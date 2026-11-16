import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { IconArrow, IconBulb, IconRocket, IconSearch, IconUsers } from "@/components/icons";
import { WavePath } from "@/components/wave-path";

const STEPS = [
  { icon: IconBulb, title: "Validate", text: "Confirm your idea with real market feedback." },
  { icon: IconSearch, title: "Explore", text: "Discover relevant patents, companies and opportunities." },
  { icon: IconUsers, title: "Connect", text: "Reach the right industry partners." },
  { icon: IconRocket, title: "Make an impact", text: "See your research move from lab to market." },
];

const TOOLS = [
  {
    n: "01",
    title: "Validate the market pain",
    text: "Log customer interviews, tag the pains you hear, and see live whether each hypothesis passes the 45% (B2C) or 75% (B2B) threshold.",
    img: { src: "/illustrations/tool-validate.png", w: 150, h: 120 },
    href: "/signup?role=RESEARCHER",
  },
  {
    n: "02",
    title: "Explore the patent landscape",
    text: "Search European Patent Office data around your topic. See who files patents, how the field grows, and save companies as potential partners.",
    img: { src: "/illustrations/tool-patents.png", w: 160, h: 126 },
    href: "/signup?role=RESEARCHER",
  },
  {
    n: "03",
    title: "Answer industry challenges",
    text: "Companies post real problems. You answer with your research, and contact details are shared only when both sides agree.",
    img: { src: "/illustrations/tool-challenges.png", w: 150, h: 126 },
    href: "/signup",
  },
];

