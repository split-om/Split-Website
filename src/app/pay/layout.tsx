import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay your bill",
  description: "Scan, split, tip, and pay with Split in Oman.",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <div className="guest-shell">{children}</div>;
}
