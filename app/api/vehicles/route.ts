import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const session = await requireAuth();

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id, archivedAt: null },
    include: {
      reminders: {
        where: { status: { notIn: ["COMPLETED", "DISMISSED"] } },
        select: { id: true, status: true, dueDate: true, dueMileage: true, title: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = vehicles.map((v) => ({
    ...v,
    overdueCount: v.reminders.filter((r) => r.status === "OVERDUE").length,
    dueSoonCount: v.reminders.filter((r) => r.status === "DUE_SOON").length,
    mostUrgent: v.reminders.find((r) => r.status === "OVERDUE") ?? v.reminders.find((r) => r.status === "DUE_SOON") ?? null,
  }));

  return Response.json(result);
}

const createVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1886).max(new Date().getFullYear() + 1),
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
  currentMileage: z.coerce.number().int().min(0).default(0),
  mileageUnit: z.enum(["KM", "MI"]).default("KM"),
  purchaseDate: z.string().optional(),
  purchaseMileage: z.coerce.number().int().optional(),
  nickname: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });

  const data = parsed.data;
  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId: session.user.id,
      make: data.make,
      model: data.model,
      year: data.year,
      trim: data.trim,
      generation: data.generation,
      vin: data.vin,
      plate: data.plate,
      engine: data.engine,
      engineCode: data.engineCode,
      fuelType: (data.fuelType as any) ?? "PETROL",
      transmission: (data.transmission as any) ?? "MANUAL",
      drivetrain: (data.drivetrain as any) ?? "FWD",
      bodyType: data.bodyType,
      color: data.color,
      marketRegion: data.marketRegion,
      currentMileage: data.currentMileage,
      mileageUnit: (data.mileageUnit as any) ?? "KM",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchaseMileage: data.purchaseMileage,
      nickname: data.nickname,
      notes: data.notes,
    },
  });

  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, actionType: "VEHICLE_CREATED", targetType: "Vehicle", targetId: vehicle.id },
  });

  return Response.json(vehicle, { status: 201 });
}
