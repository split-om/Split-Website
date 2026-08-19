import { partners } from "@/lib/data";

export function LogoMarquee({
  title = "Trusted by restaurants, hotels, and hospitality businesses across Oman",
}: {
  title?: string;
}) {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-line bg-sand py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-8 overflow-hidden">
        <div className="marquee-track flex w-max gap-10 px-6">
          {row.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-12 shrink-0 items-center text-sm font-extrabold tracking-tight text-ink/45"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
