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
  Wind,
  Fuel,
  Thermometer,
  CalendarDays,
  CheckCircle,
  BellOff,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeReminder,
  snoozeReminder,
  deleteReminder,
} from "@/app/actions/reminders";
import type { ReminderWithStatus } from "@/lib/reminders/engine";
import { MAINTENANCE_CATEGORY_LABELS } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

// ─── Icon map ─────────────────────────────────────────────────────────────────

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

// ─── Status group config ──────────────────────────────────────────────────────

type GroupKey = "OVERDUE" | "DUE_SOON" | "UPCOMING" | "COMPLETED";

const GROUP_CONFIG: Record<
  GroupKey,
  {
    labelKey: string;
    emptyLabelKey: string;
    barColor: string;
    headerBg: string;
    headerText: string;
    countBadge: string;
    countBadgeStyle?: React.CSSProperties;
    badgeClass: string;
    badgeStyle?: React.CSSProperties;
  }
> = {
  OVERDUE: {
    labelKey: "reminders.overdue",
    emptyLabelKey: "reminders.noOverdue",
    barColor: "bg-red-500",
    headerBg: "bg-red-50 border-red-100",
    headerText: "text-red-700",
    countBadge: "text-white",
    countBadgeStyle: { backgroundColor: "#dc2626" },
    badgeClass: "text-white border-0",
    badgeStyle: { backgroundColor: "#dc2626" },
  },
  DUE_SOON: {
    labelKey: "reminders.dueSoon",
    emptyLabelKey: "reminders.nothingDueSoon",
    barColor: "bg-yellow-400",
    headerBg: "bg-yellow-50 border-yellow-100",
    headerText: "text-yellow-700",
    countBadge: "text-white",
    countBadgeStyle: { backgroundColor: "#d97706" },
    badgeClass: "text-white border-0",
    badgeStyle: { backgroundColor: "#d97706" },
  },
  UPCOMING: {
    labelKey: "reminders.upcoming",
    emptyLabelKey: "reminders.noUpcoming",
    barColor: "bg-blue-500",
    headerBg: "bg-blue-50 border-blue-100",
    headerText: "text-blue-700",
    countBadge: "text-white",
    countBadgeStyle: { backgroundColor: "#2563eb" },
    badgeClass: "text-white border-0",
    badgeStyle: { backgroundColor: "#2563eb" },
  },
  COMPLETED: {
    labelKey: "reminders.completed",
    emptyLabelKey: "reminders.noCompleted",
    barColor: "bg-green-500",
    headerBg: "bg-slate-50 border-slate-200",
    headerText: "text-slate-600",
    countBadge: "text-white",
    countBadgeStyle: { backgroundColor: "#4b5563" },
    badgeClass: "text-white border-0",
    badgeStyle: { backgroundColor: "#16a34a" },
  },
};

// ─── Snooze options ───────────────────────────────────────────────────────────

const SNOOZE_OPTIONS = [
  { value: "1", labelKey: "reminders.1day" },
  { value: "3", labelKey: "reminders.3days" },
  { value: "7", labelKey: "reminders.7days" },
  { value: "14", labelKey: "reminders.14days" },
  { value: "30", labelKey: "reminders.30days" },
];

