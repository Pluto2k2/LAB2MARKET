import { FieldError } from "./action-form";
import { FIELDS, TRL_LABELS } from "@/lib/constants";

type Defaults = { title?: string; field?: string; summary?: string; keywords?: string[]; trl?: number };

/** Shared inputs for creating and editing a project. */
export function ProjectFields({ d = {} }: { d?: Defaults }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Project title</label>
        <input className="input" id="title" name="title" defaultValue={d.title} maxLength={140} required />
        <FieldError name="title" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="field">Field</label>
          <select className="input" id="field" name="field" defaultValue={d.field ?? ""} required>
            <option value="" disabled>Choose a field</option>
            {FIELDS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <FieldError name="field" />
        </div>
        <div>
          <label className="label" htmlFor="trl">Current TRL</label>
          <select className="input" id="trl" name="trl" defaultValue={String(d.trl ?? 3)}>
            {TRL_LABELS.map((l, i) => (
              <option key={l} value={i + 1}>
                TRL {i + 1}: {l}
              </option>
            ))}
          </select>
          <FieldError name="trl" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="summary">Short summary</label>
        <textarea className="input min-h-28" id="summary" name="summary" defaultValue={d.summary} maxLength={1500} required />
        <p className="hint">What it does and for whom. Leave out confidential details: summaries can be read by companies you apply to.</p>
        <FieldError name="summary" />
      </div>
      <div>
        <label className="label" htmlFor="keywords">Keywords</label>
        <input className="input" id="keywords" name="keywords" defaultValue={d.keywords?.join(", ")} placeholder="biocontrol, bacillus, wheat" />
        <p className="hint">Separate with commas. Used for matching with company challenges and for patent searches.</p>
        <FieldError name="keywords" />
      </div>
    </div>
  );
}
