import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { reminderEmail } from "@/lib/email/templates";
import { enrichReminderWithStatus } from "@/lib/reminders/engine";
import { format } from "date-fns";
import type { NotificationPrefs } from "@/types";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * For a single vehicle, find all OVERDUE or DUE_SOON reminders that have not
 * yet been notified in the past 24 hours, create NotificationLog entries, and
 * send emails where the owner has enabled email notifications.
 *
 * Returns the number of notifications that were successfully sent/created.
 */
export async function processRemindersForVehicle(
  vehicleId: string
): Promise<number> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      owner: true,
      reminders: {
        where: { status: { notIn: ["COMPLETED", "DISMISSED"] } },
      },
    },
  });

  if (!vehicle) return 0;

  const { owner, reminders } = vehicle;
  if (!owner || owner.deletedAt) return 0;

  const prefs = (owner.notificationPrefs ?? {
    email: true,
    inApp: true,
    leadDays: [30, 14, 7],
  }) as unknown as NotificationPrefs;

  const now = new Date();
  const cutoff = new Date(now.getTime() - TWENTY_FOUR_HOURS);

  // Fetch all notification logs for this vehicle in the past 24 h so we can
  // skip reminders that were already notified.
  const recentLogs = await prisma.notificationLog.findMany({
    where: {
      vehicleId,
      userId: owner.id,
      channel: "EMAIL",
      createdAt: { gte: cutoff },
      reminderId: { not: null },
    },
    select: { reminderId: true },
  });

  const notifiedReminderIds = new Set(
    recentLogs.map((l) => l.reminderId as string)
  );

  let sent = 0;

  for (const reminder of reminders) {
    const enriched = enrichReminderWithStatus(
      reminder,
      vehicle.currentMileage,
      now
    );

    // Only notify for OVERDUE or DUE_SOON
    if (
      enriched.computedStatus !== "OVERDUE" &&
      enriched.computedStatus !== "DUE_SOON"
    ) {
      continue;
    }

    // Skip if already notified in past 24 h
    if (notifiedReminderIds.has(reminder.id)) continue;

    // Create a PENDING log entry
    const log = await prisma.notificationLog.create({
      data: {
        userId: owner.id,
        vehicleId: vehicle.id,
        reminderId: reminder.id,
        channel: "EMAIL",
        status: "PENDING",
        subject: `Reminder: ${reminder.title} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        payloadSummary: enriched.computedStatus,
      },
    });

    // Send email if the user has email notifications enabled
    if (prefs.email && owner.email) {
      try {
        const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const dueDateStr = reminder.dueDate
          ? format(new Date(reminder.dueDate), "d MMM yyyy")
          : undefined;

        const { subject, html } = reminderEmail(
          vehicleName,
          reminder.title,
          dueDateStr,
          reminder.dueMileage ?? undefined
        );

        await sendEmail({ to: owner.email, subject, html });

        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: "SENT", sentAt: new Date() },
        });

        sent++;
      } catch (err) {
        console.error(
          `[notifications/processor] failed to send email for reminder ${reminder.id}`,
          err
        );

        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: "FAILED" },
        });
      }
    } else {
      // No email — mark as SKIPPED
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: "SKIPPED" },
      });
    }
  }

  return sent;
}
