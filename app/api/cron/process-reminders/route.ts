import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { processVehicleReminders } from "@/lib/reminders/engine";
import { processRemindersForVehicle } from "@/lib/notifications/processor";

// GET /api/cron/process-reminders
// Protected by Bearer token — intended to be called by a cron scheduler (e.g. Vercel Cron).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch every non-archived vehicle with its owner
    const vehicles = await prisma.vehicle.findMany({
      where: { archivedAt: null },
    });

    let totalNotifications = 0;

    for (const vehicle of vehicles) {
      // 1. Recompute & persist reminder statuses for this vehicle
      await processVehicleReminders(vehicle);

      // 2. Send notifications for reminders that are due/overdue and haven't
      //    been notified in the past 24 h
      const sent = await processRemindersForVehicle(vehicle.id);
      totalNotifications += sent;
    }

    console.log(
      `[cron/process-reminders] processed ${vehicles.length} vehicles, sent ${totalNotifications} notifications`
    );

    return Response.json({
      ok: true,
      vehiclesProcessed: vehicles.length,
      notificationsSent: totalNotifications,
    });
  } catch (err) {
    console.error("[cron/process-reminders]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
