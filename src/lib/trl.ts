export type StepAnswer = "no" | "wip" | "done";

/**
 * TRL from the ladder answers: count consecutive "done" steps from the start.
 * `gaps` lists later steps marked done that do not count; `working` is true when
 * the next step is in progress.
 */
export function computeTrl(steps: StepAnswer[]) {
  let trl = 0;
  while (trl < steps.length && steps[trl] === "done") trl++;
  const gaps: number[] = [];
  for (let i = trl + 1; i < steps.length; i++) if (steps[i] === "done") gaps.push(i);
  const working = trl < steps.length && steps[trl] === "wip";
  return { trl, gaps, working };
}
