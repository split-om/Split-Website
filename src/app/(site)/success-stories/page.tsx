import type { Metadata } from "next";
import Link from "next/link";
import { stories } from "@/lib/data";

export const metadata: Metadata = { title: "Success Stories" };

export default function SuccessStoriesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Success stories</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl">Real results from real restaurants</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {stories.map((st) => (
          <Link key={st.slug} href={`/success-stories/${st.slug}`} className="overflow-hidden rounded-[2rem] border border-line">
            <img src={st.image} alt="" className="h-64 w-full object-cover" />
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-split">{st.city}</div>
              <h2 className="mt-1 text-xl font-extrabold">{st.name}</h2>
              <p className="mt-2 text-sm text-muted">{st.summary}</p>
              <p className="mt-3 text-sm font-semibold text-split">{st.result}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
