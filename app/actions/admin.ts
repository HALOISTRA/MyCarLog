"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

// ─── Return type ──────────────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Maintenance Plan schemas ─────────────────────────────────────────────────

const planSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  generation: z.string().optional(),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  engine: z.string().optional(),
  engineCode: z.string().optional(),
  fuelType: z
    .enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG", "HYDROGEN", "OTHER"])
    .optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER"]).optional(),
  marketRegion: z.string().optional(),
  sourceDocumentId: z.string().optional(),
  verificationStatus: z
    .enum(["PENDING", "VERIFIED", "REJECTED", "NEEDS_REVIEW"])
    .default("PENDING"),
  sourceLabel: z.string().optional(),
  notes: z.string().optional(),
});

const planItemSchema = z.object({
  category: z.enum([
    "OIL_CHANGE", "FILTER_AIR", "FILTER_CABIN", "FILTER_FUEL", "FILTER_OIL",
    "BRAKE_FLUID", "COOLANT", "SPARK_PLUGS", "TIMING_BELT", "TIMING_CHAIN",
    "TRANSMISSION_OIL", "TIRES", "BATTERY", "BRAKES", "SUSPENSION",
    "REGISTRATION", "INSURANCE", "INSPECTION", "SEASONAL_SERVICE",
    "GENERAL_SERVICE", "REPAIR", "CUSTOM",
  ]),
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  mileageInterval: z.coerce.number().int().positive().optional(),
  timeIntervalMonths: z.coerce.number().int().positive().optional(),
  ruleType: z
    .enum(["TIME_ONLY", "MILEAGE_ONLY", "WHICHEVER_FIRST", "INSPECT_ONLY", "CONDITIONAL"])
    .default("WHICHEVER_FIRST"),
  warningLevel: z.enum(["INFO", "NORMAL", "IMPORTANT", "CRITICAL"]).default("NORMAL"),
  sourceReference: z.string().optional(),
  displayOrder: z.coerce.number().int().default(0),
});

// ─── createMaintenancePlan ────────────────────────────────────────────────────

export async function createMaintenancePlan(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const parsed = planSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const d = parsed.data;

    const plan = await prisma.maintenancePlan.create({
      data: {
        make: d.make,
        model: d.model,
        trim: d.trim ?? null,
        generation: d.generation ?? null,
        yearFrom: d.yearFrom ?? null,
        yearTo: d.yearTo ?? null,
        engine: d.engine ?? null,
        engineCode: d.engineCode ?? null,
        fuelType: d.fuelType ?? null,
        transmission: d.transmission ?? null,
        marketRegion: d.marketRegion ?? null,
        sourceDocumentId: d.sourceDocumentId ?? null,
        verificationStatus: d.verificationStatus,
        sourceLabel: d.sourceLabel ?? null,
        notes: d.notes ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_CREATED",
        targetType: "MaintenancePlan",
        targetId: plan.id,
        metadata: { make: d.make, model: d.model },
      },
    });

    revalidatePath("/admin/plans");
    return { success: true, data: { id: plan.id } };
  } catch (err) {
    console.error("[createMaintenancePlan]", err);
    return { success: false, error: "Failed to create maintenance plan" };
  }
}

// ─── updateMaintenancePlan ────────────────────────────────────────────────────

