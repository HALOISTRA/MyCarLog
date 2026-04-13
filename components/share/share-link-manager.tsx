"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  XCircle,
  Trash2,
  Clock,
  Eye,
  Shield,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateShareLinkDialog } from "./create-share-link-dialog";
import { revokeShareLink, deleteShareLink } from "@/app/actions/shares";
import type { ShareVisibilityConfig } from "@/types";

// Local type mirror — replaced by @/app/generated/prisma after `prisma generate`
interface ShareLink {
  id: string;
  vehicleId: string;
  createdByUserId: string;
  token: string;
  pinHash: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  visibilityConfig: unknown;
  label: string | null;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShareLinkManagerProps {
  links: ShareLink[];
  vehicleId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getShareUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${base}/share/${token}`;
}

function maskToken(token: string): string {
  if (token.length <= 8) return "••••••••";
  return token.slice(0, 4) + "••••••••••••••" + token.slice(-3);
}

function visibilitySummary(config: ShareVisibilityConfig): string {
  const parts: string[] = [];
  if (config.showMaintenance) parts.push("Maintenance");
  if (config.showDocuments) parts.push("Docs");
  if (config.showCosts) parts.push("Costs");
  if (config.showVin) parts.push("VIN");
  if (config.showPlate) parts.push("Plate");
  if (config.showNotes) parts.push("Notes");
  return parts.length ? parts.join(", ") : "Minimal info";
}

// ─── Link status ──────────────────────────────────────────────────────────────

function getLinkStatus(link: ShareLink): "active" | "revoked" | "expired" {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt && isPast(new Date(link.expiresAt))) return "expired";
  return "active";
}

const STATUS_BADGE = {
  active: {
    label: "Active",
    className: "text-white border-0",
    style: { backgroundColor: "#16a34a" },
  },
  revoked: {
    label: "Revoked",
    className: "text-white border-0",
    style: { backgroundColor: "#dc2626" },
  },
  expired: {
    label: "Expired",
    className: "text-white border-0",
    style: { backgroundColor: "#d97706" },
  },
};

// ─── Single link card ─────────────────────────────────────────────────────────

interface LinkCardProps {
  link: ShareLink;
  vehicleId: string;
  onRevoked: (id: string) => void;
  onDeleted: (id: string) => void;
}

function LinkCard({ link, vehicleId, onRevoked, onDeleted }: LinkCardProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"revoke" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);

  const status = getLinkStatus(link);
  const statusBadge = STATUS_BADGE[status];
  const shareUrl = getShareUrl(link.token);
  const visConfig = link.visibilityConfig as unknown as ShareVisibilityConfig;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      const result = await revokeShareLink(link.id);
      if (!result.success) throw new Error(result.error);
      toast.success("Link revoked");
      setConfirmAction(null);
      onRevoked(link.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteShareLink(link.id);
      if (!result.success) throw new Error(result.error);
      toast.success("Link deleted");
      setConfirmAction(null);
      onDeleted(link.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">
                {link.label ?? "Untitled link"}
              </p>
              <Badge className={statusBadge.className} style={(statusBadge as any).style}>
                {statusBadge.label}
              </Badge>
              {link.pinHash && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Shield className="w-3 h-3" />
                      PIN protected
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>This link requires a PIN to access</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {status === "active" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopy}
                      title="Copy link"
                    >
                      {copiedToken ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy share link</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(shareUrl, "_blank")}
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700"
                      onClick={() => setConfirmAction("revoke")}
                      title="Revoke link"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Revoke link (keep record)</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setConfirmAction("delete")}
                  title="Delete link"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete permanently</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Token (masked) */}
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <code className="text-xs text-muted-foreground font-mono truncate">
            {maskToken(link.token)}
          </code>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Created {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
          </span>

          {link.expiresAt && (
            <span
              className={`flex items-center gap-1 ${
                isPast(new Date(link.expiresAt))
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              }`}
            >
              <Clock className="w-3 h-3" />
              {isPast(new Date(link.expiresAt))
                ? `Expired ${formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}`
                : `Expires ${format(new Date(link.expiresAt), "dd MMM yyyy, HH:mm")}`}
            </span>
          )}

          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {link.accessCount} {link.accessCount === 1 ? "view" : "views"}
            {link.lastAccessedAt &&
              ` · last ${formatDistanceToNow(new Date(link.lastAccessedAt), {
                addSuffix: true,
              })}`}
          </span>
        </div>

        {/* Visibility summary */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="w-3 h-3 shrink-0" />
          <span>Shows: {visibilitySummary(visConfig)}</span>
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {confirmAction === "revoke" ? "Revoke Share Link" : "Delete Share Link"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction === "revoke"
              ? "Revoking this link will prevent anyone from accessing it. The link record will remain in your history."
              : "Permanently deleting this link will remove it completely. This cannot be undone."}
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmAction === "revoke" ? handleRevoke : handleDelete}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {confirmAction === "revoke" ? "Revoking…" : "Deleting…"}
                </span>
              ) : confirmAction === "revoke" ? (
                "Revoke Link"
              ) : (
                "Delete Link"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShareLinkManager({ links: initialLinks, vehicleId }: ShareLinkManagerProps) {
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);

  function handleRevoked(id: string) {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, revokedAt: new Date() } : l
      )
    );
  }

  function handleDeleted(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function handleCreated() {
    // Trigger a full refresh to get the new link from server
    window.location.reload();
  }

  const activeLinks = links.filter((l) => !l.revokedAt && !(l.expiresAt && isPast(new Date(l.expiresAt))));
  const inactiveLinks = links.filter((l) => l.revokedAt || (l.expiresAt && isPast(new Date(l.expiresAt))));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Share Links</h2>
          {activeLinks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeLinks.length} active
            </Badge>
          )}
        </div>
        <CreateShareLinkDialog vehicleId={vehicleId} onCreated={handleCreated} />
      </div>

      <Separator />

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Link2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No share links yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Create a link to share this vehicle&apos;s profile with mechanics or buyers
          </p>
          <CreateShareLinkDialog
            vehicleId={vehicleId}
            onCreated={handleCreated}
            trigger={
              <Button variant="outline" size="sm" className="mt-4">
                <Link2 className="w-4 h-4 mr-2" />
                Create first link
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active links */}
          {activeLinks.length > 0 && (
            <div className="space-y-3">
              {activeLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  vehicleId={vehicleId}
                  onRevoked={handleRevoked}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}

          {/* Inactive links */}
          {inactiveLinks.length > 0 && (
            <>
              {activeLinks.length > 0 && <Separator />}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inactive
              </p>
              <div className="space-y-3">
                {inactiveLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    vehicleId={vehicleId}
                    onRevoked={handleRevoked}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
