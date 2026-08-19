import Link from "next/link";
import { Logo } from "./Logo";
import { solutions } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-line bg-[#0d0b12] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo invert />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">
            Contactless payments and digital menus for restaurants, cafés, and hotels across Oman.
          </p>
          <p className="mt-4 text-sm text-white/65">
            🇴🇲 Al Khuwair, Muscat
            <br />
            +968 24 000 000
            <br />
            hello@split.om
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/45">Solutions</h4>
          <ul className="mt-4 space-y-2">
            {solutions.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="text-sm text-white/80 hover:text-white">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/45">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/venue/qahwa" className="hover:text-white">
                Venue console
              </Link>
            </li>
            <li>
              <Link href="/pay" className="hover:text-white">
                Pay a bill
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/success-stories" className="hover:text-white">
                Success Stories
              </Link>
            </li>
            <li>
              <Link href="/integrations" className="hover:text-white">
                Integrations
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/join" className="hover:text-white">
                Join Split
              </Link>
            </li>
            <li>
              <Link href="/demo" className="hover:text-white">
                Get a Free Demo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/45">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms of Use
              </Link>
            </li>
          </ul>
          <Link
            href="/demo"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lilac"
          >
            Get a Free Demo
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} Split Oman. All rights reserved.</p>
          <p>Built for restaurants in the Sultanate of Oman.</p>
        </div>
      </div>
    </footer>
  );
}
