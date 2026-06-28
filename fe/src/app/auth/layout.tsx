"use client";
import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  PencilLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { GoogleIcon } from "@/components/ui/BrandIcons";

const benefits = [
  { icon: Link2, label: "Save every short link" },
  { icon: PencilLine, label: "Edit and delete links" },
  { icon: Sparkles, label: "Create custom aliases" },
  { icon: ShieldCheck, label: "Access from any device" },
];

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-center border-r border-[var(--line)] p-12 md:flex">
          <Link href="/" className="mb-6 inline-flex text-4xl font-bold">
            Shortify
          </Link>

          <p className="text-lg leading-relaxed text-[var(--muted)]">
            You can shorten a URL without signing in. Create an account when
            you want a persistent workspace for the links that matter.
          </p>

          <div className="mt-10 grid gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.label}
                  className="flex items-center gap-3 rounded-md border border-[var(--line)] p-3 text-sm"
                >
                  <Icon className="h-4 w-4 text-teal-600" />
                  <span>{benefit.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center md:hidden">
              <h1 className="text-4xl font-bold">Shortify</h1>

              <p className="mt-2 text-[var(--muted)]">Smart URL Shortener</p>
            </div>

            <div className="rounded-lg border border-[var(--line)] p-6">
              <Link
                href="/"
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Home
              </Link>
              {children}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--line)]" />
                <span className="text-sm text-[var(--muted)]">OR</span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <div className="grid gap-3">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"}/auth/google`}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[var(--line)] text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <GoogleIcon />
                  Continue with Google
                </a>
              </div>

              <div className="mt-5 grid gap-2 md:hidden">
                {benefits.slice(0, 3).map((benefit) => (
                  <div
                    key={benefit.label}
                    className="rounded-md bg-black/5 px-3 py-2 text-xs text-[var(--muted)] dark:bg-white/5"
                  >
                    {benefit.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
