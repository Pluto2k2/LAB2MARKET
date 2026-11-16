import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { Role } from "@/db/schema";

const COOKIE = "l2m_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string, role: Role) {
  const token = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

async function readSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: string | null;
};

/** Current user, read from the database so a deleted user loses access at once. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const s = await readSession();
  if (!s) return null;
  const [u] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      organization: schema.users.organization,
    })
    .from(schema.users)
    .where(eq(schema.users.id, s.userId))
    .limit(1);
  return u ?? null;
});

export async function requireUser(role?: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role && user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
