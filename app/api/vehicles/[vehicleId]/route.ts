import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ownerId: session.user.id },
    include: {
      reminders: { orderBy: { dueDate: "asc" } },
      maintenanceRecords: { orderBy: { performedAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      planAssignments: { include: { plan: { include: { planItems: { orderBy: { displayOrder: "asc" } } } } }, where: { isActive: true } },
    },
  });

  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(vehicle);
}

const updateSchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.coerce.number().int().optional(),
  trim: z.string().optional(),
  generation: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  engine: z.string().optional(),
  engineCode: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  marketRegion: z.string().optional(),
  currentMileage: z.coerce.number().int().optional(),
  mileageUnit: z.enum(["KM", "MI"]).optional(),
  purchaseDate: z.string().optional(),
  purchaseMileage: z.coerce.number().int().optional(),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  imageKey: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data" }, { status: 400 });

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...parsed.data,
      fuelType: parsed.data.fuelType as any,
      transmission: parsed.data.transmission as any,
      drivetrain: parsed.data.drivetrain as any,
      mileageUnit: parsed.data.mileageUnit as any,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
    },
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { archivedAt: new Date() } });

  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, actionType: "VEHICLE_ARCHIVED", targetType: "Vehicle", targetId: vehicleId },
  });

  return Response.json({ success: true });
}
