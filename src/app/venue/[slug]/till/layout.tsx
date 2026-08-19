import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Staff till",
  description: "Counter tablet — enter the bill, guest pays on the table QR.",
  manifest: "/till-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Split Till",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function TillLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0c0b10] text-white">{children}</div>;
}
