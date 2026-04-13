import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { GarageView } from "@/components/garage/garage-view";
import type { VehicleSummary } from "@/types";

export const metadata: Metadata = {
  title: "My Garage",
};

async function getVehiclesWithCounts(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: userId },
    orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          reminders: {
            where: { status: { in: ["OVERDUE", "DUE_SOON"] } },
          },
        },
      },
      reminders: {
        where: { status: { in: ["OVERDUE", "DUE_SOON"] } },
        select: { status: true },
      },
    },
  });

  return vehicles.map((v): VehicleSummary & { archivedAt: Date | null } => {
    const overdueCount = v.reminders.filter((r) => r.status === "OVERDUE").length;
    const dueSoonCount = v.reminders.filter((r) => r.status === "DUE_SOON").length;
    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      plate: v.plate,
      currentMileage: v.currentMileage,
      mileageUnit: v.mileageUnit,
      imageUrl: v.imageUrl,
      nickname: v.nickname,
      overdueCount,
      dueSoonCount,
      archivedAt: v.archivedAt,
    };
  });
}

export default async function GaragePage() {
  const session = await requireAuth();
  const allVehicles = await getVehiclesWithCounts(session.user.id);

  const activeVehicles = allVehicles.filter((v) => !v.archivedAt);
  const archivedVehicles = allVehicles.filter((v) => v.archivedAt);

  return (
    <GarageView
      activeVehicles={activeVehicles}
      archivedVehicles={archivedVehicles}
    />
  );
}
