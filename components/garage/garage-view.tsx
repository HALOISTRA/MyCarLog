"use client";

import Link from "next/link";
import { Plus, Car, AlertTriangle, Bell, LayoutGrid, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { useLanguage } from "@/components/providers/language-provider";
import type { VehicleSummary } from "@/types";

interface GarageViewProps {
  activeVehicles: (VehicleSummary & { archivedAt: Date | null })[];
  archivedVehicles: (VehicleSummary & { archivedAt: Date | null })[];
}

export function GarageView({ activeVehicles, archivedVehicles }: GarageViewProps) {
  const { t } = useLanguage();

  const totalOverdue = activeVehicles.reduce((sum, v) => sum + v.overdueCount, 0);
  const totalDueSoon = activeVehicles.reduce((sum, v) => sum + v.dueSoonCount, 0);
  const totalActiveReminders = totalOverdue + totalDueSoon;

  return (
    <div className="space-y-8">
      {/* ── Hero section ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("garage.myGarage")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("garage.subtitle")}</p>
        </div>
        <Link href="/garage/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            {t("garage.addVehicle")}
          </Button>
        </Link>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      {activeVehicles.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<LayoutGrid className="h-5 w-5 text-blue-600" />}
            value={activeVehicles.length}
            label={t("garage.totalVehicles")}
            valueColor="text-blue-600"
          />
          <StatCard
            icon={<Bell className="h-5 w-5 text-amber-500" />}
            value={totalActiveReminders}
            label={t("garage.activeReminders")}
            valueColor="text-amber-500"
            href={totalActiveReminders > 0 ? "/reminders?filter=due_soon" : undefined}
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            value={totalOverdue}
            label={t("garage.overdueItems")}
            valueColor={totalOverdue > 0 ? "text-red-500" : "text-slate-400"}
            href={totalOverdue > 0 ? "/reminders?filter=overdue" : undefined}
          />
        </div>
      )}

      {/* ── Vehicle grid / empty state ─────────────────────────────────── */}
      {activeVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Car className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            {t("garage.garageEmpty")}
          </h2>
          <p className="mb-6 max-w-sm text-sm text-slate-500">
            {t("garage.addToStart")}
          </p>
          <Link href="/garage/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              {t("garage.addFirstVehicle")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      {/* ── Archived vehicles ─────────────────────────────────────────── */}
      {archivedVehicles.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors select-none">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
            {t("garage.archivedVehicles")} ({archivedVehicles.length})
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {archivedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Stat card sub-component ──────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  valueColor: string;
  href?: string;
}

function StatCard({ icon, value, label, valueColor, href }: StatCardProps) {
  const inner = (
    <div className={`flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        {href && <ChevronRight className="h-4 w-4 text-slate-400" />}
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default GarageView;
