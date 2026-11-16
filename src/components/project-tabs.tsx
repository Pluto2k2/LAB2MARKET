"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ id }: { id: string }) {
  const path = usePathname();
  const tabs = [
    { href: `/projects/${id}`, label: "Overview" },
    { href: `/projects/${id}/validation`, label: "Market validation" },
    { href: `/projects/${id}/patents`, label: "Patent explorer" },
  ];
  return (
    <nav aria-label="Project sections" className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              active ? "border-teal text-teal" : "border-transparent text-slate hover:text-navy"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
