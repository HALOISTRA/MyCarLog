"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Car, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      if (res.ok) { router.push("/auth/login?registered=true"); return; }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setServerError("An account with that email already exists.");
      } else {
        setServerError(body.message ?? "Registration failed. Please try again.");
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  const inputClass = (hasError: boolean) => cn(
    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
    hasError ? "border-red-300" : "border-slate-200"
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "#0f172a" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl">Vehicle Passport</span>
        </Link>
        <div className="space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Start tracking<br />
            <span className="text-blue-400">your vehicles today.</span>
          </h2>
          {[
            "Full service history for every vehicle",
            "Smart reminders for upcoming services",
            "Share history with mechanics or buyers",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
              <span className="text-slate-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Vehicle Passport</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-xl">Vehicle Passport</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-8">Free to use. No credit card required.</p>

          {serverError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full name</label>
              <input id="name" type="text" autoComplete="name" placeholder="Alex Smith" {...register("name")} className={inputClass(!!errors.name)} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} className={inputClass(!!errors.email)} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min. 8 characters" {...register("password")} className={inputClass(!!errors.password)} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm password</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" {...register("confirmPassword")} className={inputClass(!!errors.confirmPassword)} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Create account</>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
