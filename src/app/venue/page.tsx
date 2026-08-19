import Link from "next/link";
import { venues } from "@/lib/venue";
import { Logo } from "@/components/Logo";

export default function VenueHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Open a venue console</h1>
      <p className="mt-3 text-muted">
        This is the staff tablet — not the guest phone. Pick a café to see tables, Foodics bills, and live payments.
      </p>
      <div className="mt-8 space-y-3">
        {venues.map((v) => (
          <Link
            key={v.slug}
            href={`/venue/${v.slug}`}
            className="block rounded-[1.6rem] border border-line bg-white p-6 hover:border-split"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-split">{v.pos}</div>
            <div className="text-xl font-extrabold">{v.name}</div>
            <div className="text-sm text-muted">{v.area} · {v.tables.length} tables</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
