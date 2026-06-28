export type Role = "user" | "admin";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  provider?: "local" | "google";
  isActive?: boolean;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string;
  clicks: number;
  isActive: boolean;
  isGuest?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUrls {
  items: ShortUrl[];
  page: number;
  limit: number;
  total: number;
}
