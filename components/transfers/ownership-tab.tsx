"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Gauge,
  Link2,
  MailIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InitiateTransferDialog } from "./initiate-transfer-dialog";
import { cancelTransfer } from "@/app/actions/transfers";
type TransferStatus = "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferSummary {
  id: string;
  status: TransferStatus;
  toEmail: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  acceptedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  fromUser?: { name?: string | null; email: string } | null;
  toUser?: { name?: string | null; email: string } | null;
}

interface OwnerInfo {
  name?: string | null;
  email: string;
}

interface OwnershipTabProps {
  vehicleId: string;
  vehicleName: string;
  owner: OwnerInfo;
  ownedSinceDate?: Date | string | null;
  purchaseMileage?: number | null;
  mileageUnit: string;
  pendingTransfer?: TransferSummary | null;
  transferHistory: TransferSummary[];
  shareLinksCount: number;
  isOwner: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function maskName(name?: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts.slice(1).map((p) => p[0] + ".").join(" ")}`;
}

const STATUS_CONFIG: Record<
  TransferStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
    className?: string;
    style?: React.CSSProperties;
  }
> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
    className: "text-white border-0",
    style: { backgroundColor: "#d97706" },
  },
  ACCEPTED: {
    label: "Accepted",
    variant: "default",
    icon: CheckCircle2,
    className: "text-white border-0",
    style: { backgroundColor: "#16a34a" },
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
    icon: XCircle,
    className: "",
  },
  EXPIRED: {
    label: "Expired",
    variant: "destructive",
    icon: AlertTriangle,
    className: "",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OwnershipTab({
  vehicleId,
  vehicleName,
  owner,
  ownedSinceDate,
  purchaseMileage,
  mileageUnit,
  pendingTransfer,
  transferHistory,
  shareLinksCount,
  isOwner,
}: OwnershipTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancelTransfer(id: string) {
    setCancelling(true);
    const result = await cancelTransfer(id);
    setCancelling(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Transfer cancelled");
    }
  }

  return (
    <div className="space-y-6">
      {/* Owner Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Owner Information</CardTitle>
          <CardDescription className="text-xs">
            Private — only visible to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-medium">
              {maskName(owner.name)} &middot;{" "}
              <span className="font-mono text-xs">{maskEmail(owner.email)}</span>
            </span>
          </div>

          {ownedSinceDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Owned since:</span>
              <span className="font-medium">
                {format(new Date(ownedSinceDate), "dd MMM yyyy")}
              </span>
            </div>
          )}

          {purchaseMileage != null && (
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Purchase mileage:</span>
              <span className="font-medium">
                {purchaseMileage.toLocaleString()} {mileageUnit}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Active share links:</span>
            <span className="font-medium">{shareLinksCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Transfer */}
      {pendingTransfer && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Active Transfer Request</CardTitle>
              <Badge
                className={STATUS_CONFIG[pendingTransfer.status].className}
                style={(STATUS_CONFIG[pendingTransfer.status] as any).style}
              >
                {(() => {
                  const Icon = STATUS_CONFIG[pendingTransfer.status].icon;
                  return (
                    <span className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {STATUS_CONFIG[pendingTransfer.status].label}
                    </span>
                  );
                })()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MailIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-medium font-mono text-xs">
                {pendingTransfer.toEmail}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">
                {format(new Date(pendingTransfer.expiresAt), "dd MMM yyyy, HH:mm")}
              </span>
            </div>

            {isOwner && (
              <div className="pt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelTransfer(pendingTransfer.id)}
                  disabled={cancelling}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelling ? "Cancelling..." : "Cancel Transfer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transfer History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transferHistory.map((transfer, idx) => {
                const config = STATUS_CONFIG[transfer.status];
                const StatusIcon = config.icon;

                return (
                  <div key={transfer.id}>
                    {idx > 0 && <Separator className="mb-3" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>From</span>
                          <span className="font-mono font-medium text-foreground">
                            {transfer.fromUser
                              ? maskEmail(transfer.fromUser.email)
                              : "—"}
                          </span>
                          <span>to</span>
                          <span className="font-mono font-medium text-foreground">
                            {transfer.toUser
                              ? maskEmail(transfer.toUser.email)
                              : maskEmail(transfer.toEmail)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transfer.createdAt), "dd MMM yyyy")}
                          {transfer.acceptedAt && (
                            <> &middot; accepted{" "}
                              {format(new Date(transfer.acceptedAt), "dd MMM yyyy")}
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        className={config.className}
                        style={(config as any).style}
                      >
                        <span className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer CTA */}
      {isOwner && !pendingTransfer && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transfer This Vehicle
          </Button>
        </div>
      )}

      <InitiateTransferDialog
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
