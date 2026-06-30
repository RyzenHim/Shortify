"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Copy,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createGuestUrl, createUrl } from "@/features/urls/urlApi";
import { getApiMessage } from "@/lib/api";
import type { PaginatedUrls, ShortUrl } from "@/lib/types";
import { validateUrlStrict } from "@/lib/urlValidation";
import { useAppSelector } from "@/store/hooks";
import { clsx } from "clsx";

export default function Home() {
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shortUrl, setShortUrl] = useState<ShortUrl | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error === "inactive") {
        toast.error("This short URL has been deactivated by its owner.");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else if (error === "notfound") {
        toast.error("The short URL was not found.");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }, []);

  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  function isAuthed() {
    return (
      accessToken ||
      (typeof window !== "undefined" &&
        Boolean(localStorage.getItem("shortify.accessToken")))
    );
  }

  const mutation = useMutation({
    mutationFn: async (input: { originalUrl: string }) => {
      return isAuthed() ? createUrl(input) : createGuestUrl(input);
    },
    onSuccess: (url) => {
      setShortUrl(url);
      setLinkError(null);

      if (isAuthed()) {
        queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
          if (!current) {
            return { items: [url], page: 1, limit: 20, total: 1 };
          }
          return {
            ...current,
            items: [url, ...current.items],
            total: current.total + 1,
          };
        });
        queryClient.invalidateQueries({ queryKey: ["urls"] });
      }
      toast.success(isAuthed() ? "Short URL created" : "Short URL ready");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  // Live validation as the person types, after their first interaction —
  // mirrors the dashboard forms so the rules feel consistent everywhere.
  function handleChange(value: string) {
    setLink(value);
    if (!hasInteracted) return;
    if (!value.trim()) {
      setLinkError(null);
      return;
    }
    const result = validateUrlStrict(value);
    setLinkError(result.ok ? null : result.message);
  }

  function handleBlur() {
    setHasInteracted(true);
    if (!link.trim()) {
      setLinkError(null);
      return;
    }
    const result = validateUrlStrict(link);
    setLinkError(result.ok ? null : result.message);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setHasInteracted(true);

    // Always re-validate synchronously on submit — never trust a debounce
    // or a stale error state to be the last word before hitting the API.
    const result = validateUrlStrict(link);
    if (!result.ok) {
      setLinkError(result.message);
      return;
    }

    setLinkError(null);
    mutation.mutate({ originalUrl: result.url });
  }

  const isValid = hasInteracted && link.trim() !== "" && !linkError;

  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="mb-4 inline-flex rounded-md border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]">
            URL management for focused teams
          </p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-normal text-[var(--foreground)] md:text-7xl">
            Shortify
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Paste any long URL and get a short link instantly. Create an account
            when you are ready to save links, manage aliases, and track
            performance.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#shorten"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Shorten a URL
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--line)] px-5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="glass rounded-lg p-5 shadow-2xl"
          id="shorten"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Create a short link</h2>
              <p className="text-sm text-[var(--muted)]">
                No account required for your first short link.
              </p>
            </div>
            <Link2 className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">
                Destination URL
              </label>
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                value={link}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                placeholder="https://example.com/a/very/long/url"
                className={clsx(
                  "h-10 w-full rounded-md border bg-[var(--background)] px-3 text-sm outline-none transition-colors",
                  linkError
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    : isValid
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      : "border-[var(--line)] focus:border-[var(--accent)]",
                )}
              />
              {linkError ? (
                <p className="text-xs text-rose-500">{linkError}</p>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Paste a full link — http:// and https:// are both fine.
                </p>
              )}
            </div>

            <Button className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Shortening..." : "Shorten URL"}
            </Button>
          </form>

          {shortUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-md border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] p-4"
            >
              <p className="text-sm font-semibold">Your short link is ready</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={shortUrl.shortUrl}
                  className="h-10 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(shortUrl.shortUrl);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Want to save, edit, and track this link? Create a free account.
              </p>
            </motion.div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: CheckCircle2, label: "Instant links" },
              { icon: Copy, label: "Copy without login" },
              { icon: ShieldCheck, label: "Managed when signed in" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-md border border-[var(--line)] p-3 text-sm"
                >
                  <Icon className="mb-2 h-4 w-4 text-amber-600" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]/55">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Frictionless first use",
              copy: "Shorten and copy a link before creating an account.",
            },
            {
              icon: LockKeyhole,
              title: "Upgrade to save",
              copy: "Sign in to store links securely and access them anywhere.",
            },
            {
              icon: BarChart3,
              title: "Manage with confidence",
              copy: "Use history, custom aliases, editing, and basic analytics from the dashboard.",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-lg border border-[var(--line)] bg-[var(--background)] p-5"
              >
                <Icon className="mb-4 h-5 w-5 text-[var(--accent)]" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {feature.copy}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">Why teams choose Shortify</h2>
          <p className="mt-3 text-[var(--muted)]">
            A fast public shortener up front, plus a clean workspace for the
            workflows that deserve authentication.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Guest links stay simple and fast.",
            "Authenticated users get saved history and editing.",
            "Admins can review platform usage and remove abusive links.",
            "The interface stays calm, responsive, and built for repeated use.",
          ].map((item) => (
            <div
              key={item}
              className="flex gap-3 rounded-lg border border-[var(--line)] p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <span className="text-sm text-[var(--muted)]">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
