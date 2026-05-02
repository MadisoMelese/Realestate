import nodemailer from 'nodemailer';

/**
 * Send an email using Nodemailer with Gmail SMTP.
 * @param {Object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html    - HTML body content
 */
const sendEmail = async ({ to, subject, html }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      'Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env. ' +
      'Use a Gmail App Password (not your regular password). ' +
      'Generate one at: https://myaccount.google.com/apppasswords'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `Real Estate <${user}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
