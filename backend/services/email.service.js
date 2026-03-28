'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Build and send a verification email
 * @param {string} toEmail - Recipient email
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (toEmail, token) => {
  const verifyUrl = `${env.FRONTEND_URL}/auth/verify?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Verify your ChitGPT account</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif;color:#e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
            <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#f8fafc;">Verify your email</h1>
            <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;line-height:1.6;">
              Thanks for signing up for <strong style="color:#a78bfa;">ChitGPT</strong>.
              Click the button below to verify your email address. This link expires in 24 hours.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">
              Verify Email
            </a>
            <p style="color:#475569;font-size:12px;margin:24px 0 0;">
              Or copy this link: <br/>
              <a href="${verifyUrl}" style="color:#7c3aed;word-break:break-all;">${verifyUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: 'Verify your ChitGPT account',
    html,
  });

  console.info(`[Email] Verification email sent to ${toEmail}`);
};

/**
 * Send a password reset email (stub for future use)
 */
const sendPasswordResetEmail = async (toEmail, token) => {
  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your ChitGPT password',
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};

/**
 * Send an update/newsletter email
 */
const sendUpdateEmail = async (toEmail, subject, htmlBody) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif;color:#e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
            ${htmlBody}
            <hr style="border-color:rgba(255,255,255,0.08);margin:24px 0 16px;" />
            <p style="color:#475569;font-size:11px;margin:0;">
              You received this email because you have a ChitGPT account.
              <a href="${env.FRONTEND_URL}" style="color:#7c3aed;">ChitGPT</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject,
    html,
  });

  console.info(`[Email] Update email sent to ${toEmail}`);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendUpdateEmail };
