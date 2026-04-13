import Link from "next/link";
import { AlertTriangle, Car } from "lucide-react";

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "Access was denied. You may not have permission to sign in.",
  Verification:
    "The verification link has expired or has already been used. Please request a new one.",
  OAuthSignin: "Could not sign in with that provider. Please try again.",
  OAuthCallback: "Could not complete sign in. Please try again.",
  OAuthCreateAccount: "Could not create an account with that provider.",
  EmailCreateAccount: "Could not create an account with that email address.",
  Callback: "There was a problem during sign in. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Please use your original sign-in method.",
  EmailSignin: "There was a problem sending the sign-in email. Please try again.",
  CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected error occurred during sign in. Please try again.",
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;

  const errorCode = error ?? "Default";
  const message = errorMessages[errorCode] ?? errorMessages.Default;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors mb-8"
        >
          <Car className="h-6 w-6 text-primary" />
          Vehicle Passport
        </Link>

        {/* Error card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-5 mx-auto">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-3">Sign-in error</h1>

          <p className="text-muted-foreground text-sm leading-relaxed mb-2">{message}</p>

          {errorCode !== "Default" && (
            <p className="text-xs text-muted-foreground/70 mb-6">
              Error code: <code className="font-mono">{errorCode}</code>
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 text-sm font-semibold"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors px-5 py-2.5 text-sm font-medium"
            >
              Go home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
            Reset your password
          </Link>
        </p>
      </div>
    </div>
  );
}
