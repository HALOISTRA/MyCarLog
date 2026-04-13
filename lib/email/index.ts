import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ""),
  });
}

export function emailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1a1a2e; padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .header p { color: #9ca3af; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 40px; }
    .body p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; margin: 8px 0; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Vehicle Passport</h1>
      <p>Your digital vehicle companion</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>You received this email from Vehicle Passport. If you did not request this, please ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}
