import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import type { ShareVisibilityConfig } from "@/types";

type Params = { vehicleId: string };

// ─── GET /api/vehicles/[vehicleId]/shares ─────────────────────────────────────
// List share links for the authenticated owner

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
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

    const links = await prisma.shareLink.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: links });
  } catch (error) {
    console.error("[GET /api/vehicles/[vehicleId]/shares]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/vehicles/[vehicleId]/shares ────────────────────────────────────
// Create a new share link

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
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

    const body = await req.json();

    const {
      label,
      expiresAt: expiresAtRaw,
      pin,
      visibilityConfig,
    }: {
      label?: string;
      expiresAt?: string;
      pin?: string;
      visibilityConfig?: Partial<ShareVisibilityConfig>;
    } = body;

    // Validate PIN if provided
    if (pin !== undefined && pin !== null && pin !== "") {
      if (!/^\d{4}$/.test(pin)) {
        return Response.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 }
        );
      }
    }

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    if (expiresAt && expiresAt <= new Date()) {
      return Response.json(
        { error: "Expiry date must be in the future" },
        { status: 400 }
      );
    }

    // Hash PIN
    let pinHash: string | null = null;
    if (pin && pin.length === 4) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    // Merge visibility config with defaults
    const defaultVisibility: ShareVisibilityConfig = {
      showMaintenance: true,
      showDocuments: false,
      showCosts: false,
      showVin: false,
      showPlate: true,
      showNotes: false,
    };

    const mergedVisibility: ShareVisibilityConfig = {
      ...defaultVisibility,
      ...(visibilityConfig ?? {}),
    };

    const token = nanoid(21);

    const link = await prisma.shareLink.create({
      data: {
        vehicleId,
        createdByUserId: session.user.id,
        token,
        pinHash,
        expiresAt,
        label: label ?? null,
        visibilityConfig: mergedVisibility as any,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = `${baseUrl}/share/${token}`;

    return Response.json(
      { success: true, data: { ...link, url } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/vehicles/[vehicleId]/shares]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
