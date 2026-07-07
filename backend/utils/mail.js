let nodemailer = null;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendPasswordResetEmail(to, otp) {
  if (!isSmtpConfigured()) {
    console.warn('Password reset email skipped: SMTP_HOST, SMTP_USER, or SMTP_PASS is not configured.');
    return false;
  }

  if (!nodemailer) {
    nodemailer = require('nodemailer');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'EATOMO password reset code',
    text: `Your EATOMO password reset code is ${otp}. This code expires in 10 minutes.`,
    html: `<p>Your EATOMO password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
  });

  return true;
}

module.exports = { sendPasswordResetEmail, isSmtpConfigured };
