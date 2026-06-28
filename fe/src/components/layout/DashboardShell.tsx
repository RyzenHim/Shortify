"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Link2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { clearSession } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const nav = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/urls", label: "URLs", icon: Link2 },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside
        className={`fixed inset-y-0 left-0 hidden border-r border-[var(--line)] bg-[var(--panel)] p-4 transition-[width] duration-200 lg:block ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="mb-8 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-xl font-bold"
            aria-label="Shortify home"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--accent)] text-white">
              S
            </span>
            {!isCollapsed ? <span className="truncate">Shortify</span> : null}
          </Link>
          <Button
            variant="ghost"
            className="h-9 w-9 shrink-0 px-0"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="space-y-1">
          {nav
            .filter((item) => item.href !== "/admin" || user?.role === "admin")
            .map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
                  } ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
        </nav>
      </aside>

      <div
        className={`transition-[padding] duration-200 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-[var(--muted)]">Workspace</p>
              <h1 className="truncate text-lg font-semibold">
                {user?.name ?? "Shortify"}
              </h1>
            </div>
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => {
                dispatch(clearSession());
                router.push("/auth/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav
              .filter((item) => item.href !== "/admin" || user?.role === "admin")
              .map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
