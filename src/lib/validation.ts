/**
 * Market-pain validation maths, following the hackathon's "Market Pain Validation" workshop:
 * B2C hypotheses are validated at 45% confirmation, B2B hypotheses at 75%.
 * The minimum sample sizes are our own design choice, shown in the UI so researchers can see them.
 */
export type AudienceKind = "B2C" | "B2B";
export type VerdictKind = "CONFIRMS" | "REJECTS" | "UNCLEAR";

export const THRESHOLD: Record<AudienceKind, number> = { B2C: 0.45, B2B: 0.75 };
export const MIN_SAMPLE: Record<AudienceKind, number> = { B2C: 20, B2B: 5 };

export type HypothesisStatus = "NOT_ENOUGH_DATA" | "VALIDATED" | "INVALIDATED";

export interface HypothesisResult {
  confirms: number;
  rejects: number;
  unclear: number;
  total: number;
  /** confirms / total, 0 when there is no data. Unclear answers count in the total on purpose: they are not a confirmation. */
  rate: number;
  threshold: number;
  minSample: number;
  status: HypothesisStatus;
}

export function evaluateHypothesis(audience: AudienceKind, verdicts: VerdictKind[]): HypothesisResult {
  const confirms = verdicts.filter((v) => v === "CONFIRMS").length;
  const rejects = verdicts.filter((v) => v === "REJECTS").length;
  const unclear = verdicts.filter((v) => v === "UNCLEAR").length;
  const total = verdicts.length;
  const rate = total === 0 ? 0 : confirms / total;
  const threshold = THRESHOLD[audience];
  const minSample = MIN_SAMPLE[audience];
  let status: HypothesisStatus = "NOT_ENOUGH_DATA";
  if (total >= minSample) status = rate >= threshold ? "VALIDATED" : "INVALIDATED";
  return { confirms, rejects, unclear, total, rate, threshold, minSample, status };
}

/** Count pain tags across interviews, most frequent first, ties alphabetical. */
export function tallyPains(interviews: { painTags: string[] }[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const i of interviews) {
    for (const raw of new Set(i.painTags.map((t) => t.trim().toLowerCase()).filter(Boolean))) {
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const STATUS_LABEL: Record<HypothesisStatus, string> = {
  NOT_ENOUGH_DATA: "Not enough interviews yet",
  VALIDATED: "Validated",
  INVALIDATED: "Not validated",
};
