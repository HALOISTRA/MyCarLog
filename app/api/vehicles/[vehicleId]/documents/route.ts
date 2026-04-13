import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import {
  uploadFile,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/storage";
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

// ─── GET /api/vehicles/[vehicleId]/documents ──────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await requireAuth();
    const { vehicleId } = await params;

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: documents });
  } catch (error) {
    console.error("[GET /api/vehicles/[vehicleId]/documents]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/vehicles/[vehicleId]/documents ─────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await requireAuth();
    const { vehicleId } = await params;

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return Response.json(
        { error: "File type not allowed. Accepted: PDF, JPG, PNG, WEBP" },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File exceeds maximum size of 20MB" },
        { status: 400 }
      );
    }

    const title = (formData.get("title") as string) || file.name;
    const categoryRaw = (formData.get("category") as string) || "OTHER";
    const category = DOCUMENT_CATEGORIES.includes(
      categoryRaw as (typeof DOCUMENT_CATEGORIES)[number]
    )
      ? (categoryRaw as DocumentCategory)
      : ("OTHER" as DocumentCategory);

    const documentDateRaw = formData.get("documentDate") as string | null;
    const documentDate = documentDateRaw ? new Date(documentDateRaw) : null;

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
        uploadedByUserId: session.user.id,
        category,
        title,
        fileUrl: url,
        fileKey: key,
        fileType: file.type,
        fileSize: file.size,
        documentDate,
        visibilitySetting: "PRIVATE",
        includeInShareDefault: false,
      },
    });

    return Response.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/vehicles/[vehicleId]/documents]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
