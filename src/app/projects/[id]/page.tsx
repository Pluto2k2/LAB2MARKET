import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ProjectFields } from "@/components/project-fields";
import { ScorePill } from "@/components/status";
import { getOwnedProject } from "@/lib/access";
import { db, schema } from "@/lib/db";
import { hypothesesWithResults, openChallenges, rankChallenges } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { deleteProject, updateProject } from "../actions";

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("RESEARCHER");
  const project = await getOwnedProject(id, user);

  const [hyps, [{ n: interviewCount }], [{ n: partnerCount }], challenges, applications] = await Promise.all([
    hypothesesWithResults(project.id),
    db.select({ n: count() }).from(schema.interviews).where(eq(schema.interviews.projectId, project.id)),
    db.select({ n: count() }).from(schema.savedPartners).where(eq(schema.savedPartners.projectId, project.id)),
    openChallenges(),
    db.query.challengeResponses.findMany({
      where: eq(schema.challengeResponses.projectId, project.id),
      with: { challenge: { columns: { id: true, title: true } } },
    }),
  ]);
  const validated = hyps.filter((h) => h.result.status === "VALIDATED").length;
  const ranked = rankChallenges(project, challenges).filter((c) => c.match.score >= 25).slice(0, 4);

  const stats = [
    { label: "Hypotheses validated", value: `${validated} / ${hyps.length}`, href: `/projects/${project.id}/validation` },
    { label: "Interviews logged", value: String(interviewCount), href: `/projects/${project.id}/validation` },
    { label: "Potential partners saved", value: String(partnerCount), href: `/projects/${project.id}/patents` },
    { label: "Challenge applications", value: String(applications.length), href: "/challenges" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-semibold text-navy">Summary</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink/90">{project.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Keywords">
            {project.keywords.map((k) => (
              <li key={k} className="pill bg-navy-soft text-navy">{k}</li>
            ))}
          </ul>
        </section>

        <section aria-label="Progress" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-paper p-4 hover:border-teal">
              <span className="block font-display text-2xl font-bold text-navy tabular-nums">{s.value}</span>
              <span className="mt-1 block text-xs text-slate">{s.label}</span>
            </Link>
          ))}
        </section>

        <details className="card group">
          <summary className="cursor-pointer text-lg font-semibold text-navy">Edit project</summary>
          <ActionForm action={updateProject} className="mt-5 space-y-5">
            <input type="hidden" name="id" value={project.id} />
            <ProjectFields d={project} />
            <SubmitButton>Save changes</SubmitButton>
          </ActionForm>
          <form action={deleteProject} className="mt-6 border-t border-line pt-4">
            <input type="hidden" name="id" value={project.id} />
            <p className="text-sm text-slate">Deleting removes the project, its interviews, saved partners and applications.</p>
            <button type="submit" className="btn-secondary btn-sm mt-3">Delete project</button>
          </form>
        </details>
      </div>

      <aside className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-semibold text-navy">Challenges that fit</h2>
          <p className="mt-1 text-xs text-slate">Ranked by shared keywords, wording, field and TRL.</p>
          {ranked.length ? (
            <ul className="mt-4 space-y-3">
              {ranked.map((c) => (
                <li key={c.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/challenges/${c.id}?project=${project.id}`} className="text-sm font-semibold text-navy hover:text-teal">
                      {c.title}
                    </Link>
                    <ScorePill score={c.match.score} />
                  </div>
                  <p className="mt-1 text-xs text-slate">{c.companyName}</p>
                  {c.match.reasons[0] ? <p className="mt-1.5 text-xs text-ink/80">{c.match.reasons[0]}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate">
              No open challenge matches yet. Add more keywords, or <Link href="/challenges" className="link">browse all challenges</Link>.
            </p>
          )}
        </section>

        {applications.length ? (
          <section className="card">
            <h2 className="text-lg font-semibold text-navy">Your applications</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {applications.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <Link href={`/challenges/${a.challenge.id}`} className="link">{a.challenge.title}</Link>
                  <span className="pill bg-navy-soft text-navy">{a.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
