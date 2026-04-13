import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function DELETE() {
  const session = await requireAuth();
  const userId = session.user.id;

  await prisma.$transaction([
    // Anonymize the user — soft delete
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        name: "Deleted User",
        passwordHash: null,
        avatarUrl: null,
        deletedAt: new Date(),
      },
    }),
    // Archive all vehicles
    prisma.vehicle.updateMany({
      where: { ownerId: userId },
      data: { archivedAt: new Date() },
    }),
    // Revoke all share links
    prisma.shareLink.updateMany({
      where: { createdByUserId: userId },
      data: { revokedAt: new Date() },
    }),
    // Cancel pending transfers
    prisma.ownershipTransfer.updateMany({
      where: { fromUserId: userId, status: "PENDING" },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      actionType: "ACCOUNT_DELETED",
      targetType: "User",
      targetId: userId,
      metadata: {},
    },
  });

  return Response.json({ success: true });
}
