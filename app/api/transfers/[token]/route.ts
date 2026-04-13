import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/transfers/[token] — public summary for the accept page
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const transfer = await prisma.ownershipTransfer.findUnique({
      where: { token },
      select: {
        id: true,
        status: true,
        toEmail: true,
        expiresAt: true,
        createdAt: true,
        message: true,
        includeDocuments: true,
        includeCosts: true,
        includePrivateNotes: true,
        includeServiceHistory: true,
        preserveSellerArchive: true,
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            trim: true,
            year: true,
            engine: true,
            fuelType: true,
            transmission: true,
          },
        },
        fromUser: {
          select: {
            name: true,
            // Do NOT expose email of sender in public API
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    const isExpired = transfer.expiresAt < new Date() || transfer.status === "EXPIRED";

    return NextResponse.json({
      id: transfer.id,
      status: isExpired && transfer.status === "PENDING" ? "EXPIRED" : transfer.status,
      toEmail: transfer.toEmail,
      expiresAt: transfer.expiresAt,
      message: transfer.message,
      includeDocuments: transfer.includeDocuments,
      includeCosts: transfer.includeCosts,
      includePrivateNotes: transfer.includePrivateNotes,
      includeServiceHistory: transfer.includeServiceHistory,
      vehicle: transfer.vehicle,
      senderName: transfer.fromUser.name ?? "A Vehicle Passport user",
    });
  } catch (err) {
    console.error("[GET /api/transfers/[token]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
