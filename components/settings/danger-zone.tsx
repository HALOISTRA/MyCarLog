"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Download, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DangerZoneProps {
  userEmail: string;
}

export function DangerZone({ userEmail }: DangerZoneProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ─── Export ────────────────────────────────────────────────────────────────

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-passport-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data export has been downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (confirmInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Deletion failed");
      }
      toast.success("Your account has been deleted.");
      router.push("/auth/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
      setDeleting(false);
    }
  }

  const confirmValid = confirmInput === "DELETE";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="text-base font-semibold text-slate-900">Danger Zone</h2>
      </div>

      {/* Export */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">Export my data</p>
          <p className="text-xs text-slate-500">
            Download all your Vehicle Passport data as a JSON file (GDPR compliant).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="shrink-0 border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </div>

      {/* Delete account */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-red-700">Delete account</p>
          <p className="text-xs text-red-500">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="shrink-0 bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete account
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!deleting) {
            setDialogOpen(v);
            if (!v) setConfirmInput("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Delete account?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account{" "}
              <span className="font-medium">{userEmail}</span> and all
              associated vehicles, documents and maintenance records. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type <span className="font-mono font-bold">DELETE</span> to
              confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className={
                confirmInput && !confirmValid ? "border-red-400" : ""
              }
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setConfirmInput("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!confirmValid || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
