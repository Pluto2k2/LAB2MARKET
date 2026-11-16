import "server-only";
import { and, desc, eq, gte, isNull, or } from "drizzle-orm";
import { db, schema } from "./db";
import { matchProjectToChallenge, type MatchResult } from "./matching";
import { evaluateHypothesis, type HypothesisResult } from "./validation";

type Project = typeof schema.projects.$inferSelect;

/** Open challenges whose deadline has not passed, newest first. */
export async function openChallenges() {
  return db
    .select({
      id: schema.challenges.id,
      title: schema.challenges.title,
      description: schema.challenges.description,
      field: schema.challenges.field,
      keywords: schema.challenges.keywords,
      minTrl: schema.challenges.minTrl,
      deadline: schema.challenges.deadline,
      createdAt: schema.challenges.createdAt,
      companyName: schema.users.organization,
    })
    .from(schema.challenges)
    .innerJoin(schema.users, eq(schema.users.id, schema.challenges.companyId))
    .where(
      and(
        eq(schema.challenges.status, "OPEN"),
        or(isNull(schema.challenges.deadline), gte(schema.challenges.deadline, new Date())),
      ),
    )
    .orderBy(desc(schema.challenges.createdAt));
}

export type OpenChallenge = Awaited<ReturnType<typeof openChallenges>>[number];

export function rankChallenges(project: Project, list: OpenChallenge[]): (OpenChallenge & { match: MatchResult })[] {
  return list
    .map((c) => ({ ...c, match: matchProjectToChallenge(project, c) }))
    .sort((a, b) => b.match.score - a.match.score);
}

/** Hypotheses of a project with their validation result. */
export async function hypothesesWithResults(projectId: string) {
  const hyps = await db.query.hypotheses.findMany({
    where: eq(schema.hypotheses.projectId, projectId),
    with: { verdicts: { columns: { verdict: true } } },
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });
  return hyps.map((h) => ({
    id: h.id,
    statement: h.statement,
    audience: h.audience,
    result: evaluateHypothesis(
      h.audience,
      h.verdicts.map((v) => v.verdict),
    ) as HypothesisResult,
  }));
}
