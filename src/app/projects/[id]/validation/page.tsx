import { desc, eq } from "drizzle-orm";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { StatusPill } from "@/components/status";
import { getOwnedProject } from "@/lib/access";
import { ORG_TYPES } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { hypothesesWithResults } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { tallyPains } from "@/lib/validation";
import { addHypothesis, addInterview, deleteHypothesis, deleteInterview } from "./actions";

export const metadata = { title: "Market validation" };

const VERDICT_LABEL = { CONFIRMS: "Confirms", REJECTS: "Rejects", UNCLEAR: "Unclear" } as const;

export default async function ValidationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("RESEARCHER");
  const project = await getOwnedProject(id, user);

  const [hyps, interviews] = await Promise.all([
    hypothesesWithResults(project.id),
    db.query.interviews.findMany({
      where: eq(schema.interviews.projectId, project.id),
      with: { verdicts: { with: { hypothesis: { columns: { statement: true } } } } },
      orderBy: [desc(schema.interviews.date), desc(schema.interviews.createdAt)],
    }),
  ]);
  const pains = tallyPains(interviews);
  const maxPain = pains[0]?.count ?? 1;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="card" aria-labelledby="dash">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="dash" className="text-lg font-semibold text-navy">Validation dashboard</h2>
            <p className="text-xs text-slate">{interviews.length} interview{interviews.length === 1 ? "" : "s"} logged</p>
          </div>
          {hyps.length === 0 ? (
            <p className="mt-4 text-sm text-slate">Add your first hypothesis to start. Then log interviews and the results appear here.</p>
          ) : (
            <ul className="mt-5 space-y-5">
              {hyps.map((h) => {
                const r = h.result;
                const pct = Math.round(r.rate * 100);
                return (
                  <li key={h.id} className="border-b border-line pb-5 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-sm font-medium text-ink">{h.statement}</p>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="mt-3">
                      <div
                        className="relative h-3 overflow-hidden rounded-full bg-slate-soft"
                        role="img"
                        aria-label={`${pct}% of ${r.total} interviews confirm. Threshold ${Math.round(r.threshold * 100)}%.`}
                      >
                        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                        <div className="absolute inset-y-0 w-0.5 bg-night" style={{ left: `${r.threshold * 100}%` }} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-slate">
                        <span className="tabular-nums">
                          <strong className="text-ink">{pct}%</strong> confirm ({r.confirms} confirm, {r.rejects} reject, {r.unclear} unclear)
                        </span>
                        <span className="tabular-nums">
                          {h.audience} threshold {Math.round(r.threshold * 100)}%, {r.total}/{r.minSample} interviews
                        </span>
                      </div>
                    </div>
                    <form action={deleteHypothesis} className="mt-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="id" value={h.id} />
                      <button type="submit" className="text-xs text-slate underline underline-offset-2 hover:text-navy">Remove</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="log">
          <h2 id="log" className="text-lg font-semibold text-navy">Log an interview</h2>
          <ActionForm action={addInterview} resetOnSuccess className="mt-4 space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="date">Date</label>
                <input className="input" type="date" id="date" name="date" defaultValue={today} max={today} required />
                <FieldError name="date" />
              </div>
              <div>
                <label className="label" htmlFor="intervieweeRole">Person&apos;s role</label>
                <input className="input" id="intervieweeRole" name="intervieweeRole" placeholder="Farm manager" required />
                <FieldError name="intervieweeRole" />
              </div>
              <div>
                <label className="label" htmlFor="organizationType">Organisation</label>
                <select className="input" id="organizationType" name="organizationType" defaultValue="">
                  <option value="" disabled>Choose</option>
                  {ORG_TYPES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <FieldError name="organizationType" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="pastBehaviour">What did they actually do last time?</label>
              <textarea
                className="input min-h-24"
                id="pastBehaviour"
                name="pastBehaviour"
                placeholder="Last season they lost about a fifth of their wheat and paid for two extra fungicide treatments."
                required
              />
              <p className="hint">Past behaviour is stronger evidence than opinions about the future.</p>
              <FieldError name="pastBehaviour" />
            </div>
            <div>
              <label className="label" htmlFor="painTags">Pains mentioned</label>
              <input className="input" id="painTags" name="painTags" placeholder="crop loss, treatment cost, regulation" />
              <p className="hint">Separate with commas. Reuse the same words so the tally counts them together.</p>
            </div>
            {hyps.length ? (
              <fieldset className="space-y-3">
                <legend className="label">Did this interview confirm your hypotheses?</legend>
                {hyps.map((h) => (
                  <div key={h.id} className="rounded-lg border border-line p-3">
                    <p className="text-sm text-ink">{h.statement}</p>
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={h.statement}>
                      {[
                        { v: "CONFIRMS", l: "Confirms" },
                        { v: "REJECTS", l: "Rejects" },
                        { v: "UNCLEAR", l: "Unclear" },
                        { v: "", l: "Not discussed" },
                      ].map((o) => (
                        <label
                          key={o.v || "none"}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal"
                        >
                          <input type="radio" name={`verdict_${h.id}`} value={o.v} defaultChecked={o.v === ""} className="accent-teal" />
                          {o.l}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </fieldset>
            ) : null}
            <div>
              <label className="label" htmlFor="notes">Other notes <span className="font-normal text-slate">(optional)</span></label>
              <textarea className="input min-h-20" id="notes" name="notes" />
            </div>
            <SubmitButton>Save interview</SubmitButton>
          </ActionForm>
        </section>

        <section aria-labelledby="list" className="space-y-3">
          <h2 id="list" className="text-lg font-semibold text-navy">Interviews</h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-slate">No interviews yet.</p>
          ) : (
            interviews.map((iv) => (
              <article key={iv.id} className="card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy">
                    {iv.intervieweeRole}, {iv.organizationType}
                  </h3>
                  <time className="text-xs text-slate" dateTime={iv.date.toISOString()}>
                    {iv.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <p className="mt-2 text-sm text-ink/90">{iv.pastBehaviour}</p>
                {iv.notes ? <p className="mt-2 text-xs text-slate">{iv.notes}</p> : null}
                {iv.painTags.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Pains">
                    {iv.painTags.map((t) => (
                      <li key={t} className="pill bg-navy-soft text-navy">{t}</li>
                    ))}
                  </ul>
                ) : null}
                {iv.verdicts.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate">
                    {iv.verdicts.map((v) => (
                      <li key={v.hypothesisId}>
                        <strong className="text-ink">{VERDICT_LABEL[v.verdict]}:</strong> {v.hypothesis.statement}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <form action={deleteInterview} className="mt-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="id" value={iv.id} />
                  <button type="submit" className="text-xs text-slate underline underline-offset-2 hover:text-navy">Delete interview</button>
                </form>
              </article>
            ))
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card" aria-labelledby="add">
          <h2 id="add" className="text-lg font-semibold text-navy">Add a hypothesis</h2>
          <ActionForm action={addHypothesis} resetOnSuccess className="mt-4 space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <div>
              <label className="label" htmlFor="statement">Hypothesis</label>
              <textarea className="input min-h-20" id="statement" name="statement" placeholder="Wheat farmers lose part of their harvest to fungal disease every season." required />
              <FieldError name="statement" />
            </div>
            <fieldset>
              <legend className="label">Who do you interview?</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "B2B", l: "Organisations (B2B)", d: "75% to validate" },
                  { v: "B2C", l: "Individuals (B2C)", d: "45% to validate" },
                ].map((o) => (
                  <label key={o.v} className="cursor-pointer rounded-lg border border-line p-2.5 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal-soft">
                    <input type="radio" name="audience" value={o.v} defaultChecked={o.v === "B2B"} className="mr-1.5 accent-teal" />
                    {o.l}
                    <span className="block pl-5 text-xs text-slate">{o.d}</span>
                  </label>
                ))}
              </div>
              <FieldError name="audience" />
            </fieldset>
            <SubmitButton>Add hypothesis</SubmitButton>
          </ActionForm>
        </section>

        <section className="card" aria-labelledby="pains">
          <h2 id="pains" className="text-lg font-semibold text-navy">Most mentioned pains</h2>
          {pains.length ? (
            <ul className="mt-4 space-y-2.5">
              {pains.slice(0, 8).map((p) => (
                <li key={p.tag} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-sm">
                  <span className="truncate">{p.tag}</span>
                  <span className="tabular-nums text-xs text-slate">
                    {p.count} of {interviews.length}
                  </span>
                  <span className="col-span-2 mt-1 h-2 rounded-full bg-slate-soft">
                    <span className="block h-full rounded-full bg-navy" style={{ width: `${(p.count / maxPain) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate">Tag pains when you log interviews to see which ones come up most.</p>
          )}
        </section>

        <section className="rounded-2xl bg-night p-6 text-cream">
          <h2 className="font-display text-lg font-bold">Interview rules</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream/85">
            <li>Do not present your idea. Describe the problem area only.</li>
            <li>Ask about real past events, not &quot;would you buy it?&quot;.</li>
            <li>Avoid yes/no questions.</li>
            <li>Try to prove your hypothesis wrong.</li>
          </ul>
          <p className="mt-4 text-xs text-cream/60">
            Thresholds (45% B2C, 75% B2B) come from the Market Pain Validation method. Minimum sample sizes (20 B2C, 5 B2B) are our own choice.
          </p>
        </section>
      </aside>
    </div>
  );
}
