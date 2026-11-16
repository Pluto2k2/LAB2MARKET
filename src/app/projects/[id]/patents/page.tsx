import { desc, eq } from "drizzle-orm";
import { BarList, YearColumns } from "@/components/bars";
import { getOwnedProject } from "@/lib/access";
import { db, schema } from "@/lib/db";
import { byCountry, byYear, topApplicants, topCpc } from "@/lib/ops/aggregate";
import { opsConfigured, PatentSearchError, searchPatents, type PatentSearchOutcome } from "@/lib/ops/client";
import { requireUser } from "@/lib/session";
import { removePartner, savePartner, updatePartnerNote } from "./actions";

export const metadata = { title: "Patent explorer" };

type SP = { keywords?: string; cpc?: string; applicant?: string; from?: string; to?: string; run?: string };

function year(v?: string) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : undefined;
}

export default async function PatentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser("RESEARCHER");
  const project = await getOwnedProject(id, user);

  const keywords = sp.keywords ?? project.keywords.slice(0, 3).join(" ");
  let outcome: PatentSearchOutcome | null = null;
  let error: string | null = null;
  if (sp.run) {
    try {
      outcome = await searchPatents({
        keywords,
        cpc: sp.cpc,
        applicant: sp.applicant,
        fromYear: year(sp.from),
        toYear: year(sp.to),
      });
    } catch (e) {
      error = e instanceof PatentSearchError || e instanceof Error ? e.message : "The search failed. Try again.";
    }
  }

  const partners = await db
    .select()
    .from(schema.savedPartners)
    .where(eq(schema.savedPartners.projectId, project.id))
    .orderBy(desc(schema.savedPartners.patentCount));
  const savedNames = new Set(partners.map((p) => p.name));

  const records = outcome?.records ?? [];
  const applicants = topApplicants(records, 10);

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-navy">Search the patent landscape</h2>
        <p className="mt-1 text-sm text-slate">
          Find who files patents around your topic. The companies that appear most often are potential partners or licensees.
        </p>
        <form method="get" className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <input type="hidden" name="run" value="1" />
          <div>
            <label className="label" htmlFor="keywords">Keywords (title and abstract)</label>
            <input className="input" id="keywords" name="keywords" defaultValue={keywords} placeholder="bacillus biocontrol fungi" />
            <p className="hint">Up to 6 words. All words must appear.</p>
          </div>
          <div>
            <label className="label" htmlFor="cpc">CPC class <span className="font-normal text-slate">(optional)</span></label>
            <input className="input" id="cpc" name="cpc" defaultValue={sp.cpc} placeholder="A01N63" />
          </div>
          <div>
            <label className="label" htmlFor="applicant">Applicant <span className="font-normal text-slate">(optional)</span></label>
            <input className="input" id="applicant" name="applicant" defaultValue={sp.applicant} placeholder="Company name" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:col-span-2 md:max-w-sm">
            <div>
              <label className="label" htmlFor="from">From year</label>
              <input className="input" id="from" name="from" type="number" min={1900} max={2100} defaultValue={sp.from} placeholder="2015" />
            </div>
            <div>
              <label className="label" htmlFor="to">To year</label>
              <input className="input" id="to" name="to" type="number" min={1900} max={2100} defaultValue={sp.to} placeholder="2026" />
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full md:w-auto">Search patents</button>
          </div>
        </form>
        {!opsConfigured() ? (
          <p className="mt-4 rounded-lg bg-slate-soft px-4 py-3 text-sm text-navy" role="note">
            <strong>Demo mode.</strong> No EPO key is configured, so results are invented sample data marked &quot;(demo)&quot;. Add
            EPO_OPS_KEY and EPO_OPS_SECRET to use live European Patent Office data.
          </p>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="card border-navy/40 text-sm font-medium text-navy">
          {error}
        </p>
      ) : null}

      {outcome ? (
        <>
          <section aria-label="Search summary" className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-ink">
              <strong className="font-display text-2xl text-navy tabular-nums">{outcome.total.toLocaleString("en")}</strong> patent
              publications found{outcome.demo ? " (demo)" : ""}.
              {outcome.total > outcome.fetched ? ` Charts use the first ${outcome.fetched}.` : ""}
            </p>
            <code className="max-w-full overflow-x-auto rounded bg-navy-soft px-2 py-1 text-xs text-navy">{outcome.cql}</code>
          </section>

          {records.length === 0 ? (
            <p className="card text-sm text-slate">No patents match. Try fewer or broader keywords, or remove the CPC class.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card" aria-labelledby="who">
                <h3 id="who" className="text-base font-semibold text-navy">Who files the most</h3>
                <p className="mt-1 text-xs text-slate">Save a company to keep it as a potential partner for this project.</p>
                <ul className="mt-4 space-y-2">
                  {applicants.map((a) => (
                    <li key={a.key} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium" title={a.key}>{a.key}</span>
                        <span className="text-xs text-slate tabular-nums">{a.count} patent{a.count === 1 ? "" : "s"} in these results</span>
                      </span>
                      {savedNames.has(a.key) ? (
                        <span className="pill bg-teal-soft text-teal">Saved</span>
                      ) : (
                        <form action={savePartner}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="name" value={a.key} />
                          <input type="hidden" name="patentCount" value={a.count} />
                          <input type="hidden" name="query" value={outcome.cql} />
                          <input type="hidden" name="demo" value={outcome.demo ? "1" : "0"} />
                          <button type="submit" className="btn-secondary btn-sm">Save partner</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
              <div className="space-y-6">
                <section className="card" aria-labelledby="trend">
                  <h3 id="trend" className="text-base font-semibold text-navy">Publications per year</h3>
                  <div className="mt-4">
                    <YearColumns data={byYear(records)} />
                  </div>
                </section>
                <div className="grid gap-6 sm:grid-cols-2">
                  <section className="card" aria-labelledby="where">
                    <h3 id="where" className="text-base font-semibold text-navy">Where</h3>
                    <p className="mt-1 text-xs text-slate">EP = European, WO = international (PCT)</p>
                    <div className="mt-3">
                      <BarList data={byCountry(records)} label="Publications by office" color="bg-slate" />
                    </div>
                  </section>
                  <section className="card" aria-labelledby="cpcs">
                    <h3 id="cpcs" className="text-base font-semibold text-navy">Technology classes</h3>
                    <p className="mt-1 text-xs text-slate">CPC subclasses</p>
                    <div className="mt-3">
                      <BarList data={topCpc(records)} label="Publications by CPC subclass" color="bg-navy" />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {records.length ? (
            <section aria-labelledby="results" className="space-y-3">
              <h3 id="results" className="text-lg font-semibold text-navy">Results</h3>
              <ul className="space-y-3">
                {records.slice(0, 25).map((r) => (
                  <li key={r.publicationNumber} className="card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy hover:text-teal">
                        {r.title}
                        <span className="sr-only"> (opens Espacenet in a new tab)</span>
                      </a>
                      <span className="text-xs tabular-nums text-slate">
                        {r.publicationNumber}
                        {r.date ? `, ${r.date}` : ""}
                      </span>
                    </div>
                    {r.applicants.length ? <p className="mt-1 text-sm text-slate">{r.applicants.join(", ")}</p> : null}
                    {r.abstract ? <p className="mt-2 line-clamp-3 text-sm text-ink/85">{r.abstract}</p> : null}
                    {r.cpc.length ? <p className="mt-2 text-xs text-slate">CPC: {r.cpc.join(", ")}</p> : null}
                  </li>
                ))}
              </ul>
              {records.length > 25 ? <p className="text-xs text-slate">Showing 25 of {records.length} loaded results.</p> : null}
            </section>
          ) : null}
        </>
      ) : null}

      <section className="card" aria-labelledby="saved">
        <h2 id="saved" className="text-lg font-semibold text-navy">Potential partners</h2>
        {partners.length === 0 ? (
          <p className="mt-2 text-sm text-slate">Companies you save from a search appear here, with your notes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {partners.map((p) => (
              <li key={p.id} className="grid gap-3 py-3 md:grid-cols-[1fr_1.4fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                  <p className="text-xs text-slate">
                    {p.patentCount} patents, {p.source}
                  </p>
                </div>
                <form action={updatePartnerNote} className="flex gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="id" value={p.id} />
                  <label className="sr-only" htmlFor={`note-${p.id}`}>Note for {p.name}</label>
                  <input className="input py-1.5" id={`note-${p.id}`} name="note" defaultValue={p.note} placeholder="Contact, next step…" />
                  <button type="submit" className="btn-secondary btn-sm">Save</button>
                </form>
                <form action={removePartner}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="text-xs text-slate underline underline-offset-2 hover:text-navy">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
