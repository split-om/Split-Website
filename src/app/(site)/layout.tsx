import { PromoBanner } from "@/components/PromoBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoBanner />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
