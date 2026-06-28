"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Activity, Copy, Link2, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getUrls } from "@/features/urls/urlApi";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/Button";
import { ListRowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";

export default function DashBoardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["urls"], queryFn: getUrls });
  const user = useAppSelector((state) => state.auth.user);
  const urls = data?.items ?? [];
  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-teal-600">Welcome back</p>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-[var(--muted)]">
            {user?.name
              ? `${user.name}, monitor and manage your short links.`
              : "Monitor and manage your short links."}
          </p>
        </div>
        <Link
          href="/dashboard/urls"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          New URL
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          : [
              { label: "Total URLs", value: data?.total ?? 0, icon: Link2 },
              { label: "Total Clicks", value: totalClicks, icon: Activity },
              {
                label: "Active Links",
                value: urls.filter((url) => url.isActive).length,
                icon: TrendingUp,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5"
                >
                  <Icon className="mb-4 h-5 w-5 text-teal-600" />
                  <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
              );
            })}
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold">Recent URLs</h3>
            <p className="text-sm text-[var(--muted)]">
              Your latest saved links with quick actions.
            </p>
          </div>
          <Link
            href="/dashboard/urls"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ListRowSkeleton key={index} />
              ))
            : urls.slice(0, 5).map((url) => (
            <div key={url.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{url.title ?? url.shortCode}</p>
                <p className="truncate text-sm text-[var(--muted)]">{url.originalUrl}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--muted)]">{url.clicks} clicks</span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(url.shortUrl);
                    toast.success("Copied");
                  }}
                  aria-label="Copy short URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && urls.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">
              No URLs yet. Create your first short link from URL Management.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
