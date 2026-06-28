"use client";

import { useEffect } from "react";
import {
  hydratePreferences,
  setPreferencesFromUser,
} from "@/features/preferences/preferencesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function ThemeController() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { theme, accentColor } = useAppSelector((state) => state.preferences);

  useEffect(() => {
    dispatch(hydratePreferences());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(setPreferencesFromUser(user));
    }
  }, [dispatch, user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accentColor;
    document.documentElement.style.colorScheme = theme;
  }, [accentColor, theme]);

  return null;
}
