import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      deletedAt: true,
      createdAt: true,
      _count: {
        select: { vehicles: true },
      },
    },
  });

  const serialized = users.map((u: typeof users[number]) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    deletedAt: u.deletedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">{users.length} total users</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Users</CardTitle>
          <CardDescription>Manage user accounts and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={serialized} />
        </CardContent>
      </Card>
    </div>
  );
}
