/**
 * Builds a CQL query for EPO Open Patent Services (OPS) bibliographic search.
 * Field codes used: ta = title + abstract, pa = applicant, cpc = CPC classification, pd = publication date.
 */
export interface PatentQuery {
  keywords: string;
  cpc?: string;
  applicant?: string;
  fromYear?: number;
  toYear?: number;
}

const MAX_WORDS = 6;

function clean(s: string): string {
  // Strip characters that have meaning in CQL so user input cannot break the query.
  return s.replace(/["()=<>\\/]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildCql(q: PatentQuery): string {
  const parts: string[] = [];
  const words = clean(q.keywords)
    .split(" ")
    .filter((w) => w.length >= 2 && !/^(and|or|not|prox|within|all|any)$/i.test(w))
    .slice(0, MAX_WORDS);
  for (const w of words) parts.push(`ta=${w}`);

  const cpc = q.cpc ? q.cpc.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (cpc) parts.push(`cpc=${cpc}`);

  const applicant = q.applicant ? clean(q.applicant) : "";
  if (applicant) parts.push(`pa="${applicant}"`);

  const from = q.fromYear;
  const to = q.toYear;
  if (from && to) parts.push(`pd within "${Math.min(from, to)} ${Math.max(from, to)}"`);
  else if (from) parts.push(`pd>=${from}`);
  else if (to) parts.push(`pd<=${to}`);

  if (parts.length === 0) throw new Error("Enter at least one keyword or a classification code.");
  return parts.join(" and ");
}
