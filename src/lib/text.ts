const STOPWORDS = new Set(
  (
    "a an and are as at be by for from has have in into is it its of on or that the this to with we our you your " +
    "their they them using use used new based can will not no more most than such which who what when where how " +
    "also about over under between within via per de la le les des et du en"
  ).split(" "),
);

/** Lowercase words of 3+ letters, without stopwords. Accents are removed so "génie" matches "genie". */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Parse a comma-separated keyword field into clean, unique, lowercase keywords. */
export function parseKeywords(raw: string, max = 12): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const k = part.trim().toLowerCase().replace(/\s+/g, " ");
    if (k && k.length <= 60) seen.add(k);
    if (seen.size >= max) break;
  }
  return [...seen];
}
