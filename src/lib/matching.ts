import { tokenize } from "./text";

/**
 * Explainable project <-> challenge matching. No AI: a weighted score of
 *  - keyword overlap (Jaccard)            45 pts
 *  - text similarity (cosine on words)    25 pts
 *  - same field                           20 pts
 *  - TRL meets the company's minimum      10 pts (or a penalty when below)
 */
export interface MatchProject {
  title: string;
  field: string;
  summary: string;
  keywords: string[];
  trl: number;
}
export interface MatchChallenge {
  title: string;
  description: string;
  field: string;
  keywords: string[];
  minTrl: number | null;
}
export interface MatchResult {
  score: number; // 0..100
  reasons: string[];
  sharedKeywords: string[];
}

function termVector(text: string): Map<string, number> {
  const v = new Map<string, number>();
  for (const t of tokenize(text)) v.set(t, (v.get(t) ?? 0) + 1);
  return v;
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, x] of a) na += x * x;
  for (const [, y] of b) nb += y * y;
  for (const [k, x] of a) dot += x * (b.get(k) ?? 0);
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function keywordTokens(keywords: string[]): Set<string> {
  const s = new Set<string>();
  for (const k of keywords) {
    s.add(k.toLowerCase());
    for (const t of tokenize(k)) s.add(t);
  }
  return s;
}

export function matchProjectToChallenge(p: MatchProject, c: MatchChallenge): MatchResult {
  const reasons: string[] = [];
  const pk = keywordTokens(p.keywords);
  const ck = keywordTokens(c.keywords);
  const shared = [...pk].filter((k) => ck.has(k));
  const union = new Set([...pk, ...ck]).size;
  const jaccard = union === 0 ? 0 : shared.length / union;
  // Overlap of a few keywords is already meaningful, so scale up and cap.
  const kwPts = Math.min(45, Math.round(jaccard * 45 * 2.5));
  if (shared.length) reasons.push(`Shared keywords: ${shared.slice(0, 5).join(", ")}`);

  const sim = cosine(
    termVector(`${p.title} ${p.summary} ${p.keywords.join(" ")}`),
    termVector(`${c.title} ${c.description} ${c.keywords.join(" ")}`),
  );
  const textPts = Math.round(Math.min(1, sim * 2) * 25);
  if (textPts >= 8) reasons.push("Similar wording in the descriptions");

  const sameField = p.field.trim().toLowerCase() === c.field.trim().toLowerCase();
  const fieldPts = sameField ? 20 : 0;
  if (sameField) reasons.push(`Same field: ${c.field}`);

  let trlPts = 10;
  if (c.minTrl != null) {
    if (p.trl >= c.minTrl) reasons.push(`Your TRL ${p.trl} meets the minimum TRL ${c.minTrl}`);
    else {
      trlPts = -15;
      reasons.push(`Your TRL ${p.trl} is below the minimum TRL ${c.minTrl}`);
    }
  }

  const score = Math.max(0, Math.min(100, kwPts + textPts + fieldPts + trlPts));
  return { score, reasons, sharedKeywords: shared };
}
