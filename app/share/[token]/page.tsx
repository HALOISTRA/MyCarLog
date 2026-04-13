import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { format } from "date-fns";
import {
  Shield,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Car,
  FileText,
  Wrench,
  DollarSign,
  Hash,
  AlertCircle,
  Clock,
} from "lucide-react";

import { prisma } from "@/lib/db";

// Local type mirrors until `prisma generate` runs
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

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOCUMENT_CATEGORY_LABELS, FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/types";
import type { ShareVisibilityConfig } from "@/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMileage(value: number, unit: string) {
  return `${value.toLocaleString()} ${unit.toLowerCase()}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getShareData(token: string) {
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

  return link;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const link = await getShareData(token);

  // Not found
  if (!link) notFound();

  // Revoked
  if (link.revokedAt) {
    return <RevokedPage />;
  }

  // Expired
  if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
    return <ExpiredPage expiresAt={link.expiresAt} />;
  }

  // PIN required — check cookie
  if (link.pinHash) {
    const cookieStore = await cookies();
    const pinCookie = cookieStore.get(`share_pin_${token}`);
    if (!pinCookie || pinCookie.value !== "verified") {
      redirect(`/share/${token}/pin`);
    }
  }

  // Increment access count (fire and forget)
  prisma.shareLink
    .update({
      where: { id: link.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    })
    .catch((err: unknown) => console.error("[share page] access count update failed:", err));

  const vehicle = link.vehicle;
  const vis = link.visibilityConfig as unknown as ShareVisibilityConfig;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Top branding bar */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">Vehicle Passport</span>
          </div>
          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            Read-only profile
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Info banner */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            This is a read-only vehicle profile shared by the owner. The
            information shown is controlled by the owner.
          </p>
        </div>

        {/* Vehicle header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {vehicle.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-24 h-18 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.trim && (
                    <span className="text-muted-foreground font-normal text-lg ml-2">
                      {vehicle.trim}
                    </span>
                  )}
                </h1>
                {vehicle.nickname && (
                  <p className="text-muted-foreground mt-0.5">
                    &ldquo;{vehicle.nickname}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {vehicle.bodyType && (
                    <Badge variant="secondary">{vehicle.bodyType}</Badge>
                  )}
                  <Badge variant="secondary">
                    {FUEL_TYPE_LABELS[vehicle.fuelType]?.en ?? vehicle.fuelType}
                  </Badge>
                  <Badge variant="secondary">
                    {TRANSMISSION_LABELS[vehicle.transmission]?.en ?? vehicle.transmission}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core specs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cog className="w-4 h-4" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SpecItem label="Year" value={vehicle.year.toString()} />
              <SpecItem label="Make" value={vehicle.make} />
              <SpecItem label="Model" value={vehicle.model} />
              {vehicle.engine && (
                <SpecItem label="Engine" value={vehicle.engine} />
              )}
              <SpecItem
                label="Fuel Type"
                value={FUEL_TYPE_LABELS[vehicle.fuelType]?.en ?? vehicle.fuelType}
              />
              <SpecItem
                label="Transmission"
                value={TRANSMISSION_LABELS[vehicle.transmission]?.en ?? vehicle.transmission}
              />
              <SpecItem
                label="Current Mileage"
                value={formatMileage(vehicle.currentMileage, vehicle.mileageUnit)}
                icon={<Gauge className="w-3.5 h-3.5" />}
              />
              {vehicle.purchaseDate && (
                <SpecItem
                  label="Purchase Date"
                  value={format(new Date(vehicle.purchaseDate), "MMM yyyy")}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                />
              )}
              {vehicle.color && (
                <SpecItem label="Color" value={vehicle.color} />
              )}

              {/* Conditional: plate */}
              {vis.showPlate && vehicle.plate && (
                <SpecItem label="License Plate" value={vehicle.plate} />
              )}

              {/* Conditional: VIN */}
              {vis.showVin && vehicle.vin && (
                <SpecItem
                  label="VIN"
                  value={vehicle.vin}
                  className="col-span-2 sm:col-span-3 font-mono text-xs"
                  icon={<Hash className="w-3.5 h-3.5" />}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance history */}
        {vis.showMaintenance && vehicle.maintenanceRecords.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Maintenance History
                <Badge variant="secondary" className="text-xs ml-auto">
                  {vehicle.maintenanceRecords.length} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(vehicle.maintenanceRecords as MaintenanceRecordLike[]).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{record.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.performedAt), "dd MMM yyyy")}
                        </span>
                        {record.mileageAtService && (
                          <span className="text-xs text-muted-foreground">
                            {formatMileage(
                              record.mileageAtService,
                              vehicle.mileageUnit
                            )}
                          </span>
                        )}
                        {record.workshopName && (
                          <span className="text-xs text-muted-foreground">
                            {record.workshopName}
                          </span>
                        )}
                        {vis.showCosts &&
                          record.costAmount !== null &&
                          record.costAmount !== undefined && (
                            <span className="text-xs font-medium">
                              {Number(record.costAmount).toFixed(2)}{" "}
                              {record.currency ?? "EUR"}
                            </span>
                          )}
                      </div>
                      {record.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {record.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {vis.showDocuments && vehicle.documents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
                <Badge variant="secondary" className="text-xs ml-auto">
                  {vehicle.documents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(vehicle.documents as VehicleDocumentLike[]).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_CATEGORY_LABELS[doc.category]?.en ?? doc.category}
                        </Badge>
                        {doc.documentDate && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.documentDate), "dd MMM yyyy")}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owner notes */}
        {vis.showNotes && vehicle.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Owner Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {vehicle.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expiry notice */}
        {link.expiresAt && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <p>
              This link expires on{" "}
              <strong>{format(new Date(link.expiresAt), "MMMM d, yyyy 'at' HH:mm")}</strong>
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-4 pb-8">
          <Separator className="mb-6" />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>
              Powered by{" "}
              <span className="font-semibold text-foreground">
                Vehicle Passport
              </span>{" "}
              &mdash; your trusted vehicle history companion
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpecItem({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-medium flex items-center gap-1 ${className ?? ""}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function RevokedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold">Link Revoked</h1>
        <p className="text-muted-foreground text-sm">
          This share link has been revoked by the owner and is no longer accessible.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Vehicle Passport</span>
        </div>
      </div>
    </div>
  );
}

function ExpiredPage({ expiresAt }: { expiresAt: Date }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-bold">Link Expired</h1>
        <p className="text-muted-foreground text-sm">
          This share link expired on{" "}
          <strong>{format(new Date(expiresAt), "MMMM d, yyyy")}</strong> and is
          no longer accessible.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Vehicle Passport</span>
        </div>
      </div>
    </div>
  );
}
