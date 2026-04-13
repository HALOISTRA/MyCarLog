"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/types";
import { updateVehicleMileage } from "@/app/actions/vehicles";
import type { VehicleWithRelations } from "@/app/(app)/garage/[vehicleId]/page";

interface VehicleOverviewProps {
  vehicle: VehicleWithRelations;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SpecRow({
  labelEn,
  labelHr,
  value,
}: {
  labelEn: string;
  labelHr: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <dt className="min-w-0 shrink-0 text-sm text-muted-foreground sm:w-40">
        <span>{labelEn}</span>
        <span className="hidden sm:inline text-muted-foreground/60"> / {labelHr}</span>
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

// ─── Mileage update inline form ───────────────────────────────────────────────

function MileageUpdateForm({
  vehicleId,
  currentMileage,
  mileageUnit,
}: {
  vehicleId: string;
  currentMileage: number;
  mileageUnit: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentMileage));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newMileage = parseInt(value, 10);
    if (isNaN(newMileage) || newMileage < 0) {
      toast.error("Enter a valid mileage value");
      return;
    }
    setLoading(true);
    try {
      const result = await updateVehicleMileage(vehicleId, newMileage);
      if (result.success) {
        toast.success("Mileage updated!");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update mileage");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {currentMileage.toLocaleString()}&nbsp;{mileageUnit.toLowerCase()}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setValue(String(currentMileage));
            setEditing(true);
          }}
        >
          <Pencil className="h-3 w-3" />
          Update
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-32 text-sm"
        autoFocus
      />
      <span className="text-sm text-muted-foreground">{mileageUnit.toLowerCase()}</span>
      <Button type="submit" size="sm" variant="default" className="h-8 gap-1" disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Save
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => setEditing(false)}
        disabled={loading}
      >
        Cancel
      </Button>
    </form>
  );
}

// ─── VIN reveal toggle ────────────────────────────────────────────────────────

