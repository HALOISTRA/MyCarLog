"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/index";
import { transferInviteEmail } from "@/lib/email/templates";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const initiateTransferSchema = z.object({
  toEmail: z.string().email("Valid email required"),
  message: z.string().max(1000).optional(),
  includeDocuments: z.boolean().default(true),
  includeCosts: z.boolean().default(false),
  includePrivateNotes: z.boolean().default(false),
  includeServiceHistory: z.boolean().default(true),
  preserveSellerArchive: z.boolean().default(true),
});

type InitiateTransferInput = z.infer<typeof initiateTransferSchema>;

// ─── Return type ──────────────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── initiateTransfer ─────────────────────────────────────────────────────────

export async function initiateTransfer(
  vehicleId: string,
  data: InitiateTransferInput
): Promise<ActionResult<{ id: string; token: string }>> {
  try {
    const session = await requireAuth();

    const parsed = initiateTransferSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { owner: true },
    });

    if (!vehicle || vehicle.ownerId !== session.user.id) {
      return { success: false, error: "Vehicle not found" };
    }

    if (vehicle.archivedAt) {
      return { success: false, error: "Cannot transfer an archived vehicle" };
    }

    // Check for existing pending transfer
    const existing = await prisma.ownershipTransfer.findFirst({
      where: { vehicleId, status: "PENDING" },
    });
    if (existing) {
      return { success: false, error: "A pending transfer already exists for this vehicle" };
    }

    if (parsed.data.toEmail === session.user.email) {
      return { success: false, error: "You cannot transfer a vehicle to yourself" };
    }

    const token = nanoid(32);
    const expiresAt = addDays(new Date(), 7);

    const transfer = await prisma.ownershipTransfer.create({
      data: {
        vehicleId,
        fromUserId: session.user.id,
        toEmail: parsed.data.toEmail,
        status: "PENDING",
        token,
        expiresAt,
        message: parsed.data.message ?? null,
        includeDocuments: parsed.data.includeDocuments,
        includeCosts: parsed.data.includeCosts,
        includePrivateNotes: parsed.data.includePrivateNotes,
        includeServiceHistory: parsed.data.includeServiceHistory,
        preserveSellerArchive: parsed.data.preserveSellerArchive,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "TRANSFER_INITIATED",
        targetType: "OwnershipTransfer",
        targetId: transfer.id,
        metadata: {
          vehicleId,
          toEmail: parsed.data.toEmail,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        },
      },
    });

    // Send invite email
    try {
      const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const fromName = vehicle.owner.name ?? vehicle.owner.email;
      const emailContent = transferInviteEmail(vehicleName, fromName, token, parsed.data.message);
      await sendEmail({
        to: parsed.data.toEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailErr) {
      console.error("[initiateTransfer] email failed", emailErr);
      // Don't fail the action if email fails
    }

    revalidatePath(`/garage/${vehicleId}`);
    return { success: true, data: { id: transfer.id, token } };
  } catch (err) {
    console.error("[initiateTransfer]", err);
    return { success: false, error: "Failed to initiate transfer" };
  }
}

// ─── cancelTransfer ───────────────────────────────────────────────────────────

export async function cancelTransfer(
  id: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const transfer = await prisma.ownershipTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      return { success: false, error: "Transfer not found" };
    }

    if (transfer.fromUserId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (transfer.status !== "PENDING") {
      return { success: false, error: "Only pending transfers can be cancelled" };
    }

    await prisma.ownershipTransfer.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: "TRANSFER_CANCELLED",
        targetType: "OwnershipTransfer",
        targetId: id,
        metadata: { vehicleId: transfer.vehicleId },
      },
    });

    revalidatePath(`/garage/${transfer.vehicleId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[cancelTransfer]", err);
    return { success: false, error: "Failed to cancel transfer" };
  }
}

// ─── acceptTransfer ───────────────────────────────────────────────────────────

export async function acceptTransfer(
  token: string
): Promise<ActionResult<{ vehicleId: string }>> {
  try {
    const session = await requireAuth();

    const transfer = await prisma.ownershipTransfer.findUnique({
      where: { token },
      include: {
        vehicle: true,
        fromUser: true,
      },
    });

    if (!transfer) {
      return { success: false, error: "Transfer not found" };
    }

    if (transfer.status === "CANCELLED") {
      return { success: false, error: "This transfer has been cancelled" };
    }

    if (transfer.status === "ACCEPTED") {
      return { success: false, error: "This transfer has already been accepted" };
    }

    if (transfer.status === "EXPIRED" || transfer.expiresAt < new Date()) {
      return { success: false, error: "This transfer link has expired" };
    }

    // Verify recipient email
    const userEmail = session.user.email;
    if (
      transfer.toEmail.toLowerCase() !== userEmail?.toLowerCase()
    ) {
      return {
        success: false,
        error: `This transfer was sent to ${transfer.toEmail}. Please log in with that email address.`,
      };
    }

    const recipientUserId = session.user.id;

    // Run transfer in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
      // 1. Update vehicle owner
      await tx.vehicle.update({
        where: { id: transfer.vehicleId },
        data: { ownerId: recipientUserId },
      });

      // 2. Mark transfer as accepted
      await tx.ownershipTransfer.update({
        where: { id: transfer.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          toUserId: recipientUserId,
        },
      });

      // 3. If preserveSellerArchive: create an audit note as a snapshot marker
      if (transfer.preserveSellerArchive) {
        await tx.auditLog.create({
          data: {
            actorUserId: transfer.fromUserId,
            actionType: "TRANSFER_ARCHIVE_SNAPSHOT",
            targetType: "Vehicle",
            targetId: transfer.vehicleId,
            metadata: {
              transferId: transfer.id,
              vehicleName: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
              snapshotDate: new Date().toISOString(),
              note: "Seller archive preserved at time of transfer",
            },
          },
        });
      }

      // 4. Revoke all existing share links
      await tx.shareLink.updateMany({
        where: {
          vehicleId: transfer.vehicleId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      // 5. Audit log the acceptance
      await tx.auditLog.create({
        data: {
          actorUserId: recipientUserId,
          actionType: "TRANSFER_ACCEPTED",
          targetType: "OwnershipTransfer",
          targetId: transfer.id,
          metadata: {
            vehicleId: transfer.vehicleId,
            fromUserId: transfer.fromUserId,
            vehicleName: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
          },
        },
      });
    });

    revalidatePath("/garage");
    revalidatePath(`/garage/${transfer.vehicleId}`);
    return { success: true, data: { vehicleId: transfer.vehicleId } };
  } catch (err) {
    console.error("[acceptTransfer]", err);
    return { success: false, error: "Failed to accept transfer" };
  }
}

// ─── expireOldTransfers ───────────────────────────────────────────────────────

export async function expireOldTransfers(): Promise<ActionResult<{ count: number }>> {
  try {
    const result = await prisma.ownershipTransfer.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return { success: true, data: { count: result.count } };
  } catch (err) {
    console.error("[expireOldTransfers]", err);
    return { success: false, error: "Failed to expire transfers" };
  }
}
