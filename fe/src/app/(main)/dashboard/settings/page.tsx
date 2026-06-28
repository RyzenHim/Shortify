"use client";

import { Bell, Moon, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-[var(--muted)]">
          Workspace preferences for your Shortify dashboard.
        </p>
      </div>

      {[
        {
          icon: Moon,
          title: "Theme",
          description: "Shortify follows your system light or dark preference.",
        },
        {
          icon: Bell,
          title: "Notifications",
          description: "Product notifications are ready for future delivery channels.",
        },
        {
          icon: ShieldCheck,
          title: "Security",
          description: "Access tokens are attached to API requests through the Axios client.",
        },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <section
            key={item.title}
            className="flex gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5"
          >
            <Icon className="mt-1 h-5 w-5 text-teal-600" />
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
