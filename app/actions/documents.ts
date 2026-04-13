"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import {
  uploadFile,
  deleteFile,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/storage";
// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Schemas ──────────────────────────────────────────────────────────────────

const DOCUMENT_CATEGORIES = [
  "REGISTRATION",
  "INSURANCE",
  "INSPECTION",
  "INVOICE",
  "SERVICE_BOOK",
  "OWNERSHIP",
  "WARRANTY",
  "PHOTO",
  "OTHER",
] as const;

type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

const VISIBILITY_LEVELS = ["PRIVATE", "SHARED", "PUBLIC"] as const;

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  documentDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  visibilitySetting: z.enum(VISIBILITY_LEVELS).optional(),
  includeInShareDefault: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertVehicleOwnership(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId },
    select: { id: true },
  });
  if (!vehicle) {
    throw new Error("Vehicle not found or access denied");
  }
  return vehicle;
}

async function assertDocumentOwnership(documentId: string, userId: string) {
  const document = await prisma.vehicleDocument.findFirst({
    where: {
      id: documentId,
      vehicle: { ownerId: userId },
    },
    select: { id: true, fileKey: true, vehicleId: true },
  });
  if (!document) {
    throw new Error("Document not found or access denied");
  }
  return document;
}

// ─── uploadDocument ───────────────────────────────────────────────────────────

export async function uploadDocument(
  vehicleId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await assertVehicleOwnership(vehicleId, userId);

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `File type not allowed. Accepted: PDF, JPG, PNG, WEBP`,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File exceeds maximum size of 20MB`,
      };
    }

    // Parse metadata from formData
    const title = (formData.get("title") as string) || file.name;
    const category = (formData.get("category") as DocumentCategory) || "OTHER";
    const documentDateRaw = formData.get("documentDate") as string | null;
    const documentDate = documentDateRaw ? new Date(documentDateRaw) : null;

    // Validate category
    if (!DOCUMENT_CATEGORIES.includes(category as (typeof DOCUMENT_CATEGORIES)[number])) {
      return { success: false, error: "Invalid document category" };
    }

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await uploadFile(
      buffer,
      file.name,
      file.type,
      `vehicles/${vehicleId}/documents`
    );

    // Create DB record
    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId,
        uploadedByUserId: userId,
        category: category as DocumentCategory,
        title,
        fileUrl: url,
        fileKey: key,
        fileType: file.type,
        fileSize: file.size,
        documentDate,
        visibilitySetting: "PRIVATE",
        includeInShareDefault: false,
      },
      select: { id: true },
    });

    revalidatePath(`/garage/${vehicleId}`);
    return { success: true, data: { id: document.id } };
  } catch (error) {
    console.error("[uploadDocument]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// ─── updateDocument ───────────────────────────────────────────────────────────

export async function updateDocument(
  id: string,
  data: {
    title?: string;
    category?: string;
    documentDate?: string;
    visibilitySetting?: string;
    includeInShareDefault?: boolean;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const doc = await assertDocumentOwnership(id, userId);

    const parsed = updateDocumentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data",
      };
    }

    const { documentDate, ...rest } = parsed.data;

    await prisma.vehicleDocument.update({
      where: { id },
      data: {
        ...rest,
        ...(documentDate !== undefined ? { documentDate } : {}),
      },
    });

    revalidatePath(`/garage/${doc.vehicleId}`);
    return { success: true, data: { id } };
  } catch (error) {
    console.error("[updateDocument]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

// ─── deleteDocument ───────────────────────────────────────────────────────────

export async function deleteDocument(
  id: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const doc = await assertDocumentOwnership(id, userId);

    // Delete from storage
    try {
      await deleteFile(doc.fileKey);
    } catch (storageError) {
      console.error("[deleteDocument] Storage delete failed:", storageError);
      // Continue with DB deletion even if storage fails
    }

    // Delete from DB
    await prisma.vehicleDocument.delete({ where: { id } });

    revalidatePath(`/garage/${doc.vehicleId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteDocument]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
