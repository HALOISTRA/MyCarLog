import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { enrichReminderWithStatus } from "@/lib/reminders/engine";
import { AlertTriangle, Clock, Bell, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reminders — Vehicle Passport" };

export default async function RemindersPage() {
  const session = await requireAuth();

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id, archivedAt: null },
    include: {
      reminders: {
        where: { status: { notIn: ["COMPLETED", "DISMISSED"] } },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { make: "asc" },
  });

  type VehicleRow = (typeof vehicles)[number];
  type ReminderRow = VehicleRow["reminders"][number];

  const allEnriched = vehicles.flatMap((v: VehicleRow) =>
    v.reminders.map((r: ReminderRow) => ({
      ...enrichReminderWithStatus(r, v.currentMileage),
      vehicleName: `${v.year} ${v.make} ${v.model}`,
      vehicleId: v.id,
    }))
  );

  type EnrichedRow = (typeof allEnriched)[number];
  const overdue = allEnriched.filter((r: EnrichedRow) => r.computedStatus === "OVERDUE");
  const dueSoon = allEnriched.filter((r: EnrichedRow) => r.computedStatus === "DUE_SOON");
  const upcoming = allEnriched.filter((r: EnrichedRow) => r.computedStatus === "UPCOMING");
  const completed = allEnriched.filter((r: EnrichedRow) => r.computedStatus === "COMPLETED");

  const isEmpty = overdue.length === 0 && dueSoon.length === 0 && upcoming.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reminders</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          All upcoming and overdue maintenance items across your vehicles.
        </p>
      </div>

      {/* Summary stat cards — klikabilne, vode na sekciju */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="#overdue" className={`rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${overdue.length > 0 ? "bg-red-600 border border-red-700" : "bg-slate-50 border border-slate-200"}`}>
          <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${overdue.length > 0 ? "bg-red-500" : "bg-slate-100"}`}>
            <AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? "text-white" : "text-slate-400"}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${overdue.length > 0 ? "text-white" : "text-slate-400"}`}>{overdue.length}</p>
            <p className={`text-xs font-medium ${overdue.length > 0 ? "text-red-100" : "text-slate-400"}`}>Overdue</p>
          </div>
        </Link>

        <Link href="#due-soon" className={`rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${dueSoon.length > 0 ? "bg-amber-500 border border-amber-600" : "bg-slate-50 border border-slate-200"}`}>
          <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${dueSoon.length > 0 ? "bg-amber-400" : "bg-slate-100"}`}>
            <Clock className={`h-4 w-4 ${dueSoon.length > 0 ? "text-white" : "text-slate-400"}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${dueSoon.length > 0 ? "text-white" : "text-slate-400"}`}>{dueSoon.length}</p>
            <p className={`text-xs font-medium ${dueSoon.length > 0 ? "text-amber-100" : "text-slate-400"}`}>Due Soon</p>
          </div>
        </Link>

        <Link href="#upcoming" className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
            <p className="text-xs font-medium text-slate-400">Upcoming</p>
          </div>
        </Link>

        <Link href="#completed" className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">{completed.length}</p>
            <p className="text-xs font-medium text-slate-400">Completed</p>
          </div>
        </Link>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700">All up to date!</p>
          <p className="text-sm text-slate-400 mt-1">No upcoming reminders across your vehicles.</p>
        </div>
      )}

      {/* Overdue section */}
      {overdue.length > 0 && (
        <section id="overdue" className="space-y-3 scroll-mt-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Overdue</h2>
            <span className="ml-auto text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
              {overdue.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdue.map((r: EnrichedRow) => (
              <ReminderCard key={r.id} reminder={r as any} />
            ))}
          </div>
        </section>
      )}

      {/* Due Soon section */}
      {dueSoon.length > 0 && (
        <section id="due-soon" className="space-y-3 scroll-mt-20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Due Soon</h2>
            <span className="ml-auto text-xs font-medium text-yellow-600 bg-yellow-50 border border-yellow-100 rounded-full px-2 py-0.5">
              {dueSoon.length}
            </span>
          </div>
          <div className="space-y-2">
            {dueSoon.map((r: EnrichedRow) => (
              <ReminderCard key={r.id} reminder={r as any} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <section id="upcoming" className="space-y-3 scroll-mt-20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Upcoming</h2>
            <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
              {upcoming.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcoming.map((r: EnrichedRow) => (
              <ReminderCard key={r.id} reminder={r as any} />
            ))}
          </div>
        </section>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <section id="completed" className="space-y-3 scroll-mt-20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Completed</h2>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              {completed.length}
            </span>
          </div>
          <div className="space-y-2">
            {completed.map((r: EnrichedRow) => (
              <ReminderCard key={r.id} reminder={r as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Reminder card ────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
}: {
  reminder: ReturnType<typeof enrichReminderWithStatus> & {
    vehicleName: string;
    vehicleId: string;
  };
}) {
  const barColors = {
    OVERDUE: "bg-red-500",
    DUE_SOON: "bg-yellow-400",
    UPCOMING: "bg-blue-500",
    COMPLETED: "bg-green-500",
  };

  const badgeColors = {
    OVERDUE: "bg-red-50 text-red-600 border-red-100",
    DUE_SOON: "bg-yellow-50 text-yellow-700 border-yellow-100",
    UPCOMING: "bg-blue-50 text-blue-700 border-blue-100",
    COMPLETED: "bg-green-50 text-green-700 border-green-100",
  };

  const status = reminder.computedStatus as keyof typeof barColors;
  const barColor = barColors[status] ?? barColors.UPCOMING;
  const badgeColor = badgeColors[status] ?? badgeColors.UPCOMING;
  const isCompleted = status === "COMPLETED";

  const dueText = (() => {
    if (reminder.daysUntilDue !== undefined) {
      if (reminder.daysUntilDue < 0) return `${Math.abs(reminder.daysUntilDue)}d overdue`;
      if (reminder.daysUntilDue === 0) return "Due today";
      return `in ${reminder.daysUntilDue}d`;
    }
    if (reminder.mileageUntilDue !== undefined) {
      if (reminder.mileageUntilDue <= 0) return `${Math.abs(reminder.mileageUntilDue).toLocaleString()} km overdue`;
      return `${reminder.mileageUntilDue.toLocaleString()} km left`;
    }
    return null;
  })();

  const statusLabel = {
    OVERDUE: "Overdue",
    DUE_SOON: "Due Soon",
    UPCOMING: "Upcoming",
    COMPLETED: "Completed",
  }[status] ?? status;

  return (
    <Link href={`/garage/${reminder.vehicleId}?tab=reminders`}>
      <div
        className={`flex items-stretch bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden ${
          isCompleted ? "opacity-60" : ""
        }`}
      >
        {/* Left color bar */}
        <div className={`w-1 shrink-0 ${barColor}`} />

        {/* Content */}
        <div className="flex flex-1 items-center justify-between px-4 py-3 gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{reminder.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{reminder.vehicleName}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-right">
            <div className="text-xs text-slate-500 space-y-0.5">
              {reminder.dueDate && (
                <p>{new Date(reminder.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              )}
              {reminder.dueMileage != null && (
                <p>{reminder.dueMileage.toLocaleString()} km</p>
              )}
            </div>
            {dueText && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {dueText}
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor} hidden sm:inline-block`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
