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
import { register } from "@/features/auth/authApi";
import { setSession } from "@/features/auth/authSlice";
import { getApiMessage } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";

const schema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const form = useForm<RegisterForm>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (payload) => {
      dispatch(setSession(payload));
      toast.success("Account created");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Create account</h1>

      <p className="mb-5 text-sm text-[var(--muted)]">
        Start shortening URLs with Shortify.
      </p>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      >
        <Input
          label="Name"
          placeholder="John Doe"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
