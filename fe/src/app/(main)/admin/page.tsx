"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api, getApiMessage } from "@/lib/api";
import type { ApiResponse, User } from "@/lib/types";
import { ListRowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { clsx } from "clsx";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Admin gate (UI-only)
// ---------------------------------------------------------------------------
function AdminGate({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
        <h2 className="text-xl font-bold">No admin access</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          You don’t have permission to view this page.
        </p>
        <div className="mt-5">
          <Link href="/dashboard" className="block">
            <Button className="w-full">Go to your dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AdminUrl {
  _id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  isGuest?: boolean;
  owner?: { name?: string; email?: string };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function getAdminUrls() {
  const { data } =
    await api.get<ApiResponse<{ items: AdminUrl[]; total: number }>>(
      "/admin/urls",
    );
  return data.data;
}
async function getAdminUsers() {
  const { data } =
    await api.get<ApiResponse<{ items: User[]; total: number }>>(
      "/admin/users",
    );
  return data.data;
}
async function deleteAdminUrl(id: string) {
  await api.delete<ApiResponse<null>>(`/admin/urls/${id}`);
}
async function setUserStatus(input: { id: string; enabled: boolean }) {
  const { data } = await api.patch<ApiResponse<User>>(
    `/admin/users/${input.id}/${input.enabled ? "enable" : "disable"}`,
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const URL_PAGE_SIZE = 10;
const USER_PAGE_SIZE = 8;

type MainTab = "urls" | "users";
type UserStatusTab = "all" | "active" | "disabled";
type RoleFilter = "all" | "admin" | "user";

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------
function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "guest" | "active" | "inactive" | "admin" | "user";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variant === "guest" &&
          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        variant === "active" &&
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        variant === "inactive" && "bg-rose-500/10 text-rose-500",
        variant === "admin" && "bg-[var(--accent)]/10 text-[var(--accent)]",
        variant === "user" && "bg-[var(--line)] text-[var(--muted)]",
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--background)]">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function ConfirmRow({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
  variant = "danger",
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  variant?: "danger" | "warning";
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        variant === "danger"
          ? "border-rose-200 bg-rose-50 dark:border-rose-800/50 dark:bg-rose-950/30"
          : "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30",
      )}
    >
      <p
        className={clsx(
          "font-medium",
          variant === "danger"
            ? "text-rose-700 dark:text-rose-300"
            : "text-amber-700 dark:text-amber-300",
        )}
      >
        {message}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onCancel}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className={clsx(
            "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold text-white disabled:opacity-60",
            variant === "danger"
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-amber-500 hover:bg-amber-600",
          )}
        >
          {isPending ? "Working…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3">
      <p className="text-xs text-[var(--muted)]">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Pill tab button used in both main tabs and sub-tabs
function TabPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={clsx(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
            active
              ? "bg-white/20 text-white"
              : "bg-[var(--line)] text-[var(--muted)]",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminPage() {
  // Main tab
  const [mainTab, setMainTab] = useState<MainTab>("urls");

  // URL panel state
  const [urlSearch, setUrlSearch] = useState("");
  const [urlPage, setUrlPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // User panel state
  const [userStatusTab, setUserStatusTab] = useState<UserStatusTab>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [userPage, setUserPage] = useState(1);
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: urlData, isLoading: urlLoading } = useQuery({
    queryKey: ["admin", "urls"],
    queryFn: getAdminUrls,
  });
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
  });

  // ---- URL derived state ----
  const filteredUrls = useMemo(() => {
    return (urlData?.items ?? []).filter((url) => {
      const text =
        `${url.shortCode} ${url.originalUrl} ${url.owner?.email ?? ""}`.toLowerCase();
      return text.includes(urlSearch.toLowerCase());
    });
  }, [urlData?.items, urlSearch]);

  const urlTotalPages = Math.ceil(filteredUrls.length / URL_PAGE_SIZE);
  const pagedUrls = useMemo(() => {
    const start = (urlPage - 1) * URL_PAGE_SIZE;
    return filteredUrls.slice(start, start + URL_PAGE_SIZE);
  }, [filteredUrls, urlPage]);

  // ---- User derived state ----
  const allUsers = userData?.items ?? [];

  // Counts for sub-tab badges
  const activeCount = allUsers.filter((u) => u.isActive !== false).length;
  const disabledCount = allUsers.filter((u) => u.isActive === false).length;
  const adminCount = allUsers.filter((u) => u.role === "admin").length;
  const userCount = allUsers.filter((u) => u.role !== "admin").length;

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const statusOk =
        userStatusTab === "all" ||
        (userStatusTab === "active" && u.isActive !== false) ||
        (userStatusTab === "disabled" && u.isActive === false);
      const roleOk =
        roleFilter === "all" ||
        (roleFilter === "admin" && u.role === "admin") ||
        (roleFilter === "user" && u.role !== "admin");
      return statusOk && roleOk;
    });
  }, [allUsers, userStatusTab, roleFilter]);

  const userTotalPages = Math.ceil(filteredUsers.length / USER_PAGE_SIZE);
  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  // Reset user page when filters change
  function setUserStatusTabAndReset(v: UserStatusTab) {
    setUserStatusTab(v);
    setUserPage(1);
  }
  function setRoleFilterAndReset(v: RoleFilter) {
    setRoleFilter(v);
    setUserPage(1);
  }

  const isUrlFiltered = urlSearch.trim() !== "";
  const isUserFiltered = userStatusTab !== "all" || roleFilter !== "all";

  function resetUrlFilters() {
    setUrlSearch("");
    setUrlPage(1);
  }
  function resetUserFilters() {
    setUserStatusTab("all");
    setRoleFilter("all");
    setUserPage(1);
  }

  // ---- Mutations ----
  const deleteMutation = useMutation({
    mutationFn: deleteAdminUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "urls"] });
      setConfirmDeleteId(null);
      toast.success("URL removed");
    },
    onError: (error) => {
      setConfirmDeleteId(null);
      toast.error(getApiMessage(error));
    },
  });

  const userStatusMutation = useMutation({
    mutationFn: setUserStatus,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmToggleId(null);
      toast.success(updated.isActive ? "User enabled" : "User disabled");
    },
    onError: (error) => {
      setConfirmToggleId(null);
      toast.error(getApiMessage(error));
    },
  });

  const guestCount = urlData?.items.filter((u) => u.isGuest).length ?? 0;

  return (
    <ProtectedRoute>
      <AdminGate>
        <DashboardShell>
          <div className="space-y-6">
            {/* ---- Page header ---- */}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Admin
                </span>
              </div>
              <h1 className="text-2xl font-bold">Control panel</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Manage users, review links, and remove abusive content.
              </p>
            </div>

            {/* ---- Stat cards — always visible ---- */}
            <div className="grid gap-4 sm:grid-cols-3">
              {urlLoading || userLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <StatCard
                    icon={Link2}
                    label="Total URLs"
                    value={urlData?.total ?? 0}
                    sub={`${guestCount} from guests`}
                  />
                  <StatCard
                    icon={Globe}
                    label="Guest URLs"
                    value={guestCount}
                    sub="Not tied to any account"
                  />
                  <StatCard
                    icon={Users}
                    label="Registered users"
                    value={userData?.total ?? 0}
                    sub={`${activeCount} active · ${disabledCount} disabled`}
                  />
                </>
              )}
            </div>

            {/* ---- Main tab switcher ---- */}
            <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 w-fit">
              <TabPill
                active={mainTab === "urls"}
                onClick={() => setMainTab("urls")}
                count={urlData?.total}
              >
                <Link2 className="h-3.5 w-3.5" />
                Links
              </TabPill>
              <TabPill
                active={mainTab === "users"}
                onClick={() => setMainTab("users")}
                count={userData?.total}
              >
                <Users className="h-3.5 w-3.5" />
                Users
              </TabPill>
            </div>

            {/* ================================================================
              URL PANEL
          ================================================================ */}
            {mainTab === "urls" && (
              <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                {/* Command bar */}
                <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">All links</p>
                    <p className="text-xs text-[var(--muted)]">
                      {urlLoading
                        ? "Loading…"
                        : urlSearch
                          ? `${filteredUrls.length} of ${urlData?.total ?? 0} match`
                          : `${urlData?.total ?? 0} total`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        value={urlSearch}
                        onChange={(e) => {
                          setUrlSearch(e.target.value);
                          setUrlPage(1);
                        }}
                        placeholder="Short code, URL, or owner"
                        className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                    {isUrlFiltered && (
                      <button
                        onClick={resetUrlFilters}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-[var(--line)]">
                  {urlLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <ListRowSkeleton key={i} />
                    ))
                  ) : pagedUrls.length === 0 ? (
                    <div className="p-10 text-center text-sm text-[var(--muted)]">
                      {urlSearch
                        ? "No links match that search."
                        : "No links yet."}
                    </div>
                  ) : (
                    pagedUrls.map((url) => (
                      <div key={url._id} className="space-y-3 p-5">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold">
                                {url.shortCode}
                              </p>
                              {url.isGuest && (
                                <Badge variant="guest">Guest</Badge>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm text-[var(--muted)]">
                              {url.originalUrl}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {url.owner?.email ? (
                                <>
                                  Owner:{" "}
                                  <span className="text-[var(--foreground)]">
                                    {url.owner.email}
                                  </span>
                                </>
                              ) : (
                                <span className="italic">No account</span>
                              )}
                              <span className="mx-2 opacity-40">·</span>
                              <span className="tabular-nums">
                                {url.clicks} click{url.clicks !== 1 ? "s" : ""}
                              </span>
                            </p>
                          </div>
                          {confirmDeleteId !== url._id && (
                            <button
                              onClick={() => setConfirmDeleteId(url._id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:bg-rose-950/40"
                              aria-label="Delete URL"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {confirmDeleteId === url._id && (
                          <ConfirmRow
                            message="Permanently delete this link?"
                            confirmLabel="Delete"
                            onConfirm={() => deleteMutation.mutate(url._id)}
                            onCancel={() => setConfirmDeleteId(null)}
                            isPending={deleteMutation.isPending}
                            variant="danger"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Pagination
                  page={urlPage}
                  totalPages={urlTotalPages}
                  total={filteredUrls.length}
                  pageSize={URL_PAGE_SIZE}
                  onChange={setUrlPage}
                />
              </section>
            )}

            {/* ================================================================
              USER PANEL
          ================================================================ */}
            {mainTab === "users" && (
              <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                {/* Command bar with sub-tabs + role filter */}
                <div className="space-y-3 border-b border-[var(--line)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">User accounts</p>
                      <p className="text-xs text-[var(--muted)]">
                        {userLoading
                          ? "Loading…"
                          : `${filteredUsers.length} of ${userData?.total ?? 0} shown`}
                      </p>
                    </div>
                    {isUserFiltered && (
                      <button
                        onClick={resetUserFilters}
                        className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Status sub-tabs */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--background)] p-0.5">
                      {(
                        [
                          {
                            value: "all",
                            label: "All",
                            count: allUsers.length,
                          },
                          {
                            value: "active",
                            label: "Active",
                            count: activeCount,
                          },
                          {
                            value: "disabled",
                            label: "Disabled",
                            count: disabledCount,
                          },
                        ] as {
                          value: UserStatusTab;
                          label: string;
                          count: number;
                        }[]
                      ).map(({ value, label, count }) => (
                        <button
                          key={value}
                          onClick={() => setUserStatusTabAndReset(value)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                            userStatusTab === value
                              ? "bg-[var(--panel)] text-[var(--foreground)] shadow-sm"
                              : "text-[var(--muted)] hover:text-[var(--foreground)]",
                          )}
                        >
                          {label}
                          <span
                            className={clsx(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                              userStatusTab === value
                                ? "bg-[var(--line)] text-[var(--foreground)]"
                                : "text-[var(--muted)]",
                            )}
                          >
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Role filter pills */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Role
                      </span>
                      {(
                        [
                          { value: "all", label: "All" },
                          { value: "admin", label: "Admin", count: adminCount },
                          { value: "user", label: "User", count: userCount },
                        ] as {
                          value: RoleFilter;
                          label: string;
                          count?: number;
                        }[]
                      ).map(({ value, label, count }) => (
                        <button
                          key={value}
                          onClick={() => setRoleFilterAndReset(value)}
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                            roleFilter === value
                              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]",
                          )}
                        >
                          {label}
                          {count !== undefined && (
                            <span className="tabular-nums opacity-70">
                              {count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User rows */}
                <div className="divide-y divide-[var(--line)]">
                  {userLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <ListRowSkeleton key={i} />
                    ))
                  ) : pagedUsers.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-sm text-[var(--muted)]">
                        {userStatusTab !== "all" || roleFilter !== "all"
                          ? "No users match the current filters."
                          : "No users yet."}
                      </p>
                      {(userStatusTab !== "all" || roleFilter !== "all") && (
                        <button
                          onClick={() => {
                            setUserStatusTab("all");
                            setRoleFilter("all");
                            setUserPage(1);
                          }}
                          className="mt-2 text-xs text-[var(--accent)] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    pagedUsers.map((user) => {
                      const isActive = user.isActive !== false;
                      const isConfirming = confirmToggleId === user.id;
                      return (
                        <div key={user.id} className="space-y-3 p-5">
                          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[11px] font-bold uppercase text-[var(--accent)]">
                                {(user.name ?? user.email ?? "?").slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">
                                    {user.name ?? "—"}
                                  </p>
                                  <Badge
                                    variant={
                                      user.role === "admin" ? "admin" : "user"
                                    }
                                  >
                                    {user.role}
                                  </Badge>
                                  <Badge
                                    variant={isActive ? "active" : "inactive"}
                                  >
                                    {isActive ? "Active" : "Disabled"}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                                  {user.email}
                                </p>
                              </div>
                            </div>

                            {!isConfirming && (
                              <button
                                onClick={() => setConfirmToggleId(user.id)}
                                disabled={user.role === "admin"}
                                className={clsx(
                                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                  isActive
                                    ? "border-[var(--line)] text-[var(--muted)] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:bg-rose-950/40"
                                    : "border-[var(--line)] text-[var(--muted)] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40",
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5" /> Disable
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" /> Enable
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {isConfirming && (
                            <ConfirmRow
                              message={
                                isActive
                                  ? `Disable ${user.name ?? user.email}? They won't be able to log in.`
                                  : `Re-enable ${user.name ?? user.email}?`
                              }
                              confirmLabel={
                                isActive ? "Disable user" : "Enable user"
                              }
                              onConfirm={() =>
                                userStatusMutation.mutate({
                                  id: user.id,
                                  enabled: !isActive,
                                })
                              }
                              onCancel={() => setConfirmToggleId(null)}
                              isPending={userStatusMutation.isPending}
                              variant={isActive ? "danger" : "warning"}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <Pagination
                  page={userPage}
                  totalPages={userTotalPages}
                  total={filteredUsers.length}
                  pageSize={USER_PAGE_SIZE}
                  onChange={setUserPage}
                />
              </section>
            )}
          </div>
        </DashboardShell>
      </AdminGate>
    </ProtectedRoute>
  );
}
