const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const { sendPasswordResetEmail, isSmtpConfigured } = require('../utils/mail');

const RESET_OTP_TTL_MINUTES = 10;
const RESET_OTP_DIGITS = 4;
const RESET_OTP_MAX_ATTEMPTS = 5;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function generateOtp() {
  const min = 10 ** (RESET_OTP_DIGITS - 1);
  const max = (10 ** RESET_OTP_DIGITS) - 1;
  return String(crypto.randomInt(min, max + 1));
}

function hashOtp(email, otp) {
  const secret = process.env.JWT_SECRET || 'eatomo-reset-fallback';
  return crypto
    .createHmac('sha256', secret)
    .update(`${normalizeEmail(email)}:${String(otp).trim()}`)
    .digest('hex');
}

function canReturnDebugOtp() {
  return process.env.RESET_OTP_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
}

async function findValidResetOtp(email, otp) {
  const normalizedEmail = normalizeEmail(email);
  const otpHash = hashOtp(normalizedEmail, otp);
  return PasswordResetOtp.findOne({
    email: normalizedEmail,
    otpHash,
    used: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: RESET_OTP_MAX_ATTEMPTS }
  }).sort({ createdAt: -1 });
}

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    // Check existing user
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({
      username, email, password,
      fullName: fullName || '',
      phone: phone || '',
      address: address || '',
      role: 'user'
    });

    // Generate token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is missing'
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      access_token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = (username || '').trim();

    if (!normalizedUsername || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Find user (select password explicitly)
    const user = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedUsername.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Generate token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is missing'
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      access_token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.body.username);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    const response = {
      success: true,
      message: 'If this email exists, a password reset code has been sent.'
    };

    if (!user) {
      return res.json(response);
    }

    const otp = generateOtp();
    await PasswordResetOtp.updateMany({ email, used: false }, { used: true });
    await PasswordResetOtp.create({
      email,
      otpHash: hashOtp(email, otp),
      expiresAt: new Date(Date.now() + RESET_OTP_TTL_MINUTES * 60 * 1000)
    });

    let emailSent = false;
    let emailError = null;
    try {
      emailSent = await sendPasswordResetEmail(email, otp);
    } catch (sendError) {
      emailError = sendError;
      console.error('Password reset email failed:', sendError.message);
    }
    response.emailSent = emailSent;
    response.expiresInMinutes = RESET_OTP_TTL_MINUTES;

    if (!emailSent && canReturnDebugOtp()) {
      response.debugOtp = otp;
      response.message = 'Password reset code generated. Email is not configured, so debugOtp is returned for testing.';
      if (emailError) {
        response.emailError = emailError.message;
      }
    } else if (!emailSent && !isSmtpConfigured()) {
      response.message = 'Password reset code generated, but email is not configured on server.';
    } else if (!emailSent && emailError) {
      return res.status(502).json({
        success: false,
        message: 'Password reset code generated, but email delivery failed',
        error: emailError.message
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to request password reset', error: error.message });
  }
};

/**
 * POST /api/auth/verify-reset-otp
 * Body: { email, otp }
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const resetOtp = await findValidResetOtp(email, otp);
    if (!resetOtp) {
      await PasswordResetOtp.updateMany({ email, used: false }, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 */
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const resetOtp = await findValidResetOtp(email, otp);
    if (!resetOtp) {
      await PasswordResetOtp.updateMany({ email, used: false }, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    resetOtp.used = true;
    await resetOtp.save();
    await PasswordResetOtp.updateMany({ email, used: false }, { used: true });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

/**
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile', error: error.message });
  }
};

/**
 * PATCH /api/auth/profile
 * Update editable user info (fullName, phone, address)
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'phone', 'address'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = String(req.body[key]).trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update. Allowed: fullName, phone, address' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

/**
 * PATCH /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Fetch user WITH password field
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password — pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};