function RevealableField({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = value.slice(0, 3) + "•".repeat(Math.max(0, value.length - 6)) + value.slice(-3);
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("font-mono text-sm", !revealed && "tracking-widest")}>
        {revealed ? value : masked}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={revealed ? "Hide VIN" : "Reveal VIN"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VehicleOverview({ vehicle }: VehicleOverviewProps) {
  const fuelLabel = FUEL_TYPE_LABELS[vehicle.fuelType];
  const transmissionLabel = TRANSMISSION_LABELS[vehicle.transmission];
  const drivetrainLabel = DRIVETRAIN_LABELS[vehicle.drivetrain];

  const ownershipSince = vehicle.purchaseDate
    ? format(new Date(vehicle.purchaseDate), "d MMM yyyy")
    : null;

  // Days since purchase
  const daysSincePurchase = vehicle.purchaseDate
    ? Math.floor(
        (Date.now() - new Date(vehicle.purchaseDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: specs + stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* ── Quick stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Current Mileage"
            labelHr="Trenutna km"
            value={`${vehicle.currentMileage.toLocaleString()} ${vehicle.mileageUnit.toLowerCase()}`}
          />
          {vehicle.purchaseDate && (
            <StatCard
              label="Owned Since"
              labelHr="Vlasništvo od"
              value={ownershipSince!}
            />
          )}
          {daysSincePurchase !== null && (
            <StatCard
              label="Days Owned"
              labelHr="Dana vlasništva"
              value={daysSincePurchase.toLocaleString()}
            />
          )}
        </div>

        {/* ── Identity ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionHeading>Vehicle Identity / Identitet vozila</SectionHeading>
          <dl className="space-y-3">
            <SpecRow labelEn="Make" labelHr="Marka" value={vehicle.make} />
            <SpecRow labelEn="Model" labelHr="Model" value={vehicle.model} />
            <SpecRow labelEn="Year" labelHr="Godina" value={vehicle.year} />
            <SpecRow labelEn="Trim" labelHr="Varijanta" value={vehicle.trim} />
            <SpecRow labelEn="Generation" labelHr="Generacija" value={vehicle.generation} />
            <SpecRow labelEn="Body Type" labelHr="Karoserija" value={vehicle.bodyType} />
            <SpecRow labelEn="Color" labelHr="Boja" value={vehicle.color} />
            <SpecRow labelEn="Market" labelHr="Tržište" value={vehicle.marketRegion} />
            <SpecRow labelEn="Nickname" labelHr="Nadimak" value={vehicle.nickname} />
            {vehicle.plate && (
              <SpecRow
                labelEn="Plate"
                labelHr="Registracija"
                value={
                  <span className="font-mono tracking-wider">{vehicle.plate}</span>
                }
              />
            )}
            {vehicle.vin && (
              <SpecRow
                labelEn="VIN"
                labelHr="VIN"
                value={<RevealableField value={vehicle.vin} />}
              />
            )}
          </dl>
        </div>

        {/* ── Engine & Drivetrain ───────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionHeading>Engine & Drivetrain / Motor i pogon</SectionHeading>
          <dl className="space-y-3">
            <SpecRow
              labelEn="Fuel Type"
              labelHr="Gorivo"
              value={
                fuelLabel
                  ? `${fuelLabel.en} / ${fuelLabel.hr}`
                  : vehicle.fuelType
              }
            />
            <SpecRow
              labelEn="Transmission"
              labelHr="Mjenjač"
              value={
                transmissionLabel
                  ? `${transmissionLabel.en} / ${transmissionLabel.hr}`
                  : vehicle.transmission
              }
            />
            <SpecRow
              labelEn="Drivetrain"
              labelHr="Pogon"
              value={
                drivetrainLabel
                  ? `${drivetrainLabel.en} / ${drivetrainLabel.hr}`
                  : vehicle.drivetrain
              }
            />
            <SpecRow labelEn="Engine" labelHr="Motor" value={vehicle.engine} />
            <SpecRow
              labelEn="Engine Code"
              labelHr="Šifra motora"
              value={vehicle.engineCode}
            />
          </dl>
        </div>

        {/* ── Purchase info ─────────────────────────────────────── */}
        {(vehicle.purchaseDate || vehicle.purchaseMileage !== null) && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <SectionHeading>Purchase Info / Informacije o kupnji</SectionHeading>
            <dl className="space-y-3">
              {vehicle.purchaseDate && (
                <SpecRow
                  labelEn="Purchase Date"
                  labelHr="Datum kupnje"
                  value={format(new Date(vehicle.purchaseDate), "d MMMM yyyy")}
                />
              )}
              {vehicle.purchaseMileage !== null && (
                <SpecRow
                  labelEn="Mileage at Purchase"
                  labelHr="Km pri kupnji"
                  value={`${vehicle.purchaseMileage!.toLocaleString()} ${vehicle.mileageUnit.toLowerCase()}`}
                />
              )}
              {vehicle.purchaseMileage !== null && (
                <SpecRow
                  labelEn="Km Since Purchase"
                  labelHr="Km od kupnje"
                  value={`${(vehicle.currentMileage - vehicle.purchaseMileage!).toLocaleString()} ${vehicle.mileageUnit.toLowerCase()}`}
                />
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Right: mileage update + notes */}
      <div className="space-y-4">
        {/* Update mileage */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <SectionHeading>Update Mileage / Ažuriraj km</SectionHeading>
          <MileageUpdateForm
            vehicleId={vehicle.id}
            currentMileage={vehicle.currentMileage}
            mileageUnit={vehicle.mileageUnit}
          />
          <p className="text-xs text-muted-foreground">
            Keep mileage current for accurate reminder calculations.
          </p>
        </div>

        {/* Notes */}
        {vehicle.notes && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <SectionHeading>Notes / Bilješke</SectionHeading>
              <span className="text-xs text-muted-foreground">(private)</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {vehicle.notes}
            </p>
          </div>
        )}

        {/* Created / updated timestamps */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <SectionHeading>Record Info</SectionHeading>
          <dl className="space-y-2">
            <div className="flex justify-between text-xs">
              <dt className="text-muted-foreground">Added</dt>
              <dd className="text-foreground">
                {format(new Date(vehicle.createdAt), "d MMM yyyy")}
              </dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="text-foreground">
                {format(new Date(vehicle.updatedAt), "d MMM yyyy")}
              </dd>
            </div>
            {vehicle.archivedAt && (
              <div className="flex justify-between text-xs">
                <dt className="text-muted-foreground">Archived</dt>
                <dd className="text-foreground">
                  {format(new Date(vehicle.archivedAt), "d MMM yyyy")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  labelHr,
  value,
}: {
  label: string;
  labelHr: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">
        {label}
        <span className="hidden sm:inline"> / {labelHr}</span>
      </p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default VehicleOverview;
