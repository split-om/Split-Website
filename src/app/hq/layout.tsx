import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split HQ",
  description: "Clients and revenue for Split.",
};

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0d0b12] text-white">{children}</div>;
}
