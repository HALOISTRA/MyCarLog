import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { generateVehiclePDF } from "@/lib/pdf/vehicle-report";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: session.user.id },
    include: {
      maintenanceRecords: { orderBy: { performedAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      documents: {
        select: { id: true, category: true, title: true, documentDate: true, fileType: true, fileSize: true },
      },
    },
  });

  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const format = new URL(request.url).searchParams.get("format");

  if (format === "pdf") {
    const pdf = await generateVehiclePDF(vehicle as any);
    const filename = `vehicle-passport-${vehicle.make}-${vehicle.model}-${vehicle.year}.pdf`;
    return new Response(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (format === "csv") {
    // Export service history as CSV
    const headers = ["Date", "Mileage", "Category", "Title", "Workshop", "Cost", "Currency", "Description"];
    const rows = vehicle.maintenanceRecords.map((r) => [
      r.performedAt.toISOString().slice(0, 10),
      r.mileageAtService ?? "",
      r.category,
      `"${r.title.replace(/"/g, '""')}"`,
      r.workshopName ? `"${r.workshopName.replace(/"/g, '""')}"` : "",
      r.costAmount ?? "",
      r.currency ?? "",
      r.description ? `"${r.description.replace(/"/g, '""')}"` : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const filename = `service-history-${vehicle.make}-${vehicle.model}-${vehicle.year}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Default: JSON export
  const filename = `vehicle-${vehicle.make}-${vehicle.model}-${vehicle.year}.json`;
  return new Response(JSON.stringify({ vehicle, exportedAt: new Date().toISOString() }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
