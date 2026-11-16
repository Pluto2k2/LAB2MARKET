/**
 * Demo data for local development. Everything here is fictional and marked "(demo)".
 * Run with: npm run db:seed   (it first deletes previous demo accounts)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { inArray } from "drizzle-orm";
import { db, schema } from "../src/lib/db";

const PASSWORD = "demo1234";
const EMAILS = ["juliana@example.com", "agro@example.com", "materials@example.com"];

async function main() {
  await db.delete(schema.users).where(inArray(schema.users.email, EMAILS));
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [juliana, agro, materials] = await db
    .insert(schema.users)
    .values([
      { email: EMAILS[0], name: "Juliana Demo", passwordHash, role: "RESEARCHER", organization: "Example University (demo)" },
      { email: EMAILS[1], name: "Marta Demo", passwordHash, role: "COMPANY", organization: "AgroExample (demo)" },
      { email: EMAILS[2], name: "Lena Demo", passwordHash, role: "COMPANY", organization: "MaterialsExample (demo)" },
    ])
    .returning();

  const [project] = await db
    .insert(schema.projects)
    .values({
      ownerId: juliana.id,
      title: "Bacillus strain for biological control of crop fungi",
      field: "Agronomy / Food",
      summary:
        "A soil bacterium isolated during my PhD that reduces fungal disease in wheat in lab and greenhouse tests, as an alternative to chemical fungicides. (demo)",
      keywords: ["biocontrol", "bacillus", "fungicide alternative", "wheat"],
      trl: 4,
    })
    .returning();

  const [h1, h2, h3] = await db
    .insert(schema.hypotheses)
    .values([
      { projectId: project.id, audience: "B2B", statement: "Cereal farms lose part of their harvest to fungal disease every season." },
      { projectId: project.id, audience: "B2B", statement: "Farms want to reduce chemical fungicides because of regulation and cost." },
      { projectId: project.id, audience: "B2B", statement: "Agri-input companies actively look for biological products to license." },
    ])
    .returning();

  const interviews = [
    { role: "Farm manager", org: "Farm / producer", past: "Lost about a fifth of the wheat harvest to septoria last year and paid for an extra spray.", pains: ["crop loss", "treatment cost"], v: ["CONFIRMS", "CONFIRMS", null] },
    { role: "Agronomy advisor", org: "Company", past: "Advised 30 farms to switch one treatment to a biological product after new residue limits.", pains: ["regulation", "treatment cost"], v: ["CONFIRMS", "CONFIRMS", "CONFIRMS"] },
    { role: "Cooperative buyer", org: "Company", past: "Rejected two batches last season for residue levels, which cost the cooperative a premium contract.", pains: ["regulation", "residues"], v: ["UNCLEAR", "CONFIRMS", null] },
    { role: "Farm owner", org: "Farm / producer", past: "Has not had a major fungal outbreak in three years and did not change treatments.", pains: ["treatment cost"], v: ["REJECTS", "UNCLEAR", null] },
    { role: "R&D manager", org: "Company", past: "Licensed one biocontrol strain from a university in 2024 after a two-year search.", pains: ["finding partners"], v: [null, "CONFIRMS", "CONFIRMS"] },
    { role: "Farm manager", org: "Farm / producer", past: "Replaced one chemical spray with a biological product this spring, mainly to cut costs.", pains: ["treatment cost", "crop loss"], v: ["CONFIRMS", "CONFIRMS", null] },
  ] as const;

  const hyps = [h1, h2, h3];
  for (const [i, iv] of interviews.entries()) {
    const [row] = await db
      .insert(schema.interviews)
      .values({
        projectId: project.id,
        date: new Date(Date.now() - (interviews.length - i) * 3 * 86_400_000),
        intervieweeRole: `${iv.role} (demo)`,
        organizationType: iv.org,
        pastBehaviour: iv.past,
        painTags: [...iv.pains],
      })
      .returning();
    const verdicts = iv.v
      .map((v, k) => (v ? { interviewId: row.id, hypothesisId: hyps[k].id, verdict: v } : null))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (verdicts.length) await db.insert(schema.interviewVerdicts).values(verdicts);
  }

  const inDays = (d: number) => new Date(Date.now() + d * 86_400_000);
  await db.insert(schema.challenges).values([
    {
      companyId: agro.id,
      title: "Biological alternative to chemical fungicides for cereals (demo)",
      description:
        "Our farmer customers face stricter residue limits. We look for biocontrol solutions that reduce fungal disease in wheat and barley, with field or greenhouse evidence, ready for joint field trials next season.",
      field: "Agronomy / Food",
      keywords: ["biocontrol", "fungicide alternative", "cereals", "wheat"],
      minTrl: 4,
      deadline: inDays(45),
    },
    {
      companyId: agro.id,
      title: "Low-cost sensor for early detection of plant disease (demo)",
      description:
        "We want a field sensor or imaging method that detects fungal infection before visible symptoms, so farmers can treat earlier and less. Open to lab-stage research.",
      field: "Agronomy / Food",
      keywords: ["sensor", "plant disease", "early detection", "imaging"],
      minTrl: 3,
      deadline: inDays(60),
    },
    {
      companyId: materials.id,
      title: "Recyclable bio-based packaging material (demo)",
      description:
        "We need a bio-based film for food packaging that keeps moisture out for 6 months and can be recycled in existing streams. Looking for materials research partners.",
      field: "Chemistry / Materials",
      keywords: ["packaging", "bio-based", "recycling", "polymer"],
      minTrl: 3,
      deadline: null,
    },
  ]);

  console.log("Demo data ready. Log in with:");
  console.log(`  Researcher: ${EMAILS[0]} / ${PASSWORD}`);
  console.log(`  Company:    ${EMAILS[1]} / ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
