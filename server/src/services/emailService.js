import nodemailer from 'nodemailer';
import { getAppUrl } from '../utils/appUrl.js';

const RESEND_URL = 'https://api.resend.com/emails';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

let smtpTransport;
function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return smtpTransport;
}

// Brevo's HTTPS email API. Used where SMTP is blocked (Railway's Free and
// Hobby plans block it). BREVO_SENDER_EMAIL must be a sender verified in
// the Brevo account (a single address such as a Gmail one is enough; no
// domain needed).
async function sendWithBrevo({ to, subject, text }) {
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME || 'Finance Tracker', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Brevo responded with HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
}

// Sends through SMTP (e.g. a Gmail account with an app password) when
// SMTP_USER/SMTP_PASS are set, otherwise through Brevo when BREVO_API_KEY is
// set, otherwise through Resend when RESEND_API_KEY is set. With none (local
// development) the email is printed to the server console instead, so the
// links in it can still be used.
async function sendEmail({ to, subject, text }) {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await getSmtpTransport().sendMail({
      from: process.env.EMAIL_FROM || `Finance Tracker <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    return;
  }

  if (process.env.BREVO_API_KEY) {
    await sendWithBrevo({ to, subject, text });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[email not sent: no email provider is configured]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    }
    return;
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Finance Tracker <onboarding@resend.dev>',
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Email provider responded with HTTP ${res.status}`);
  }
}

// `plan` is the paid plan picked before signing up, if any; it rides along in
// the link so the person lands on the right plan once their account exists.
export function sendVerificationEmail(email, token, plan = null) {
  const link = `${getAppUrl()}/verify-email?token=${token}${plan ? `&plan=${plan}` : ''}`;
  return sendEmail({
    to: email,
    subject: 'Confirm your email to create your Finance Tracker account',
    text: `Welcome to Finance Tracker!\n\nYour account is created when you confirm this email address. Open this link to finish signing up:\n${link}\n\nThe link expires in 24 hours. If you didn't sign up, you can ignore this email and no account will be created.`,
  });
}

export function sendPasswordResetEmail(email, token) {
  const link = `${getAppUrl()}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your Finance Tracker password',
    text: `We received a request to reset your Finance Tracker password.\n\nChoose a new password here:\n${link}\n\nThe link expires in 1 hour. If you didn't ask for this, you can ignore this email.`,
  });
}
