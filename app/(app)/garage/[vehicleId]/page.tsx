import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { VehicleHeader } from "@/components/vehicles/vehicle-header";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";

interface Props {
  params: Promise<{ vehicleId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { make: true, model: true, year: true, nickname: true },
  });
  if (!vehicle) return { title: "Vehicle Not Found" };
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` — ${vehicle.nickname}` : ""}`;
  return { title };
}

async function getVehicle(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: userId },
    include: {
      reminders: {
        orderBy: { dueDate: "asc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      maintenanceRecords: {
        orderBy: { performedAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          documents: true,
          maintenanceRecords: true,
          reminders: {
            where: { status: { in: ["OVERDUE", "DUE_SOON"] } },
          },
        },
      },
    },
  });
}

export type VehicleWithRelations = NonNullable<Awaited<ReturnType<typeof getVehicle>>>;

export default async function VehicleProfilePage({ params }: Props) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await getVehicle(vehicleId, session.user.id);
  if (!vehicle) notFound();

  const overdueCount = vehicle.reminders.filter((r) => r.status === "OVERDUE").length;
  const dueSoonCount = vehicle.reminders.filter((r) => r.status === "DUE_SOON").length;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Link
          href="/garage"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          My Garage
        </Link>
        <span className="text-slate-300">/</span>
        <span className="truncate max-w-[220px] text-slate-900 font-semibold">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.nickname ? ` — ${vehicle.nickname}` : ""}
        </span>
      </nav>

      {/* ── Vehicle header ──────────────────────────────────────────── */}
      <VehicleHeader
        vehicle={vehicle}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
      />

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <VehicleTabs
        vehicle={vehicle}
        documentCount={vehicle._count.documents}
        maintenanceCount={vehicle._count.maintenanceRecords}
        reminderCount={vehicle._count.reminders}
      />
    </div>
  );
}
