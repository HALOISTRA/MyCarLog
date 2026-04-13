"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";

// ─── Schema ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
  locale: z.enum(["en", "hr"]),
  timezone: z.string().min(1, "Timezone is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Timezones (common subset) ────────────────────────────────────────────────

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Budapest",
  "Europe/Bucharest",
  "Europe/Sofia",
  "Europe/Athens",
  "Europe/Helsinki",
  "Europe/Tallinn",
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Zagreb",
  "Europe/Belgrade",
  "Europe/Sarajevo",
  "Europe/Skopje",
  "Europe/Ljubljana",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfileFormProps {
  defaultValues: ProfileFormValues;
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const locale = watch("locale");
  const timezone = watch("timezone");

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t("settings.saveChanges"));
      }

      toast.success(t("settings.profileSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Information section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">
            Profile Information
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              {t("settings.name")}
            </Label>
            <Input
              id="name"
              placeholder={t("settings.yourName")}
              {...register("name")}
              className={errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl" className="text-sm font-medium text-slate-700">
              {t("settings.avatarUrl")}
            </Label>
            <Input
              id="avatarUrl"
              placeholder="https://example.com/avatar.jpg"
              {...register("avatarUrl")}
              className={errors.avatarUrl ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {errors.avatarUrl && (
              <p className="text-xs text-red-500">{errors.avatarUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preferences section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">
            Preferences
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Locale */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              {t("settings.language")}
            </Label>
            <Select
              value={locale}
              onValueChange={(v) => setValue("locale", v as "en" | "hr")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hr">Hrvatski</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              {t("settings.timezone")}
            </Label>
            <Select
              value={timezone}
              onValueChange={(v) => setValue("timezone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("settings.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
