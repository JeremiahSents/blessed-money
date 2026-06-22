"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isAdmin: boolean;
}

export function AdminPanel() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery<{ data: UserRecord[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: string;
      isAdmin: boolean;
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: (_, { isAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-me"] });
      toast.success(isAdmin ? "Admin access granted" : "Admin access removed");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2.5 text-foreground">
          <HugeiconsIcon icon={UserMultipleIcon} className="w-5 h-5" />
          <h2 className="text-lg font-semibold">User access</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">
          Grant access so people can log in. Anyone without access is sent to onboarding.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 rounded-full bg-muted" />
                <div className="h-3 w-40 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {usersData?.data?.map((u) => (
            <div key={u.id} className="flex items-center gap-3.5 px-4 py-3.5">
              <PersonAvatar seed={u.id} name={u.name} className="w-10 h-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  {u.isAdmin && (
                    <Badge className="h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide border-none bg-success/10 text-success shrink-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <Button
                size="sm"
                variant={u.isAdmin ? "ghost" : "secondary"}
                onClick={() =>
                  toggleAdminMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })
                }
                disabled={toggleAdminMutation.isPending}
                className={
                  u.isAdmin
                    ? "shrink-0 h-9 rounded-xl px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "shrink-0 h-9 rounded-xl px-3 text-xs font-semibold border border-border bg-card"
                }
              >
                {u.isAdmin ? "Remove" : "Grant access"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
