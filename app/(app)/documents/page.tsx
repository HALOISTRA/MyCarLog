import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DOCUMENT_CATEGORY_LABELS } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Car,
  FileImage,
  FileCode,
  FileSpreadsheet,
  Upload,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Documents — Vehicle Passport" };

function getFileIcon(fileType: string | null | undefined) {
  if (!fileType) return FileText;
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType === "application/pdf") return FileText;
  if (fileType.includes("spreadsheet") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("html") || fileType.includes("xml") || fileType.includes("json")) return FileCode;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const session = await requireAuth();

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id, archivedAt: null },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { make: "asc" },
  });

  type VehicleWithDocs = (typeof vehicles)[number];
  type DocRow = VehicleWithDocs["documents"][number];

  const totalDocs = vehicles.reduce(
    (sum: number, v: VehicleWithDocs) => sum + v.documents.length,
    0
  );

  const vehiclesWithDocs = vehicles.filter(
    (v: VehicleWithDocs) => v.documents.length > 0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            {totalDocs === 0
              ? "No documents yet across your vehicles."
              : `${totalDocs} document${totalDocs !== 1 ? "s" : ""} across your vehicles.`}
          </p>
        </div>
        <Link
          href="/garage"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Link>
      </div>

      {/* Empty state */}
      {totalDocs === 0 && (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No documents yet</p>
          <p className="text-sm text-slate-400 mt-1">Open a vehicle to upload documents.</p>
        </div>
      )}

      {/* Vehicles with documents */}
      {vehiclesWithDocs.map((vehicle: VehicleWithDocs) => {
        const byCategory = vehicle.documents.reduce(
          (acc: Record<string, DocRow[]>, doc: DocRow) => {
            (acc[doc.category] = acc[doc.category] ?? []).push(doc);
            return acc;
          },
          {} as Record<string, DocRow[]>
        );

        return (
          <section key={vehicle.id} className="space-y-4">
            {/* Vehicle header */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Car className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Link
                  href={`/garage/${vehicle.id}`}
                  className="font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate"
                >
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.nickname && (
                    <span className="text-slate-400 font-normal">
                      {" "}— {vehicle.nickname}
                    </span>
                  )}
                </Link>
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                  {vehicle.documents.length}
                </span>
              </div>
            </div>

            {/* Category groups */}
            {Object.entries(byCategory).map(([cat, docs]) => (
              <div key={cat} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Category label */}
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {DOCUMENT_CATEGORY_LABELS[cat]?.en ?? cat}
                  </p>
                </div>

                {/* Document rows */}
                <div className="divide-y divide-slate-100">
                  {(docs as DocRow[]).map((doc: DocRow) => {
                    const Icon = getFileIcon(doc.fileType);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        {/* File icon */}
                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-blue-500" />
                        </div>

                        {/* Name + date */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {doc.documentDate && (
                              <span className="text-xs text-slate-400">
                                {format(doc.documentDate, "dd MMM yyyy")}
                              </span>
                            )}
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-400">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                        </div>

                        {/* Visibility + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={doc.visibilitySetting === "PRIVATE" ? "secondary" : "outline"}
                            className="text-xs hidden sm:inline-flex"
                          >
                            {doc.visibilitySetting === "PRIVATE"
                              ? "Private"
                              : doc.visibilitySetting === "SHARED"
                              ? "Shared"
                              : "Public"}
                          </Badge>
                          <Link
                            href={`/api/vehicles/${vehicle.id}/documents/${doc.id}`}
                            target="_blank"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Open document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
