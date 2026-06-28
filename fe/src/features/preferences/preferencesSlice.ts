import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AccentColor, ThemeMode, User } from "@/lib/types";

interface PreferencesState {
  theme: ThemeMode;
  accentColor: AccentColor;
}

const initialState: PreferencesState = {
  theme: "dark",
  accentColor: "teal",
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    hydratePreferences(state) {
      if (typeof window === "undefined") {
        return;
      }

      const rawUser = localStorage.getItem("shortify.user");
      const user = rawUser ? (JSON.parse(rawUser) as User) : null;
      const storedTheme = localStorage.getItem("shortify.theme") as ThemeMode | null;
      const storedAccent = localStorage.getItem(
        "shortify.accentColor",
      ) as AccentColor | null;

      state.theme = user?.theme ?? storedTheme ?? "dark";
      state.accentColor = user?.accentColor ?? storedAccent ?? "teal";
    },
    setPreferences(state, action: PayloadAction<PreferencesState>) {
      state.theme = action.payload.theme;
      state.accentColor = action.payload.accentColor;

      if (typeof window !== "undefined") {
        localStorage.setItem("shortify.theme", action.payload.theme);
        localStorage.setItem("shortify.accentColor", action.payload.accentColor);
      }
    },
    setPreferencesFromUser(state, action: PayloadAction<User>) {
      state.theme = action.payload.theme ?? "dark";
      state.accentColor = action.payload.accentColor ?? "teal";

      if (typeof window !== "undefined") {
        localStorage.setItem("shortify.theme", state.theme);
        localStorage.setItem("shortify.accentColor", state.accentColor);
      }
    },
  },
});

export const { hydratePreferences, setPreferences, setPreferencesFromUser } =
  preferencesSlice.actions;
export default preferencesSlice.reducer;
