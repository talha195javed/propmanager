// Lightweight email helper for tenant invites.
//
// Uses nodemailer when it is installed AND SMTP_* env vars are configured.
// Otherwise it degrades to a console-log no-op so the rest of the flow keeps
// working in development (the temp password is logged so invites are testable
// without a real mail server).
//
// To enable real sending: `cd server && npm i nodemailer` and set
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (+ optional APP_URL).

let nodemailer = null;
try {
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

let transporter = null;

function isConfigured() {
  return Boolean(
    nodemailer &&
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Send a tenant invite with their auto-generated temporary password.
 * Never throws — returns { sent: boolean }. Callers should not let an email
 * failure abort tenant creation.
 */
async function sendInvite({ to, fullName, password, loginUrl }) {
  const url = loginUrl || process.env.APP_URL || 'http://localhost:5173/login';

  if (!isConfigured()) {
    console.log(
      `[email:noop] Invite for ${fullName || ''} <${to}> — temp password: ${password} — login: ${url}`
    );
    return { sent: false };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'You have been invited to PropManager',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
          <h2>Welcome to PropManager${fullName ? `, ${fullName}` : ''}</h2>
          <p>An account has been created for you. Use the credentials below to sign in:</p>
          <p>
            <strong>Email:</strong> ${to}<br/>
            <strong>Temporary password:</strong> ${password}
          </p>
          <p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Sign in</a></p>
          <p style="color:#666;font-size:13px;">Please change your password after your first login.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send invite email:', err.message);
    return { sent: false };
  }
}

/**
 * Notify the given addresses about a task. Best-effort — never throws.
 * `to` is an array of email addresses.
 */
async function sendTaskNotification({ to, task }) {
  const recipients = (to || []).filter(Boolean);
  if (recipients.length === 0) return { sent: false };

  const due = task.due_date ? new Date(task.due_date).toDateString() : '—';

  if (!isConfigured()) {
    console.log(
      `[email:noop] Task "${task.title}" (${task.priority || 'low'}, due ${due}) → ${recipients.join(', ')}`
    );
    return { sent: false };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.join(', '),
      subject: `New task: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
          <h2>${task.title}</h2>
          <p>
            <strong>Assigned to:</strong> ${task.assign_to || '—'}<br/>
            <strong>Priority:</strong> ${task.priority || 'low'}<br/>
            <strong>Due date:</strong> ${due}
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send task notification:', err.message);
    return { sent: false };
  }
}

/**
 * Notify a tenant that a service request was raised on their unit.
 * Best-effort — never throws.
 */
async function sendMaintenanceNotification({ to, request }) {
  if (!to) return { sent: false };

  if (!isConfigured()) {
    console.log(
      `[email:noop] Service request ${request.reference_number || ''} "${request.title}" → ${to}`
    );
    return { sent: false };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Service request raised: ${request.reference_number || ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
          <h2>${request.title}</h2>
          <p>
            <strong>Reference:</strong> ${request.reference_number || '—'}<br/>
            <strong>Priority:</strong> ${request.priority || '—'}<br/>
            <strong>Category:</strong> ${request.category || '—'}
          </p>
          <p style="color:#666;font-size:13px;">We'll keep you updated as this progresses.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send maintenance notification:', err.message);
    return { sent: false };
  }
}

module.exports = { sendInvite, sendTaskNotification, sendMaintenanceNotification, isConfigured };
