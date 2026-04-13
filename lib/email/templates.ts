import { emailTemplate } from "./index";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function passwordResetEmail(token: string): {
  subject: string;
  html: string;
} {
  const link = `${appUrl}/auth/reset-password?token=${token}`;
  return {
    subject: "Reset your Vehicle Passport password",
    html: emailTemplate(
      "Reset Password",
      `
      <p>You requested a password reset for your Vehicle Passport account.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <p><a class="btn" href="${link}">Reset Password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `
    ),
  };
}

export function transferInviteEmail(
  vehicleName: string,
  fromName: string,
  token: string,
  message?: string
): { subject: string; html: string } {
  const link = `${appUrl}/transfer/accept?token=${token}`;
  return {
    subject: `${fromName} is transferring a vehicle to you`,
    html: emailTemplate(
      "Vehicle Transfer",
      `
      <p><strong>${fromName}</strong> wants to transfer <strong>${vehicleName}</strong> to your Vehicle Passport account.</p>
      ${message ? `<p>Message from ${fromName}: <em>${message}</em></p>` : ""}
      <p>Click below to review and accept the transfer. This invitation expires in 7 days.</p>
      <p><a class="btn" href="${link}">Review Transfer</a></p>
      <p>You will need to log in or create a free account to accept the transfer.</p>
    `
    ),
  };
}

export function reminderEmail(
  vehicleName: string,
  reminderTitle: string,
  dueDate?: string,
  dueMileage?: number
): { subject: string; html: string } {
  const dueText = [
    dueDate ? `Due: ${dueDate}` : null,
    dueMileage ? `At ${dueMileage.toLocaleString()} km` : null,
  ]
    .filter(Boolean)
    .join(" or ");

  return {
    subject: `Reminder: ${reminderTitle} — ${vehicleName}`,
    html: emailTemplate(
      "Vehicle Reminder",
      `
      <p>This is a reminder for your vehicle <strong>${vehicleName}</strong>:</p>
      <p style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;">
        <strong>${reminderTitle}</strong>${dueText ? `<br><span style="color:#6b7280;font-size:14px;">${dueText}</span>` : ""}
      </p>
      <p><a class="btn" href="${appUrl}/garage">View in Vehicle Passport</a></p>
    `
    ),
  };
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Vehicle Passport",
    html: emailTemplate(
      "Welcome",
      `
      <p>Hi ${name || "there"}, welcome to Vehicle Passport! 🎉</p>
      <p>Your digital vehicle companion is ready. Here's what you can do:</p>
      <ul style="color:#374151;line-height:1.8;">
        <li>Add your vehicles to your personal garage</li>
        <li>Track maintenance history and service records</li>
        <li>Set reminders for registration, insurance, and service intervals</li>
        <li>Share a read-only link with mechanics or potential buyers</li>
        <li>Transfer vehicle history when selling your car</li>
      </ul>
      <p><a class="btn" href="${appUrl}/garage">Go to My Garage</a></p>
    `
    ),
  };
}
