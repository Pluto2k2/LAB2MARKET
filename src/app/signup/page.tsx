import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { getCurrentUser } from "@/lib/session";
import { signup } from "../auth-actions";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  const defaultRole = role === "COMPANY" ? "COMPANY" : "RESEARCHER";
  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl font-bold text-navy">Create your account</h1>
      <ActionForm action={signup} className="card mt-6 space-y-4">
        <fieldset>
          <legend className="label">I am</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "RESEARCHER", l: "A researcher" },
              { v: "COMPANY", l: "A company" },
            ].map((o) => (
              <label
                key={o.v}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal-soft"
              >
                <input type="radio" name="role" value={o.v} defaultChecked={o.v === defaultRole} className="accent-teal" />
                {o.l}
              </label>
            ))}
          </div>
          <FieldError name="role" />
        </fieldset>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" autoComplete="name" required />
          <FieldError name="name" />
        </div>
        <div>
          <label className="label" htmlFor="organization">Organisation</label>
          <input className="input" id="organization" name="organization" autoComplete="organization" placeholder="University, lab or company" />
          <p className="hint">Required for companies.</p>
          <FieldError name="organization" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
          <FieldError name="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="hint">At least 8 characters.</p>
          <FieldError name="password" />
        </div>
        <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-sm text-slate">
        Already registered? <Link href="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}
