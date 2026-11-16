"use client";

import { useState } from "react";
import { FieldError } from "./action-form";
import { TRL_LABELS, TRL_NEXT_ACTIONS, TRL_STEPS } from "@/lib/constants";
import { computeTrl, type StepAnswer } from "@/lib/trl";

const OPTIONS: { value: StepAnswer; label: string }[] = [
  { value: "no", label: "Not yet" },
  { value: "wip", label: "In progress" },
  { value: "done", label: "Done" },
];

/**
 * TRL self-assessment from the first version: one step per level, answered
 * Not yet / In progress / Done. The TRL counts only up to the first step that is not done.
 * The computed level is submitted as the hidden "trl" field.
 */
export function TrlLadder({ initialTrl }: { initialTrl?: number }) {
  const [steps, setSteps] = useState<StepAnswer[]>(() =>
    TRL_STEPS.map((_, i) => (initialTrl && i < initialTrl ? "done" : "no")),
  );
  const { trl, gaps, working } = computeTrl(steps);

  const set = (i: number, v: StepAnswer) => setSteps((s) => s.map((x, j) => (j === i ? v : x)));

  return (
    <fieldset className="space-y-3">
      <legend className="label">Technology readiness: the TRL ladder</legend>
      <p className="hint -mt-1">
        For each step, mark what you have actually done. We count your TRL only up to the first step that is not done.
      </p>

      <ol className="space-y-2">
        {TRL_STEPS.map(([title, hint], i) => {
          const id = `trl-step-${i}`;
          return (
            <li key={title} className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-3 sm:flex-row sm:items-center">
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
                  i < trl ? "bg-teal text-cream" : "bg-slate-soft text-slate"
                }`}
              >
                {i + 1}
              </span>
              <span id={`${id}-l`} className="min-w-0 flex-1 text-sm font-medium text-ink">
                {title}
                <small className="block text-xs font-normal text-slate">{hint}</small>
              </span>
              <span role="radiogroup" aria-labelledby={`${id}-l`} className="flex shrink-0 overflow-hidden rounded-lg border border-line text-xs">
                {OPTIONS.map((o) => {
                  const checked = steps[i] === o.value;
                  const on =
                    o.value === "done" ? "bg-teal text-cream" : o.value === "wip" ? "bg-mint text-ink" : "bg-slate-soft text-navy";
                  return (
                    <label
                      key={o.value}
                      className={`cursor-pointer px-2.5 py-1.5 font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal ${
                        checked ? on : "bg-ivory text-slate hover:bg-sage"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={id}
                        value={o.value}
                        checked={checked}
                        onChange={() => set(i, o.value)}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ol>

      <input type="hidden" name="trl" value={trl} />

      <div aria-live="polite" className="rounded-xl border border-teal/30 bg-teal-soft p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <small className="block text-[0.65rem] font-semibold uppercase tracking-wider text-teal">Estimated TRL</small>
            <span className="font-display text-4xl font-bold text-navy tabular-nums">{trl}</span>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-navy">{trl === 0 ? "Not yet at TRL 1" : TRL_LABELS[trl - 1]}</p>
            <p className="text-slate">
              {trl === 9
                ? "Top of the scale."
                : `${working ? "Working toward" : "Next:"} TRL ${trl + 1}, ${TRL_LABELS[trl].toLowerCase()}.`}
            </p>
            {trl < 9 ? <p className="mt-1 text-xs text-slate">Next step: {TRL_NEXT_ACTIONS[trl]}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {steps.map((v, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < trl ? "bg-teal" : i === trl && v === "wip" ? "bg-mint" : "bg-slate-soft"}`}
            />
          ))}
        </div>
        {gaps.length ? (
          <p role="alert" className="mt-3 rounded-lg border border-[#c9a227] bg-[#fff6d6] p-2.5 text-xs text-ink">
            <span aria-hidden="true">⚠ </span>
            You marked step {gaps.map((g) => g + 1).join(", ")} as done, but step {trl + 1} is not. We count your TRL only up
            to the first missing step. Check step {trl + 1}, or the evidence for the later steps.
          </p>
        ) : null}
      </div>
      <FieldError name="trl" />
    </fieldset>
  );
}