// ─── Single reminder card ─────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  isOwner,
  onCompleted,
  onSnoozed,
  onDeleted,
  onEdit,
}: {
  reminder: ReminderWithStatus;
  isOwner: boolean;
  onCompleted: (id: string) => void;
  onSnoozed: (id: string) => void;
  onDeleted: (id: string) => void;
  onEdit?: (reminder: ReminderWithStatus) => void;
}) {
  const { t } = useLanguage();
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState("7");

  const Icon = CATEGORY_ICONS[reminder.category] ?? Wrench;
  const categoryLabel =
    MAINTENANCE_CATEGORY_LABELS[reminder.category]?.en ?? reminder.category;

  const isCompleted = reminder.computedStatus === "COMPLETED";
  const isOverdue = reminder.computedStatus === "OVERDUE";
  const isDueSoon = reminder.computedStatus === "DUE_SOON";

  const config = GROUP_CONFIG[reminder.computedStatus as GroupKey] ?? GROUP_CONFIG.UPCOMING;

  async function handleComplete() {
    setCompleting(true);
    const result = await completeReminder(reminder.id);
    if (result.success) {
      toast.success(t("reminders.markedComplete"));
      onCompleted(reminder.id);
    } else {
      toast.error(result.error ?? t("reminders.failedComplete"));
    }
    setCompleting(false);
  }

  async function handleSnooze() {
    const days = parseInt(snoozeDays, 10);
    const result = await snoozeReminder(reminder.id, days);
    if (result.success) {
      toast.success(days === 1 ? t("reminders.snoozed").replace("{n}", String(days)) : t("reminders.snoozedDays").replace("{n}", String(days)));
      setShowSnooze(false);
      onSnoozed(reminder.id);
    } else {
      toast.error(result.error ?? t("reminders.failedSnooze"));
    }
  }

  async function handleDelete() {
    if (!confirm(t("reminders.deleteConfirm"))) return;
    setDeleting(true);
    const result = await deleteReminder(reminder.id);
    if (result.success) {
      toast.success(t("reminders.deleted"));
      onDeleted(reminder.id);
    } else {
      toast.error(result.error ?? t("reminders.failedDelete"));
    }
    setDeleting(false);
  }

  function dueLabel(): string {
    if (reminder.daysUntilDue !== undefined) {
      if (reminder.daysUntilDue < 0) {
        return `${Math.abs(reminder.daysUntilDue)} ${t("reminders.daysOverdue")}`;
      }
      if (reminder.daysUntilDue === 0) return t("reminders.dueToday");
      const key = reminder.daysUntilDue === 1 ? "reminders.dueInDays" : "reminders.dueInDaysPlural";
      return t(key).replace("{n}", String(reminder.daysUntilDue));
    }
    if (reminder.mileageUntilDue !== undefined) {
      if (reminder.mileageUntilDue <= 0) {
        return `${Math.abs(reminder.mileageUntilDue).toLocaleString()} ${t("reminders.kmOverdue")}`;
      }
      return `${reminder.mileageUntilDue.toLocaleString()} ${t("reminders.kmRemaining")}`;
    }
    return "";
  }

  return (
    <div
      className={cn(
        "flex items-stretch bg-white rounded-xl border border-slate-200 shadow-sm transition-all overflow-hidden",
        isCompleted && "opacity-60"
      )}
    >
      {/* Left color bar */}
      <div className={cn("w-1 shrink-0", config.barColor)} />

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="h-4 w-4 text-slate-500" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900 text-sm">
                {reminder.title}
              </p>
              {reminder.sourceType === "OFFICIAL_PLAN" ? (
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-medium">
                  {t("reminders.officialPlan")}
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                  {t("reminders.custom")}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">{categoryLabel}</p>

            {/* Due info row */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {reminder.dueDate && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(reminder.dueDate), "d MMM yyyy")}
                </span>
              )}
              {reminder.dueMileage != null && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Gauge className="h-3 w-3" />
                  {reminder.dueMileage.toLocaleString()} km
                </span>
              )}
              {dueLabel() && (
                <span
                  className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", config.badgeClass)}
                  style={config.badgeStyle}
                >
                  {isOverdue && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                  {dueLabel()}
                </span>
              )}
            </div>

            {/* Description */}
            {reminder.description && (
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                {reminder.description}
              </p>
            )}

            {/* Snooze picker */}
            {showSnooze && (
              <div className="mt-3 flex items-center gap-2">
                <Select value={snoozeDays} onValueChange={setSnoozeDays}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SNOOZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={handleSnooze}>
                  {t("reminders.snooze")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setShowSnooze(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          {isOwner && !isCompleted && (
            <div className="flex shrink-0 gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={handleComplete}
                disabled={completing}
                title={t("reminders.markComplete")}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:bg-slate-100"
                onClick={() => setShowSnooze((v) => !v)}
                title={t("reminders.snooze")}
              >
                <BellOff className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:bg-slate-100"
                  onClick={() => onEdit(reminder)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

function ReminderGroup({
  groupKey,
  reminders,
  isOwner,
  onCompleted,
  onSnoozed,
  onDeleted,
  onEdit,
}: {
  groupKey: GroupKey;
  reminders: ReminderWithStatus[];
  isOwner: boolean;
  onCompleted: (id: string) => void;
  onSnoozed: (id: string) => void;
  onDeleted: (id: string) => void;
  onEdit?: (reminder: ReminderWithStatus) => void;
}) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(groupKey === "COMPLETED");
  const config = GROUP_CONFIG[groupKey];

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
          config.headerBg,
          config.headerText
        )}
      >
        <span className="flex items-center gap-2.5">
          {t(config.labelKey)}
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", config.countBadge)} style={config.countBadgeStyle}>
            {reminders.length}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 opacity-60" />
        ) : (
          <ChevronUp className="h-4 w-4 opacity-60" />
        )}
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-2">
          {reminders.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              {t(config.emptyLabelKey)}
            </p>
          ) : (
            reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                isOwner={isOwner}
                onCompleted={onCompleted}
                onSnoozed={onSnoozed}
                onDeleted={onDeleted}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReminderListProps {
  reminders: ReminderWithStatus[];
  currentMileage: number;
  isOwner: boolean;
  onEdit?: (reminder: ReminderWithStatus) => void;
}

export function ReminderList({
  reminders,
  currentMileage: _currentMileage,
  isOwner,
  onEdit,
}: ReminderListProps) {
  const { t } = useLanguage();
  const [localReminders, setLocalReminders] =
    useState<ReminderWithStatus[]>(reminders);

  function remove(id: string) {
    setLocalReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function markCompleted(id: string) {
    setLocalReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, computedStatus: "COMPLETED" as const } : r
      )
    );
  }

  function markSnoozed(id: string) {
    setLocalReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, computedStatus: "UPCOMING" as const } : r
      )
    );
  }

  const groups: Record<GroupKey, ReminderWithStatus[]> = {
    OVERDUE: localReminders.filter((r) => r.computedStatus === "OVERDUE"),
    DUE_SOON: localReminders.filter((r) => r.computedStatus === "DUE_SOON"),
    UPCOMING: localReminders.filter((r) => r.computedStatus === "UPCOMING"),
    COMPLETED: localReminders.filter((r) => r.computedStatus === "COMPLETED"),
  };

  const ORDER: GroupKey[] = ["OVERDUE", "DUE_SOON", "UPCOMING", "COMPLETED"];

  if (localReminders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-14 text-center">
        <CalendarDays className="h-8 w-8 text-slate-300" />
        <p className="text-slate-400 text-sm">{t("reminders.noRemindersYet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ORDER.map((key) => (
        <ReminderGroup
          key={key}
          groupKey={key}
          reminders={groups[key]}
          isOwner={isOwner}
          onCompleted={markCompleted}
          onSnoozed={markSnoozed}
          onDeleted={remove}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
