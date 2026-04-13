"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Car, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be 100 characters or fewer"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Invalid reset link</h1>
        <p className="text-muted-foreground mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 text-sm font-semibold"
        >
          Request new link
        </Link>
      </div>
    );
  }

  async function onSubmit(data: ResetPasswordFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      if (res.ok) {
        router.push("/auth/login?reset=true");
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (res.status === 400) {
        setServerError(
          body.message ??
            "This reset link is invalid or has expired. Please request a new one."
        );
      } else {
        setServerError(body.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
      {serverError && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}{" "}
          {serverError.includes("expired") && (
            <Link
              href="/auth/forgot-password"
              className="font-medium underline hover:no-underline"
            >
              Request a new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              {...register("password")}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                errors.password
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground"
          >
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...register("confirmPassword")}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground",
            "px-4 py-2.5 text-sm font-semibold",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <Car className="h-6 w-6 text-primary" />
            Vehicle Passport
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Set new password</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        <Suspense fallback={<div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8 h-64 animate-pulse" />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
