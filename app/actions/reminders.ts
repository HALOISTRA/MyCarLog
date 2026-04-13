"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createNextRecurringReminder } from "@/lib/reminders/engine";
import type { MaintenanceCategory, ReminderSource } from "@/app/generated/prisma";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const MAINTENANCE_CATEGORIES = [
  "OIL_CHANGE",
  "FILTER_AIR",
  "FILTER_CABIN",
  "FILTER_FUEL",
  "FILTER_OIL",
  "BRAKE_FLUID",
  "COOLANT",
  "SPARK_PLUGS",
  "TIMING_BELT",
  "TIMING_CHAIN",
  "TRANSMISSION_OIL",
  "TIRES",
  "BATTERY",
  "BRAKES",
  "SUSPENSION",
  "REGISTRATION",
  "INSURANCE",
  "INSPECTION",
  "SEASONAL_SERVICE",
  "GENERAL_SERVICE",
  "REPAIR",
  "CUSTOM",
] as const;

const recurrenceRuleSchema = z
  .object({
    intervalMonths: z.number().int().positive().optional(),
    intervalKm: z.number().int().positive().optional(),
  })
  .optional()
  .nullable();

const reminderSchema = z
  .object({
    category: z.enum(MAINTENANCE_CATEGORIES),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    dueMileage: z.coerce.number().int().positive().optional().nullable(),
    leadTimeDays: z.coerce.number().int().min(1).max(365).default(30),
    recurrenceRule: recurrenceRuleSchema,
  })
  .refine((d) => d.dueDate || d.dueMileage, {
    message: "At least one of due date or due mileage is required",
    path: ["dueDate"],
  });

export type ReminderInput = z.infer<typeof reminderSchema>;

// ─── Ownership helpers ────────────────────────────────────────────────────────

async function assertVehicleOwnership(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId, archivedAt: null },
    select: { id: true },
  });
  if (!vehicle) throw new Error("Vehicle not found or access denied");
  return vehicle;
}

async function assertReminderOwnership(reminderId: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, vehicle: { ownerId: userId } },
    select: { id: true, vehicleId: true },
  });
  if (!reminder) throw new Error("Reminder not found or access denied");
  return reminder;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createReminder(
  vehicleId: string,
  rawData: unknown
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await assertVehicleOwnership(vehicleId, userId);

    const parsed = reminderSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    const reminder = await prisma.reminder.create({
      data: {
        vehicleId,
        sourceType: "USER_CUSTOM" as ReminderSource,
        category: data.category as MaintenanceCategory,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        dueMileage: data.dueMileage ?? null,
        leadTimeDays: data.leadTimeDays,
        recurrenceRule: data.recurrenceRule ?? undefined,
        status: "UPCOMING",
      },
      select: { id: true },
    });

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath(`/reminders`);

    return { success: true, data: { id: reminder.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateReminder(
  id: string,
  rawData: unknown
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertReminderOwnership(id, userId);

    const parsed = reminderSchema.partial().safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(data.category !== undefined && {
          category: data.category as MaintenanceCategory,
        }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.dueMileage !== undefined && { dueMileage: data.dueMileage }),
        ...(data.leadTimeDays !== undefined && {
          leadTimeDays: data.leadTimeDays,
        }),
        ...(data.recurrenceRule !== undefined && {
          recurrenceRule: data.recurrenceRule ?? undefined,
        }),
      },
      select: { id: true },
    });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/reminders`);

    return { success: true, data: { id: reminder.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteReminder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertReminderOwnership(id, userId);

    await prisma.reminder.delete({ where: { id } });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/reminders`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function completeReminder(
  id: string,
  mileage?: number
): Promise<{ success: boolean; nextReminderId?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertReminderOwnership(id, userId);

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        lastTriggeredAt: new Date(),
      },
    });

    // Create next recurring reminder if applicable
    await createNextRecurringReminder(reminder, mileage);

    // Fetch the newly created next reminder (if any)
    const nextReminder = await prisma.reminder.findFirst({
      where: {
        vehicleId: existing.vehicleId,
        linkedPlanItemId: reminder.linkedPlanItemId ?? undefined,
        status: "UPCOMING",
        createdAt: { gt: reminder.updatedAt },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/reminders`);

    return { success: true, nextReminderId: nextReminder?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function snoozeReminder(
  id: string,
  days: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertReminderOwnership(id, userId);

    if (days < 1 || days > 365) {
      return { success: false, error: "Snooze duration must be between 1 and 365 days" };
    }

    await prisma.reminder.update({
      where: { id },
      data: {
        snoozedUntil: addDays(new Date(), days),
        status: "SNOOZED",
      },
    });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/reminders`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
