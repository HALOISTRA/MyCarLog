"use client";

import { useState } from "react";
import {
  FileText,
  Car,
  Shield,
  ClipboardCheck,
  Receipt,
  BookOpen,
  ScrollText,
  BadgeCheck,
  Camera,
  FolderOpen,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "./document-list";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { DOCUMENT_CATEGORY_LABELS } from "@/types";
// Local type mirrors — replaced by @/app/generated/prisma after `prisma generate`
interface VehicleDocument {
  id: string;
  vehicleId: string;
  uploadedByUserId: string;
  category: string;
  title: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  documentDate: Date | null;
  visibilitySetting: string;
  includeInShareDefault: boolean;
  sourceType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  [key: string]: unknown;
}

// ─── Category icons ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  REGISTRATION: Car,
  INSURANCE: Shield,
  INSPECTION: ClipboardCheck,
  INVOICE: Receipt,
  SERVICE_BOOK: BookOpen,
  OWNERSHIP: ScrollText,
  WARRANTY: BadgeCheck,
  PHOTO: Camera,
  OTHER: FolderOpen,
};

type DocumentCategory = keyof typeof CATEGORY_ICONS;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentsTabProps {
  documents: VehicleDocument[];
  vehicle: Vehicle;
  isOwner: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentsTab({
  documents: initialDocuments,
  vehicle,
  isOwner,
}: DocumentsTabProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocuments);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "ALL">("ALL");

  // ── Category counts ───────────────────────────────────────────────────────

  const categoryCounts = documents.reduce<Record<string, number>>(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // ── Filtered documents ────────────────────────────────────────────────────

  const filteredDocuments =
    selectedCategory === "ALL"
      ? documents
      : documents.filter((d) => d.category === selectedCategory);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function handleUpdated(updated: Partial<VehicleDocument> & { id: string }) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
    );
  }

  // ── Category sidebar items ────────────────────────────────────────────────

  const allCategories: { key: DocumentCategory | "ALL"; label: string }[] = [
    { key: "ALL", label: "All Documents" },
    ...Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, labels]) => ({
      key: key as DocumentCategory,
      label: labels.en,
    })),
  ];

  const selectedCategoryLabel =
    selectedCategory === "ALL"
      ? "All Documents"
      : DOCUMENT_CATEGORY_LABELS[selectedCategory]?.en ?? selectedCategory;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Documents</h2>
          <Badge variant="secondary" className="text-xs">
            {documents.length}
          </Badge>
        </div>
        {isOwner && (
          <DocumentUploadDialog
            vehicleId={vehicle.id}
            onSuccess={() => {
              // Refresh: ideally the parent re-fetches; for now show a toast
              window.location.reload();
            }}
          />
        )}
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Category sidebar ─────────────────────────────────────────────── */}
        <nav
          aria-label="Document categories"
          className="md:w-52 shrink-0"
        >
          {/* Mobile: horizontal scroll */}
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
            {allCategories.map(({ key, label }) => {
              const Icon = key === "ALL" ? FolderOpen : CATEGORY_ICONS[key] ?? FolderOpen;
              const count = key === "ALL" ? documents.length : (categoryCounts[key] ?? 0);
              const isActive = selectedCategory === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap md:whitespace-normal w-full text-left",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {count > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "text-xs ml-auto shrink-0",
                        isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Document list ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {selectedCategoryLabel}
              {filteredDocuments.length > 0 && (
                <span className="ml-2 text-foreground font-semibold">
                  ({filteredDocuments.length})
                </span>
              )}
            </h3>
            {/* Upload shortcut within category */}
            {isOwner && selectedCategory !== "ALL" && (
              <DocumentUploadDialog
                vehicleId={vehicle.id}
                onSuccess={() => window.location.reload()}
                trigger={
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                }
              />
            )}
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No {selectedCategory === "ALL" ? "" : selectedCategoryLabel.toLowerCase()}{" "}
                documents yet
              </p>
              {isOwner && (
                <DocumentUploadDialog
                  vehicleId={vehicle.id}
                  onSuccess={() => window.location.reload()}
                  trigger={
                    <Button variant="outline" size="sm" className="mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload first document
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <DocumentList
              documents={filteredDocuments}
              isOwner={isOwner}
              vehicleId={vehicle.id}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
