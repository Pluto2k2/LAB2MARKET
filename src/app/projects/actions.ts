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

const projectSchema = z.object({
  title: z.string().min(4, "Give your project a title (4 characters or more).").max(140),
  field: z.enum(FIELDS, { message: "Choose a field." }),
  summary: z.string().min(20, "Describe the project in at least 20 characters.").max(1500),
  keywords: z.array(z.string()).min(1, "Add at least one keyword."),
  trl: z.coerce.number().int().min(1, "Mark at least step 1 of the TRL ladder as done.").max(9, "TRL is between 1 and 9."),
});

function readProject(fd: FormData) {
  return projectSchema.safeParse({
    title: str(fd, "title"),
    field: str(fd, "field"),
    summary: str(fd, "summary"),
    keywords: parseKeywords(str(fd, "keywords")),
    trl: str(fd, "trl"),
  });
}

export async function createProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("RESEARCHER");
  const parsed = readProject(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const [p] = await db
    .insert(schema.projects)
    .values({ ...parsed.data, ownerId: user.id })
    .returning({ id: schema.projects.id });
  redirect(`/projects/${p.id}`);
}

export async function updateProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("RESEARCHER");
  const id = str(fd, "id");
  if (!isUuid(id)) return { error: "Project not found." };
  const parsed = readProject(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const updated = await db
    .update(schema.projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, user.id)))
    .returning({ id: schema.projects.id });
  if (!updated.length) return { error: "Project not found." };
  revalidatePath(`/projects/${id}`);
  return { ok: "Project saved." };
}

export async function deleteProject(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const id = str(fd, "id");
  if (!isUuid(id)) return;
  await db.delete(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, user.id)));
  redirect("/dashboard");
}
