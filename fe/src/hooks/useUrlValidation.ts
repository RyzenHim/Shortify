import { useCallback, useEffect, useRef, useState } from "react";
import { validateUrlStrict } from "@/lib/urlValidation";

export type UrlValidationState =
  | { status: "idle" }
  | { status: "typing" }
  | { status: "validating" }
  | { status: "valid"; normalizedUrl: string }
  | { status: "invalid"; message: string };

/**
 * Debounced, stateful URL validation for free-standing inputs (i.e. ones not
 * wired through react-hook-form + Zod, like the homepage's guest shortener).
 *
 * Delegates every actual validation decision to `validateUrlStrict` from
 * `@/lib/urlValidation` — the same function the Zod schemas use — so this
 * hook and the authenticated forms can never disagree on what counts as a
 * valid URL. There is exactly one validator in the codebase; this hook is
 * just a different way of driving it for inputs outside react-hook-form.
 */
export function useUrlValidation(debounceMs = 350) {
  const [inputValue, setInputValue] = useState("");
  const [state, setState] = useState<UrlValidationState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setState({ status: "idle" });
        return;
      }

      setState({ status: "typing" });

      debounceRef.current = setTimeout(() => {
        setState({ status: "validating" });
        // Tiny artificial delay so "validating" state is perceptible on fast machines
        requestAnimationFrame(() => {
          const result = validateUrlStrict(value);
          if (result.ok) {
            setState({ status: "valid", normalizedUrl: result.url });
          } else {
            setState({ status: "invalid", message: result.message });
          }
        });
      }, debounceMs);
    },
    [debounceMs],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setInputValue(value);
      validate(value);
    },
    [validate],
  );

  const reset = useCallback(() => {
    setInputValue("");
    setState({ status: "idle" });
  }, []);

  /** Returns the normalized URL if currently valid, otherwise null. Falls
   *  back to a synchronous validation pass if the debounce hasn't settled
   *  yet — used when the caller needs an immediate answer (e.g. submit). */
  const getNormalizedUrl = useCallback((): string | null => {
    if (state.status === "valid") return state.normalizedUrl;
    const result = validateUrlStrict(inputValue);
    return result.ok ? result.url : null;
  }, [state, inputValue]);

  /** Force-validates synchronously and updates state — call this on form
   *  submit so a pending debounce can't let an invalid URL through. */
  const forceValidate = useCallback((): string | null => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const result = validateUrlStrict(inputValue);
    if (result.ok) {
      setState({ status: "valid", normalizedUrl: result.url });
      return result.url;
    } else {
      setState({ status: "invalid", message: result.message });
      return null;
    }
  }, [inputValue]);

  return {
    inputValue,
    state,
    onChange,
    reset,
    getNormalizedUrl,
    forceValidate,
    setInputValue,
  };
}
