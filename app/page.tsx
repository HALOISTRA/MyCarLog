import Link from "next/link";
import { Car, Wrench, Bell, Share2, ArrowRightLeft, Shield, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Car,
    title: "Your Garage",
    titleHr: "Vaša garaža",
    description: "Add all your vehicles in one place. Store make, model, VIN, registration details, and more.",
    descriptionHr: "Dodajte sva vozila na jedno mjesto. Pohranite marku, model, VIN, registracijske podatke i više.",
  },
  {
    icon: Wrench,
    title: "Maintenance History",
    titleHr: "Servisna povijest",
    description: "Log every service, repair, and inspection. Build a complete record your mechanic will love.",
    descriptionHr: "Bilježite svaki servis, popravak i pregled. Izgradite kompletnu evidenciju.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    titleHr: "Pametni podsjetnici",
    description: "Never miss a registration renewal, oil change, or insurance expiry. Set it once, relax.",
    descriptionHr: "Ne propustite obnovu registracije, izmjenu ulja ili istek osiguranja.",
  },
  {
    icon: Share2,
    title: "Share Links",
    titleHr: "Dijeljenje",
    description: "Share a read-only link to your vehicle history with mechanics or prospective buyers.",
    descriptionHr: "Podijelite link na servisnu povijest s mehaničarem ili kupcem.",
  },
  {
    icon: ArrowRightLeft,
    title: "Ownership Transfer",
    titleHr: "Prijenos vlasništva",
    description: "Sell your car and transfer its full history to the new owner with a single click.",
    descriptionHr: "Prodajte auto i prenesete cijelu povijest novom vlasniku jednim klikom.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    titleHr: "Sigurnost i privatnost",
    description: "Your data is private by default. Share only what you choose, with who you choose.",
    descriptionHr: "Vaši podaci su privatni prema zadanoj postavci. Dijelite samo što odaberete.",
  },
];

const stats = [
  { value: "100%", label: "Private by default", labelHr: "Privatno prema zadanoj postavci" },
  { value: "∞", label: "Vehicles supported", labelHr: "Podržanih vozila" },
  { value: "Free", label: "Always free to use", labelHr: "Uvijek besplatno" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800" style={{ background: "#0f172a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Vehicle Passport</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors px-4 py-2 rounded-lg"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 text-center" style={{ background: "#0f172a" }}>
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 text-sm font-medium mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Digital vehicle companion
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Every vehicle has a{" "}
              <span className="text-blue-400">story</span>
              <br />
              worth keeping
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Vehicle Passport keeps your entire vehicle history — maintenance records, documents,
              reminders, and more — organised and always with you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors px-8 py-4 text-base font-semibold shadow-lg shadow-blue-500/25"
              >
                Get Started — it&apos;s free
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors px-8 py-4 text-base font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section className="py-12 px-4 sm:px-6 border-y border-slate-800" style={{ background: "#1e293b" }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.value}>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-1">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                Everything your vehicles need
              </h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                Stop losing paperwork. Start building a history that matters.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-6 text-center" style={{ background: "#0f172a" }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to get organised?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Create your free account and add your first vehicle in under two minutes.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors px-10 py-4 text-base font-semibold shadow-lg shadow-blue-500/25"
            >
              Create Free Account
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-800" style={{ background: "#0f172a" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <Car className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Vehicle Passport</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Vehicle Passport. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
