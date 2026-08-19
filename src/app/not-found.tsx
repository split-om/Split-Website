import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">404</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">This table is empty</h1>
      <p className="mt-3 text-muted">The page you are looking for is not on the menu.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
        Back to Split
      </Link>
    </section>
  );
}
