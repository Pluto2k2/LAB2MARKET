import type { ZodError } from "zod";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: string;
};

export const initialFormState: FormState = {};

export function fromZod(err: ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
