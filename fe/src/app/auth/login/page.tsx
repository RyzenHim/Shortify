"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login } from "@/features/auth/authApi";
import { setSession } from "@/features/auth/authSlice";
import { getApiMessage } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const form = useForm<LoginForm>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      dispatch(setSession(payload));
      toast.success("Welcome back");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>

      <p className="mb-5 text-sm text-[var(--muted)]">
        Login to continue using Shortify.
      </p>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Password</span>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            label=""
            type="password"
            placeholder="Enter your password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Signing in..." : "Login"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
