import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

type Params = { token: string };

// ─── POST /api/share/[token]/verify-pin ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return Response.json(
        { success: false, error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    // Fetch the share link
    const link = await prisma.shareLink.findUnique({
      where: { token },
      select: {
        id: true,
        pinHash: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!link) {
      return Response.json(
        { success: false, error: "Share link not found" },
        { status: 404 }
      );
    }

    if (link.revokedAt) {
      return Response.json(
        { success: false, error: "This share link has been revoked" },
        { status: 410 }
      );
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return Response.json(
        { success: false, error: "This share link has expired" },
        { status: 410 }
      );
    }

    if (!link.pinHash) {
      // No PIN required — redirect directly
      return Response.json({ success: true });
    }

    // Verify PIN against stored hash
    const isValid = await bcrypt.compare(pin, link.pinHash);

    if (!isValid) {
      return Response.json(
        { success: false, error: "Incorrect PIN. Please try again." },
        { status: 401 }
      );
    }

    // Set a short-lived cookie marking this token as PIN-verified
    // Cookie name is scoped to the token so different share links have separate cookies
    const cookieName = `share_pin_${token}`;
    const maxAge = 60 * 60 * 24; // 24 hours

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      [
        `${cookieName}=verified`,
        `Path=/share/${token}`,
        `Max-Age=${maxAge}`,
        `HttpOnly`,
        `SameSite=Lax`,
        // Omit Secure for local dev; in production behind HTTPS this is fine
        ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
      ].join("; ")
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[POST /api/share/[token]/verify-pin]", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
