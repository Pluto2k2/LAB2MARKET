import type { Bucket } from "@/lib/ops/aggregate";

/** Horizontal bar list. Text carries the numbers, so colour is never the only signal. */
export function BarList({ data, label, color = "bg-teal" }: { data: Bucket[]; label: string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="space-y-2" aria-label={label}>
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-sm">
          <span className="truncate" title={d.key}>{d.key}</span>
          <span className="tabular-nums text-xs text-slate">{d.count}</span>
          <span className="col-span-2 mt-1 h-2 rounded-full bg-slate-soft">
            <span className={`block h-full rounded-full ${color}`} style={{ width: `${(d.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns for a time series (filings per year). */
export function YearColumns({ data }: { data: Bucket[] }) {
  if (!data.length) return <p className="text-sm text-slate">No dates in these results.</p>;
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Publications per year: ${data.map((d) => `${d.key}: ${d.count}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] tabular-nums text-slate">{d.count}</span>
            <div className="w-full rounded-t bg-navy" style={{ height: `${(d.count / max) * 85}%`, minHeight: 2 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-[10px] tabular-nums text-slate">
            {d.key.slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
