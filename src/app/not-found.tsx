import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md py-16">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy">This page does not exist</h1>
      <p className="mt-3 text-sm text-slate">It may have been removed, or you may not have access to it.</p>
      <Link href="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
