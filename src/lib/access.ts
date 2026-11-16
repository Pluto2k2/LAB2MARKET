import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "./db";
import type { CurrentUser } from "./session";

/** Loads a project only if the current user owns it (admins can see all). Otherwise 404, so ids cannot be probed. */
export async function getOwnedProject(projectId: string, user: CurrentUser) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const where =
    user.role === "ADMIN"
      ? eq(schema.projects.id, projectId)
      : and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, user.id));
  const [project] = await db.select().from(schema.projects).where(where).limit(1);
  if (!project) notFound();
  return project;
}

export function isUuid(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);
}
