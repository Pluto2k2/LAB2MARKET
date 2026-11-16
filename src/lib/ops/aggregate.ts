import type { PatentRecord } from "./parse";

export interface Bucket {
  key: string;
  count: number;
}

function top(map: Map<string, number>, n: number): Bucket[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, n);
}

/** Companies (and other applicants) filing the most patents in the result set: potential partners or licensees. */
export function topApplicants(records: PatentRecord[], n = 10): Bucket[] {
  const m = new Map<string, number>();
  for (const r of records) for (const a of r.applicants) m.set(a, (m.get(a) ?? 0) + 1);
  return top(m, n);
}

export function byYear(records: PatentRecord[]): Bucket[] {
  const m = new Map<string, number>();
  for (const r of records) if (r.year) m.set(String(r.year), (m.get(String(r.year)) ?? 0) + 1);
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key));
}

export function byCountry(records: PatentRecord[], n = 8): Bucket[] {
  const m = new Map<string, number>();
  for (const r of records) m.set(r.country, (m.get(r.country) ?? 0) + 1);
  return top(m, n);
}

export function topCpc(records: PatentRecord[], n = 8): Bucket[] {
  const m = new Map<string, number>();
  for (const r of records) {
    // Group at subclass level (e.g. A01N) so the chart stays readable.
    for (const c of new Set(r.cpc.map((x) => x.slice(0, 4)))) m.set(c, (m.get(c) ?? 0) + 1);
  }
  return top(m, n);
}
