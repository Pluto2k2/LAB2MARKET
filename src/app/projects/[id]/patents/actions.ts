"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/forms";
import { isUuid } from "@/lib/access";

async function ownProject(projectId: string, userId: string) {
  if (!isUuid(projectId)) return false;
  const [p] = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId)))
    .limit(1);
  return Boolean(p);
}

export async function savePartner(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  const name = str(fd, "name").slice(0, 200);
  const patentCount = Math.max(0, Math.min(10_000, Number(str(fd, "patentCount")) || 0));
  if (!name || !(await ownProject(projectId, user.id))) return;
  await db
    .insert(schema.savedPartners)
    .values({
      projectId,
      name,
      patentCount,
      query: str(fd, "query").slice(0, 500),
      source: str(fd, "demo") === "1" ? "Demo data" : "EPO Open Patent Services",
    })
    .onConflictDoUpdate({
      target: [schema.savedPartners.projectId, schema.savedPartners.name],
      set: { patentCount, query: str(fd, "query").slice(0, 500) },
    });
  revalidatePath(`/projects/${projectId}/patents`);
}

export async function removePartner(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  const id = str(fd, "id");
  if (!isUuid(id) || !(await ownProject(projectId, user.id))) return;
  await db
    .delete(schema.savedPartners)
    .where(and(eq(schema.savedPartners.id, id), eq(schema.savedPartners.projectId, projectId)));
  revalidatePath(`/projects/${projectId}/patents`);
}

export async function updatePartnerNote(fd: FormData) {
  const user = await requireUser("RESEARCHER");
  const projectId = str(fd, "projectId");
  const id = str(fd, "id");
  if (!isUuid(id) || !(await ownProject(projectId, user.id))) return;
  await db
    .update(schema.savedPartners)
    .set({ note: str(fd, "note").slice(0, 500) })
    .where(and(eq(schema.savedPartners.id, id), eq(schema.savedPartners.projectId, projectId)));
  revalidatePath(`/projects/${projectId}/patents`);
}
