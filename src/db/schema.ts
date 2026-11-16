import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["RESEARCHER", "COMPANY", "ADMIN"]);
export const audienceEnum = pgEnum("audience", ["B2C", "B2B"]);
export const verdictEnum = pgEnum("verdict", ["CONFIRMS", "REJECTS", "UNCLEAR"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["OPEN", "CLOSED"]);
export const responseStatusEnum = pgEnum("response_status", ["PENDING", "ACCEPTED", "DECLINED"]);

const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  organization: text("organization"),
  createdAt: created(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    field: text("field").notNull(),
    summary: text("summary").notNull(),
    keywords: text("keywords").array().notNull().default([]),
    trl: integer("trl").notNull().default(1),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId)],
);

/** A statement to test with real people, e.g. "Farmers lose crops to fungi every season". */
export const hypotheses = pgTable(
  "hypotheses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    statement: text("statement").notNull(),
    audience: audienceEnum("audience").notNull(),
    createdAt: created(),
  },
  (t) => [index("hypotheses_project_idx").on(t.projectId)],
);

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    intervieweeRole: text("interviewee_role").notNull(),
    organizationType: text("organization_type").notNull(),
    /** What the person actually did in the past: the strongest evidence. */
    pastBehaviour: text("past_behaviour").notNull(),
    notes: text("notes").notNull().default(""),
    painTags: text("pain_tags").array().notNull().default([]),
    createdAt: created(),
  },
  (t) => [index("interviews_project_idx").on(t.projectId)],
);

export const interviewVerdicts = pgTable(
  "interview_verdicts",
  {
    interviewId: uuid("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    hypothesisId: uuid("hypothesis_id")
      .notNull()
      .references(() => hypotheses.id, { onDelete: "cascade" }),
    verdict: verdictEnum("verdict").notNull(),
  },
  (t) => [primaryKey({ columns: [t.interviewId, t.hypothesisId] })],
);

/** A company found through the patent explorer, kept as a potential partner. */
export const savedPartners = pgTable(
  "saved_partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    patentCount: integer("patent_count").notNull(),
    query: text("query").notNull(),
    source: text("source").notNull(),
    note: text("note").notNull().default(""),
    createdAt: created(),
  },
  (t) => [uniqueIndex("saved_partners_project_name_uq").on(t.projectId, t.name)],
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    field: text("field").notNull(),
    keywords: text("keywords").array().notNull().default([]),
    minTrl: integer("min_trl"),
    deadline: timestamp("deadline", { withTimezone: true }),
    status: challengeStatusEnum("status").notNull().default("OPEN"),
    createdAt: created(),
  },
  (t) => [index("challenges_status_idx").on(t.status)],
);

/** Double opt-in: the researcher applies, the company accepts. Contacts are shown only when ACCEPTED. */
export const challengeResponses = pgTable(
  "challenge_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    researcherId: uuid("researcher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    status: responseStatusEnum("status").notNull().default("PENDING"),
    createdAt: created(),
  },
  (t) => [uniqueIndex("responses_challenge_project_uq").on(t.challengeId, t.projectId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  challenges: many(challenges),
  responses: many(challengeResponses),
}));
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  hypotheses: many(hypotheses),
  interviews: many(interviews),
  partners: many(savedPartners),
  responses: many(challengeResponses),
}));
export const hypothesesRelations = relations(hypotheses, ({ one, many }) => ({
  project: one(projects, { fields: [hypotheses.projectId], references: [projects.id] }),
  verdicts: many(interviewVerdicts),
}));
export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  project: one(projects, { fields: [interviews.projectId], references: [projects.id] }),
  verdicts: many(interviewVerdicts),
}));
export const verdictsRelations = relations(interviewVerdicts, ({ one }) => ({
  interview: one(interviews, { fields: [interviewVerdicts.interviewId], references: [interviews.id] }),
  hypothesis: one(hypotheses, { fields: [interviewVerdicts.hypothesisId], references: [hypotheses.id] }),
}));
export const savedPartnersRelations = relations(savedPartners, ({ one }) => ({
  project: one(projects, { fields: [savedPartners.projectId], references: [projects.id] }),
}));
export const challengesRelations = relations(challenges, ({ one, many }) => ({
  company: one(users, { fields: [challenges.companyId], references: [users.id] }),
  responses: many(challengeResponses),
}));
export const responsesRelations = relations(challengeResponses, ({ one }) => ({
  challenge: one(challenges, { fields: [challengeResponses.challengeId], references: [challenges.id] }),
  project: one(projects, { fields: [challengeResponses.projectId], references: [projects.id] }),
  researcher: one(users, { fields: [challengeResponses.researcherId], references: [users.id] }),
}));

export type Role = (typeof roleEnum.enumValues)[number];
