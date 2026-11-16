/**
 * Tolerant parser for the JSON returned by OPS `published-data/search/biblio`.
 * OPS turns XML into JSON with "$" for text and "@attr" for attributes, and a list
 * with a single element becomes a plain object, so every access goes through asArray().
 */
export interface PatentRecord {
  publicationNumber: string; // e.g. EP1234567A1
  country: string;
  date: string | null; // YYYY-MM-DD
  year: number | null;
  title: string;
  applicants: string[];
  cpc: string[];
  abstract: string | null;
  url: string;
}

export interface PatentSearchResult {
  total: number;
  records: PatentRecord[];
}

type J = Record<string, unknown>;

export function asArray<T = unknown>(v: unknown): T[] {
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]) as T[];
}

function obj(v: unknown): J {
  return v && typeof v === "object" ? (v as J) : {};
}

function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  const o = obj(v);
  if ("$" in o) return String(o["$"]);
  // Abstract paragraphs: { p: [{ $ }, ...] }
  if ("p" in o) return asArray(o["p"]).map(text).join(" ");
  return "";
}

function pickLang(list: unknown): string {
  const items = asArray<J>(list);
  const en = items.find((i) => obj(i)["@lang"] === "en");
  return text(en ?? items[0]).trim();
}

/** "BASF SE [DE]" -> "BASF SE"; also trims trailing commas and spaces. */
export function cleanApplicant(name: string): string {
  return name.replace(/\s*\[[A-Z]{2}\]\s*$/, "").replace(/[\s,]+$/, "").trim();
}

function formatDate(raw: string): string | null {
  return /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : null;
}

function cpcCode(c: J): string {
  const section = text(c["section"]);
  const klass = text(c["class"]);
  const subclass = text(c["subclass"]);
  const main = text(c["main-group"]);
  const sub = text(c["subgroup"]);
  if (!section) return "";
  return `${section}${klass}${subclass}${main ? ` ${main}/${sub || "00"}` : ""}`.trim();
}

function findDocuments(node: unknown, out: J[] = []): J[] {
  if (Array.isArray(node)) {
    for (const n of node) findDocuments(n, out);
  } else if (node && typeof node === "object") {
    const o = node as J;
    if ("exchange-document" in o) {
      for (const d of asArray<J>(o["exchange-document"])) out.push(obj(d));
    } else {
      for (const v of Object.values(o)) findDocuments(v, out);
    }
  }
  return out;
}

export function parseRecord(doc: J): PatentRecord | null {
  const country = String(doc["@country"] ?? "");
  const number = String(doc["@doc-number"] ?? "");
  const kind = String(doc["@kind"] ?? "");
  if (!country || !number) return null;
  const bib = obj(doc["bibliographic-data"]);

  const pubIds = asArray<J>(obj(bib["publication-reference"])["document-id"]);
  const docdb = pubIds.find((d) => obj(d)["@document-id-type"] === "docdb") ?? pubIds[0];
  const date = formatDate(text(obj(docdb)["date"]));

  const applicantNodes = asArray<J>(obj(obj(bib["parties"])["applicants"])["applicant"]);
  const preferred = applicantNodes.filter((a) => obj(a)["@data-format"] === "epodoc");
  const source = preferred.length ? preferred : applicantNodes;
  const applicants = [
    ...new Set(source.map((a) => cleanApplicant(text(obj(obj(a)["applicant-name"])["name"]))).filter(Boolean)),
  ];

  const classifications = asArray<J>(obj(bib["patent-classifications"])["patent-classification"]);
  const cpc = [...new Set(classifications.map((c) => cpcCode(obj(c))).filter(Boolean))].slice(0, 4);

  const abstract = pickLang(doc["abstract"]) || null;
  const publicationNumber = `${country}${number}${kind}`;

  return {
    publicationNumber,
    country,
    date,
    year: date ? Number(date.slice(0, 4)) : null,
    title: pickLang(bib["invention-title"]) || "(no title)",
    applicants,
    cpc,
    abstract,
    url: `https://worldwide.espacenet.com/patent/search?q=pn%3D${encodeURIComponent(publicationNumber)}`,
  };
}

export function parseSearchResponse(json: unknown): PatentSearchResult {
  const root = obj(obj(json)["ops:world-patent-data"]);
  const search = obj(root["ops:biblio-search"]);
  const total = Number(search["@total-result-count"] ?? 0) || 0;
  const records = findDocuments(search["ops:search-result"] ?? search)
    .map(parseRecord)
    .filter((r): r is PatentRecord => r !== null);
  return { total, records };
}
