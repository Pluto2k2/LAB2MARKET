"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fromZod, str, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/access";
import { parseKeywords } from "@/lib/text";

async function ownProject(projectId: string, userId: string) {
  if (!isUuid(projectId)) return false;
  const [p] = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId)))
    .limit(1);
  return Boolean(p);
}

const hypothesisSchema = z.object({
  statement: z.string().min(10, "Write the hypothesis as a full sentence (10 characters or more).").max(300),
  audience: z.enum(["B2C", "B2B"], { message: "Choose who you interview." }),
});

export async function addHypothesis(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  if (!(await ownProject(projectId, user.id))) return { error: "Project not found." };
  const parsed = hypothesisSchema.safeParse({ statement: str(fd, "statement"), audience: str(fd, "audience") });
  if (!parsed.success) return fromZod(parsed.error);
  await db.insert(schema.hypotheses).values({ projectId, ...parsed.data });
  revalidatePath(`/projects/${projectId}/validation`);
  return { ok: "Hypothesis added." };
}

export async function deleteHypothesis(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  const id = str(fd, "id");
  if (!isUuid(id) || !(await ownProject(projectId, user.id))) return;
  await db.delete(schema.hypotheses).where(and(eq(schema.hypotheses.id, id), eq(schema.hypotheses.projectId, projectId)));
  revalidatePath(`/projects/${projectId}/validation`);
}

const interviewSchema = z.object({
  date: z.coerce.date({ message: "Enter the interview date." }).refine((d) => d <= new Date(Date.now() + 86_400_000), {
    message: "The interview date cannot be in the future.",
  }),
  intervieweeRole: z.string().min(2, "Enter the person's role, e.g. farm manager.").max(100),
  organizationType: z.string().min(2, "Choose the type of organisation.").max(60),
  pastBehaviour: z
    .string()
    .min(15, "Describe what the person actually did in the past (15 characters or more).")
    .max(1500),
  notes: z.string().max(3000),
  painTags: z.array(z.string()).max(10),
});

export async function addInterview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  if (!(await ownProject(projectId, user.id))) return { error: "Project not found." };
  const parsed = interviewSchema.safeParse({
    date: str(fd, "date"),
    intervieweeRole: str(fd, "intervieweeRole"),
    organizationType: str(fd, "organizationType"),
    pastBehaviour: str(fd, "pastBehaviour"),
    notes: str(fd, "notes"),
    painTags: parseKeywords(str(fd, "painTags"), 10),
  });
  if (!parsed.success) return fromZod(parsed.error);

  // Verdicts arrive as verdict_<hypothesisId> = CONFIRMS | REJECTS | UNCLEAR | "" (not discussed).
  const entries: { hypothesisId: string; verdict: "CONFIRMS" | "REJECTS" | "UNCLEAR" }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("verdict_") || typeof value !== "string" || !value) continue;
    const hypothesisId = key.slice("verdict_".length);
    if (isUuid(hypothesisId) && (value === "CONFIRMS" || value === "REJECTS" || value === "UNCLEAR")) {
      entries.push({ hypothesisId, verdict: value });
    }
  }
  // Only keep verdicts for hypotheses that belong to this project.
  const valid = entries.length
    ? await db
        .select({ id: schema.hypotheses.id })
        .from(schema.hypotheses)
        .where(
          and(
            eq(schema.hypotheses.projectId, projectId),
            inArray(
              schema.hypotheses.id,
              entries.map((e) => e.hypothesisId),
            ),
          ),
        )
    : [];
  const validIds = new Set(valid.map((v) => v.id));

  await db.transaction(async (tx) => {
    const [iv] = await tx
      .insert(schema.interviews)
      .values({ projectId, ...parsed.data })
      .returning({ id: schema.interviews.id });
    const rows = entries.filter((e) => validIds.has(e.hypothesisId)).map((e) => ({ interviewId: iv.id, ...e }));
    if (rows.length) await tx.insert(schema.interviewVerdicts).values(rows);
  });

  revalidatePath(`/projects/${projectId}/validation`);
  return { ok: "Interview saved. The dashboard is updated." };
}

export async function deleteInterview(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  const id = str(fd, "id");
  if (!isUuid(id) || !(await ownProject(projectId, user.id))) return;
  await db.delete(schema.interviews).where(and(eq(schema.interviews.id, id), eq(schema.interviews.projectId, projectId)));
  revalidatePath(`/projects/${projectId}/validation`);
}
