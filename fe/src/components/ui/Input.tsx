import { clsx } from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--foreground)]">
        {label}
      </span>
      <input
        id={inputId}
        className={clsx(
          "h-11 w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
