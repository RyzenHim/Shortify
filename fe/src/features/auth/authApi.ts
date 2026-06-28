import { api } from "@/lib/api";
import type {
  AccentColor,
  ApiResponse,
  AuthPayload,
  ThemeMode,
  User,
} from "@/lib/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export async function login(input: LoginInput) {
  const { data } = await api.post<ApiResponse<AuthPayload>>("/auth/login", input);
  return data.data;
}

export async function adminLogin(input: LoginInput) {
  const { data } = await api.post<ApiResponse<AuthPayload>>(
    "/auth/admin/login",
    input,
  );
  return data.data;
}

export async function register(input: RegisterInput) {
  const { data } = await api.post<ApiResponse<AuthPayload>>(
    "/auth/register",
    input,
  );
  return data.data;
}

export async function updateProfile(input: { name: string }) {
  const { data } = await api.patch<ApiResponse<User>>("/auth/profile", input);
  return data.data;
}

export async function updatePreferences(input: {
  theme: ThemeMode;
  accentColor: AccentColor;
}) {
  const { data } = await api.patch<ApiResponse<User>>(
    "/auth/preferences",
    input,
  );
  return data.data;
}
