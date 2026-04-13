import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalVehicles,
      activeVehicles,
      activeShareLinks,
      pendingTransfers,
      totalTransfers,
      plansVerified,
      plansPending,
      plansNeedsReview,
      plansTotal,
      auditLast24h,
      auditLastWeek,
      recentTransfers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { archivedAt: null } }),
      prisma.shareLink.count({
        where: {
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.ownershipTransfer.count({ where: { status: "PENDING" } }),
      prisma.ownershipTransfer.count(),
      prisma.maintenancePlan.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.maintenancePlan.count({ where: { verificationStatus: "PENDING" } }),
      prisma.maintenancePlan.count({ where: { verificationStatus: "NEEDS_REVIEW" } }),
      prisma.maintenancePlan.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.ownershipTransfer.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          toEmail: true,
          vehicle: { select: { make: true, model: true, year: true } },
        },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        deleted: totalUsers - activeUsers,
      },
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
        archived: totalVehicles - activeVehicles,
      },
      shareLinks: {
        active: activeShareLinks,
      },
      transfers: {
        pending: pendingTransfers,
        total: totalTransfers,
        recent: recentTransfers,
      },
      maintenancePlans: {
        total: plansTotal,
        verified: plansVerified,
        pending: plansPending,
        needsReview: plansNeedsReview,
      },
      audit: {
        last24h: auditLast24h,
        lastWeek: auditLastWeek,
      },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
