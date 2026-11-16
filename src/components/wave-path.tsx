import type { ComponentType } from "react";

type Step = { icon: ComponentType<{ className?: string }>; title: string; text: string };

/*
 * "The complete path": a wavy road with one station per step.
 * Desktop: horizontal wave, stations alternate crest / trough, labels sit outside the wave.
 * Mobile: vertical wave on the left, labels to the right.
 * Pure SVG + CSS, no client JS. Geometry is in px so the circles land exactly on the line.
 */

// Desktop geometry (SVG x is stretched to the container width; y is fixed px).
const TOP = 128; // space reserved above the wave for crest labels
const WAVE_H = 176;
const H = TOP + WAVE_H + 128;
const CREST = 36;
const TROUGH = 140;
const R = 32; // station radius

const D_WAVE =
  `M0,${(CREST + TROUGH) / 2 + 20} C40,${CREST} 85,${CREST} 125,${CREST} ` +
  `S300,${TROUGH} 375,${TROUGH} S550,${CREST} 625,${CREST} S800,${TROUGH} 875,${TROUGH} S965,${TROUGH - 30} 1000,${TROUGH - 50}`;

// Mobile geometry
const ROW = 132;
const MX = [30, 62]; // alternating x of station centres

export function WavePath({ steps }: { steps: Step[] }) {
  const mobilePts = steps.map((_, i) => [MX[i % 2], R + i * ROW] as const);
  let dMobile = `M${mobilePts[0][0]},0 L${mobilePts[0][0]},${mobilePts[0][1]}`;
  for (let i = 1; i < mobilePts.length; i++) {
    const [x0, y0] = mobilePts[i - 1];
    const [x1, y1] = mobilePts[i];
    const my = (y0 + y1) / 2;
    dMobile += ` C${x0},${my} ${x1},${my} ${x1},${y1}`;
  }
  const mobileH = mobilePts[mobilePts.length - 1][1] + R + 12;

  return (
    <>
      {/* Desktop / tablet */}
      <div className="relative hidden md:block" style={{ height: H }}>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 1000 ${WAVE_H}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 w-full overflow-visible"
          style={{ top: TOP, height: WAVE_H }}
        >
          <defs>
            <linearGradient id="wave-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#6cc4ae" />
              <stop offset="1" stopColor="#004643" />
            </linearGradient>
          </defs>
          {/* soft road */}
          <path d={D_WAVE} fill="none" stroke="#e4efdc" strokeWidth="16" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* travelled line */}
          <path d={D_WAVE} fill="none" stroke="url(#wave-grad)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* centre dashes */}
          <path
            d={D_WAVE}
            fill="none"
            stroke="#fbf8e6"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <ol className="relative grid h-full grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => {
            const crest = i % 2 === 0;
            const cy = TOP + (crest ? CREST : TROUGH);
            return (
              <li key={title} className="relative">
                <span
                  className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-sage text-midnight shadow-[0_0_0_6px_var(--color-page),0_8px_18px_-10px_rgba(0,70,67,0.6)] ring-2 ring-teal"
                  style={{ top: cy - R, width: R * 2, height: R * 2 }}
                >
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[0.68rem] font-bold text-[#fdfbf0]">
                    {i + 1}
                  </span>
                </span>
                <div
                  className="absolute inset-x-0 mx-auto max-w-[13rem] px-2 text-center"
                  style={crest ? { bottom: H - (cy - R) + 14 } : { top: cy + R + 14 }}
                >
                  <h3 className="whitespace-nowrap text-[1.02rem] font-semibold text-midnight xl:text-[1.12rem]">{title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-[1.6] text-slate xl:text-[0.87rem]">{text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile */}
      <div className="relative md:hidden">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 92 ${mobileH}`}
          className="absolute left-0 top-0"
          style={{ width: 92, height: mobileH }}
        >
          <path d={dMobile} fill="none" stroke="#e4efdc" strokeWidth="14" strokeLinecap="round" />
          <path d={dMobile} fill="none" stroke="#004643" strokeWidth="3" strokeLinecap="round" />
          <path d={dMobile} fill="none" stroke="#fbf8e6" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" />
        </svg>
        <ol className="relative">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex items-start" style={{ minHeight: ROW }}>
              <span
                className="relative flex shrink-0 items-center justify-center rounded-full bg-sage text-midnight shadow-[0_0_0_5px_var(--color-page)] ring-2 ring-teal"
                style={{ width: R * 2, height: R * 2, marginLeft: MX[i % 2] - R }}
              >
                <Icon className="h-6 w-6" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[0.62rem] font-bold text-[#fdfbf0]">
                  {i + 1}
                </span>
              </span>
              <div className="pt-2" style={{ marginLeft: 92 - (MX[i % 2] + R) + 16 }}>
                <h3 className="text-[1rem] font-semibold text-midnight">{title}</h3>
                <p className="mt-1.5 max-w-[16rem] text-[0.85rem] leading-[1.6] text-slate">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
