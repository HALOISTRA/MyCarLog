"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Globe,
  Calendar,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDocument, updateDocument } from "@/app/actions/documents";

// Local type mirror — replaced by @/generated/prisma after `prisma generate`
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/");
}

// ─── Visibility config ────────────────────────────────────────────────────────

const VISIBILITY_CONFIG = {
  PRIVATE: {
    label: "Private",
    icon: EyeOff,
    variant: "secondary" as const,
    className: "bg-muted text-muted-foreground",
  },
  SHARED: {
    label: "Shared",
    icon: Users,
    variant: "outline" as const,
    className: "border-blue-300 text-blue-700 dark:text-blue-400",
  },
  PUBLIC: {
    label: "Public",
    icon: Globe,
    variant: "outline" as const,
    className: "border-green-300 text-green-700 dark:text-green-400",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentListProps {
  documents: VehicleDocument[];
  isOwner: boolean;
  vehicleId: string;
  onDeleted?: (id: string) => void;
  onUpdated?: (doc: Partial<VehicleDocument> & { id: string }) => void;
}

// ─── Document card ────────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: VehicleDocument;
  isOwner: boolean;
  vehicleId: string;
  onDeleted?: (id: string) => void;
  onUpdated?: (doc: Partial<VehicleDocument> & { id: string }) => void;
}

function DocumentCard({
  document,
  isOwner,
  vehicleId,
  onDeleted,
  onUpdated,
}: DocumentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isImage = isImageType(document.fileType);
  const visConfig =
    VISIBILITY_CONFIG[document.visibilitySetting as keyof typeof VISIBILITY_CONFIG] ??
    VISIBILITY_CONFIG.PRIVATE;
  const VisIcon = visConfig.icon;

  async function handleDownload() {
    setDownloadLoading(true);
    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/documents/${document.id}`
      );
      if (!res.ok) throw new Error("Failed to get download URL");
      // The GET endpoint redirects to signed URL
      window.open(res.url, "_blank");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleToggleShare(checked: boolean) {
    setToggling(true);
    try {
      const result = await updateDocument(document.id, {
        includeInShareDefault: checked,
      });
      if (!result.success) throw new Error(result.error);
      onUpdated?.({ id: document.id, includeInShareDefault: checked });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteDocument(document.id);
      if (!result.success) throw new Error(result.error);
      toast.success("Document deleted");
      setConfirmDelete(false);
      onDeleted?.(document.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {isImage ? (
            <Image className="w-8 h-8 text-purple-500" />
          ) : (
            <FileText className="w-8 h-8 text-red-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{document.title}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {document.documentDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(document.documentDate), "dd MMM yyyy")}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(document.fileSize)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Visibility badge */}
            <Badge
              variant={visConfig.variant}
              className={`text-xs gap-1 ${visConfig.className}`}
            >
              <VisIcon className="w-3 h-3" />
              {visConfig.label}
            </Badge>
          </div>

          {/* Share toggle — owner only */}
          {isOwner && (
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id={`share-toggle-${document.id}`}
                checked={document.includeInShareDefault}
                onCheckedChange={handleToggleShare}
                disabled={toggling}
                className="scale-90"
              />
              <Label
                htmlFor={`share-toggle-${document.id}`}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Include in shared link
              </Label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            disabled={downloadLoading}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Document
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{document.title}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ categoryLabel }: { categoryLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">
        No {categoryLabel} documents
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Upload a document to get started
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentList({
  documents,
  isOwner,
  vehicleId,
  onDeleted,
  onUpdated,
}: DocumentListProps) {
  if (documents.length === 0) {
    return <EmptyState categoryLabel="matching" />;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          isOwner={isOwner}
          vehicleId={vehicleId}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function DocumentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
          <Skeleton className="w-8 h-8 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      ))}
    </div>
  );
}
