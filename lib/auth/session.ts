import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/garage");
  }
  return session;
}

export async function getSession() {
  return auth();
}
