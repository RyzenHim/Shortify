import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <p className="text-sm font-semibold text-teal-600">404</p>
      <h1 className="mt-2 text-5xl font-extrabold">Link not found</h1>

      <p className="mt-3 max-w-md text-[var(--muted)]">
        The short link you&apos;re looking for doesn&apos;t exist or may have expired.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-md bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700"
      >
        Back to Shortify
      </Link>
    </div>
  );
}
