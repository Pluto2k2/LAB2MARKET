"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fromZod, str, type FormState } from "@/lib/forms";
import { FIELDS } from "@/lib/constants";
import { parseKeywords } from "@/lib/text";
import { isUuid } from "@/lib/access";

const challengeSchema = z.object({
  title: z.string().min(6, "Write a clear title (6 characters or more).").max(140),
  description: z.string().min(40, "Describe the problem in at least 40 characters.").max(4000),
  field: z.enum(FIELDS, { message: "Choose a field." }),
  keywords: z.array(z.string()).min(1, "Add at least one keyword."),
  minTrl: z.number().int().min(1).max(9).nullable(),
  deadline: z
    .date()
    .nullable()
    .refine((d) => d === null || d > new Date(), { message: "The deadline must be in the future." }),
});

export async function createChallenge(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("COMPANY");
  const minTrlRaw = str(fd, "minTrl");
  const deadlineRaw = str(fd, "deadline");
  const parsed = challengeSchema.safeParse({
    title: str(fd, "title"),
    description: str(fd, "description"),
    field: str(fd, "field"),
    keywords: parseKeywords(str(fd, "keywords")),
    minTrl: minTrlRaw ? Number(minTrlRaw) : null,
    deadline: deadlineRaw ? new Date(`${deadlineRaw}T23:59:59`) : null,
  });
  if (!parsed.success) return fromZod(parsed.error);
  const [c] = await db
    .insert(schema.challenges)
    .values({ ...parsed.data, companyId: user.id })
    .returning({ id: schema.challenges.id });
  redirect(`/challenges/${c.id}`);
}

export async function setChallengeStatus(fd: FormData) {
  const user = await requireUser("COMPANY");
  const id = str(fd, "id");
  const status = str(fd, "status") === "CLOSED" ? "CLOSED" : "OPEN";
  if (!isUuid(id)) return;
  await db
    .update(schema.challenges)
    .set({ status })
    .where(and(eq(schema.challenges.id, id), eq(schema.challenges.companyId, user.id)));
  revalidatePath(`/challenges/${id}`);
  revalidatePath("/challenges");
}

const responseSchema = z.object({
  message: z.string().min(30, "Explain in at least 30 characters how your research answers the challenge.").max(2000),
});

export async function respondToChallenge(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("RESEARCHER");
  const challengeId = str(fd, "challengeId");
  const projectId = str(fd, "projectId");
  if (!isUuid(challengeId)) return { error: "Challenge not found." };
  if (!isUuid(projectId)) return { fieldErrors: { projectId: "Choose one of your projects." } };

  const parsed = responseSchema.safeParse({ message: str(fd, "message") });
  if (!parsed.success) return fromZod(parsed.error);

  const [challenge] = await db
    .select({ id: schema.challenges.id, status: schema.challenges.status, deadline: schema.challenges.deadline })
    .from(schema.challenges)
    .where(eq(schema.challenges.id, challengeId))
    .limit(1);
  if (!challenge) return { error: "Challenge not found." };
  if (challenge.status !== "OPEN" || (challenge.deadline && challenge.deadline < new Date())) {
    return { error: "This challenge is closed to new applications." };
  }
  const [project] = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, user.id)))
    .limit(1);
  if (!project) return { fieldErrors: { projectId: "Choose one of your projects." } };

  const inserted = await db
    .insert(schema.challengeResponses)
    .values({ challengeId, projectId, researcherId: user.id, message: parsed.data.message })
    .onConflictDoNothing()
    .returning({ id: schema.challengeResponses.id });
  if (!inserted.length) return { error: "You already applied with this project." };

  revalidatePath(`/challenges/${challengeId}`);
  return { ok: "Application sent. Your contact details stay private until the company accepts." };
}

export async function setResponseStatus(fd: FormData) {
  const user = await requireUser("COMPANY");
  const responseId = str(fd, "responseId");
  const status = str(fd, "status");
  if (!isUuid(responseId) || (status !== "ACCEPTED" && status !== "DECLINED")) return;
  // Only the company that owns the challenge may decide.
  const [row] = await db
    .select({ challengeId: schema.challengeResponses.challengeId })
    .from(schema.challengeResponses)
    .innerJoin(schema.challenges, eq(schema.challenges.id, schema.challengeResponses.challengeId))
    .where(and(eq(schema.challengeResponses.id, responseId), eq(schema.challenges.companyId, user.id)))
    .limit(1);
  if (!row) return;
  await db.update(schema.challengeResponses).set({ status }).where(eq(schema.challengeResponses.id, responseId));
  revalidatePath(`/challenges/${row.challengeId}`);
}

export async function withdrawResponse(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const responseId = str(fd, "responseId");
  const challengeId = str(fd, "challengeId");
  if (!isUuid(responseId)) return;
  await db
    .delete(schema.challengeResponses)
    .where(and(eq(schema.challengeResponses.id, responseId), eq(schema.challengeResponses.researcherId, user.id)));
  if (isUuid(challengeId)) revalidatePath(`/challenges/${challengeId}`);
}
