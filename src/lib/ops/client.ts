import "server-only";
import { buildCql, type PatentQuery } from "./query";
import { parseSearchResponse, type PatentSearchResult } from "./parse";
import { demoSearchResponse } from "./demo";

const OPS_BASE = "https://ops.epo.org/3.2";
const PAGE = 100; // OPS returns at most 100 results per request
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface PatentSearchOutcome extends PatentSearchResult {
  cql: string;
  demo: boolean;
  fetched: number;
}

export class PatentSearchError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

let token: { value: string; expiresAt: number } | null = null;
const cache = new Map<string, { at: number; result: PatentSearchOutcome }>();

export function opsConfigured(): boolean {
  return Boolean(process.env.EPO_OPS_KEY && process.env.EPO_OPS_SECRET);
}

async function getToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 30_000) return token.value;
  const basic = Buffer.from(`${process.env.EPO_OPS_KEY}:${process.env.EPO_OPS_SECRET}`).toString("base64");
  const res = await fetch(`${OPS_BASE}/auth/accesstoken`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new PatentSearchError("The EPO rejected the API credentials. Check EPO_OPS_KEY and EPO_OPS_SECRET.", res.status);
  const data = (await res.json()) as { access_token: string; expires_in: string | number };
  token = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
  return token.value;
}

export async function searchPatents(q: PatentQuery): Promise<PatentSearchOutcome> {
  const cql = buildCql(q);

  if (!opsConfigured()) {
    const parsed = parseSearchResponse(demoSearchResponse(q.keywords));
    return { ...parsed, cql, demo: true, fetched: parsed.records.length };
  }

  const hit = cache.get(cql);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;

  const url = `${OPS_BASE}/rest-services/published-data/search/biblio?q=${encodeURIComponent(cql)}&Range=1-${PAGE}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await getToken()}`, Accept: "application/json" },
    cache: "no-store",
  });

  // OPS answers 404 when a search has no results.
  if (res.status === 404) {
    const empty: PatentSearchOutcome = { total: 0, records: [], cql, demo: false, fetched: 0 };
    cache.set(cql, { at: Date.now(), result: empty });
    return empty;
  }
  if (res.status === 403) throw new PatentSearchError("The EPO usage limit was reached. Try again in a few minutes.", 403);
  if (res.status === 400) throw new PatentSearchError("The search could not be understood. Try simpler keywords.", 400);
  if (!res.ok) throw new PatentSearchError(`The EPO service answered with an error (${res.status}). Try again later.`, res.status);

  const parsed = parseSearchResponse(await res.json());
  const result: PatentSearchOutcome = { ...parsed, cql, demo: false, fetched: parsed.records.length };
  cache.set(cql, { at: Date.now(), result });
  return result;
}
