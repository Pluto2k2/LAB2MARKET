import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { logout } from "./auth-actions";
import { Wordmark } from "@/components/logo";
import { NavLink } from "@/components/nav-link";

export const metadata: Metadata = {
  title: { default: "Lab2Market STEM", template: "%s | Lab2Market STEM" },
  description: "From lab to market: validation, patent intelligence and industry challenges for women researchers in STEM.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body suppressHydrationWarning className="flex min-h-screen flex-col bg-page text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ivory focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 bg-midnight">
          <div className="flex min-h-[4.75rem] w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-3 sm:px-8 lg:px-12">
            <Link href={user ? "/dashboard" : "/"} aria-label="Lab2Market STEM, home" className="rounded-md">
              <Wordmark />
            </Link>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-x-8 gap-y-2">
              {user ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-7">
                    <NavLink href="/dashboard">Dashboard</NavLink>
                    {user.role !== "COMPANY" ? <NavLink href="/projects/new">New project</NavLink> : null}
                    <NavLink href="/challenges" exact={false}>Challenges</NavLink>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-sm text-[#fdfbf0]/60 lg:inline">
                      {user.name}, {user.role === "COMPANY" ? user.organization ?? "Company" : "Researcher"}
                    </span>
                    <form action={logout}>
                      <button
                        type="submit"
                        className="rounded-full border border-[#fdfbf0]/35 px-4 py-2 text-sm font-semibold text-[#fdfbf0] hover:border-[#fdfbf0]"
                      >
                        Log out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-9">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/#tools">Tools</NavLink>
                    <NavLink href="/#about">About</NavLink>
                  </div>
                  <div className="flex items-center gap-6 md:ml-14">
                    <Link href="/login" className="text-[0.95rem] font-medium text-[#fdfbf0]/85 hover:text-[#fdfbf0]">
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-full bg-ivory px-5 py-2.5 text-sm font-semibold text-midnight shadow-sm hover:bg-cream"
                    >
                      Create account
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </header>
        <main id="main" className="w-full max-w-[1440px] flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="max-w-[1440px] px-5 py-6 text-[0.8rem] text-slate sm:px-8 lg:px-12">
            Lab2Market STEM. Guidance only, not legal or financial advice. Patent data: EPO Open Patent Services.
          </div>
        </footer>
      </body>
    </html>
  );
}
