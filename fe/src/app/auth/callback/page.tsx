"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { setSession } from "@/features/auth/authSlice";
import type { User } from "@/lib/types";
import { useAppDispatch } from "@/store/hooks";

export default function AuthCallbackPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const rawUser = params.get("user");

    if (!accessToken || !refreshToken || !rawUser) {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/auth/login");
      return;
    }

    try {
      const user = JSON.parse(rawUser) as User;
      dispatch(setSession({ user, accessToken, refreshToken }));
      toast.success("Signed in with Google");
      router.replace("/dashboard");
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/auth/login");
    }
  }, [dispatch, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-teal-600" />
        <h1 className="text-xl font-semibold">Completing Google sign-in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          You will be redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}
