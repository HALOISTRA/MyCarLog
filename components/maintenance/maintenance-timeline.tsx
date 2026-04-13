"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Wrench,
  Droplets,
  Filter,
  Zap,
  Shield,
  Clock,
  Gauge,
  Leaf,
  Settings,
  Car,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Wind,
  Fuel,
  Thermometer,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteMaintenanceRecord } from "@/app/actions/maintenance";
import { MAINTENANCE_CATEGORY_LABELS } from "@/types";
import type { MaintenanceRecord } from "@/app/generated/prisma";

// ─── Category icon map ────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  OIL_CHANGE: Droplets,
  FILTER_AIR: Wind,
  FILTER_CABIN: Wind,
  FILTER_FUEL: Fuel,
  FILTER_OIL: Filter,
  BRAKE_FLUID: Shield,
  COOLANT: Thermometer,
  SPARK_PLUGS: Zap,
  TIMING_BELT: Clock,
  TIMING_CHAIN: Clock,
  TRANSMISSION_OIL: Settings,
  TIRES: Car,
  BATTERY: Zap,
  BRAKES: Shield,
  SUSPENSION: Gauge,
  REGISTRATION: CalendarDays,
  INSURANCE: Shield,
  INSPECTION: Settings,
  SEASONAL_SERVICE: Leaf,
  GENERAL_SERVICE: Wrench,
  REPAIR: Wrench,
  CUSTOM: Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  OIL_CHANGE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FILTER_AIR: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  FILTER_CABIN: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  FILTER_FUEL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  FILTER_OIL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  BRAKE_FLUID: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  COOLANT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SPARK_PLUGS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  TIMING_BELT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  TIMING_CHAIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  TRANSMISSION_OIL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TIRES: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  BATTERY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  BRAKES: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUSPENSION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  REGISTRATION: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  INSURANCE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INSPECTION: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  SEASONAL_SERVICE: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  GENERAL_SERVICE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REPAIR: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  CUSTOM: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MaintenanceTimelineProps {
  records: MaintenanceRecord[];
  currentMileage: number;
  isOwner: boolean;
  isLoading?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
}

// ─── Single record card ───────────────────────────────────────────────────────

function RecordCard({
  record,
  isOwner,
  onEdit,
  onDeleted,
}: {
  record: MaintenanceRecord;
  isOwner: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const Icon = CATEGORY_ICONS[record.category] ?? Wrench;
  const iconColor = CATEGORY_COLORS[record.category] ?? CATEGORY_COLORS.CUSTOM;
  const categoryLabel =
    MAINTENANCE_CATEGORY_LABELS[record.category]?.en ?? record.category;

  const hasExtra =
    record.description ||
    record.partsUsed ||
    record.laborNotes;

  const longDescription =
    record.description && record.description.length > 120;

  async function handleDelete() {
    if (!confirm("Delete this service record? This cannot be undone.")) return;
    setDeleting(true);
    const result = await deleteMaintenanceRecord(record.id);
    if (result.success) {
      toast.success("Record deleted");
      onDeleted(record.id);
    } else {
      toast.error(result.error ?? "Failed to delete record");
    }
    setDeleting(false);
  }

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            iconColor
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-1 w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Card body */}
      <div className="mb-6 flex-1 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        {/* Header row */}
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex-1">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {record.title}
            </p>
            {record.workshopName && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {record.workshopName}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(record.performedAt), "d MMM yyyy")}
            </Badge>
            {record.mileageAtService !== null &&
              record.mileageAtService !== undefined && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Gauge className="h-3 w-3" />
                  {record.mileageAtService.toLocaleString()} km
                </Badge>
              )}
            {record.costAmount !== null &&
              record.costAmount !== undefined && (
                <Badge className="text-xs">
                  {Number(record.costAmount).toFixed(2)}{" "}
                  {record.currency ?? "EUR"}
                </Badge>
              )}
          </div>
        </div>

        {/* Description (collapsible if long) */}
        {record.description && (
          <div className="mt-3">
            <p
              className={cn(
                "text-sm text-neutral-700 dark:text-neutral-300",
                !expanded && longDescription && "line-clamp-2"
              )}
            >
              {record.description}
            </p>
            {longDescription && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Extra details (parts / labor) – revealed on expand */}
        {expanded && (record.partsUsed || record.laborNotes) && (
          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {record.partsUsed && (
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Parts used
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {record.partsUsed}
                </p>
              </div>
            )}
            {record.laborNotes && (
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Labor notes
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {record.laborNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toggle extra details if no long description triggers expand */}
        {!longDescription && hasExtra && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {expanded ? (
              <>
                Hide details <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show details <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="mt-3 flex justify-end gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(record)}
                className="h-7 px-2 text-xs"
              >
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MaintenanceTimeline({
  records,
  currentMileage,
  isOwner,
  isLoading = false,
  onEdit,
}: MaintenanceTimelineProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [localRecords, setLocalRecords] =
    useState<MaintenanceRecord[]>(records);

  // Keep in sync when parent updates
  if (records !== localRecords && records.length !== localRecords.length) {
    setLocalRecords(records);
  }

  const sorted = [...localRecords].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  const filtered =
    categoryFilter === "ALL"
      ? sorted
      : sorted.filter((r) => r.category === categoryFilter);

  const categories = Array.from(new Set(localRecords.map((r) => r.category)));

  function handleDeleted(id: string) {
    setLocalRecords((prev) => prev.filter((r) => r.id !== id));
  }

  if (isLoading) return <TimelineSkeleton />;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </p>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {MAINTENANCE_CATEGORY_LABELS[cat]?.en ?? cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
          <Wrench className="h-8 w-8 text-neutral-400" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {localRecords.length === 0
              ? "No service records yet"
              : "No records match the selected filter"}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div>
        {filtered.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            isOwner={isOwner}
            onEdit={onEdit}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
}
