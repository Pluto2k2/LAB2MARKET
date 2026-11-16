import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { getCurrentUser } from "@/lib/session";
import { login } from "../auth-actions";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl font-bold text-navy">Log in</h1>
      <ActionForm action={login} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-sm text-slate">
        No account yet? <Link href="/signup" className="link">Create one</Link>
      </p>
    </div>
  );
}
