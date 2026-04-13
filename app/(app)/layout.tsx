import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { AuthSessionProvider } from "@/components/layout/session-provider";
import { LanguageProvider } from "@/components/providers/language-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const initialLocale = localeCookie === "hr" ? "hr" : "en";

  return (
    <AuthSessionProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </LanguageProvider>
    </AuthSessionProvider>
  );
}
