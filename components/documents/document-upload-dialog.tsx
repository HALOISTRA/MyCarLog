"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_CATEGORY_LABELS } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const CATEGORY_OPTIONS = Object.entries(DOCUMENT_CATEGORY_LABELS).map(
  ([value, labels]) => ({ value, label: labels.en })
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentUploadDialogProps {
  vehicleId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentUploadDialog({
  vehicleId,
  onSuccess,
  trigger,
}: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [documentDate, setDocumentDate] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File validation ─────────────────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PDF, JPG, PNG, and WEBP files are accepted.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File exceeds the ${MAX_SIZE_MB}MB limit.`;
    }
    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
      if (!title) {
        // Auto-fill title from filename (strip extension)
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }

  // ── Drag & drop handlers ────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title || selectedFile.name);
      formData.append("category", category);
      if (documentDate) formData.append("documentDate", documentDate);

      const response = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Upload failed");
      }

      toast.success("Document uploaded successfully");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function resetForm() {
    setSelectedFile(null);
    setFileError(null);
    setTitle("");
    setCategory("OTHER");
    setDocumentDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(value: boolean) {
    if (!value) resetForm();
    setOpen(value);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop zone for file upload"
            className={[
              "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="sr-only"
              onChange={handleInputChange}
            />

            {selectedFile ? (
              <div className="flex items-center gap-3 justify-center">
                <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-auto p-1 hover:bg-muted rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop a file here or <span className="text-blue-500">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, WEBP &mdash; max {MAX_SIZE_MB}MB
                </p>
              </>
            )}
          </div>

          {/* File error */}
          {fileError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {fileError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Registration 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={uploading}>
              <SelectTrigger id="doc-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document date */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-date">Document Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="doc-date"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
