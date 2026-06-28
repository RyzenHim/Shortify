"use client";

import { hydrateSession } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    dispatch(hydrateSession());
  }, [dispatch]);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("shortify.accessToken")
        : null;

    if (!token && !storedToken) {
      router.push("/auth/login");
    }
  }, [token, router]);

  if (!token && typeof window !== "undefined" && !localStorage.getItem("shortify.accessToken")) {
    return null;
  }

  return <>{children}</>;
}
