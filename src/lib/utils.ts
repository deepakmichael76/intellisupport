import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Turn API error payloads (string or Zod flatten object) into a user-visible message */
export function getApiErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;

  const err = error as {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
    message?: string;
  };

  if (err.message) return err.message;

  const form = err.formErrors?.filter(Boolean) ?? [];
  const fields = err.fieldErrors
    ? Object.entries(err.fieldErrors).flatMap(([key, msgs]) =>
        (msgs ?? []).map((m) => `${key}: ${m}`)
      )
    : [];

  const combined = [...form, ...fields];
  return combined.length > 0 ? combined.join(". ") : fallback;
}
