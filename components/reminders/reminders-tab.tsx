"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Bell, CheckCircle } from "lucide-react";
import { ReminderList } from "./reminder-list";
import { AddReminderDialog } from "./add-reminder-dialog";
import { enrichReminderWithStatus } from "@/lib/reminders/engine";

type Filter = "all" | "overdue" | "due_soon" | "upcoming" | "completed";

interface RemindersTabProps {
  reminders: ReturnType<typeof enrichReminderWithStatus>[];
  vehicle: { id: string; currentMileage: number };
  isOwner: boolean;
}

export function RemindersTab({ reminders, vehicle, isOwner }: RemindersTabProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const overdueCount = reminders.filter((r) => r.computedStatus === "OVERDUE").length;
  const dueSoonCount = reminders.filter((r) => r.computedStatus === "DUE_SOON").length;
  const upcomingCount = reminders.filter((r) => r.computedStatus === "UPCOMING").length;
  const completedCount = reminders.filter((r) => r.computedStatus === "COMPLETED").length;

  const filtered = reminders.filter((r) => {
    if (filter === "all") return r.computedStatus !== "COMPLETED";
    if (filter === "overdue") return r.computedStatus === "OVERDUE";
    if (filter === "due_soon") return r.computedStatus === "DUE_SOON";
    if (filter === "upcoming") return r.computedStatus === "UPCOMING";
    if (filter === "completed") return r.computedStatus === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        {overdueCount > 0 && (
          <Badge className="text-white border-0 cursor-pointer" style={{ backgroundColor: "#dc2626" }} onClick={() => setFilter("overdue")}>
            <AlertTriangle className="h-3 w-3 mr-1" /> {overdueCount} Overdue
          </Badge>
        )}
        {dueSoonCount > 0 && (
          <Badge className="text-white border-0 cursor-pointer" style={{ backgroundColor: "#d97706" }} onClick={() => setFilter("due_soon")}>
            <Clock className="h-3 w-3 mr-1" /> {dueSoonCount} Due Soon
          </Badge>
        )}
        {upcomingCount > 0 && (
          <Badge className="text-white border-0 cursor-pointer" style={{ backgroundColor: "#2563eb" }} onClick={() => setFilter("upcoming")}>
            <Bell className="h-3 w-3 mr-1" /> {upcomingCount} Upcoming
          </Badge>
        )}
        {completedCount > 0 && (
          <Badge className="text-white border-0 cursor-pointer" style={{ backgroundColor: "#4b5563" }} onClick={() => setFilter("completed")}>
            <CheckCircle className="h-3 w-3 mr-1" /> {completedCount} Completed
          </Badge>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1">
        {(["all", "overdue", "due_soon", "upcoming", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f === "due_soon" ? "Due Soon" : f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Add reminder */}
      {isOwner && (
        <div className="flex justify-end">
          <AddReminderDialog vehicleId={vehicle.id} />
        </div>
      )}

      {/* List */}
      <ReminderList reminders={filtered} currentMileage={vehicle.currentMileage} isOwner={isOwner} />
    </div>
  );
}
