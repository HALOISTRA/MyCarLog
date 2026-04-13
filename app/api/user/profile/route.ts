import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";

export async function GET() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, avatarUrl: true, locale: true, timezone: true, createdAt: true },
  });
  return Response.json(user);
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.enum(["en", "hr"]).optional(),
  timezone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, email: true, name: true, avatarUrl: true, locale: true, timezone: true },
  });

  return Response.json(updated);
}
