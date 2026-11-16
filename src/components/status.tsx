import { STATUS_LABEL, type HypothesisStatus } from "@/lib/validation";

const STYLE: Record<HypothesisStatus, string> = {
  VALIDATED: "bg-teal text-cream",
  INVALIDATED: "bg-navy text-cream",
  NOT_ENOUGH_DATA: "bg-slate-soft text-slate",
};
const ICON: Record<HypothesisStatus, string> = { VALIDATED: "✓", INVALIDATED: "✕", NOT_ENOUGH_DATA: "…" };

export function StatusPill({ status }: { status: HypothesisStatus }) {
  return (
    <span className={`pill ${STYLE[status]}`}>
      <span aria-hidden="true" className="mr-1">{ICON[status]}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const strong = score >= 60;
  const medium = score >= 35;
  return (
    <span className={`pill ${strong ? "bg-teal text-cream" : medium ? "bg-teal-soft text-teal" : "bg-slate-soft text-slate"}`}>
      {score}% match
    </span>
  );
}
