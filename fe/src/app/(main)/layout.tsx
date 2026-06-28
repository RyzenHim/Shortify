"use client";

import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWorkspaceRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <>
      {!isWorkspaceRoute ? <Navbar /> : null}
      {children}
    </>
  );
}
