import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import {
  deleteFile,
  getSignedDownloadUrl,
} from "@/lib/storage";
// DocumentCategory and VisibilityLevel types derived from local const arrays

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

const VISIBILITY_LEVELS = ["PRIVATE", "SHARED", "PUBLIC"] as const;

type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

type Params = { vehicleId: string; documentId: string };

// ─── Ownership helper ─────────────────────────────────────────────────────────

async function getDocumentForOwner(documentId: string, userId: string) {
  return prisma.vehicleDocument.findFirst({
    where: {
      id: documentId,
      vehicle: { ownerId: userId },
    },
  });
}

// ─── GET /api/vehicles/[vehicleId]/documents/[documentId] ─────────────────────
// Redirects to a signed download URL

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await requireAuth();
    const { documentId, vehicleId } = await params;

    const doc = await getDocumentForOwner(documentId, session.user.id);
    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const signedUrl = await getSignedDownloadUrl(doc.fileKey, 600); // 10 min
    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error("[GET /documents/[documentId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/vehicles/[vehicleId]/documents/[documentId] ──────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await requireAuth();
    const { documentId } = await params;

    const doc = await getDocumentForOwner(documentId, session.user.id);
    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (typeof body.title === "string") updateData.title = body.title;
    if (
      typeof body.category === "string" &&
      DOCUMENT_CATEGORIES.includes(body.category as (typeof DOCUMENT_CATEGORIES)[number])
    ) {
      updateData.category = body.category as DocumentCategory;
    }
    if (body.documentDate !== undefined) {
      updateData.documentDate = body.documentDate ? new Date(body.documentDate) : null;
    }
    if (
      typeof body.visibilitySetting === "string" &&
      VISIBILITY_LEVELS.includes(body.visibilitySetting as (typeof VISIBILITY_LEVELS)[number])
    ) {
      updateData.visibilitySetting = body.visibilitySetting as VisibilityLevel;
    }
    if (typeof body.includeInShareDefault === "boolean") {
      updateData.includeInShareDefault = body.includeInShareDefault;
    }

    const updated = await prisma.vehicleDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /documents/[documentId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/vehicles/[vehicleId]/documents/[documentId] ─────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await requireAuth();
    const { documentId } = await params;

    const doc = await getDocumentForOwner(documentId, session.user.id);
    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from storage
    try {
      await deleteFile(doc.fileKey);
    } catch (storageError) {
      console.error("[DELETE /documents/[documentId]] Storage error:", storageError);
    }

    await prisma.vehicleDocument.delete({ where: { id: documentId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /documents/[documentId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
