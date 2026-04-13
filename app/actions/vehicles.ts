"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1886).max(new Date().getFullYear() + 2),
  trim: z.string().optional(),
  generation: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  engine: z.string().optional(),
  engineCode: z.string().optional(),
  fuelType: z
    .enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG", "HYDROGEN", "OTHER"])
    .default("PETROL"),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER"]).default("MANUAL"),
  drivetrain: z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]).default("FWD"),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  marketRegion: z.string().optional(),
  currentMileage: z.coerce.number().int().min(0).default(0),
  mileageUnit: z.enum(["KM", "MI"]).default("KM"),
  purchaseDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  purchaseMileage: z.coerce.number().int().min(0).optional(),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imageKey: z.string().optional(),
});

const mileageSchema = z.object({
  mileage: z.coerce.number().int().min(0),
});

// ─── Return type helpers ──────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── createVehicle ────────────────────────────────────────────────────────────

export async function createVehicle(
  formData: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    const parsed = vehicleSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const data = parsed.data;

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: session.user.id,
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim ?? null,
        generation: data.generation ?? null,
        vin: data.vin ?? null,
        plate: data.plate ?? null,
        engine: data.engine ?? null,
        engineCode: data.engineCode ?? null,
        fuelType: data.fuelType,
        transmission: data.transmission,
        drivetrain: data.drivetrain,
        bodyType: data.bodyType ?? null,
        color: data.color ?? null,
        marketRegion: data.marketRegion ?? null,
        currentMileage: data.currentMileage,
        mileageUnit: data.mileageUnit,
        purchaseDate: data.purchaseDate ?? null,
        purchaseMileage: data.purchaseMileage ?? null,
        nickname: data.nickname ?? null,
        notes: data.notes ?? null,
        imageUrl: data.imageUrl || null,
        imageKey: data.imageKey ?? null,
      },
    });

    revalidatePath("/garage");
    return { success: true, data: { id: vehicle.id } };
  } catch (err) {
    console.error("[createVehicle]", err);
    return { success: false, error: "Failed to create vehicle" };
  }
}

// ─── updateVehicle ────────────────────────────────────────────────────────────

export async function updateVehicle(
  id: string,
  formData: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== session.user.id) {
      return { success: false, error: "Vehicle not found" };
    }

    const parsed = vehicleSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const data = parsed.data;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim ?? null,
        generation: data.generation ?? null,
        vin: data.vin ?? null,
        plate: data.plate ?? null,
        engine: data.engine ?? null,
        engineCode: data.engineCode ?? null,
        fuelType: data.fuelType,
        transmission: data.transmission,
        drivetrain: data.drivetrain,
        bodyType: data.bodyType ?? null,
        color: data.color ?? null,
        marketRegion: data.marketRegion ?? null,
        currentMileage: data.currentMileage,
        mileageUnit: data.mileageUnit,
        purchaseDate: data.purchaseDate ?? null,
        purchaseMileage: data.purchaseMileage ?? null,
        nickname: data.nickname ?? null,
        notes: data.notes ?? null,
        imageUrl: data.imageUrl || null,
        imageKey: data.imageKey ?? null,
      },
    });

    revalidatePath("/garage");
    revalidatePath(`/garage/${id}`);
    return { success: true, data: { id: vehicle.id } };
  } catch (err) {
    console.error("[updateVehicle]", err);
    return { success: false, error: "Failed to update vehicle" };
  }
}

// ─── deleteVehicle (soft delete / archive) ────────────────────────────────────

export async function deleteVehicle(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== session.user.id) {
      return { success: false, error: "Vehicle not found" };
    }

    await prisma.vehicle.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    revalidatePath("/garage");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteVehicle]", err);
    return { success: false, error: "Failed to archive vehicle" };
  }
}

// ─── updateVehicleMileage ─────────────────────────────────────────────────────

export async function updateVehicleMileage(
  id: string,
  mileage: number
): Promise<ActionResult<{ currentMileage: number }>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== session.user.id) {
      return { success: false, error: "Vehicle not found" };
    }

    const parsed = mileageSchema.safeParse({ mileage });
    if (!parsed.success) {
      return { success: false, error: "Invalid mileage value" };
    }

    if (parsed.data.mileage < existing.currentMileage) {
      return { success: false, error: "New mileage cannot be less than current mileage" };
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { currentMileage: parsed.data.mileage },
    });

    revalidatePath(`/garage/${id}`);
    revalidatePath("/garage");
    return { success: true, data: { currentMileage: vehicle.currentMileage } };
  } catch (err) {
    console.error("[updateVehicleMileage]", err);
    return { success: false, error: "Failed to update mileage" };
  }
}

// ─── restoreVehicle ───────────────────────────────────────────────────────────

export async function restoreVehicle(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== session.user.id) {
      return { success: false, error: "Vehicle not found" };
    }

    await prisma.vehicle.update({
      where: { id },
      data: { archivedAt: null },
    });

    revalidatePath("/garage");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[restoreVehicle]", err);
    return { success: false, error: "Failed to restore vehicle" };
  }
}