export async function updateMaintenancePlan(
  id: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const parsed = planSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const d = parsed.data;

    const plan = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        make: d.make,
        model: d.model,
        trim: d.trim ?? null,
        generation: d.generation ?? null,
        yearFrom: d.yearFrom ?? null,
        yearTo: d.yearTo ?? null,
        engine: d.engine ?? null,
        engineCode: d.engineCode ?? null,
        fuelType: d.fuelType ?? null,
        transmission: d.transmission ?? null,
        marketRegion: d.marketRegion ?? null,
        sourceDocumentId: d.sourceDocumentId ?? null,
        verificationStatus: d.verificationStatus,
        sourceLabel: d.sourceLabel ?? null,
        notes: d.notes ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_UPDATED",
        targetType: "MaintenancePlan",
        targetId: plan.id,
        metadata: { make: d.make, model: d.model },
      },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${id}`);
    return { success: true, data: { id: plan.id } };
  } catch (err) {
    console.error("[updateMaintenancePlan]", err);
    return { success: false, error: "Failed to update maintenance plan" };
  }
}

// ─── deleteMaintenancePlan ────────────────────────────────────────────────────

export async function deleteMaintenancePlan(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    await prisma.maintenancePlan.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_DELETED",
        targetType: "MaintenancePlan",
        targetId: id,
        metadata: {},
      },
    });

    revalidatePath("/admin/plans");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteMaintenancePlan]", err);
    return { success: false, error: "Failed to delete maintenance plan" };
  }
}

// ─── createPlanItem ───────────────────────────────────────────────────────────

export async function createPlanItem(
  planId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const parsed = planItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const d = parsed.data;

    const item = await prisma.maintenancePlanItem.create({
      data: {
        maintenancePlanId: planId,
        category: d.category,
        itemName: d.itemName,
        description: d.description ?? null,
        mileageInterval: d.mileageInterval ?? null,
        timeIntervalMonths: d.timeIntervalMonths ?? null,
        ruleType: d.ruleType,
        warningLevel: d.warningLevel,
        sourceReference: d.sourceReference ?? null,
        displayOrder: d.displayOrder,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_ITEM_CREATED",
        targetType: "MaintenancePlanItem",
        targetId: item.id,
        metadata: { planId, itemName: d.itemName },
      },
    });

    revalidatePath(`/admin/plans/${planId}`);
    return { success: true, data: { id: item.id } };
  } catch (err) {
    console.error("[createPlanItem]", err);
    return { success: false, error: "Failed to create plan item" };
  }
}

// ─── updatePlanItem ───────────────────────────────────────────────────────────

export async function updatePlanItem(
  id: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const parsed = planItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const d = parsed.data;

    const item = await prisma.maintenancePlanItem.update({
      where: { id },
      data: {
        category: d.category,
        itemName: d.itemName,
        description: d.description ?? null,
        mileageInterval: d.mileageInterval ?? null,
        timeIntervalMonths: d.timeIntervalMonths ?? null,
        ruleType: d.ruleType,
        warningLevel: d.warningLevel,
        sourceReference: d.sourceReference ?? null,
        displayOrder: d.displayOrder,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_ITEM_UPDATED",
        targetType: "MaintenancePlanItem",
        targetId: item.id,
        metadata: { itemName: d.itemName },
      },
    });

    revalidatePath(`/admin/plans/${item.maintenancePlanId}`);
    return { success: true, data: { id: item.id } };
  } catch (err) {
    console.error("[updatePlanItem]", err);
    return { success: false, error: "Failed to update plan item" };
  }
}

// ─── deletePlanItem ───────────────────────────────────────────────────────────

export async function deletePlanItem(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const item = await prisma.maintenancePlanItem.findUnique({
      where: { id },
      select: { maintenancePlanId: true },
    });

    if (!item) return { success: false, error: "Item not found" };

    await prisma.maintenancePlanItem.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_ITEM_DELETED",
        targetType: "MaintenancePlanItem",
        targetId: id,
        metadata: { planId: item.maintenancePlanId },
      },
    });

    revalidatePath(`/admin/plans/${item.maintenancePlanId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePlanItem]", err);
    return { success: false, error: "Failed to delete plan item" };
  }
}

// ─── verifyPlan ───────────────────────────────────────────────────────────────

export async function verifyPlan(planId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    await prisma.maintenancePlan.update({
      where: { id: planId },
      data: { verificationStatus: "VERIFIED" },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "PLAN_VERIFIED",
        targetType: "MaintenancePlan",
        targetId: planId,
        metadata: {},
      },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[verifyPlan]", err);
    return { success: false, error: "Failed to verify plan" };
  }
}

// ─── setUserRole ──────────────────────────────────────────────────────────────

export async function setUserRole(
  userId: string,
  role: "USER" | "ADMIN"
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    if (userId === session.user.id) {
      return { success: false, error: "You cannot change your own role" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "USER_ROLE_CHANGED",
        targetType: "User",
        targetId: userId,
        metadata: { newRole: role },
      },
    });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[setUserRole]", err);
    return { success: false, error: "Failed to update user role" };
  }
}

// ─── uploadSourceDocument ─────────────────────────────────────────────────────

export async function uploadSourceDocument(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const title = formData.get("title") as string;
    const make = formData.get("make") as string;
    const model = formData.get("model") as string;
    const yearRange = formData.get("yearRange") as string | null;
    const marketRegion = formData.get("marketRegion") as string | null;
    const sourceType = (formData.get("sourceType") as string) || "PDF";
    const fileUrl = formData.get("fileUrl") as string | null;
    const fileKey = formData.get("fileKey") as string | null;
    const extractionNotes = formData.get("extractionNotes") as string | null;

    if (!title || !make || !model) {
      return { success: false, error: "Title, make and model are required" };
    }

    const doc = await prisma.maintenancePlanSourceDocument.create({
      data: {
        title,
        make,
        model,
        yearRange: yearRange ?? null,
        marketRegion: marketRegion ?? null,
        sourceType,
        fileUrl: fileUrl ?? null,
        fileKey: fileKey ?? null,
        extractionNotes: extractionNotes ?? null,
        uploadedByUserId: session.user.id,
        verificationStatus: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "SOURCE_DOCUMENT_UPLOADED",
        targetType: "MaintenancePlanSourceDocument",
        targetId: doc.id,
        metadata: { title, make, model },
      },
    });

    revalidatePath("/admin/sources");
    return { success: true, data: { id: doc.id } };
  } catch (err) {
    console.error("[uploadSourceDocument]", err);
    return { success: false, error: "Failed to create source document" };
  }
}
