import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted">Last updated 16 August 2026</p>
      <div className="prose mt-8 max-w-none space-y-4 text-muted">
        <p>
          Split Oman collects only the information needed to provide restaurant payment services, run demos, and
          support venues. Demo form submissions are used to contact you about Split products.
        </p>
        <p>
          Payment card data is processed by licensed acquiring partners. Split does not store full card numbers on
          venue devices.
        </p>
        <p>
          To request access or deletion of your data, email hello@split.om. This policy is a product placeholder and
          should be reviewed by counsel before production use.
        </p>
      </div>
    </article>
  );
}
