"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import type { FormState } from "@/lib/forms";

const FormCtx = createContext<{ state: FormState; pending: boolean }>({ state: {}, pending: false });

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * A form bound to a server action. Shows errors and success messages.
 * It submits through a transition instead of the native form action, so React does not
 * clear what the user typed when the server returns a validation error.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className={className} noValidate aria-busy={pending}>
      <FormCtx.Provider value={{ state, pending }}>
        {children}
        {state.error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-navy">
            <span aria-hidden="true">⚠ </span>
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p role="status" className="mt-3 text-sm font-medium text-teal">
            {state.ok}
          </p>
        ) : null}
      </FormCtx.Provider>
    </form>
  );
}

export function FieldError({ name }: { name: string }) {
  const { state } = useContext(FormCtx);
  const msg = state.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs font-medium text-navy" id={`${name}-error`}>
      {msg}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useContext(FormCtx);
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}
