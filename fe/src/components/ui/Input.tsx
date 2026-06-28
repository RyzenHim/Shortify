import { clsx } from "clsx";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--foreground)]">
        {label}
      </span>
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "h-11 w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-ring)]",
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
});
