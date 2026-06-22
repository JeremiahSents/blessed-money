"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { PersonAvatar } from "@/components/shared/person-avatar";

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
    <Card>
      <CardHeader>
        <CardTitle>User Access</CardTitle>
        <CardDescription>
          Grant admin access so users can log in and use Blessed. Users without
          admin access will be sent to onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : (
          <div className="space-y-3">
            {usersData?.data?.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PersonAvatar seed={u.id} name={u.name} className="w-9 h-9 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      {u.isAdmin && (
                        <Badge className="text-[10px] px-1.5 py-0 shrink-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={u.isAdmin ? "destructive" : "outline"}
                  onClick={() =>
                    toggleAdminMutation.mutate({
                      userId: u.id,
                      isAdmin: !u.isAdmin,
                    })
                  }
                  disabled={toggleAdminMutation.isPending}
                  className="shrink-0"
                >
                  {u.isAdmin ? "Remove Access" : "Grant Access"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
