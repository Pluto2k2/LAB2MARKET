"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header link with the thin mint underline used for the current page. */
export function NavLink({ href, children, exact = true }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const path = usePathname();
  const base = href.split("#")[0] || "/";
  const active = !href.includes("#") && (exact ? path === base : path.startsWith(base));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-2 text-[0.95rem] font-medium transition-colors ${
        active ? "text-[#fdfbf0]" : "text-[#fdfbf0]/80 hover:text-[#fdfbf0]"
      } after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-mint ${
        active ? "after:opacity-100" : "after:opacity-0"
      }`}
    >
      {children}
    </Link>
  );
}
