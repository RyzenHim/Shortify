import { api } from "@/lib/api";
import type { ApiResponse, PaginatedUrls, ShortUrl } from "@/lib/types";

export interface CreateUrlInput {
  originalUrl: string;
  title?: string;
  customCode?: string;
}

export interface UpdateUrlInput {
  id: string;
  originalUrl?: string;
  title?: string;
  isActive?: boolean;
  resetClicks?: boolean;
}

export async function getUrls() {
  const { data } = await api.get<ApiResponse<PaginatedUrls>>("/urls?limit=1000");
  return data.data;
}

export async function createUrl(input: CreateUrlInput) {
  const { data } = await api.post<ApiResponse<ShortUrl>>("/urls", input);
  return data.data;
}

export async function createGuestUrl(input: Pick<CreateUrlInput, "originalUrl">) {
  const { data } = await api.post<ApiResponse<ShortUrl>>(
    "/public/urls",
    input,
  );
  return data.data;
}

export async function updateUrl({ id, ...input }: UpdateUrlInput) {
  const { data } = await api.patch<ApiResponse<ShortUrl>>(`/urls/${id}`, input);
  return data.data;
}

export async function deleteUrl(id: string) {
  await api.delete<ApiResponse<null>>(`/urls/${id}`);
}
