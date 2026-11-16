import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { FIELDS, TRL_LABELS } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { createChallenge } from "../actions";

export const metadata = { title: "Post a challenge" };

export default async function NewChallengePage() {
  await requireUser("COMPANY");
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">New challenge</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy">Describe the problem you need solved</h1>
      <p className="mt-2 text-sm text-slate">Researchers see this publicly. Do not include confidential information.</p>
      <ActionForm action={createChallenge} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input className="input" id="title" name="title" placeholder="Biological alternative to chemical fungicides for wheat" required />
          <FieldError name="title" />
        </div>
        <div>
          <label className="label" htmlFor="description">The problem</label>
          <textarea className="input min-h-36" id="description" name="description" required placeholder="What happens today, why it is a problem, what a good solution must do, constraints." />
          <FieldError name="description" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="field">Field</label>
            <select className="input" id="field" name="field" defaultValue="" required>
              <option value="" disabled>Choose a field</option>
              {FIELDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <FieldError name="field" />
          </div>
          <div>
            <label className="label" htmlFor="minTrl">Minimum TRL <span className="font-normal text-slate">(optional)</span></label>
            <select className="input" id="minTrl" name="minTrl" defaultValue="">
              <option value="">Any stage</option>
              {TRL_LABELS.map((l, i) => (
                <option key={l} value={i + 1}>TRL {i + 1}: {l}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="keywords">Keywords</label>
            <input className="input" id="keywords" name="keywords" placeholder="biocontrol, fungicide alternative, cereals" />
            <p className="hint">Separate with commas. Used to match researchers&apos; projects.</p>
            <FieldError name="keywords" />
          </div>
          <div>
            <label className="label" htmlFor="deadline">Deadline <span className="font-normal text-slate">(optional)</span></label>
            <input className="input" id="deadline" name="deadline" type="date" min={tomorrow} />
            <FieldError name="deadline" />
          </div>
        </div>
        <SubmitButton pendingText="Publishing…">Publish challenge</SubmitButton>
      </ActionForm>
    </div>
  );
}
