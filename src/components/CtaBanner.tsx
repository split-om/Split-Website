import Link from "next/link";

export function CtaBanner({
  title = "Ready to transform your restaurant?",
  body = "Request a demo to discover how Split can improve your payment process and elevate your diners' experience from start to finish.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2e1065] via-[#5b21b6] to-[#7c3aed] px-8 py-14 text-white sm:px-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 text-white/80">{body}</p>
          <Link
            href="/join"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-lilac"
          >
            Join Split
          </Link>
        </div>
      </div>
    </section>
  );
}
