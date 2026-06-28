import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, AuthPayload, User } from "./types";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem("shortify.accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<null>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isLoginRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/admin/login");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isLoginRequest ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("shortify.refreshToken");
    const rawUser = localStorage.getItem("shortify.user");
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;

    if (!refreshToken || !user?.id) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const { data } = await axios.post<ApiResponse<AuthPayload>>(
        `${api.defaults.baseURL}/auth/refresh`,
        { userId: user.id, refreshToken },
        { withCredentials: true },
      );

      localStorage.setItem("shortify.user", JSON.stringify(data.data.user));
      localStorage.setItem("shortify.accessToken", data.data.accessToken);
      localStorage.setItem("shortify.refreshToken", data.data.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("shortify.user");
      localStorage.removeItem("shortify.accessToken");
      localStorage.removeItem("shortify.refreshToken");
      return Promise.reject(refreshError);
    }
  },
);

export function getApiMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<null>>(error)) {
    const message = error.response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message ?? error.message;
  }

  return "Something went wrong. Please try again.";
}
