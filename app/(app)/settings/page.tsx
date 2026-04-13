import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { DangerZone } from "@/components/settings/danger-zone";
import { User, Bell, ShieldAlert, Lock } from "lucide-react";
import type { NotificationPrefs } from "@/types";

export const metadata: Metadata = {
  title: "Settings — Vehicle Passport",
};

export default async function SettingsPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      locale: true,
      timezone: true,
      notificationPrefs: true,
    },
  });

  if (!user) return null;

  const notifPrefs = (user.notificationPrefs ?? {
    email: true,
    inApp: true,
    leadDays: [30, 14, 7],
  }) as unknown as NotificationPrefs;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage your profile, notifications and account.
        </p>
      </div>

      <Tabs defaultValue="profile">
        {/* Tab list — horizontal scroll on mobile, clean pill style */}
        <TabsList className="flex h-auto flex-wrap gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="privacy"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-6">
          <ProfileForm
            defaultValues={{
              name: user.name ?? "",
              avatarUrl: user.avatarUrl ?? "",
              locale: (user.locale ?? "en") as "hr" | "en",
              timezone: user.timezone ?? "UTC",
            }}
          />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">Notifications</h2>
            </div>
            <div className="p-6">
              <NotificationSettings defaultValues={notifPrefs} />
            </div>
          </div>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">Privacy</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Vehicle Passport stores only the data you provide. Your vehicle
                data is private by default and is only shared when you explicitly
                create a share link.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                You can export a copy of all your data or permanently delete your
                account from the{" "}
                <span className="font-semibold text-slate-800">Danger Zone</span>{" "}
                tab.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="mt-6">
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
            </div>
            <div className="p-6">
              <DangerZone userEmail={user.email} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
