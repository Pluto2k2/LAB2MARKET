# Lab2Market STEM

A web platform that helps women researchers in STEM take their research from the lab to the market.

This first version contains three features:

1. **Market validation tracker.** Write hypotheses, log customer interviews, tag the pains people mention, and see live whether each hypothesis is validated (45% confirmation for B2C, 75% for B2B, from the Market Pain Validation method).
2. **Patent explorer.** Search European Patent Office data (Open Patent Services) around a project. See who files the most patents, publications per year, offices and technology classes, and save companies as potential partners.
3. **Industry challenge board.** Companies post real problems. Researchers answer with a project. Each project gets an explainable match score. Contact details are shared only when the company accepts (double opt-in).

## Stack

- Next.js 15 (App Router, server actions), React 19, TypeScript
- Tailwind CSS 4, Lexend and Fraunces fonts (self-hosted through Fontsource)
- PostgreSQL with Drizzle ORM
- Session auth: bcrypt password hashes and a signed JWT in an httpOnly cookie
- Vitest for unit tests

No AI service is used. Matching uses weighted rules and word-based text similarity, computed on your own server.

## Run it locally

Requirements: Node.js 20 or newer, and PostgreSQL 14 or newer (or Docker).

```bash
npm install
cp .env.example .env          # then set SESSION_SECRET to a long random string
docker compose up -d          # skip if you already run PostgreSQL; then edit DATABASE_URL in .env
npm run db:migrate            # creates the tables
npm run db:seed               # optional: fictional demo accounts and data
npm run dev                   # http://localhost:3000
```

Demo accounts created by the seed (all fictional, marked "demo"):

| Role | Email | Password |
| --- | --- | --- |
| Researcher | juliana@example.com | demo1234 |
| Company | agro@example.com | demo1234 |
| Company | materials@example.com | demo1234 |

To make a long random secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Live patent data (EPO Open Patent Services)

Without credentials, the patent explorer runs in **demo mode** with invented data marked "(demo)".

To use real data:

1. Create a free account at https://developers.epo.org and register an app to get a consumer key and secret.
2. Put them in `.env` as `EPO_OPS_KEY` and `EPO_OPS_SECRET`, then restart the server.

The free tier has fair-use limits (the EPO tolerates about 10 searches per minute per IP). The app caches each search for one hour and asks for at most 100 results per search, so charts are based on the first 100 results.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (validation maths, matching, patent query and parser) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | New migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset and load demo data |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Project structure

```
src/
  app/                      pages and server actions
    projects/[id]/          overview, validation/, patents/
    challenges/             board, new/, [id]/
    dashboard/              researcher and company dashboards
  components/               shared UI (forms, bars, status pills)
  db/schema.ts              database tables
  lib/
    validation.ts           hypothesis thresholds and pain tally
    matching.ts             project-to-challenge scoring
    ops/                    EPO client, CQL query builder, parser, aggregations, demo data
    session.ts, access.ts   auth and ownership checks
drizzle/                    SQL migrations
scripts/seed.ts             demo data
tests/                      unit tests
```

## Security and privacy

- Every mutation checks on the server that the user owns the project or challenge.
- Projects are only visible to their owner. Companies see a project only when the researcher applies to their challenge.
- Researcher and company identities are revealed to each other only after the company accepts an application.
- Passwords are hashed with bcrypt (12 rounds). Sessions are signed JWTs in httpOnly, SameSite=Lax cookies.
- Before production: host the database in the EU (GDPR), add rate limiting on login, email verification, password reset, account deletion and data export, and a privacy policy.

## What is not built yet

Email verification and password reset, university (TTO) accounts and dashboards, mentor accounts and booking, file uploads, notifications by email, the program database from the MVP, and billing. See the product roadmap.

Guidance only: the platform does not give legal, patent or financial advice.
