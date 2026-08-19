import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stories } from "@/lib/data";
import { CtaBanner } from "@/components/CtaBanner";

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = stories.find((s) => s.slug === slug);
  return { title: story?.name ?? "Story" };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = stories.find((s) => s.slug === slug);
  if (!story) notFound();

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link href="/success-stories" className="text-sm font-semibold text-split">
          ← All stories
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-split">{story.city}</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{story.name}</h1>
        <p className="mt-4 text-lg text-muted">{story.summary}</p>
        <img src={story.image} alt="" className="mt-8 h-[420px] w-full rounded-[2rem] object-cover" />
        <p className="mt-8 text-xl font-extrabold text-split">{story.result}</p>
        <p className="mt-6 text-lg leading-8 text-muted">{story.body}</p>
      </article>
      <CtaBanner />
    </>
  );
}
