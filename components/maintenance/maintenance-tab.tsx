"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Bell,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MaintenanceTimeline } from "./maintenance-timeline";
import { AddServiceRecordDialog } from "./add-service-record-dialog";
import type {
  Vehicle,
  MaintenanceRecord,
  VehiclePlanAssignment,
  MaintenancePlanItem,
  AssignmentConfidence,
} from "@/generated/prisma";
import { MAINTENANCE_CATEGORY_LABELS } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanItemStatus = "UP_TO_DATE" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";

interface EnrichedPlanItem extends MaintenancePlanItem {
  status: PlanItemStatus;
  lastServicedAt?: Date | null;
  lastServicedMileage?: number | null;
}

interface MaintenanceTabProps {
  vehicle: Vehicle;
  records: MaintenanceRecord[];
  planAssignment?: (VehiclePlanAssignment & {
    plan: {
      id: string;
      make: string;
      model: string;
      sourceLabel: string | null;
      verificationStatus: string;
    };
  }) | null;
  planItems?: EnrichedPlanItem[];
  isOwner?: boolean;
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<
  AssignmentConfidence,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  EXACT: { label: "Exact match", variant: "default" },
  LIKELY: { label: "Likely match", variant: "secondary" },
  MANUAL_REVIEW: { label: "Manual review", variant: "outline" },
};

// ─── Plan item status config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PlanItemStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  UP_TO_DATE: {
    label: "Up to date",
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
  },
  DUE_SOON: {
    label: "Due soon",
    icon: Clock,
    className: "text-yellow-600 dark:text-yellow-400",
  },
  OVERDUE: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "text-red-600 dark:text-red-400",
  },
  UNKNOWN: {
    label: "Unknown",
    icon: HelpCircle,
    className: "text-neutral-400",
  },
};

// ─── Plan section ─────────────────────────────────────────────────────────────

function PlanSection({
  planAssignment,
  planItems = [],
}: {
  planAssignment: NonNullable<MaintenanceTabProps["planAssignment"]>;
  planItems: EnrichedPlanItem[];
}) {
  const [expanded, setExpanded] = useState(true);
  const confidence = planAssignment.assignmentConfidence as AssignmentConfidence;
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];

  const isVerified =
    planAssignment.plan.verificationStatus === "VERIFIED";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-base">
              Official Maintenance Plan
            </CardTitle>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {planAssignment.plan.sourceLabel ??
                `${planAssignment.plan.make} ${planAssignment.plan.model}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={confidenceConfig.variant}>
              {confidenceConfig.label}
            </Badge>
            {isVerified && (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 w-full justify-between px-2 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide plan items" : "Show plan items"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </CardHeader>

      {expanded && planItems.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {planItems.map((item: EnrichedPlanItem & Record<string, any>) => {
              const statusConfig = STATUS_CONFIG[item.status];
              const StatusIcon = statusConfig.icon;
              const categoryLabel =
                MAINTENANCE_CATEGORY_LABELS[item.category as string]?.en ?? item.category;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 dark:border-neutral-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {categoryLabel}
                      {item.mileageInterval && (
                        <> &middot; every {item.mileageInterval.toLocaleString()} km</>
                      )}
                      {item.timeIntervalMonths && (
                        <> &middot; every {item.timeIntervalMonths} months</>
                      )}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      statusConfig.className
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Bell className="h-3.5 w-3.5" />
              Suggest Reminders
            </Button>
          </div>
        </CardContent>
      )}

      {expanded && planItems.length === 0 && (
        <CardContent className="pt-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No plan items available.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MaintenanceTab({
  vehicle,
  records,
  planAssignment,
  planItems = [],
  isOwner = false,
}: MaintenanceTabProps) {
  const [key, setKey] = useState(0);

  function handleRecordAdded() {
    // Bump key to re-render the timeline after a new record is added
    setKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {/* Official maintenance plan */}
      {planAssignment && (
        <PlanSection
          planAssignment={planAssignment}
          planItems={planItems}
        />
      )}

      {/* Service history */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Service History
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isOwner && (
            <AddServiceRecordDialog
              vehicleId={vehicle.id}
              onSuccess={handleRecordAdded}
            />
          )}
        </div>

        <Separator className="mb-4" />

        <MaintenanceTimeline
          key={key}
          records={records}
          currentMileage={vehicle.currentMileage}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
