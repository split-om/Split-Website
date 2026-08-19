import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Terms of Use</h1>
      <p className="mt-4 text-sm text-muted">Last updated 16 August 2026</p>
      <div className="mt-8 space-y-4 text-muted">
        <p>
          This website describes Split products for hospitality businesses in the Sultanate of Oman. Information is
          provided for evaluation and is not a binding offer.
        </p>
        <p>
          Commercial use of Split software and payments is governed by a separate merchant agreement. These website
          terms are a placeholder and should be reviewed by counsel before production use.
        </p>
      </div>
    </article>
  );
}
