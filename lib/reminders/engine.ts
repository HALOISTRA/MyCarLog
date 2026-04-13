import { prisma } from "@/lib/db";
import type { Reminder, Vehicle } from "@/app/generated/prisma";
import { addDays, isBefore, isAfter } from "date-fns";

export type ReminderWithStatus = Reminder & {
  computedStatus: "OVERDUE" | "DUE_SOON" | "UPCOMING" | "COMPLETED";
  daysUntilDue?: number;
  mileageUntilDue?: number;
};

/**
 * Compute the effective status of a reminder based on date and mileage.
 */
export function computeReminderStatus(
  reminder: Reminder,
  currentMileage: number,
  now: Date = new Date()
): "OVERDUE" | "DUE_SOON" | "UPCOMING" | "COMPLETED" {
  if (reminder.status === "COMPLETED") return "COMPLETED";
  if (reminder.status === "DISMISSED") return "COMPLETED";

  if (reminder.snoozedUntil && isAfter(reminder.snoozedUntil, now)) {
    return "UPCOMING";
  }

  const leadDays = reminder.leadTimeDays ?? 30;
  let dateOverdue = false;
  let dateDueSoon = false;
  let mileageOverdue = false;
  let mileageDueSoon = false;

  if (reminder.dueDate) {
    dateOverdue = isBefore(reminder.dueDate, now);
    dateDueSoon =
      !dateOverdue && isBefore(reminder.dueDate, addDays(now, leadDays));
  }

  if (reminder.dueMileage !== null && reminder.dueMileage !== undefined) {
    mileageOverdue = currentMileage >= reminder.dueMileage;
    const mileageLeadBuffer = Math.ceil((currentMileage / 1000) * 50); // 5% buffer
    mileageDueSoon =
      !mileageOverdue &&
      currentMileage >= reminder.dueMileage - mileageLeadBuffer;
  }

  if (dateOverdue || mileageOverdue) return "OVERDUE";
  if (dateDueSoon || mileageDueSoon) return "DUE_SOON";
  return "UPCOMING";
}

export function enrichReminderWithStatus(
  reminder: Reminder,
  currentMileage: number,
  now: Date = new Date()
): ReminderWithStatus {
  const computedStatus = computeReminderStatus(reminder, currentMileage, now);

  let daysUntilDue: number | undefined;
  let mileageUntilDue: number | undefined;

  if (reminder.dueDate) {
    const diff = reminder.dueDate.getTime() - now.getTime();
    daysUntilDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (reminder.dueMileage !== null && reminder.dueMileage !== undefined) {
    mileageUntilDue = reminder.dueMileage - currentMileage;
  }

  return { ...reminder, computedStatus, daysUntilDue, mileageUntilDue };
}

/**
 * Process all active reminders for a vehicle and update statuses.
 * Called by the daily cron job.
 */
export async function processVehicleReminders(
  vehicle: Vehicle
): Promise<void> {
  const reminders = await prisma.reminder.findMany({
    where: {
      vehicleId: vehicle.id,
      status: { notIn: ["COMPLETED", "DISMISSED"] },
    },
  });

  const now = new Date();

  for (const reminder of reminders) {
    const newStatus = computeReminderStatus(
      reminder,
      vehicle.currentMileage,
      now
    );

    // Only update if status changed
    const dbStatus =
      newStatus === "COMPLETED" ? "COMPLETED" : (newStatus as string);
    if (reminder.status !== dbStatus) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: dbStatus as Reminder["status"] },
      });
    }
  }
}

/**
 * Create next recurring reminder after completion.
 */
export async function createNextRecurringReminder(
  completedReminder: Reminder,
  completedAtMileage?: number
): Promise<void> {
  if (!completedReminder.recurrenceRule) return;

  const rule = completedReminder.recurrenceRule as {
    intervalMonths?: number;
    intervalKm?: number;
  };

  let nextDueDate: Date | undefined;
  let nextDueMileage: number | undefined;

  if (rule.intervalMonths && completedReminder.dueDate) {
    nextDueDate = new Date(completedReminder.dueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + rule.intervalMonths);
  }

  if (rule.intervalKm && completedAtMileage !== undefined) {
    nextDueMileage = completedAtMileage + rule.intervalKm;
  }

  if (!nextDueDate && !nextDueMileage) return;

  await prisma.reminder.create({
    data: {
      vehicleId: completedReminder.vehicleId,
      sourceType: completedReminder.sourceType,
      category: completedReminder.category,
      title: completedReminder.title,
      description: completedReminder.description,
      dueDate: nextDueDate ?? null,
      dueMileage: nextDueMileage ?? null,
      recurrenceRule: completedReminder.recurrenceRule,
      leadTimeDays: completedReminder.leadTimeDays,
      status: "UPCOMING",
      linkedPlanItemId: completedReminder.linkedPlanItemId,
    },
  });
}
