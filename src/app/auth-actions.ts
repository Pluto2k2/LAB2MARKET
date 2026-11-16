"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { fromZod, str, type FormState } from "@/lib/forms";

const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your name.").max(80),
    email: z.string().email("Enter a valid email address.").max(120),
    password: z.string().min(8, "Use at least 8 characters.").max(200),
    role: z.enum(["RESEARCHER", "COMPANY"], { message: "Choose researcher or company." }),
    organization: z.string().max(120).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.role === "COMPANY" && !d.organization) {
      ctx.addIssue({ code: "custom", path: ["organization"], message: "Enter your company name." });
    }
  });

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    password: typeof fd.get("password") === "string" ? (fd.get("password") as string) : "",
    role: str(fd, "role"),
    organization: str(fd, "organization") || undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, d.email)).limit(1);
  if (existing.length) return { fieldErrors: { email: "An account with this email already exists. Log in instead." } };

  const passwordHash = await bcrypt.hash(d.password, 12);
  const [user] = await db
    .insert(schema.users)
    .values({ name: d.name, email: d.email, passwordHash, role: d.role, organization: d.organization ?? null })
    .returning({ id: schema.users.id, role: schema.users.role });
  await createSession(user.id, user.role);
  redirect("/dashboard");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  if (!email || !password) return { error: "Enter your email and password." };
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Same message whether the email or the password is wrong, so accounts cannot be discovered.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  await createSession(user.id, user.role);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
