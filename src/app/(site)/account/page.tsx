import { GuestAuth } from "@/components/GuestAuth";

export const metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-split">Diners</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Log in or create an account</h1>
      <p className="mt-3 text-sm text-muted">
        Use the same account at any Split café. Your name prints on the receipt. Friends at your table still scan the
        same QR.
      </p>
      <div className="mt-8">
        <GuestAuth />
      </div>
    </section>
  );
}
