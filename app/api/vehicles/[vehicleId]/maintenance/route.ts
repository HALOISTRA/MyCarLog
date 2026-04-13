import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const records = await prisma.maintenanceRecord.findMany({
    where: {
      vehicleId,
      ...(category ? { category: category as any } : {}),
    },
    orderBy: { performedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json(records);
}

const recordSchema = z.object({
  performedAt: z.string(),
  mileageAtService: z.coerce.number().int().optional(),
  category: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  partsUsed: z.string().optional(),
  laborNotes: z.string().optional(),
  costAmount: z.coerce.number().optional(),
  currency: z.string().optional(),
  workshopName: z.string().optional(),
  isOfficialPlanDerived: z.boolean().optional(),
  linkedPlanItemId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId: session.user.id } });
  if (!vehicle) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });

  const record = await prisma.maintenanceRecord.create({
    data: {
      vehicleId,
      createdByUserId: session.user.id,
      performedAt: new Date(parsed.data.performedAt),
      mileageAtService: parsed.data.mileageAtService,
      category: parsed.data.category as any,
      title: parsed.data.title,
      description: parsed.data.description,
      partsUsed: parsed.data.partsUsed,
      laborNotes: parsed.data.laborNotes,
      costAmount: parsed.data.costAmount,
      currency: parsed.data.currency ?? "EUR",
      workshopName: parsed.data.workshopName,
      isOfficialPlanDerived: parsed.data.isOfficialPlanDerived ?? false,
      linkedPlanItemId: parsed.data.linkedPlanItemId,
    },
  });

  return Response.json(record, { status: 201 });
}
