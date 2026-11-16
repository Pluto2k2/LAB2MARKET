import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hypothesesWithResults, openChallenges, rankChallenges } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { TRL_LABELS } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  return user.role === "COMPANY" ? <CompanyDashboard userId={user.id} name={user.name} /> : <ResearcherDashboard userId={user.id} name={user.name} />;
}

async function ResearcherDashboard({ userId, name }: { userId: string; name: string }) {
  const [projects, challenges] = await Promise.all([
    db.select().from(schema.projects).where(eq(schema.projects.ownerId, userId)).orderBy(desc(schema.projects.updatedAt)),
    openChallenges(),
  ]);
  const cards = await Promise.all(
    projects.map(async (p) => {
      const [hyps, [{ n }]] = await Promise.all([
        hypothesesWithResults(p.id),
        db.select({ n: count() }).from(schema.interviews).where(eq(schema.interviews.projectId, p.id)),
      ]);
      const matches = rankChallenges(p, challenges).filter((c) => c.match.score >= 35).length;
      return { p, hyps, interviews: n, matches };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">Hello, {name.split(" ")[0]}</h1>
        </div>
        <Link href="/projects/new" className="btn-primary">New project</Link>
      </div>

      {cards.length === 0 ? (
        <section className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-navy">Start with your first project</h2>
          <p className="mt-2 text-sm text-slate">
            Describe your research in a few lines. You can then test your market hypotheses, explore patents in your field and answer company
            challenges.
          </p>
          <Link href="/projects/new" className="btn-primary mt-4">Create a project</Link>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {cards.map(({ p, hyps, interviews, matches }) => {
            const validated = hyps.filter((h) => h.result.status === "VALIDATED").length;
            return (
              <li key={p.id} className="card flex flex-col gap-4">
                <div>
                  <p className="text-xs text-slate">{p.field}</p>
                  <Link href={`/projects/${p.id}`} className="mt-1 block text-lg font-semibold text-navy hover:text-teal">{p.title}</Link>
                  <p className="mt-1 text-xs text-slate">TRL {p.trl}: {TRL_LABELS[p.trl - 1]}</p>
                </div>
                <div className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i < p.trl ? "bg-teal" : "bg-slate-soft"}`} />
                  ))}
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-navy-soft p-2">
                    <dt className="text-[11px] text-slate">Validated</dt>
                    <dd className="font-semibold tabular-nums text-navy">{validated}/{hyps.length}</dd>
                  </div>
                  <div className="rounded-lg bg-navy-soft p-2">
                    <dt className="text-[11px] text-slate">Interviews</dt>
                    <dd className="font-semibold tabular-nums text-navy">{interviews}</dd>
                  </div>
                  <div className="rounded-lg bg-navy-soft p-2">
                    <dt className="text-[11px] text-slate">Good matches</dt>
                    <dd className="font-semibold tabular-nums text-navy">{matches}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/projects/${p.id}/validation`} className="btn-secondary btn-sm">Log interview</Link>
                  <Link href={`/projects/${p.id}/patents`} className="btn-secondary btn-sm">Explore patents</Link>
                  <Link href={`/challenges?project=${p.id}`} className="btn-secondary btn-sm">See challenges</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function CompanyDashboard({ userId, name }: { userId: string; name: string }) {
  const rows = await db
    .select({
      id: schema.challenges.id,
      title: schema.challenges.title,
      status: schema.challenges.status,
      deadline: schema.challenges.deadline,
      total: sql<number>`count(${schema.challengeResponses.id})::int`,
      pending: sql<number>`count(${schema.challengeResponses.id}) filter (where ${schema.challengeResponses.status} = 'PENDING')::int`,
    })
    .from(schema.challenges)
    .leftJoin(schema.challengeResponses, eq(schema.challengeResponses.challengeId, schema.challenges.id))
    .where(eq(schema.challenges.companyId, userId))
    .groupBy(schema.challenges.id)
    .orderBy(desc(schema.challenges.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Company dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">Hello, {name.split(" ")[0]}</h1>
        </div>
        <Link href="/challenges/new" className="btn-primary">Post a challenge</Link>
      </div>
      {rows.length === 0 ? (
        <section className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-navy">Post your first challenge</h2>
          <p className="mt-2 text-sm text-slate">Describe a technical problem. Researchers whose work fits will answer with their project.</p>
          <Link href="/challenges/new" className="btn-primary mt-4">Post a challenge</Link>
        </section>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3 font-semibold">Challenge</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">New</th>
                <th className="px-5 py-3 text-right font-semibold">Applications</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3"><Link href={`/challenges/${r.id}`} className="link">{r.title}</Link></td>
                  <td className="px-5 py-3">
                    <span className={`pill ${r.status === "OPEN" ? "bg-teal-soft text-teal" : "bg-slate-soft text-slate"}`}>
                      {r.status === "OPEN" ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.pending > 0 ? <strong className="text-teal">{r.pending}</strong> : 0}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
