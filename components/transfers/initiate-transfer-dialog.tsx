"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRightLeft,
  Copy,
  Check,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { initiateTransfer } from "@/app/actions/transfers";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  toEmail: z.string().email("Enter a valid email address"),
  message: z.string().max(1000).optional(),
  includeServiceHistory: z.boolean(),
  includeDocuments: z.boolean(),
  includeCosts: z.boolean(),
  includePrivateNotes: z.boolean(),
  preserveSellerArchive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface InitiateTransferDialogProps {
  vehicleId: string;
  vehicleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InitiateTransferDialog({
  vehicleId,
  vehicleName,
  open,
  onOpenChange,
}: InitiateTransferDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [transferResult, setTransferResult] = useState<{
    id: string;
    token: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      includeServiceHistory: true,
      includeDocuments: true,
      includeCosts: false,
      includePrivateNotes: false,
      preserveSellerArchive: true,
    },
  });

  const watchedValues = watch();
  const isConfirmed = confirmText === "TRANSFER";

  async function onSubmit(data: FormValues) {
    const result = await initiateTransfer(vehicleId, data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setTransferResult(result.data);
    toast.success("Transfer initiated successfully");
  }

  function handleClose() {
    if (!isSubmitting) {
      onOpenChange(false);
      // Reset after animation
      setTimeout(() => {
        reset();
        setConfirmText("");
        setTransferResult(null);
        setCopied(false);
      }, 200);
    }
  }

  async function copyLink() {
    if (!transferResult) return;
    const link = `${appUrl}/transfer/accept?token=${transferResult.token}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Success state ──────────────────────────────────────────────────────────

  if (transferResult) {
    const link = `${appUrl}/transfer/accept?token=${transferResult.token}`;
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Initiated</DialogTitle>
            <DialogDescription>
              The recipient has been sent an email with the transfer link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Transfer ID</p>
              <p className="font-mono text-sm">{transferResult.id}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Transfer link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={link}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLink}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This link expires in 7 days. You can cancel the transfer
                from the vehicle ownership tab.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Form state ─────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
            Transfer Vehicle Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer <strong>{vehicleName}</strong> to a new owner.
          </DialogDescription>
        </DialogHeader>

        {/* Warning banner */}
        <Alert variant="destructive" className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
          <AlertTriangle className="h-4 w-4 !text-orange-600 dark:!text-orange-400" />
          <AlertDescription className="text-sm font-medium">
            This will permanently transfer vehicle ownership. The recipient
            will gain full control of this vehicle record.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Recipient email */}
          <div className="space-y-1.5">
            <Label htmlFor="toEmail">
              Recipient email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="toEmail"
              type="email"
              placeholder="buyer@example.com"
              {...register("toEmail")}
              aria-invalid={!!errors.toEmail}
            />
            {errors.toEmail && (
              <p className="text-xs text-destructive">{errors.toEmail.message}</p>
            )}
          </div>

          {/* Optional message */}
          <div className="space-y-1.5">
            <Label htmlFor="message">
              Message to recipient{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              rows={3}
              className="resize-none"
              {...register("message")}
            />
          </div>

          <Separator />

          {/* Transfer options */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Transfer options</p>

            <div className="space-y-3">
              {(
                [
                  {
                    field: "includeServiceHistory" as const,
                    label: "Include maintenance history",
                    description: "All service records and maintenance timeline",
                  },
                  {
                    field: "includeDocuments" as const,
                    label: "Include document copies",
                    description: "Uploaded documents and files",
                  },
                  {
                    field: "includeCosts" as const,
                    label: "Include cost information",
                    description: "Service costs and expense data",
                  },
                  {
                    field: "includePrivateNotes" as const,
                    label: "Include private notes",
                    description: "Personal notes attached to this vehicle",
                  },
                ] as const
              ).map(({ field, label, description }) => (
                <div key={field} className="flex items-start gap-3">
                  <Checkbox
                    id={field}
                    checked={watchedValues[field]}
                    onCheckedChange={(checked) =>
                      setValue(field, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={field}
                      className="cursor-pointer font-normal"
                    >
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Keep archive */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="preserveSellerArchive" className="cursor-pointer">
                Keep archived copy for yourself
              </Label>
              <p className="text-xs text-muted-foreground">
                Saves a snapshot of this vehicle in your history
              </p>
            </div>
            <Switch
              id="preserveSellerArchive"
              checked={watchedValues.preserveSellerArchive}
              onCheckedChange={(checked) =>
                setValue("preserveSellerArchive", checked)
              }
            />
          </div>

          <Separator />

          {/* Confirmation */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm">
              Type{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-bold">
                TRANSFER
              </code>{" "}
              to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="TRANSFER"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmed || isSubmitting}
            >
              {isSubmitting ? "Initiating..." : "Transfer Ownership"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
