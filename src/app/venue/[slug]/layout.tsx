import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Staff",
  description: "Split staff console for the café floor, till, menu, and table QRs.",
  manifest: "/venue-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Split Staff",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function VenueSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
