# Split — Restaurant payments for Oman

Marketing site for **Split**, a contactless restaurant payment platform for the Sultanate of Oman. Inspired by the structure of modern hospitality-payments sites (Pay-at-Table, Order-and-Pay, digital menus, SoftPOS, rewards).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Original photography and SVG brand mark

## Guest Pay-at-Table (the product)

Open **[/pay](http://localhost:3000/pay)** — a standalone mobile checkout, no marketing chrome.

1. **Scan** the table QR (camera), type a code, or tap a demo tent
2. **Review** the live bill
3. **Split** equally, by item, or a custom amount
4. **Tip** your server
5. **Pay** with Apple Pay, Google Pay, card, or **pay in restaurant**
6. **Receipt**, Google-style review prompt, and remaining balance if the table is only partly paid

Every bill includes **Split's fee** of **OMR 0.200**. Tips are calculated on food + VAT only.

Checkout is built for Amwal Pay. Without merchant keys it runs a sandbox stub (no charge). To go live, copy `.env.example` to `.env.local` and set `AMWAL_MERCHANT_ID`, `AMWAL_TERMINAL_ID`, and `AMWAL_SECURE_HASH_KEY`. Guests then redirect to Amwal and return to `/pay/[code]/return`. Webhooks land on `POST /api/pay/webhook`.

Demo tables: `PEARL-12`, `MUTRAH-4`, `QURUM-8`, and **`QAHWA-7`** (Foodics sandbox café). Payments persist in `localStorage` so a second guest on the same browser sees the remaining balance. Use **Reset table** to start over.

Venues join at `/join`. Pick a POS to see how Split connects. Foodics venues can run **Connect Foodics sandbox** then open the guest bill. Split reads the check and marks it paid; inventory stays in the POS. Set `FOODICS_ACCESS_TOKEN` in `.env.local` to point at a real Foodics sandbox.

## Main routes

- `/pay` guest scan
- `/pay/pearl-12` (and other table codes) checkout
- `/` marketing home
- `/pay-at-table`, `/order-and-pay`, `/digital-menu`, `/payment-links`, `/softpos`, `/rewards`
- `/success-stories`
- `/demo`, `/contact`, `/about`, `/integrations`
