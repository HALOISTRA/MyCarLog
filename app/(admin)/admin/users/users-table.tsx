"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setUserRole } from "@/app/actions/admin";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  deletedAt: string | null;
  createdAt: string;
  _count: { vehicles: number };
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleRoleToggle(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    startTransition(async () => {
      const result = await setUserRole(userId, newRole as "USER" | "ADMIN");
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`User role updated to ${newRole}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Vehicles</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr
                key={user.id}
                className={user.deletedAt ? "opacity-50" : "hover:bg-muted/30"}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                    <p className="text-xs text-muted-foreground opacity-60">{user.id.slice(0, 8)}...</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className={
                      user.role === "ADMIN"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : ""
                    }
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {user._count.vehicles}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(new Date(user.createdAt), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">
                  {user.deletedAt ? (
                    <Badge variant="destructive" className="text-xs">Deleted</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      disabled={isPending || !!user.deletedAt}
                    >
                      {user.role === "ADMIN" ? (
                        <>
                          <ShieldX className="h-3.5 w-3.5" />
                          Revoke Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {users.length} users
      </p>
    </div>
  );
}
