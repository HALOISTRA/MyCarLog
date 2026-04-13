"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/garage";
  const registered = searchParams.get("registered");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormValues) {
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError("Invalid email or password. Please try again.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Account created — sign in to continue.
        </div>
      )}
      {authError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {authError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
              errors.email ? "border-red-300" : "border-slate-200"
            )}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                errors.password ? "border-red-300" : "border-slate-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
          ) : "Sign in"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Left panel — navy */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "#0f172a" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl">Vehicle Passport</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Your vehicles,<br />
            <span className="text-blue-400">fully documented.</span>
          </h2>
          <p className="text-slate-400 text-lg">
            One place for every service record, document, and reminder across all your vehicles.
          </p>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Vehicle Passport</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-xl">Vehicle Passport</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

          <Suspense fallback={<div className="h-48 rounded-xl bg-slate-100 animate-pulse" />}>
            <LoginForm />
          </Suspense>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