const STATS = [
  { value: "1 in 3", label: "researchers globally are women", source: "UNESCO UIS, 2025" },
  { value: "18.1%", label: "of patent inventors are women", source: "International applications, WIPO 2026" },
  { value: "∞", label: "opportunities to turn ideas into impact", source: null },
];

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="-mt-8 sm:-mt-10">
      {/* Hero */}
      <section aria-labelledby="hero-title" className="grid items-center gap-10 pb-14 pt-12 md:grid-cols-[1.22fr_1fr] md:gap-4 md:pb-12 md:pt-16 xl:pb-20 xl:pt-24">
        <div className="min-w-0">
          <p className="font-eyebrow text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-teal xl:text-[0.78rem]">
            For women researchers in STEM
          </p>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[2.6rem] font-bold leading-[1.1] text-midnight sm:text-[3.1rem] lg:text-[3.3rem] xl:mt-7 xl:text-[4.15rem]"
          >
            <span className="md:whitespace-nowrap">Take your research</span>
            <br />
            from the lab
            <br />
            to the market.
          </h1>
          <p className="mt-7 max-w-[30rem] text-[1.02rem] leading-[1.65] text-slate xl:mt-8 xl:max-w-[35rem] xl:text-[1.18rem]">
            Test whether people really need your work, find the companies active in your field, and connect with the ones looking for what
            you built.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 xl:mt-9 xl:gap-4">
            <Link
              href="/signup?role=RESEARCHER"
              className="inline-flex items-center gap-3 rounded-full bg-teal px-7 py-3.5 text-[0.88rem] font-semibold xl:px-8 xl:py-4 xl:text-[0.98rem] text-[#fdfbf0] shadow-[0_6px_16px_-8px_rgba(0,70,67,0.7)] transition-colors hover:bg-midnight"
            >
              I am a researcher
              <IconArrow className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/signup?role=COMPANY"
              className="inline-flex items-center rounded-full border-[1.5px] border-teal px-7 py-3.5 text-[0.88rem] font-semibold xl:px-8 xl:py-4 xl:text-[0.98rem] text-teal transition-colors hover:bg-teal hover:text-[#fdfbf0]"
            >
              I represent a company
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <Image
            src="/illustrations/hero-women-in-stem.webp"
            alt="Illustration: a woman scientist in a lab coat looks ahead, with lab equipment on one side and a city skyline with a wind turbine on the other."
            width={1200}
            height={854}
            priority
            unoptimized
            className="h-auto w-full max-w-[520px] md:-mr-2 xl:max-w-[640px]"
          />
        </div>
      </section>

      {/* The complete path */}
      <section aria-labelledby="path-title" id="path" className="rule-bleed-top rule-bleed-bottom py-14 xl:py-[4.5rem]">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-eyebrow text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal xl:text-[0.75rem]">The complete path</p>
            <h2 id="path-title" className="mt-4 font-display text-[1.95rem] font-bold leading-[1.2] text-midnight xl:text-[2.45rem]">
              From discovery
              <br />
              to real-world impact.
            </h2>
          </div>
          <p className="max-w-[34rem] text-[0.93rem] leading-[1.7] text-slate xl:text-[1.05rem]">
            Lab2Market STEM gives you the tools, data and connections to turn your research into solutions, faster, easier, and with the
            right people.
          </p>
        </div>
        <div className="mt-10 md:mt-6">
          <WavePath steps={STEPS} />
        </div>
      </section>

      {/* Three tools */}
      <section aria-labelledby="tools-title" id="tools" className="scroll-mt-24 pt-14 xl:pt-[4.5rem]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="tools-title" className="flex items-center gap-5 font-display text-[1.95rem] font-bold leading-tight text-midnight xl:text-[2.45rem]">
            <span aria-hidden="true" className="h-0.5 w-7 rounded-full bg-teal" />
            Three tools, one goal
          </h2>
          <Link
            href="/signup?role=RESEARCHER"
            className="group mb-1 inline-flex items-center gap-4 text-[0.82rem] font-semibold text-teal xl:text-[0.95rem]"
          >
            <span className="border-b-[1.5px] border-teal pb-1">Explore all tools</span>
            <IconArrow className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ol className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:mt-9 xl:gap-6">
          {TOOLS.map((t) => (
            <li
              key={t.n}
              className="relative flex min-h-[19rem] flex-col overflow-hidden rounded-[16px] border border-line bg-ivory p-6 shadow xl:min-h-[23rem] xl:p-8-[0_10px_30px_-24px_rgba(14,34,56,0.45)]"
            >
              <span className="font-display text-[1.9rem] font-semibold leading-none text-teal xl:text-[2.3rem]">{t.n}</span>
              <h3 className="mt-4 font-display text-[1.1rem] font-semibold leading-snug text-midnight xl:mt-5 xl:text-[1.42rem]">{t.title}</h3>
              <p className="mt-3 max-w-[19rem] text-[0.84rem] leading-[1.6] text-slate xl:mt-4 xl:max-w-[20rem] xl:text-[0.97rem]">{t.text}</p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                <Link href={t.href} className="group mb-2 inline-flex shrink-0 items-center gap-3 whitespace-nowrap text-[0.75rem] font-semibold text-teal xl:text-[0.85rem]">
                  Learn more<span className="sr-only"> about {t.title.toLowerCase()}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper xl:h-9 xl:w-9 transition-colors group-hover:border-teal">
                    <IconArrow className="h-4 w-4" />
                  </span>
                </Link>
                <Image src={t.img.src} alt="" width={t.img.w} height={t.img.h} unoptimized className="-mb-2 -mr-2 h-auto w-[130px] min-w-0 xl:-mb-3 xl:-mr-3 xl:w-[155px]" />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Impact */}
      <section aria-labelledby="impact-title" id="about" className="scroll-mt-24 pb-4 pt-8 xl:pt-10">
        <div className="grid overflow-hidden rounded-[18px] bg-midnight text-[#fdfbf0] lg:grid-cols-[auto_1.1fr_1.25fr] lg:items-center">
          <Image
            src="/illustrations/women-impact.png"
            alt=""
            width={186}
            height={198}
            unoptimized
            className="mx-auto h-auto w-[160px] self-end lg:mx-0 lg:ml-2 lg:w-[175px] xl:w-[200px]"
          />
          <div className="px-8 pb-2 pt-2 lg:py-8 lg:pl-10 lg:pr-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-mint lg:whitespace-nowrap xl:text-[0.7rem]">Real research. Real opportunities.</p>
            <h2 id="impact-title" className="mt-3.5 font-display text-[1.8rem] font-semibold leading-[1.15] xl:text-[2.2rem]">
              More women.
              <br />
              More impact.
            </h2>
            <p className="mt-3.5 max-w-[19rem] text-[0.8rem] leading-relaxed text-[#fdfbf0]/85 xl:max-w-[22rem] xl:text-[0.95rem]">
              We&apos;re building a fairer innovation ecosystem where brilliant research finds the right partners.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 px-8 pb-10 pt-6 sm:grid-cols-3 lg:py-8 lg:pl-2 lg:pr-8">
            {STATS.map((s) => (
              <div key={s.value} className="sm:border-l sm:border-[#2f5b66] sm:pl-6 sm:py-1">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-[2rem] font-semibold leading-none text-mint xl:text-[2.4rem]">{s.value}</dd>
                <dd className="mt-3 max-w-[10rem] text-[0.74rem] leading-snug text-[#fdfbf0]/85 xl:max-w-[10rem] xl:text-[0.84rem]">{s.label}</dd>
                {s.source ? <dd className="mt-1.5 text-[0.6rem] text-[#fdfbf0]/45">{s.source}</dd> : null}
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
