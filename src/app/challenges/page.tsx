import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ScorePill } from "@/components/status";
import { FIELDS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { openChallenges, rankChallenges } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { tokenize } from "@/lib/text";

export const metadata = { title: "Industry challenges" };

type SP = { q?: string; field?: string; project?: string };

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const [open, myProjects, mine] = await Promise.all([
    openChallenges(),
    user.role === "RESEARCHER"
      ? db.select().from(schema.projects).where(eq(schema.projects.ownerId, user.id)).orderBy(desc(schema.projects.updatedAt))
      : Promise.resolve([]),
    user.role === "COMPANY"
      ? db.select().from(schema.challenges).where(eq(schema.challenges.companyId, user.id)).orderBy(desc(schema.challenges.createdAt))
      : Promise.resolve([]),
  ]);

  const selected = myProjects.find((p) => p.id === sp.project) ?? myProjects[0];
  const terms = tokenize(sp.q ?? "");
  const filtered = open.filter((c) => {
    if (sp.field && c.field !== sp.field) return false;
    if (!terms.length) return true;
    const hay = tokenize(`${c.title} ${c.description} ${c.keywords.join(" ")} ${c.companyName ?? ""}`);
    return terms.every((t) => hay.some((h) => h.startsWith(t)));
  });
  const ranked = selected ? rankChallenges(selected, filtered) : filtered.map((c) => ({ ...c, match: null }));
  const list = ranked;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Open innovation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">Industry challenges</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate">
            Real problems posted by companies. Researchers answer with their project. Contact details are shared only after the company
            accepts.
          </p>
        </div>
        {user.role === "COMPANY" ? <Link href="/challenges/new" className="btn-primary">Post a challenge</Link> : null}
      </div>

      {mine.length ? (
        <section className="card" aria-labelledby="mine">
          <h2 id="mine" className="text-lg font-semibold text-navy">Your challenges</h2>
          <ul className="mt-3 divide-y divide-line">
            {mine.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/challenges/${c.id}`} className="link">{c.title}</Link>
                <span className={`pill ${c.status === "OPEN" ? "bg-teal-soft text-teal" : "bg-slate-soft text-slate"}`}>
                  {c.status === "OPEN" ? "Open" : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form method="get" className="card grid gap-4 md:grid-cols-[2fr_1.2fr_1.2fr_auto] md:items-end">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input className="input" id="q" name="q" type="search" defaultValue={sp.q} placeholder="fungicide, sensor, recycling…" />
        </div>
        <div>
          <label className="label" htmlFor="field">Field</label>
          <select className="input" id="field" name="field" defaultValue={sp.field ?? ""}>
            <option value="">All fields</option>
            {FIELDS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        {myProjects.length ? (
          <div>
            <label className="label" htmlFor="project">Rank for my project</label>
            <select className="input" id="project" name="project" defaultValue={selected?.id}>
              {myProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        <button type="submit" className="btn-primary">Apply filters</button>
      </form>

      <p className="text-sm text-slate" role="status">
        {list.length} open challenge{list.length === 1 ? "" : "s"}
        {selected ? `, ranked for "${selected.title}"` : ""}
      </p>

      {list.length === 0 ? (
        <p className="card text-sm text-slate">No open challenge matches these filters.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {ranked.map((c) => (
            <li key={c.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/challenges/${c.id}${selected ? `?project=${selected.id}` : ""}`} className="text-base font-semibold text-navy hover:text-teal">
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate">{c.companyName}, {c.field}</p>
                </div>
                {c.match ? <ScorePill score={c.match.score} /> : null}
              </div>
              <p className="line-clamp-3 text-sm text-ink/85">{c.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate">
                {c.minTrl ? <span className="pill bg-navy-soft text-navy">TRL {c.minTrl}+</span> : null}
                {c.deadline ? <span>Closes {c.deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span> : <span>No deadline</span>}
              </div>
              {c.match?.reasons.length ? <p className="text-xs text-ink/75">{c.match.reasons.slice(0, 2).join(", ")}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
