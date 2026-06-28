"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Pencil, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/features/auth/authApi";
import { updateUser } from "@/features/auth/authSlice";
import { getApiMessage } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const profileSchema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      dispatch(updateUser(updatedUser));
      setIsEditing(false);
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  useEffect(() => {
    form.reset({ name: user?.name ?? "" });
  }, [form, user?.name]);

  return (
    <>
      <div className="max-w-3xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-[var(--accent)] text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Profile</h2>
              <p className="text-sm text-[var(--muted)]">
                Your Shortify account details.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-[var(--line)] p-4">
            <dt className="text-sm text-[var(--muted)]">Name</dt>
            <dd className="mt-1 font-semibold">
              {user?.name ?? "Not available"}
            </dd>
          </div>
          <div className="rounded-md border border-[var(--line)] p-4">
            <dt className="text-sm text-[var(--muted)]">Email</dt>
            <dd className="mt-1 font-semibold">
              {user?.email ?? "Not available"}
            </dd>
          </div>
          <div className="rounded-md border border-[var(--line)] p-4">
            <dt className="text-sm text-[var(--muted)]">Role</dt>
            <dd className="mt-1 font-semibold capitalize">
              {user?.role ?? "user"}
            </dd>
          </div>
          <div className="rounded-md border border-[var(--line)] p-4">
            <dt className="text-sm text-[var(--muted)]">Provider</dt>
            <dd className="mt-1 font-semibold capitalize">
              {user?.provider ?? "local"}
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-[var(--muted)]">
          Email and role are protected account fields and cannot be edited from
          this screen.
        </p>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
          <form
            className="w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Edit profile</h3>
                <p className="text-sm text-[var(--muted)]">
                  Update your display name.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                aria-label="Close profile editor"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <Input
                label="Name"
                error={form.formState.errors.name?.message}
                {...form.register("name")}
              />
              <Input label="Email" value={user?.email ?? ""} readOnly />
              <Input label="Role" value={user?.role ?? "user"} readOnly />
              <Button className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
