let nodemailer = null;
let resend = null;

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

function isSmtpConfigured() {
  return isResendConfigured() || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendPasswordResetEmail(to, otp) {
  if (!isSmtpConfigured()) {
    console.warn('Password reset email skipped: RESEND_API_KEY/MAIL_FROM or SMTP credentials are not configured.');
    return false;
  }

  if (isResendConfigured()) {
    if (!resend) {
      const { Resend } = require('resend');
      resend = new Resend(process.env.RESEND_API_KEY);
    }

    const result = await resend.emails.send({
      from: process.env.MAIL_FROM,
      to,
      subject: 'EATOMO password reset code',
      text: `Your EATOMO password reset code is ${otp}. This code expires in 10 minutes.`,
      html: `<p>Your EATOMO password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
    });

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      const error = new Error(`Resend email failed: ${errorMessage}`);
      error.provider = 'resend';
      error.statusCode = result.error.statusCode || result.error.status || 502;
      throw error;
    }

    console.log(`Password reset email queued via Resend: id=${result.data && result.data.id ? result.data.id : 'unknown'}`);
    return true;
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
    family: Number(process.env.SMTP_FAMILY || 4),
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
