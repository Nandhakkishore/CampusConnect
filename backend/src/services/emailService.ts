import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (user && pass) {
    if (process.env.GMAIL_USER || (host && host.includes('gmail'))) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else if (host) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  return transporter;
}

export async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  const mailer = getTransporter();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">CampusConnect</h1>
        <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Two-factor authentication code</p>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Use the following 6-digit security code to verify your identity and access your CampusConnect account:</p>

      <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 18px 24px; text-align: center; margin: 28px 0;">
        <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0F172A;">${code}</span>
      </div>

      <p style="color: #64748B; font-size: 13px; line-height: 1.5;">
        ⏱️ This security code is valid for <strong>10 minutes</strong>. If you did not attempt to sign in to CampusConnect, please ignore this email or update your password immediately.
      </p>

      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;" />
      <p style="color: #94A3B8; font-size: 12px; margin: 0;">CampusConnect • Student Project & Talent Marketplace</p>
    </div>
  `;

  if (mailer) {
    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@campusconnect.edu';
      await mailer.sendMail({
        from: `"CampusConnect Security" <${fromAddress}>`,
        to: toEmail,
        subject: `Your CampusConnect Security Code: ${code}`,
        text: `Your CampusConnect security code is: ${code}. It expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`✉️ [EMAIL SENT] Verification code successfully sent to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`⚠️ [EMAIL SEND ERROR] Failed to send email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log(`📧 [EMAIL NOTICE] No SMTP credentials configured. Security code for ${toEmail}: ${code}`);
    return false;
  }
}
