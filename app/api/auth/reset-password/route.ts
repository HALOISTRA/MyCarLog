import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input." },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;

    // Find the token record
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => null);

      return NextResponse.json(
        { message: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found for this reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Update password and delete token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch (err) {
    console.error("[reset-password] Unexpected error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
