"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Pencil,
  Search,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  normalizeUrlInput,
  createUrlSchema,
  editUrlSchema,
  type CreateUrlForm,
  type EditUrlForm,
} from "@/lib/urlValidation";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import {
  createUrl,
  deleteUrl,
  getUrls,
  updateUrl,
} from "@/features/urls/urlApi";
import { getApiMessage } from "@/lib/api";
import type { PaginatedUrls, ShortUrl } from "@/lib/types";
import { clsx } from "clsx";

// ---------------------------------------------------------------------------
// Small helper: field error + hint row
// ---------------------------------------------------------------------------
function FieldMessage({
  error,
  hint,
}: {
  error?: string;
  hint?: React.ReactNode;
}) {
  if (error) {
    return (
      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-500">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (hint) {
    return <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>;
  }
  return null;
}

// Character counter that turns red when approaching the limit
function CharCount({ current, max }: { current: number; max: number }) {
  const near = current >= max * 0.8;
  const over = current > max;
  return (
    <span
      className={clsx(
        "text-[10px] tabular-nums",
        over
          ? "text-rose-500 font-semibold"
          : near
            ? "text-amber-500"
            : "text-[var(--muted)]",
      )}
    >
      {current}/{max}
    </span>
  );
}

// Controlled input wrapper that adds error border + optional right element
function ValidatedInput({
  label,
  error,
  hint,
  right,
  inputProps,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  right?: React.ReactNode;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">{label}</label>
        {right}
      </div>
      <input
        {...inputProps}
        className={clsx(
          "h-10 w-full rounded-md border bg-[var(--background)] px-3 text-sm outline-none transition-colors",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
            : "border-[var(--line)] focus:border-[var(--accent)]",
        )}
      />
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function UrlManagementPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "clicks-desc" | "clicks-asc">(
    "newest",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [formKey, setFormKey] = useState(0);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<ShortUrl | null>(null);
  const queryClient = useQueryClient();

  // ---- Create form ----
  const form = useForm<CreateUrlForm>({
    resolver: zodResolver(createUrlSchema),
    defaultValues: { originalUrl: "", title: "", customCode: "" },
    mode: "onTouched", // validate on blur, then live on change
  });

  const watchedTitle = form.watch("title") ?? "";
  // ---- Edit form ----
  const editForm = useForm<EditUrlForm>({
    resolver: zodResolver(editUrlSchema),
    defaultValues: {
      originalUrl: "",
      title: "",
      isActive: true,
      resetClicks: false,
    },
    mode: "onTouched",
  });

  const editTitle = editForm.watch("title") ?? "";

  // ---- Data ----
  const { data, isLoading } = useQuery({
    queryKey: ["urls"],
    queryFn: getUrls,
  });

  const sortedAndFilteredUrls = useMemo(() => {
    const urls = data?.items ?? [];
    const filtered = urls.filter((url) => {
      const text =
        `${url.title ?? ""} ${url.shortCode} ${url.originalUrl}`.toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ||
        (status === "active" && url.isActive) ||
        (status === "inactive" && !url.isActive);
      return matchesSearch && matchesStatus;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "clicks-desc") return b.clicks - a.clicks;
      if (sortBy === "clicks-asc") return a.clicks - b.clicks;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.items, query, status, sortBy]);

  const paginatedUrls = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return sortedAndFilteredUrls.slice(start, start + 10);
  }, [sortedAndFilteredUrls, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredUrls.length / 10);

  // ---- Mutations ----
  const createMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: (createdUrl) => {
      queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
        if (!current)
          return { items: [createdUrl], page: 1, limit: 20, total: 1 };
        return {
          ...current,
          items: [createdUrl, ...current.items],
          total: current.total + 1,
        };
      });
      setFormKey((prev) => prev + 1);
      form.reset(
        { originalUrl: "", title: "", customCode: "" },
        { keepErrors: false },
      );
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      toast.success("Short URL created");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.filter((url) => url.id !== deletedId),
          total: Math.max(current.total - 1, 0),
        };
      });
      setDeletingUrl(null);
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      toast.success("URL deleted");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: updateUrl,
    onSuccess: (updatedUrl) => {
      queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((url) =>
            url.id === updatedUrl.id ? updatedUrl : url,
          ),
        };
      });
      setEditingUrl(null);
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      if (!updatedUrl.isActive) {
        toast.info(
          `"${updatedUrl.title ?? updatedUrl.shortCode}" is now inactive.`,
        );
      } else {
        toast.success("URL updated");
      }
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  // ---- Handlers ----
  function handleCreate(data: CreateUrlForm) {
    createMutation.mutate({
      originalUrl: normalizeUrlInput(data.originalUrl),
      ...(data.title?.trim() ? { title: data.title.trim() } : {}),
      ...(data.customCode?.trim()
        ? { customCode: data.customCode.trim() }
        : {}),
    });
  }

  function handleUpdate(values: EditUrlForm) {
    if (!editingUrl) return;
    updateMutation.mutate({
      id: editingUrl.id,
      originalUrl: normalizeUrlInput(values.originalUrl),
      ...(values.title?.trim() ? { title: values.title.trim() } : {}),
      isActive: values.isActive,
      resetClicks: values.resetClicks,
    });
  }

  // ---- Render ----
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {/* ---- Create form panel ---- */}
      <section className="h-fit rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-xl font-bold">Create URL</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Paste any long link and get a short one instantly.
        </p>

        <form
          key={formKey}
          className="mt-5 space-y-4"
          onSubmit={form.handleSubmit(handleCreate)}
          noValidate
        >
          {/* Destination URL */}
          <ValidatedInput
            label="Destination URL"
            error={form.formState.errors.originalUrl?.message}
            hint="Paste a full link — http:// and https:// are both fine."
            inputProps={{
              type: "text",
              inputMode: "url",
              placeholder: "https://example.com/very-long-path",
              autoComplete: "url",
              spellCheck: false,
              ...form.register("originalUrl"),
            }}
          />

          {/* Title — optional, 60 char cap */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                Title{" "}
                <span className="font-normal text-[var(--muted)]">
                  (optional)
                </span>
              </label>
              <CharCount current={watchedTitle.length} max={60} />
            </div>
            <input
              type="text"
              placeholder="Launch campaign"
              maxLength={65} // let Zod surface the error, but cap runaway input
              className={clsx(
                "h-10 w-full rounded-md border bg-[var(--background)] px-3 text-sm outline-none transition-colors",
                form.formState.errors.title
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-[var(--line)] focus:border-[var(--accent)]",
              )}
              {...form.register("title")}
            />
            <FieldMessage error={form.formState.errors.title?.message} />
          </div>

          {/* Custom alias — optional */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Custom alias{" "}
              <span className="font-normal text-[var(--muted)]">
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="launch-2026"
              maxLength={55}
              className={clsx(
                "h-10 w-full rounded-md border bg-[var(--background)] px-3 text-sm outline-none transition-colors font-mono",
                form.formState.errors.customCode
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-[var(--line)] focus:border-[var(--accent)]",
              )}
              {...form.register("customCode")}
            />
            <FieldMessage
              error={form.formState.errors.customCode?.message}
              hint="Letters, numbers, and hyphens only (4–50 chars). Leave blank for a random link."
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? "Creating…" : "Create short URL"}
          </Button>

          {/* Summary error bar — shown when user submits with errors */}
          {Object.keys(form.formState.errors).length > 0 &&
            form.formState.isSubmitted && (
              <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Fix the errors above before creating the link.
              </div>
            )}
        </form>
      </section>

      {/* ---- URL list panel ---- */}
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between">
        <div>
          <div className="space-y-4 border-b border-[var(--line)] p-5">
            <div>
              <h2 className="text-xl font-bold">URL Management</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Search, filter, copy, edit, and delete your saved links.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search links"
                  className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target.value as "all" | "active" | "inactive",
                    );
                    setCurrentPage(1);
                  }}
                  className="h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">All links</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(
                      event.target.value as
                        | "newest"
                        | "clicks-desc"
                        | "clicks-asc",
                    );
                    setCurrentPage(1);
                  }}
                  className="h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="newest">Newest first</option>
                  <option value="clicks-desc">Clicks (high to low)</option>
                  <option value="clicks-asc">Clicks (low to high)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <ListRowSkeleton key={index} />
                ))
              : paginatedUrls.map((url) => (
                  <div
                    key={url.id}
                    className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] w-28 shrink-0">
                          Title:
                        </span>
                        <p className="font-semibold text-sm truncate">
                          {url.title ?? "(No Title)"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] w-28 shrink-0">
                          Short URL:
                        </span>
                        <a
                          href={url.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-medium text-[var(--accent)] hover:underline"
                        >
                          {url.shortUrl}
                        </a>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] w-28 shrink-0">
                          Origin URL:
                        </span>
                        <p className="truncate text-sm text-[var(--muted)]">
                          {url.originalUrl}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] w-28 shrink-0">
                          Clicks / Status:
                        </span>
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--foreground)]">
                            {url.clicks} clicks
                          </span>
                          <span>·</span>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              url.isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500",
                            )}
                          >
                            {url.isActive ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="Visit short URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Visit</span>
                      </a>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(url.shortUrl);
                          toast.success("Copied");
                        }}
                        aria-label="Copy short URL"
                        className="h-9 px-3 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="ml-1.5 hidden sm:inline">Copy</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingUrl(url);
                          editForm.reset({
                            originalUrl: url.originalUrl,
                            title: url.title ?? "",
                            isActive: url.isActive,
                            resetClicks: false,
                          });
                        }}
                        aria-label="Edit URL"
                        className="h-9 px-3"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setDeletingUrl(url)}
                        aria-label="Delete URL"
                        className="h-9 px-3"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            {!isLoading && !sortedAndFilteredUrls.length ? (
              <div className="p-10 text-center text-sm text-[var(--muted)]">
                No links match this view.
              </div>
            ) : null}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--line)] p-5">
            <p className="text-sm text-[var(--muted)]">
              Showing{" "}
              <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * 10, sortedAndFilteredUrls.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {sortedAndFilteredUrls.length}
              </span>{" "}
              results
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="h-9 px-3 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="h-9 px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ---- Edit modal ---- */}
      {editingUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 px-4 py-6">
          <form
            className="w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl"
            onSubmit={editForm.handleSubmit(handleUpdate)}
            noValidate
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Edit URL</h3>
                <p className="text-sm text-[var(--muted)]">
                  Update the destination or display title.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingUrl(null)}
                aria-label="Close editor"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Destination URL */}
              <ValidatedInput
                label="Destination URL"
                error={editForm.formState.errors.originalUrl?.message}
                hint="Full URL including https://"
                inputProps={{
                  type: "text",
                  inputMode: "url",
                  autoComplete: "url",
                  spellCheck: false,
                  ...editForm.register("originalUrl"),
                }}
              />

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none">
                    Title{" "}
                    <span className="font-normal text-[var(--muted)]">
                      (optional)
                    </span>
                  </label>
                  <CharCount current={editTitle.length} max={60} />
                </div>
                <input
                  type="text"
                  maxLength={65}
                  className={clsx(
                    "h-10 w-full rounded-md border bg-[var(--background)] px-3 text-sm outline-none transition-colors",
                    editForm.formState.errors.title
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-[var(--line)] focus:border-[var(--accent)]",
                  )}
                  {...editForm.register("title")}
                />
                <FieldMessage
                  error={editForm.formState.errors.title?.message}
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-start gap-3 rounded-md border border-[var(--line)] p-3 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  {...editForm.register("isActive")}
                />
                <span>
                  <span className="block font-medium">Active short link</span>
                  <span className="text-[var(--muted)]">
                    Inactive links remain saved but won't redirect.
                  </span>
                </span>
              </label>

              {/* Reset clicks */}
              <label className="flex items-start gap-3 rounded-md border border-[var(--line)] p-3 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  {...editForm.register("resetClicks")}
                />
                <span>
                  <span className="block font-medium">Reset click count</span>
                  <span className="text-[var(--muted)]">
                    Current clicks: {editingUrl.clicks}. This will set it to 0.
                  </span>
                </span>
              </label>

              <Button className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>

              {Object.keys(editForm.formState.errors).length > 0 &&
                editForm.formState.isSubmitted && (
                  <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Fix the errors above before saving.
                  </div>
                )}
            </div>
          </form>
        </div>
      ) : null}

      {/* ---- Delete confirm modal ---- */}
      {deletingUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Delete short URL?</h3>
                <p className="text-sm text-[var(--muted)]">
                  This removes the link from your account permanently.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingUrl(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-md border border-[var(--line)] bg-[var(--background)] p-3">
              <p className="truncate font-medium">
                {deletingUrl.title ?? deletingUrl.shortCode}
              </p>
              <p className="truncate text-sm text-[var(--muted)]">
                {deletingUrl.shortUrl}
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingUrl(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingUrl.id)}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete URL"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
