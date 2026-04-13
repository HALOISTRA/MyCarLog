"use client";

import Link from "next/link";
import {
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Archive,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import type { VehicleSummary } from "@/types";

interface VehicleCardProps {
  vehicle: VehicleSummary & { archivedAt?: Date | null };
}

/** Returns a deterministic gradient based on the vehicle make initial */
function makePlaceholderGradient(make: string): string {
  const gradients = [
    "from-blue-600 to-blue-800",
    "from-slate-600 to-slate-800",
    "from-indigo-600 to-indigo-800",
    "from-sky-600 to-sky-800",
    "from-violet-600 to-violet-800",
    "from-teal-600 to-teal-800",
  ];
  const idx = (make.charCodeAt(0) ?? 0) % gradients.length;
  return gradients[idx];
}

function maskPlate(plate: string): string {
  if (plate.length <= 4) return plate;
  const first = plate.slice(0, 2);
  const last = plate.slice(-2);
  const masked = "*".repeat(plate.length - 4);
  return `${first}${masked}${last}`;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { t } = useLanguage();
  const isArchived = !!vehicle.archivedAt;
  const hasOverdue = vehicle.overdueCount > 0;
  const hasDueSoon = !hasOverdue && vehicle.dueSoonCount > 0;

  const gradient = makePlaceholderGradient(vehicle.make);

  const reminderBadge = hasOverdue ? (
    <Badge className="gap-1 text-xs text-white border-0" style={{ backgroundColor: "#dc2626" }}>
      <AlertTriangle className="h-3 w-3" />
      {vehicle.overdueCount} {t("garage.overdue")}
    </Badge>
  ) : hasDueSoon ? (
    <Badge className="gap-1 text-xs text-white border-0" style={{ backgroundColor: "#d97706" }}>
      <Clock className="h-3 w-3" />
      {vehicle.dueSoonCount} {t("garage.dueSoon")}
    </Badge>
  ) : (
    <Badge className="gap-1 text-xs text-white border-0" style={{ backgroundColor: "#16a34a" }}>
      <CheckCircle2 className="h-3 w-3" />
      {t("garage.allOk")}
    </Badge>
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        isArchived && "opacity-60"
      )}
    >
      {/* ── Image / placeholder ──────────────────────────────────────── */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
        {vehicle.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradient
            )}
          >
            <Car className="h-14 w-14 text-white/40" aria-hidden="true" />
          </div>
        )}

        {/* Archived overlay */}
        {isArchived && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-xl bg-slate-900/50 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "#475569" }}>
              <Archive className="h-3.5 w-3.5" />
              {t("garage.archived")}
            </span>
          </div>
        )}
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold leading-tight text-slate-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.nickname && (
            <p className="mt-0.5 truncate text-sm text-slate-500">
              &ldquo;{vehicle.nickname}&rdquo;
            </p>
          )}
        </div>

        {/* Badges row: plate + fuel */}
        <div className="flex flex-wrap items-center gap-1.5">
          {vehicle.plate && (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-600">
              {maskPlate(vehicle.plate)}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            <Gauge className="h-3 w-3 shrink-0 text-blue-500" />
            {vehicle.currentMileage.toLocaleString()}&nbsp;{vehicle.mileageUnit.toLowerCase()}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Status + action row */}
        <div className="flex items-center justify-between gap-2">
          {!isArchived ? reminderBadge : <span />}
          <Link href={`/garage/${vehicle.id}`}>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {t("garage.viewVehicle")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
