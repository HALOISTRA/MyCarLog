import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";

const prefsSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  leadDays: z.array(z.number().int()).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid data" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { notificationPrefs: true } });
  const existing = (user?.notificationPrefs ?? {}) as Record<string, unknown>;
  const merged = { ...existing, ...parsed.data };

  await prisma.user.update({ where: { id: session.user.id }, data: { notificationPrefs: merged } });
  return Response.json({ success: true, prefs: merged });
}
