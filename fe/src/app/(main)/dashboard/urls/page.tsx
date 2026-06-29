"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { destinationUrlField } from "@/lib/urlValidation";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import {
  createUrl,
  deleteUrl,
  getUrls,
  updateUrl,
} from "@/features/urls/urlApi";
import { getApiMessage } from "@/lib/api";
import type { PaginatedUrls, ShortUrl } from "@/lib/types";

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
  const filteredUrls = useMemo(() => {
    const urls = data?.items ?? [];
    return urls.filter((url) => {
      const text =
        `${url.title ?? ""} ${url.shortCode} ${url.originalUrl}`.toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ||
        (status === "active" && url.isActive) ||
        (status === "inactive" && !url.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [data?.items, query, status]);
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

      const createdOriginalUrl = form.getValues("originalUrl");

      // ✅ Fix: reset() with keepErrors: false clears all field errors cleanly.
      // Previously, selective clearErrors() calls after reset() left originalUrl
      // in a touched+validated state, causing "Enter a valid URL" to fire
      // immediately when the user started typing a new URL.
      form.reset(
        { originalUrl: createdOriginalUrl, title: "", customCode: "" },
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
          className="mt-5 space-y-4"
          onSubmit={form.handleSubmit((data) => {
            const payload = {
              originalUrl: data.originalUrl,
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
          <Input
            label="Custom alias"
            placeholder="launch-2026"
            {...form.register("customCode")}
          />
          <Button className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create short URL"}
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search links"
                className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | "active" | "inactive")
              }
              className="h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All links</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <ListRowSkeleton key={index} />
              ))
            : filteredUrls.map((url) => (
                <div
                  key={url.id}
                  className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {url.title ?? url.shortCode}
                    </p>
                    <p className="truncate text-sm text-[var(--accent)]">
                      {url.shortUrl}
                    </p>
                    <p className="truncate text-sm text-[var(--muted)]">
                      {url.originalUrl}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {url.clicks} clicks ·{" "}
                      {url.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeletingUrl(url)}
                      aria-label="Delete URL"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          {!isLoading && !filteredUrls.length ? (
            <div className="p-10 text-center text-sm text-[var(--muted)]">
              No links match this view.
            </div>
          ) : null}
        </div>
      </section>

      {editingUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 px-4 py-6">
          <form
            className="w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl"
            onSubmit={editForm.handleSubmit((values) =>
              updateMutation.mutate({
                id: editingUrl.id,
                originalUrl: values.originalUrl,
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
