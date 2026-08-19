import Link from "next/link";
import { Logo } from "@/components/Logo";

const once = [
  {
    n: "0",
    who: "You — one time only",
    title: "Become a Foodics app",
    body: "Email Foodics (or apply on foodics.com/marketplace) as Split. They give you a Client ID and Secret. You cannot skip this if you want a real Allow Split button. Until then, use the POS lab sandbox.",
  },
];

const each = [
  {
    n: "1",
    who: "You",
    title: "Ask one question",
    body: "“Do you use Foodics, and can the owner log in?” If no owner login, stop. Waiters cannot connect you.",
  },
  {
    n: "2",
    who: "Restaurant owner",
    title: "Open Foodics Console",
    body: "They go to console.foodics.com on a laptop. Sign in with the owner email — not a cashier PIN.",
  },
  {
    n: "3",
    who: "Restaurant owner",
    title: "Marketplace → Split → Install",
    body: "They search Split, tap Install, then Authorize Split to access my account. That click is the connection. No USB, no installer, no new till.",
  },
  {
    n: "4",
    who: "You",
    title: "You land in Split with their venue",
    body: "Foodics sends you a token. Split can now read open table checks and later mark them paid. Confirm the branch name and that tables 1, 2, 3… match the floor.",
  },
  {
    n: "5",
    who: "You + owner",
    title: "Amwal for their shop",
    body: "They stay Amwal’s merchant (their CR, their IBAN). You do not take their food money. Split only takes the 0.203 fee via split settlement.",
  },
  {
    n: "6",
    who: "You",
    title: "Print one QR per table",
    body: "Venue console → Print table QRs. Table 7 QR always opens table 7. Stick them down. This is the only physical thing.",
  },
  {
    n: "7",
    who: "Waiter + you",
    title: "One test table",
    body: "Waiter rings two coffees on Foodics to table 7 (same as today). You scan the QR. Bill should match. Pay. Foodics check should show paid. Card machine stays as backup.",
  },
];

export default function FoodicsPlaybookPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Logo invert />
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Foodics only</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">How you connect a restaurant</h1>
      <p className="mt-3 text-sm text-white/60">
        No hardware. They keep Foodics. You get permission to see the open bill and mark it paid.
      </p>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-white/40">Before any café — you do this once</h2>
      <ol className="mt-3 space-y-3">
        {once.map((s) => (
          <Step key={s.n} {...s} />
        ))}
      </ol>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-white/40">Every Foodics restaurant after that</h2>
      <ol className="mt-3 space-y-3">
        {each.map((s) => (
          <Step key={s.n} {...s} />
        ))}
      </ol>

      <div className="mt-10 rounded-2xl border border-white/10 p-4 text-sm text-white/70">
        <p className="font-extrabold text-white">If they cannot find Split in Marketplace yet</p>
        <p className="mt-2">
          You are not listed. Practice in the POS lab. For a real pilot, Foodics support can enable a private app:
          owner emails support@foodics.com from the owner inbox with their account number and “please authorise Split
          (table payments).”
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/hq/pos" className="rounded-full bg-violet-500 px-4 py-2 font-semibold">
          Practice in POS lab
        </Link>
        <Link href="/venue/qahwa" className="rounded-full border border-white/20 px-4 py-2 font-semibold">
          Café console
        </Link>
      </div>
    </div>
  );
}

function Step({ n, who, title, body }: { n: string; who: string; title: string; body: string }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-extrabold">
        {n}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">{who}</p>
        <p className="font-extrabold">{title}</p>
        <p className="mt-1 text-sm text-white/60">{body}</p>
      </div>
    </li>
  );
}
