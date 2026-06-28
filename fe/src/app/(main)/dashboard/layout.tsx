"use client";

import ProtectedRoute from "@/app/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
