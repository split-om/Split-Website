import { billFoodTotal, billSplitFee, billTotal, itemSubtotal, SPLIT_FEE_NAME, type VenueBill } from "@/lib/bills";
import { formatOMR } from "@/lib/money";
import { remainingBaisa, type TableSession } from "@/lib/pay-session";
import { methodLabel } from "@/lib/payments/public";

const WIDTH = 32;

function pad(left: string, right: string, width = WIDTH) {
  const gap = Math.max(1, width - left.length - right.length);
  return `${left}${" ".repeat(gap)}${right}`;
}

function center(text: string, width = WIDTH) {
  const t = text.slice(0, width);
  const left = Math.max(0, Math.floor((width - t.length) / 2));
  return `${" ".repeat(left)}${t}`;
}

function line(ch = "-") {
  return ch.repeat(WIDTH);
}

export function receiptText(bill: VenueBill, session?: TableSession | null) {
  const paid = session?.paidBaisa ?? 0;
  const remaining = session ? remainingBaisa(bill, session) : billTotal(bill);
  const when = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const rows = [
    center("SPLIT"),
    center(bill.venue),
    bill.venueArea ? center(bill.venueArea.slice(0, WIDTH)) : "",
    line(),
    pad(`Table ${bill.table}`, when),
    bill.guestName ? center(bill.guestName) : "",
    bill.guestPhone ? center(bill.guestPhone) : "",
    bill.server ? `Server ${bill.server}` : "",
    line(),
    ...bill.items.map((item) => pad(`${item.qty}x ${item.name}`.slice(0, 20), formatOMR(itemSubtotal(item)))),
    line(),
    pad("Food + VAT", formatOMR(billFoodTotal(bill))),
    pad(SPLIT_FEE_NAME, formatOMR(billSplitFee(bill))),
    pad("TOTAL", formatOMR(billTotal(bill))),
  ];
  if (session?.payments.length) {
    rows.push(line("."));
    for (const p of session.payments) {
      rows.push(pad(methodLabel(p.method).slice(0, 18), formatOMR(p.billBaisa + p.tipBaisa)));
    }
  }
  rows.push(pad("Paid", formatOMR(paid)));
  rows.push(pad("REMAINING", formatOMR(remaining)));
  rows.push(line());
  rows.push(center("Thank you"));
  rows.push(center("Scan QR to pay leftover"));
  rows.push("");
  rows.push("");
  rows.push("");
  return rows.filter((r) => r !== "").join("\n") + "\n";
}

export function receiptHtml(bill: VenueBill, session?: TableSession | null) {
  const paid = session?.paidBaisa ?? 0;
  const remaining = session ? remainingBaisa(bill, session) : billTotal(bill);
  const when = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const items = bill.items
    .map(
      (item) =>
        `<div class="row"><span>${item.qty}× ${escapeHtml(item.name)}</span><span>${formatOMR(itemSubtotal(item))}</span></div>`,
    )
    .join("");
  const pays = (session?.payments ?? [])
    .map(
      (p) =>
        `<div class="row"><span>${escapeHtml(methodLabel(p.method))}</span><span>${formatOMR(p.billBaisa + p.tipBaisa)}</span></div>`,
    )
    .join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${escapeHtml(bill.venue)} T${escapeHtml(bill.table)}</title>
<style>
  @page { size: 58mm auto; margin: 2mm; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { font: 12px/1.35 ui-monospace, "Courier New", monospace; width: 54mm; }
  h1 { font-size: 16px; margin: 0 0 2px; text-align: center; }
  .sub, .thanks { text-align: center; font-size: 11px; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
  .total { font-weight: 800; }
</style>
</head>
<body>
  <h1>SPLIT</h1>
  <div class="sub">${escapeHtml(bill.venue)}</div>
  ${bill.venueArea ? `<div class="sub">${escapeHtml(bill.venueArea)}</div>` : ""}
  <hr />
  <div class="row"><span>Table ${escapeHtml(bill.table)}</span><span>${escapeHtml(when)}</span></div>
  ${bill.guestName ? `<div class="sub">${escapeHtml(bill.guestName)}</div>` : ""}
  ${bill.guestPhone ? `<div class="sub">${escapeHtml(bill.guestPhone)}</div>` : ""}
  ${bill.server ? `<div>Server ${escapeHtml(bill.server)}</div>` : ""}
  <hr />
  ${items}
  <hr />
  <div class="row"><span>Food + VAT</span><span>${formatOMR(billFoodTotal(bill))}</span></div>
  <div class="row"><span>${escapeHtml(SPLIT_FEE_NAME)}</span><span>${formatOMR(billSplitFee(bill))}</span></div>
  <div class="row total"><span>TOTAL</span><span>${formatOMR(billTotal(bill))}</span></div>
  ${pays ? `<hr />${pays}` : ""}
  <div class="row"><span>Paid</span><span>${formatOMR(paid)}</span></div>
  <div class="row total"><span>REMAINING</span><span>${formatOMR(remaining)}</span></div>
  <hr />
  <p class="thanks">Thank you<br/>Scan the table QR to pay leftover</p>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
