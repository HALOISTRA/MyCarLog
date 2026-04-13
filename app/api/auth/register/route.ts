import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";

const registerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email is already taken
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    const { subject, html } = welcomeEmail(name);
    sendEmail({ to: email, subject, html }).catch((err: unknown) => {
      console.error("[register] Failed to send welcome email:", err);
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
