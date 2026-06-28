"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-600 text-white">
            S
          </span>
          Shortify
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5 sm:flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
