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
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var p=location.pathname||"";if(p.indexOf("/lite")!==-1)return;var ua=navigator.userAgent||"";var a=ua.match(/Android (\\d+)/);var c=ua.match(/Chrome\\/(\\d+)/);var old=(a&&parseInt(a[1],10)<8)||(c&&parseInt(c[1],10)<90);function go(){var parts=p.replace(/\\/+$/,"").split("/");if(parts.length>=3&&parts[1]==="venue")location.replace("/venue/"+parts[2]+"/lite");}if(old){go();return;}setTimeout(function(){var t=document.body&&document.body.innerText?document.body.innerText:"";if(t.indexOf("Opening staff")!==-1&&t.indexOf("Your name")===-1)go();},2500);})();`,
        }}
      />
      {children}
    </>
  );
}
