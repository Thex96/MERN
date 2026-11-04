const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text }) {
  if (!to || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return false;
  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error("Email notification error:", error.message);
    return false;
  }
}

module.exports = { sendEmail };
