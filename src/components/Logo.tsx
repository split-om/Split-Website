import Link from "next/link";

/** Same mark as the official wordmark — two slanted bars + Split. */
export function SplitMark({
  fill = "#7C3AED",
  className = "h-8 w-8",
}: {
  fill?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill={fill}>
      <path d="M9.1 2.4c1.15-.42 2.42.18 2.84 1.33l6.6 18.2c.42 1.15-.18 2.42-1.33 2.84-1.15.42-2.42-.18-2.84-1.33l-6.6-18.2C7.35 4.09 7.95 2.82 9.1 2.4Z" />
      <path d="M18.4 6.1c1.15-.42 2.42.18 2.84 1.33l6.6 18.2c.42 1.15-.18 2.42-1.33 2.84-1.15.42-2.42-.18-2.84-1.33l-6.6-18.2c-.42-1.15.18-2.42 1.33-2.84Z" />
    </svg>
  );
}

export function Logo({
  className = "",
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  const word = invert ? "#ffffff" : "#2A1248";
  const mark = invert ? "#ffffff" : "#7C3AED";
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Split home">
      <SplitMark fill={mark} className="h-8 w-8 shrink-0" />
      <span
        className="text-[1.45rem] font-extrabold tracking-tight"
        style={{ color: word, letterSpacing: "-0.04em" }}
      >
        Split
      </span>
    </Link>
  );
}
