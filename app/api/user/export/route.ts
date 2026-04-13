import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, vehicles, maintenanceRecords, reminders, documents, transfers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, locale: true, timezone: true, createdAt: true },
    }),
    prisma.vehicle.findMany({ where: { ownerId: userId } }),
    prisma.maintenanceRecord.findMany({
      where: { vehicle: { ownerId: userId } },
      orderBy: { performedAt: "desc" },
    }),
    prisma.reminder.findMany({ where: { vehicle: { ownerId: userId } } }),
    prisma.vehicleDocument.findMany({
      where: { vehicle: { ownerId: userId } },
      select: { id: true, vehicleId: true, category: true, title: true, documentDate: true, fileType: true, fileSize: true, createdAt: true },
    }),
    prisma.ownershipTransfer.findMany({
      where: { fromUserId: userId },
      select: { id: true, vehicleId: true, toEmail: true, status: true, createdAt: true, acceptedAt: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    vehicles,
    maintenanceRecords,
    reminders,
    documents,
    transfers,
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vehicle-passport-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
