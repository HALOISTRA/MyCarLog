"use client";

import { useState } from "react";
import { Link2, Copy, Check, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createShareLink } from "@/app/actions/shares";
import type { ShareVisibilityConfig } from "@/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateShareLinkDialogProps {
  vehicleId: string;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

// ─── Default visibility ───────────────────────────────────────────────────────

const DEFAULT_VISIBILITY: ShareVisibilityConfig = {
  showMaintenance: true,
  showDocuments: false,
  showCosts: false,
  showVin: false,
  showPlate: true,
  showNotes: false,
};

// ─── Visibility options ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: {
  key: keyof ShareVisibilityConfig;
  label: string;
  description: string;
}[] = [
  {
    key: "showMaintenance",
    label: "Maintenance history",
    description: "Service records and upcoming maintenance",
  },
  {
    key: "showDocuments",
    label: "Documents",
    description: "Registration, insurance, invoices, etc.",
  },
  {
    key: "showCosts",
    label: "Costs",
    description: "Service costs and financial details",
  },
  {
    key: "showVin",
    label: "VIN number",
    description: "Vehicle Identification Number",
  },
  {
    key: "showPlate",
    label: "License plate",
    description: "Vehicle registration plate",
  },
  {
    key: "showNotes",
    label: "Private notes",
    description: "Owner notes about the vehicle",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateShareLinkDialog({
  vehicleId,
  onCreated,
  trigger,
}: CreateShareLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Form state
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pin, setPin] = useState("");
  const [visibility, setVisibility] =
    useState<ShareVisibilityConfig>(DEFAULT_VISIBILITY);

  function toggleVisibility(key: keyof ShareVisibilityConfig) {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await createShareLink(vehicleId, {
        label: label || undefined,
        expiresAt: expiresAt || undefined,
        pin: pin.length === 4 ? pin : undefined,
        visibilityConfig: visibility,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setGeneratedUrl(result.data.url);
      toast.success("Share link created");
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setLabel("");
      setExpiresAt("");
      setPin("");
      setVisibility(DEFAULT_VISIBILITY);
      setGeneratedUrl(null);
      setCopied(false);
      setShowPin(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Link2 className="w-4 h-4 mr-2" />
            Create Share Link
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
        </DialogHeader>

        {generatedUrl ? (
          /* ── Success state ─────────────────────────────────────────────── */
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">
                Share link created successfully!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedUrl}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-background"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the vehicle profile according to
              the visibility settings you configured.
              {pin && " They will be prompted for a PIN before viewing."}
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form state ────────────────────────────────────────────────── */
          <div className="space-y-5 pt-2">
            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="share-label">
                Label{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="share-label"
                placeholder='e.g. "For mechanic" or "Potential buyer"'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={creating}
              />
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <Label htmlFor="share-expiry">
                Expires at{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="share-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={creating}
              />
            </div>

            {/* PIN */}
            <div className="space-y-1.5">
              <Label htmlFor="share-pin">
                PIN protection{" "}
                <span className="text-muted-foreground text-xs">(optional, 4 digits)</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="share-pin"
                  type={showPin ? "text" : "password"}
                  placeholder="Leave blank for no PIN"
                  value={pin}
                  maxLength={4}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setPin(v);
                  }}
                  disabled={creating}
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPin((v) => !v)}
                  tabIndex={-1}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {pin.length > 0 && pin.length < 4 && (
                <p className="text-xs text-destructive">PIN must be 4 digits</p>
              )}
            </div>

            <Separator />

            {/* Visibility toggles */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Visibility settings</p>
              <p className="text-xs text-muted-foreground">
                Choose what information the link recipient can see.
              </p>
              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map(({ key, label: optLabel, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{optLabel}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      id={`vis-${key}`}
                      checked={visibility[key]}
                      onCheckedChange={() => toggleVisibility(key)}
                      disabled={creating}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || (pin.length > 0 && pin.length !== 4)}
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating…
                  </span>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Create Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
