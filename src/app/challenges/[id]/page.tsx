import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { ScorePill } from "@/components/status";
import { isUuid } from "@/lib/access";
import { TRL_LABELS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { matchProjectToChallenge } from "@/lib/matching";
import { requireUser } from "@/lib/session";
import { respondToChallenge, setChallengeStatus, setResponseStatus, withdrawResponse } from "../actions";

const STATUS_STYLE = {
  PENDING: "bg-slate-soft text-slate",
  ACCEPTED: "bg-teal text-cream",
  DECLINED: "bg-navy text-cream",
} as const;
const STATUS_TEXT = { PENDING: "Waiting for the company", ACCEPTED: "Accepted", DECLINED: "Declined" } as const;

export default async function ChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const user = await requireUser();

  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, id),
    with: { company: { columns: { id: true, name: true, email: true, organization: true } } },
  });
  if (!challenge) notFound();

  const isOwner = user.id === challenge.companyId;
  const expired = Boolean(challenge.deadline && challenge.deadline < new Date());
  const acceptingApplications = challenge.status === "OPEN" && !expired;
  // Closed challenges stay visible only to their owner and to researchers who applied.
  const myResponses =
    user.role === "RESEARCHER"
      ? await db.query.challengeResponses.findMany({
          where: and(eq(schema.challengeResponses.challengeId, id), eq(schema.challengeResponses.researcherId, user.id)),
          with: { project: { columns: { id: true, title: true } } },
        })
      : [];
  if (!acceptingApplications && !isOwner && myResponses.length === 0 && user.role !== "ADMIN") notFound();

  const myProjects =
    user.role === "RESEARCHER"
      ? await db.select().from(schema.projects).where(eq(schema.projects.ownerId, user.id)).orderBy(desc(schema.projects.updatedAt))
      : [];
  const appliedIds = new Set(myResponses.map((r) => r.projectId));
  const selected = myProjects.find((p) => p.id === sp.project) ?? myProjects.find((p) => !appliedIds.has(p.id)) ?? myProjects[0];
  const match = selected ? matchProjectToChallenge(selected, challenge) : null;
  const available = myProjects.filter((p) => !appliedIds.has(p.id));

  const responses = isOwner
    ? await db.query.challengeResponses.findMany({
        where: eq(schema.challengeResponses.challengeId, id),
        with: {
          project: true,
          researcher: { columns: { name: true, email: true, organization: true } },
        },
        orderBy: [desc(schema.challengeResponses.createdAt)],
      })
    : [];

  return (
    <div className={`grid gap-6 ${isOwner ? "" : "lg:grid-cols-[1.5fr_1fr]"}`}>
      <article className="space-y-6">
        <div>
          <Link href="/challenges" className="text-sm text-slate hover:text-navy">← All challenges</Link>
          <p className="eyebrow mt-4">{challenge.company.organization ?? "Company"}, {challenge.field}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">{challenge.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`pill ${acceptingApplications ? "bg-teal-soft text-teal" : "bg-slate-soft text-slate"}`}>
              {acceptingApplications ? "Open" : expired ? "Deadline passed" : "Closed"}
            </span>
            {challenge.minTrl ? (
              <span className="pill bg-navy-soft text-navy">Minimum TRL {challenge.minTrl}: {TRL_LABELS[challenge.minTrl - 1]}</span>
            ) : null}
            {challenge.deadline ? (
              <span className="pill bg-navy-soft text-navy">
                Closes {challenge.deadline.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            ) : null}
          </div>
        </div>
        <section className="card">
          <h2 className="text-lg font-semibold text-navy">The problem</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">{challenge.description}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Keywords">
            {challenge.keywords.map((k) => (
              <li key={k} className="pill bg-navy-soft text-navy">{k}</li>
            ))}
          </ul>
        </section>

        {isOwner ? (
          <section aria-labelledby="apps" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="apps" className="text-lg font-semibold text-navy">Applications ({responses.length})</h2>
              <form action={setChallengeStatus}>
                <input type="hidden" name="id" value={challenge.id} />
                <input type="hidden" name="status" value={challenge.status === "OPEN" ? "CLOSED" : "OPEN"} />
                <button type="submit" className="btn-secondary btn-sm">
                  {challenge.status === "OPEN" ? "Close challenge" : "Reopen challenge"}
                </button>
              </form>
            </div>
            {responses.length === 0 ? (
              <p className="card text-sm text-slate">No applications yet. Researchers whose projects match will see this challenge ranked high.</p>
            ) : (
              responses.map((r) => {
                const m = matchProjectToChallenge(r.project, challenge);
                return (
                  <div key={r.id} className="card space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-navy">{r.project.title}</h3>
                        <p className="text-xs text-slate">
                          {r.project.field}, TRL {r.project.trl}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ScorePill score={m.score} />
                        <span className={`pill ${STATUS_STYLE[r.status]}`}>{r.status === "PENDING" ? "New" : STATUS_TEXT[r.status]}</span>
                      </div>
                    </div>
                    <p className="text-sm text-ink/85">{r.project.summary}</p>
                    <blockquote className="border-l-2 border-teal pl-3 text-sm italic text-ink/85">{r.message}</blockquote>
                    {r.status === "ACCEPTED" ? (
                      <p className="rounded-lg bg-teal-soft px-3 py-2 text-sm text-ink">
                        Contact: <strong>{r.researcher.name}</strong>
                        {r.researcher.organization ? `, ${r.researcher.organization}` : ""},{" "}
                        <span className="select-all">{r.researcher.email}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate">The researcher&apos;s identity and email are shown once you accept.</p>
                    )}
                    {r.status !== "ACCEPTED" ? (
                      <div className="flex gap-2">
                        <form action={setResponseStatus}>
                          <input type="hidden" name="responseId" value={r.id} />
                          <input type="hidden" name="status" value="ACCEPTED" />
                          <button type="submit" className="btn-primary btn-sm">Accept and share contacts</button>
                        </form>
                        {r.status === "PENDING" ? (
                          <form action={setResponseStatus}>
                            <input type="hidden" name="responseId" value={r.id} />
                            <input type="hidden" name="status" value="DECLINED" />
                            <button type="submit" className="btn-secondary btn-sm">Decline</button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </section>
        ) : null}
      </article>

      <aside className="space-y-6">
        {user.role === "RESEARCHER" ? (
          <>
            {myResponses.length ? (
              <section className="card space-y-3" aria-labelledby="my">
                <h2 id="my" className="text-lg font-semibold text-navy">Your applications</h2>
                {myResponses.map((r) => (
                  <div key={r.id} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.project.title}</span>
                      <span className={`pill ${STATUS_STYLE[r.status]}`}>{STATUS_TEXT[r.status]}</span>
                    </div>
                    {r.status === "ACCEPTED" ? (
                      <p className="mt-2 rounded bg-teal-soft px-2 py-1.5">
                        Contact: <strong>{challenge.company.name}</strong>, {challenge.company.organization},{" "}
                        <span className="select-all">{challenge.company.email}</span>
                      </p>
                    ) : r.status === "PENDING" ? (
                      <form action={withdrawResponse} className="mt-2">
                        <input type="hidden" name="responseId" value={r.id} />
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        <button type="submit" className="text-xs text-slate underline underline-offset-2 hover:text-navy">Withdraw</button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </section>
            ) : null}

            {match && selected ? (
              <section className="card" aria-labelledby="fit">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="fit" className="text-lg font-semibold text-navy">How well it fits</h2>
                  <ScorePill score={match.score} />
                </div>
                <p className="mt-1 text-xs text-slate">For &quot;{selected.title}&quot;</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/85">
                  {match.reasons.length ? match.reasons.map((r) => <li key={r}>{r}</li>) : <li>Few shared keywords or terms.</li>}
                </ul>
              </section>
            ) : null}

            {acceptingApplications ? (
              available.length ? (
                <section className="card" aria-labelledby="apply">
                  <h2 id="apply" className="text-lg font-semibold text-navy">Answer this challenge</h2>
                  <ActionForm action={respondToChallenge} resetOnSuccess className="mt-4 space-y-4">
                    <input type="hidden" name="challengeId" value={challenge.id} />
                    <div>
                      <label className="label" htmlFor="projectId">Project</label>
                      <select className="input" id="projectId" name="projectId" defaultValue={available.find((p) => p.id === selected?.id)?.id ?? available[0].id}>
                        {available.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                      <FieldError name="projectId" />
                    </div>
                    <div>
                      <label className="label" htmlFor="message">Why your research fits</label>
                      <textarea className="input min-h-32" id="message" name="message" required placeholder="What your result does, the evidence so far, and what you would need from the company." />
                      <FieldError name="message" />
                    </div>
                    <p className="text-xs text-slate">The company sees your project summary and message. Your name and email stay hidden until it accepts.</p>
                    <SubmitButton pendingText="Sending…">Send application</SubmitButton>
                  </ActionForm>
                </section>
              ) : myProjects.length === 0 ? (
                <p className="card text-sm text-slate">
                  <Link href="/projects/new" className="link">Create a project</Link> to answer this challenge.
                </p>
              ) : (
                <p className="card text-sm text-slate">Application sent with all your projects. The company will see them in its inbox.</p>
              )
            ) : null}
          </>
        ) : !isOwner ? (
          <p className="card text-sm text-slate">Only researchers can answer challenges.</p>
        ) : null}
      </aside>
    </div>
  );
}
