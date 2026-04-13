"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import type { MaintenanceCategory } from "@/app/generated/prisma";

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

const maintenanceRecordSchema = z.object({
  performedAt: z.coerce.date(),
  mileageAtService: z.coerce.number().int().positive().optional().nullable(),
  category: z.enum(MAINTENANCE_CATEGORIES),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  partsUsed: z.string().max(2000).optional().nullable(),
  laborNotes: z.string().max(2000).optional().nullable(),
  costAmount: z.coerce.number().positive().optional().nullable(),
  currency: z.string().length(3).default("EUR"),
  workshopName: z.string().max(200).optional().nullable(),
});

export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertVehicleOwnership(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId, archivedAt: null },
    select: { id: true },
  });
  if (!vehicle) {
    throw new Error("Vehicle not found or access denied");
  }
  return vehicle;
}

async function assertRecordOwnership(recordId: string, userId: string) {
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, createdByUserId: userId },
    select: { id: true, vehicleId: true },
  });
  if (!record) {
    throw new Error("Record not found or access denied");
  }
  return record;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createMaintenanceRecord(
  vehicleId: string,
  rawData: unknown
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await assertVehicleOwnership(vehicleId, userId);

    const parsed = maintenanceRecordSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        createdByUserId: userId,
        performedAt: data.performedAt,
        mileageAtService: data.mileageAtService ?? null,
        category: data.category as MaintenanceCategory,
        title: data.title,
        description: data.description ?? null,
        partsUsed: data.partsUsed ?? null,
        laborNotes: data.laborNotes ?? null,
        costAmount: data.costAmount ?? null,
        currency: data.currency,
        workshopName: data.workshopName ?? null,
      },
      select: { id: true },
    });

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath(`/vehicles/${vehicleId}/maintenance`);

    return { success: true, data: { id: record.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateMaintenanceRecord(
  id: string,
  rawData: unknown
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertRecordOwnership(id, userId);

    const parsed = maintenanceRecordSchema.partial().safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        ...(data.performedAt !== undefined && {
          performedAt: data.performedAt,
        }),
        ...(data.mileageAtService !== undefined && {
          mileageAtService: data.mileageAtService,
        }),
        ...(data.category !== undefined && {
          category: data.category as MaintenanceCategory,
        }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.partsUsed !== undefined && { partsUsed: data.partsUsed }),
        ...(data.laborNotes !== undefined && { laborNotes: data.laborNotes }),
        ...(data.costAmount !== undefined && { costAmount: data.costAmount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.workshopName !== undefined && {
          workshopName: data.workshopName,
        }),
      },
      select: { id: true },
    });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/vehicles/${existing.vehicleId}/maintenance`);

    return { success: true, data: { id: record.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteMaintenanceRecord(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const existing = await assertRecordOwnership(id, userId);

    await prisma.maintenanceRecord.delete({ where: { id } });

    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/vehicles/${existing.vehicleId}/maintenance`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
