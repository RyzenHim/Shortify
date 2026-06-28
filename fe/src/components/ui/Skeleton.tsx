import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-black/10 dark:bg-white/10",
        className,
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
      <Skeleton className="mb-4 h-5 w-5" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-full max-w-xl" />
        <Skeleton className="h-3 w-52" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
      </div>
    </div>
  );
}
