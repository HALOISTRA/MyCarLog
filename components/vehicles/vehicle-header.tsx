"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Share2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Fuel,
  Settings2,
  Gauge,
  Archive,
  RotateCcw,
  X,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { deleteVehicle, restoreVehicle } from "@/app/actions/vehicles";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/types";
import { useLanguage } from "@/components/providers/language-provider";
import type { VehicleWithRelations } from "@/app/(app)/garage/[vehicleId]/page";

interface VehicleHeaderProps {
  vehicle: VehicleWithRelations;
  overdueCount: number;
  dueSoonCount: number;
}

export function VehicleHeader({
  vehicle,
  overdueCount,
  dueSoonCount,
}: VehicleHeaderProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isArchived = !!vehicle.archivedAt;

  const fuelLabel = FUEL_TYPE_LABELS[vehicle.fuelType]?.en ?? vehicle.fuelType;
  const transmissionLabel =
    TRANSMISSION_LABELS[vehicle.transmission]?.en ?? vehicle.transmission;
  const drivetrainLabel =
    DRIVETRAIN_LABELS[vehicle.drivetrain]?.en ?? vehicle.drivetrain;

  async function handleArchive() {
    if (
      !confirm(
        isArchived
          ? t("vehicle.restoreConfirm")
          : t("vehicle.archiveConfirm")
      )
    )
      return;
    setArchiving(true);
    try {
      const result = isArchived
        ? await restoreVehicle(vehicle.id)
        : await deleteVehicle(vehicle.id);
      if (result.success) {
        toast.success(isArchived ? t("vehicle.vehicleRestored") : t("vehicle.vehicleArchived"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("vehicle.somethingWentWrong"));
      }
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      {/* ── Main header card ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Top banner — image or gradient */}
        <div className="relative h-48 sm:h-64 w-full">
          {vehicle.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
              <Car className="h-24 w-24 text-white/20" aria-hidden="true" />
            </div>
          )}

          {/* Archived overlay */}
          {isArchived && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Badge className="gap-2 text-sm px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                <Archive className="h-4 w-4" />
                {t("garage.archived")}
              </Badge>
            </div>
          )}

          {/* Action buttons — top-right corner of the banner */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 backdrop-blur-sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("vehicle.share")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 backdrop-blur-sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("vehicle.edit")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className={cn(
                "gap-1.5 shadow-sm backdrop-blur-sm border",
                isArchived
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                  : "bg-white/90 hover:bg-white text-slate-700 border-slate-200"
              )}
              onClick={handleArchive}
              disabled={archiving}
            >
              {isArchived ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("vehicle.restore")}
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  {t("vehicle.archive")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Content section below the image ─────────────────────── */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: name + specs */}
            <div className="min-w-0 flex-1">
              {/* Vehicle name */}
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ""}
              </h1>
              {vehicle.nickname && (
                <p className="mt-0.5 text-base text-slate-500">
                  &ldquo;{vehicle.nickname}&rdquo;
                </p>
              )}

              {/* Spec badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SpecBadge icon={<Fuel className="h-3.5 w-3.5 text-blue-500" />} label={fuelLabel} />
                <SpecBadge icon={<Settings2 className="h-3.5 w-3.5 text-blue-500" />} label={transmissionLabel} />
                <SpecBadge icon={<Settings2 className="h-3.5 w-3.5 text-blue-500" />} label={drivetrainLabel} />
              </div>
            </div>

            {/* Right: mileage stat */}
            <div className="flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <Gauge className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {t("vehicle.mileage")}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {vehicle.currentMileage.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {vehicle.mileageUnit.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Status badges row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {overdueCount > 0 && (
              <Badge className="gap-1.5 text-white border-0" style={{ backgroundColor: "#dc2626" }}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueCount} {t("garage.overdue")}
              </Badge>
            )}
            {dueSoonCount > 0 && (
              <Badge className="gap-1.5 text-white border-0" style={{ backgroundColor: "#d97706" }}>
                <Clock className="h-3.5 w-3.5" />
                {dueSoonCount} {t("garage.dueSoon")}
              </Badge>
            )}
            {overdueCount === 0 && dueSoonCount === 0 && (
              <Badge className="gap-1.5 text-white border-0" style={{ backgroundColor: "#16a34a" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("vehicle.allRemindersOk")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t("vehicle.editVehicle")}
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                aria-label={t("vehicle.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            mode="edit"
            vehicleId={vehicle.id}
            defaultValues={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              trim: vehicle.trim ?? undefined,
              generation: vehicle.generation ?? undefined,
              vin: vehicle.vin ?? undefined,
              plate: vehicle.plate ?? undefined,
              engine: vehicle.engine ?? undefined,
              engineCode: vehicle.engineCode ?? undefined,
              fuelType: vehicle.fuelType,
              transmission: vehicle.transmission,
              drivetrain: vehicle.drivetrain,
              bodyType: vehicle.bodyType ?? undefined,
              color: vehicle.color ?? undefined,
              marketRegion: vehicle.marketRegion ?? undefined,
              currentMileage: vehicle.currentMileage,
              mileageUnit: vehicle.mileageUnit,
              purchaseDate: vehicle.purchaseDate
                ? vehicle.purchaseDate.toISOString().split("T")[0]
                : undefined,
              purchaseMileage: vehicle.purchaseMileage ?? undefined,
              nickname: vehicle.nickname ?? undefined,
              notes: vehicle.notes ?? undefined,
              imageUrl: vehicle.imageUrl ?? undefined,
              imageKey: vehicle.imageKey ?? undefined,
            }}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Share dialog ─────────────────────────────────────────────── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vehicle.share")}</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-sm text-slate-500">
            {t("vehicle.shareComingSoon")}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => setShareOpen(false)}
            >
              {t("vehicle.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SpecBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
      {icon}
      {label}
    </span>
  );
}

export default VehicleHeader;
