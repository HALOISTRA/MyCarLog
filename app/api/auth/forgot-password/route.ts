import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

// Always return 200 to avoid revealing whether an email address is registered
const ok = () => NextResponse.json({ message: "ok" }, { status: 200 });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      // Still return 200 to avoid leaking info
      return ok();
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!user) {
      // Don't reveal that the email doesn't exist
      return ok();
    }

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });

    const { subject, html } = passwordResetEmail(token);
    await sendEmail({ to: email, subject, html });

    return ok();
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err);
    // Still return 200 — don't reveal server errors to the client
    return ok();
  }
}
