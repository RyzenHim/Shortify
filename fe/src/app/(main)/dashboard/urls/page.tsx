"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Pencil, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { destinationUrlField, normalizeUrlInput } from "@/lib/urlValidation";
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

const schema = z.object({
  originalUrl: destinationUrlField,
  title: z.string(),
  customCode: z.string(),
});

const editSchema = z.object({
  originalUrl: destinationUrlField,
  title: z.string(),
  isActive: z.boolean(),
  resetClicks: z.boolean(),
});

type UrlForm = z.infer<typeof schema>;
type EditUrlForm = z.infer<typeof editSchema>;

export default function UrlManagementPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "clicks-desc" | "clicks-asc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [formKey, setFormKey] = useState(0);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<ShortUrl | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<UrlForm>({
    resolver: zodResolver(schema),
    defaultValues: { originalUrl: "", title: "", customCode: "" },
  });
  const editForm = useForm<EditUrlForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      originalUrl: "",
      title: "",
      isActive: true,
      resetClicks: false,
    },
  });

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
      if (sortBy === "clicks-desc") {
        return b.clicks - a.clicks;
      }
      if (sortBy === "clicks-asc") {
        return a.clicks - b.clicks;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.items, query, status, sortBy]);

  const paginatedUrls = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return sortedAndFilteredUrls.slice(start, start + 10);
  }, [sortedAndFilteredUrls, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredUrls.length / 10);

  const createMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: (createdUrl) => {
      queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
        if (!current) {
          return {
            items: [createdUrl],
            page: 1,
            limit: 20,
            total: 1,
          };
        }

        return {
          ...current,
          items: [createdUrl, ...current.items],
          total: current.total + 1,
        };
      });

      // Increment formKey to completely discard old DOM inputs and errors
      setFormKey((prev) => prev + 1);
      form.reset({ originalUrl: "", title: "", customCode: "" }, { keepErrors: false });

      queryClient.invalidateQueries({ queryKey: ["urls"] });
      toast.success("Short URL created");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<PaginatedUrls>(["urls"], (current) => {
        if (!current) {
          return current;
        }

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
        if (!current) {
          return current;
        }

        return {
          ...current,
          items: current.items.map((url) =>
            url.id === updatedUrl.id ? updatedUrl : url,
          ),
        };
      });
      setEditingUrl(null);
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      toast.success("URL updated");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="h-fit rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-xl font-bold">Create URL</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Generate a saved link. Custom aliases are available here after login.
        </p>
        <form
          key={formKey}
          className="mt-5 space-y-4"
          onSubmit={form.handleSubmit((data) => {
            const payload = {
              originalUrl: normalizeUrlInput(data.originalUrl),
              ...(data.title?.trim() ? { title: data.title.trim() } : {}),
              ...(data.customCode?.trim()
                ? { customCode: data.customCode.trim() }
                : {}),
            };

            createMutation.mutate(payload);
          })}
        >
          <Input
            label="Destination URL"
            placeholder="https://example.com"
            error={form.formState.errors.originalUrl?.message}
            {...form.register("originalUrl")}
          />
          <Input
            label="Title"
            placeholder="Launch campaign"
            {...form.register("title")}
          />
          <div className="space-y-1.5">
            <Input
              label="Custom alias"
              placeholder="launch-2026"
              {...form.register("customCode")}
            />
            <p className="text-xs text-[var(--muted)]">
              Without an alias, a random link will be generated automatically.
            </p>
          </div>
          <Button className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create short URL"}
          </Button>
        </form>
      </section>

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
                    setStatus(event.target.value as "all" | "active" | "inactive");
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
                    setSortBy(event.target.value as "newest" | "clicks-desc" | "clicks-asc");
                    setCurrentPage(1);
                  }}
                  className="h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="newest">Newest First</option>
                  <option value="clicks-desc">Clicks (High to Low)</option>
                  <option value="clicks-asc">Clicks (Low to High)</option>
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
                          Shorted URL:
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
                          <span className="font-semibold text-[var(--foreground)]">{url.clicks} clicks</span>
                          <span>·</span>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              url.isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500"
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
                        title="Visit Short URL"
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
              Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * 10, sortedAndFilteredUrls.length)}
              </span>{" "}
              of <span className="font-medium">{sortedAndFilteredUrls.length}</span> results
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

      {editingUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 px-4 py-6">
          <form
            className="w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl"
            onSubmit={editForm.handleSubmit((values) =>
              updateMutation.mutate({
                id: editingUrl.id,
                // ✅ normalizeUrlInput called here instead of z.preprocess
                originalUrl: normalizeUrlInput(values.originalUrl),
                ...(values.title?.trim() ? { title: values.title.trim() } : {}),
                isActive: values.isActive,
                resetClicks: values.resetClicks,
              }),
            )}
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
              <Input
                label="Destination URL"
                error={editForm.formState.errors.originalUrl?.message}
                {...editForm.register("originalUrl")}
              />
              <Input label="Title" {...editForm.register("title")} />
              <label className="flex items-start gap-3 rounded-md border border-[var(--line)] p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  {...editForm.register("isActive")}
                />
                <span>
                  <span className="block font-medium">Active short link</span>
                  <span className="text-[var(--muted)]">
                    Inactive links remain saved but will no longer redirect.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-[var(--line)] p-3 text-sm">
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
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {deletingUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Delete short URL?</h3>
                <p className="text-sm text-[var(--muted)]">
                  This action removes the saved link from your account.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingUrl(null)}
                aria-label="Close delete confirmation"
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
                {deleteMutation.isPending ? "Deleting..." : "Delete URL"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
