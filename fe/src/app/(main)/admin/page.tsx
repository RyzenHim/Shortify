"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Trash2, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api";
import { getApiMessage } from "@/lib/api";
import type { ApiResponse, User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ListRowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";

interface AdminUrl {
  _id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  isGuest?: boolean;
  owner?: { name?: string; email?: string };
}

async function getAdminUrls() {
  const { data } = await api.get<
    ApiResponse<{ items: AdminUrl[]; total: number }>
  >("/admin/urls");
  return data.data;
}

async function getAdminUsers() {
  const { data } = await api.get<ApiResponse<{ items: User[]; total: number }>>(
    "/admin/users",
  );
  return data.data;
}

async function deleteAdminUrl(id: string) {
  await api.delete<ApiResponse<null>>(`/admin/urls/${id}`);
}

async function setUserStatus(input: { id: string; enabled: boolean }) {
  const action = input.enabled ? "enable" : "disable";
  const { data } = await api.patch<ApiResponse<User>>(
    `/admin/users/${input.id}/${action}`,
  );
  return data.data;
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "urls"],
    queryFn: getAdminUrls,
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
  });
  const filteredUrls = useMemo(() => {
    return (data?.items ?? []).filter((url) => {
      const text = `${url.shortCode} ${url.originalUrl} ${url.owner?.email ?? ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [data?.items, search]);
  const deleteMutation = useMutation({
    mutationFn: deleteAdminUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "urls"] });
      toast.success("URL removed");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });
  const userStatusMutation = useMutation({
    mutationFn: setUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-[var(--muted)]">
              Manage users, review URLs, and remove abusive links.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {isLoading || usersQuery.isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <StatCardSkeleton key={index} />
                ))
              : [
                  { label: "Total URLs", value: data?.total ?? 0 },
                  {
                    label: "Guest URLs",
                    value:
                      data?.items.filter((url) => url.isGuest).length ?? 0,
                  },
                  { label: "Users", value: usersQuery.data?.total ?? 0 },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5"
                  >
                    <ShieldAlert className="mb-4 h-5 w-5 text-[var(--accent)]" />
                    <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                ))}
          </div>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
            <div className="space-y-4 border-b border-[var(--line)] p-5">
              <p className="font-semibold">
                {isLoading ? "Loading..." : `${data?.total ?? 0} total URLs`}
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search URLs or owners"
                className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="divide-y divide-[var(--line)]">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <ListRowSkeleton key={index} />
                  ))
                : filteredUrls.map((url) => (
                <div key={url._id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {url.shortCode}
                      {url.isGuest ? (
                        <span className="ml-2 rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                          Guest
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-[var(--muted)]">
                      {url.originalUrl}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Owner: {url.owner?.email ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--muted)]">
                      {url.clicks} clicks
                    </span>
                    <Button
                      variant="danger"
                      onClick={() => deleteMutation.mutate(url._id)}
                      aria-label="Delete abusive URL"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] p-5">
              <p className="font-semibold">User Management</p>
              <p className="text-sm text-[var(--muted)]">
                Disable users when moderation requires it.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {usersQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <ListRowSkeleton key={index} />
                  ))
                : usersQuery.data?.items.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {user.email} · {user.role} ·{" "}
                      {user.isActive === false ? "Disabled" : "Active"}
                    </p>
                  </div>
                  <Button
                    variant={user.isActive === false ? "secondary" : "danger"}
                    onClick={() =>
                      userStatusMutation.mutate({
                        id: user.id,
                        enabled: user.isActive === false,
                      })
                    }
                  >
                    {user.isActive === false ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                    {user.isActive === false ? "Enable" : "Disable"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
