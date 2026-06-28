"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Moon, Palette, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { updatePreferences } from "@/features/auth/authApi";
import { updateUser } from "@/features/auth/authSlice";
import { setPreferences } from "@/features/preferences/preferencesSlice";
import { getApiMessage } from "@/lib/api";
import type { AccentColor, ThemeMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const themes: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const accents: Array<{
  value: AccentColor;
  label: string;
  swatch: string;
}> = [
  { value: "teal", label: "Teal", swatch: "#0f766e" },
  { value: "blue", label: "Blue", swatch: "#2563eb" },
  { value: "violet", label: "Violet", swatch: "#7c3aed" },
  { value: "rose", label: "Rose", swatch: "#e11d48" },
  { value: "amber", label: "Amber", swatch: "#b45309" },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);
  const user = useAppSelector((state) => state.auth.user);
  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (updatedUser) => {
      dispatch(updateUser(updatedUser));
      dispatch(
        setPreferences({
          theme: updatedUser.theme ?? "dark",
          accentColor: updatedUser.accentColor ?? "teal",
        }),
      );
      toast.success("Preferences saved");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const savePreferences = (next: {
    theme?: ThemeMode;
    accentColor?: AccentColor;
  }) => {
    const payload = {
      theme: next.theme ?? preferences.theme,
      accentColor: next.accentColor ?? preferences.accentColor,
    };

    dispatch(setPreferences(payload));
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-[var(--muted)]">
          Personalize your Shortify workspace. Preferences are saved to your
          account and restored when you log in.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="mb-5 flex items-start gap-4">
          <Palette className="mt-1 h-5 w-5 text-[var(--accent)]" />
          <div>
            <h3 className="font-semibold">Appearance</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose a light or dark interface and an accent color for buttons,
              links, active states, and focus rings.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">Theme</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {themes.map((theme) => {
                const Icon = theme.icon;
                const active = preferences.theme === theme.value;
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => savePreferences({ theme: theme.value })}
                    className={`flex h-14 items-center justify-between rounded-md border px-4 text-left text-sm font-semibold ${
                      active
                        ? "border-[var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-[var(--accent)]" />
                      {theme.label}
                    </span>
                    {active ? <Check className="h-4 w-4 text-[var(--accent)]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Accent color</p>
            <div className="grid gap-3 sm:grid-cols-5">
              {accents.map((accent) => {
                const active = preferences.accentColor === accent.value;
                return (
                  <button
                    key={accent.value}
                    type="button"
                    onClick={() =>
                      savePreferences({ accentColor: accent.value })
                    }
                    className={`flex h-20 flex-col items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                      active
                        ? "border-[var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full"
                      style={{ backgroundColor: accent.swatch }}
                    >
                      {active ? <Check className="h-4 w-4 text-white" /> : null}
                    </span>
                    {accent.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="flex gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
        <ShieldCheck className="mt-1 h-5 w-5 text-[var(--accent)]" />
        <div>
          <h3 className="font-semibold">Account sync</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Signed in as {user?.email ?? "your account"}. Changes are applied
            immediately and stored on your profile.
          </p>
          {mutation.isPending ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Saving...</p>
          ) : null}
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() =>
              savePreferences({
                theme: preferences.theme,
                accentColor: preferences.accentColor,
              })
            }
            disabled={mutation.isPending}
          >
            Save current preferences
          </Button>
        </div>
      </section>
    </div>
  );
}
