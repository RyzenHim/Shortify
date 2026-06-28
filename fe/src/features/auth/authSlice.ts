import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthPayload, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateSession(state) {
      if (typeof window === "undefined") {
        return;
      }

      const rawUser = localStorage.getItem("shortify.user");
      state.user = rawUser ? (JSON.parse(rawUser) as User) : null;
      state.accessToken = localStorage.getItem("shortify.accessToken");
      state.refreshToken = localStorage.getItem("shortify.refreshToken");
    },
    setSession(state, action: PayloadAction<AuthPayload>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      localStorage.setItem("shortify.user", JSON.stringify(action.payload.user));
      localStorage.setItem("shortify.accessToken", action.payload.accessToken);
      localStorage.setItem("shortify.refreshToken", action.payload.refreshToken);
      localStorage.setItem("shortify.theme", action.payload.user.theme ?? "dark");
      localStorage.setItem(
        "shortify.accentColor",
        action.payload.user.accentColor ?? "teal",
      );
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem("shortify.user", JSON.stringify(action.payload));
      localStorage.setItem("shortify.theme", action.payload.theme ?? "dark");
      localStorage.setItem(
        "shortify.accentColor",
        action.payload.accentColor ?? "teal",
      );
    },
    clearSession(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("shortify.user");
      localStorage.removeItem("shortify.accessToken");
      localStorage.removeItem("shortify.refreshToken");
    },
  },
});

export const { hydrateSession, setSession, updateUser, clearSession } =
  authSlice.actions;
export default authSlice.reducer;
