"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import type { ShareVisibilityConfig } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Schemas ──────────────────────────────────────────────────────────────────

const visibilityConfigSchema = z.object({
  showMaintenance: z.boolean().default(true),
  showDocuments: z.boolean().default(false),
  showCosts: z.boolean().default(false),
  showVin: z.boolean().default(false),
  showPlate: z.boolean().default(true),
  showNotes: z.boolean().default(false),
});

const createShareLinkSchema = z.object({
  label: z.string().max(100).optional(),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  pin: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
    .optional(),
  visibilityConfig: visibilityConfigSchema.default({
    showMaintenance: true,
    showDocuments: false,
    showCosts: false,
    showVin: false,
    showPlate: true,
    showNotes: false,
  }),
});

export type CreateShareLinkInput = z.input<typeof createShareLinkSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertVehicleOwnership(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId },
    select: { id: true },
  });
  if (!vehicle) throw new Error("Vehicle not found or access denied");
  return vehicle;
}

async function assertShareLinkOwnership(id: string, userId: string) {
  const link = await prisma.shareLink.findFirst({
    where: { id, createdByUserId: userId },
    select: { id: true, vehicleId: true },
  });
  if (!link) throw new Error("Share link not found or access denied");
  return link;
}

// ─── createShareLink ──────────────────────────────────────────────────────────

export async function createShareLink(
  vehicleId: string,
  data: CreateShareLinkInput
): Promise<ActionResult<{ id: string; token: string; url: string }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await assertVehicleOwnership(vehicleId, userId);

    const parsed = createShareLinkSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data",
      };
    }

    const { label, expiresAt, pin, visibilityConfig } = parsed.data;

    // Hash PIN if provided
    let pinHash: string | undefined;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    // Generate a URL-safe token (21 chars of nanoid gives ~126 bits of entropy)
    const token = nanoid(21);

    const link = await prisma.shareLink.create({
      data: {
        vehicleId,
        createdByUserId: userId,
        token,
        pinHash: pinHash ?? null,
        expiresAt: expiresAt ?? null,
        label: label ?? null,
        visibilityConfig: visibilityConfig as any,
      },
      select: { id: true, token: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = `${baseUrl}/share/${link.token}`;

    revalidatePath(`/garage/${vehicleId}`);
    return { success: true, data: { id: link.id, token: link.token, url } };
  } catch (error) {
    console.error("[createShareLink]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create share link",
    };
  }
}

// ─── revokeShareLink ──────────────────────────────────────────────────────────

export async function revokeShareLink(
  id: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const link = await assertShareLinkOwnership(id, session.user.id);

    await prisma.shareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    revalidatePath(`/garage/${link.vehicleId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[revokeShareLink]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke link",
    };
  }
}

// ─── deleteShareLink ──────────────────────────────────────────────────────────

export async function deleteShareLink(
  id: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const link = await assertShareLinkOwnership(id, session.user.id);

    await prisma.shareLink.delete({ where: { id } });

    revalidatePath(`/garage/${link.vehicleId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteShareLink]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete link",
    };
  }
}
