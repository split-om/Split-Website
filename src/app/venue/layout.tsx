import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue console",
  description: "What a restaurant or café sees in Split.",
};

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#f3f1f6]">{children}</div>;
}
