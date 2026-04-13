"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { NotificationPrefs } from "@/types";

// ─── Lead-time options (days) ─────────────────────────────────────────────────

const LEAD_DAY_OPTIONS = [60, 30, 14, 7, 3, 1] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationSettingsProps {
  defaultValues: NotificationPrefs;
}

export function NotificationSettings({
  defaultValues,
}: NotificationSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(defaultValues.email);
  const [inAppEnabled, setInAppEnabled] = useState(defaultValues.inApp);
  const [leadDays, setLeadDays] = useState<number[]>(
    defaultValues.leadDays ?? [30, 14, 7]
  );

  function toggleLeadDay(day: number) {
    setLeadDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailEnabled,
          inApp: inAppEnabled,
          leadDays: leadDays.sort((a, b) => b - a),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save preferences");
      }

      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 space-y-6">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Notifications
      </h2>

      {/* Email toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="email-notif" className="text-sm font-medium">
            Email notifications
          </Label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Receive reminder alerts via email.
          </p>
        </div>
        <Switch
          id="email-notif"
          checked={emailEnabled}
          onCheckedChange={setEmailEnabled}
        />
      </div>

      {/* In-app toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="inapp-notif" className="text-sm font-medium">
            In-app notifications
          </Label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Show badges and alerts inside the app.
          </p>
        </div>
        <Switch
          id="inapp-notif"
          checked={inAppEnabled}
          onCheckedChange={setInAppEnabled}
        />
      </div>

      {/* Lead time */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Notify me this many days before due date
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select one or more lead-time windows.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {LEAD_DAY_OPTIONS.map((day) => {
            const checked = leadDays.includes(day);
            const id = `lead-${day}`;
            return (
              <div key={day} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleLeadDay(day)}
                />
                <Label
                  htmlFor={id}
                  className={cn(
                    "text-sm cursor-pointer",
                    checked
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {day === 1 ? "1 day" : `${day} days`}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-1">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
