import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.robintehofstee.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'noreply@robintehofstee.com';
const APP_URL = process.env.APP_URL || 'https://dashboard.robintehofstee.com';

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Web Analytics" <${FROM}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Verify your email</h2>
        <p>Click the button below to verify your email address and activate your account.</p>
        <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        <p style="color:#bbb;font-size:12px">${url}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Web Analytics" <${FROM}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">If you didn't request this, ignore this email.</p>
        <p style="color:#bbb;font-size:12px">${url}</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string) {
  await transporter.sendMail({
    from: `"Web Analytics" <${FROM}>`,
    to: email,
    subject: 'Welcome to Web Analytics',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Welcome!</h2>
        <p>Your account has been approved. You can now log in and start tracking your websites.</p>
        <a href="${APP_URL}/login" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}
