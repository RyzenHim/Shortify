"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-[var(--accent)]">500</p>
        <h1 className="mt-2 text-4xl font-bold">Something broke</h1>
        <p className="mt-3 max-w-md text-[var(--muted)]">
          The page could not be rendered. Try again in a moment.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
