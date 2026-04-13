import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { ShareVisibilityConfig } from "@/types";

// Local record type mirrors (replaced by Prisma generated types after `prisma generate`)
interface MaintenanceRecordLike {
  id: string;
  performedAt: Date;
  mileageAtService: number | null;
  category: string;
  title: string;
  description: string | null;
  workshopName: string | null;
  costAmount: unknown;
  currency: string | null;
}

interface VehicleDocumentLike {
  id: string;
  title: string;
  category: string;
  fileType: string;
  fileSize: number;
  documentDate: Date | null;
}

type Params = { token: string };

// ─── GET /api/share/[token] ───────────────────────────────────────────────────
// Returns filtered vehicle data according to visibilityConfig.
// Also validates token, revocation, expiry, and PIN cookie.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { token } = await params;

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        vehicle: {
          include: {
            maintenanceRecords: {
              orderBy: { performedAt: "desc" },
            },
            documents: {
              where: { includeInShareDefault: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!link) {
      return Response.json({ error: "Share link not found" }, { status: 404 });
    }

    if (link.revokedAt) {
      return Response.json({ error: "This share link has been revoked" }, { status: 410 });
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return Response.json({ error: "This share link has expired" }, { status: 410 });
    }

    // Check PIN cookie if PIN is required
    if (link.pinHash) {
      const cookieStore = await cookies();
      const pinCookie = cookieStore.get(`share_pin_${token}`);
      if (!pinCookie || pinCookie.value !== "verified") {
        return Response.json(
          { error: "PIN required", requiresPin: true },
          { status: 401 }
        );
      }
    }

    // Increment access count
    await prisma.shareLink.update({
      where: { id: link.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    const vehicle = link.vehicle;
    const vis = link.visibilityConfig as unknown as ShareVisibilityConfig;

    // Build filtered response
    const filteredVehicle = {
      // Always visible
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      year: vehicle.year,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      drivetrain: vehicle.drivetrain,
      bodyType: vehicle.bodyType,
      color: vehicle.color,
      currentMileage: vehicle.currentMileage,
      mileageUnit: vehicle.mileageUnit,
      purchaseDate: vehicle.purchaseDate,
      engine: vehicle.engine,
      imageUrl: vehicle.imageUrl,
      nickname: vehicle.nickname,

      // Conditional
      plate: vis.showPlate ? vehicle.plate : null,
      vin: vis.showVin ? vehicle.vin : null,
      notes: vis.showNotes ? vehicle.notes : null,

      maintenanceRecords: vis.showMaintenance
        ? (vehicle.maintenanceRecords as MaintenanceRecordLike[]).map((r) => ({
            id: r.id,
            performedAt: r.performedAt,
            mileageAtService: r.mileageAtService,
            category: r.category,
            title: r.title,
            description: r.description,
            workshopName: r.workshopName,
            costAmount: vis.showCosts ? r.costAmount : null,
            currency: vis.showCosts ? r.currency : null,
          }))
        : [],

      documents: vis.showDocuments
        ? (vehicle.documents as VehicleDocumentLike[]).map((d) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            fileType: d.fileType,
            fileSize: d.fileSize,
            documentDate: d.documentDate,
          }))
        : [],
    };

    return Response.json({
      success: true,
      data: {
        vehicle: filteredVehicle,
        shareLink: {
          label: link.label,
          expiresAt: link.expiresAt,
          visibilityConfig: vis,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/share/[token]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
