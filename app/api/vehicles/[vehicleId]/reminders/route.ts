import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { enrichReminderWithStatus } from "@/lib/reminders/engine";
import { z } from "zod";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const reminders = await prisma.reminder.findMany({
    where: { vehicleId },
    orderBy: { dueDate: "asc" },
  });

  const enriched = reminders.map((r) => enrichReminderWithStatus(r, vehicle.currentMileage));
  return Response.json(enriched);
}

const reminderSchema = z.object({
  category: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  dueMileage: z.coerce.number().int().optional(),
  leadTimeDays: z.coerce.number().int().default(30),
  recurrenceRule: z.object({
    intervalMonths: z.coerce.number().int().optional(),
    intervalKm: z.coerce.number().int().optional(),
  }).optional(),
  linkedPlanItemId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = reminderSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });

  if (!parsed.data.dueDate && !parsed.data.dueMileage) {
    return Response.json({ error: "At least one of dueDate or dueMileage is required" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      vehicleId,
      category: parsed.data.category as any,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      dueMileage: parsed.data.dueMileage,
      leadTimeDays: parsed.data.leadTimeDays,
      recurrenceRule: (parsed.data.recurrenceRule ?? null) as any,
      status: "UPCOMING",
      linkedPlanItemId: parsed.data.linkedPlanItemId,
    },
  });

  return Response.json(reminder, { status: 201 });
}
