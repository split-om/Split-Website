import { omrToBaisa } from "./money";

/**
 * Guest is charged 0.203 OMR. After Amwal's 1.5% on that line
 * (0.203 × 0.985 ≈ 0.200) Split keeps 0.200 OMR.
 */
export const SPLIT_FEE_BAISA = omrToBaisa(0.203);
export const SPLIT_FEE_NET_BAISA = omrToBaisa(0.2);
export const AMWAL_MDR = 0.015;
export const SPLIT_FEE_NAME = "Split's fee";

export function splitFeeBaisa(_foodTotalBaisa?: number): number {
  return SPLIT_FEE_BAISA;
}

export function billSplitFee(_bill?: VenueBill): number {
  return SPLIT_FEE_BAISA;
}

export type LineItem = {
  id: string;
  name: string;
  detail?: string;
  qty: number;
  unitBaisa: number;
};

export type VenueBill = {
  code: string;
  venue: string;
  venueArea: string;
  table: string;
  server: string;
  coverUrl: string;
  items: LineItem[];
  vatRate: number;
  pos?: "foodics" | "demo";
  posOrderId?: string;
};

export const bills: VenueBill[] = [
  {
    code: "pearl-12",
    venue: "The Pearl Room",
    venueArea: "Qurum, Muscat",
    table: "12",
    server: "Fatima",
    coverUrl: "/images/food-spread.jpg",
    vatRate: 0.05,
    items: [
      { id: "p1", name: "Hammour mashwi", detail: "Charcoal sea bream, lemon", qty: 1, unitBaisa: omrToBaisa(8.5) },
      { id: "p2", name: "Mixed mezze", detail: "Hummus, moutabal, fattoush", qty: 1, unitBaisa: omrToBaisa(4.2) },
      { id: "p3", name: "Mint lemonade", qty: 2, unitBaisa: omrToBaisa(1.8) },
    ],
  },
  {
    code: "mutrah-4",
    venue: "Trattoria Mutrah",
    venueArea: "Mutrah Corniche",
    table: "4",
    server: "Luca",
    coverUrl: "/images/story-trattoria.jpg",
    vatRate: 0.05,
    items: [
      { id: "m1", name: "Burrata & tomato", qty: 1, unitBaisa: omrToBaisa(3.9) },
      { id: "m2", name: "Truffle tagliatelle", qty: 2, unitBaisa: omrToBaisa(6.4) },
      { id: "m3", name: "Margherita pizza", qty: 1, unitBaisa: omrToBaisa(5.2) },
      { id: "m4", name: "Tiramisu", qty: 2, unitBaisa: omrToBaisa(2.6) },
      { id: "m5", name: "Sparkling water", qty: 2, unitBaisa: omrToBaisa(1.2) },
    ],
  },
  {
    code: "qurum-8",
    venue: "Qurum Coast",
    venueArea: "Qurum Beach",
    table: "8",
    server: "Aisha",
    coverUrl: "/images/story-coast.jpg",
    vatRate: 0.05,
    items: [
      { id: "q1", name: "Shuwa slider", detail: "Slow-cooked, saffron onion", qty: 2, unitBaisa: omrToBaisa(3.2) },
      { id: "q2", name: "Grilled lobster", qty: 1, unitBaisa: omrToBaisa(18.0) },
      { id: "q3", name: "Catch of the day", qty: 1, unitBaisa: omrToBaisa(9.5) },
      { id: "q4", name: "Saffron rice", qty: 2, unitBaisa: omrToBaisa(1.8) },
      { id: "q5", name: "Pomegranate fizz", qty: 3, unitBaisa: omrToBaisa(2.4) },
      { id: "q6", name: "Luqaimat", qty: 1, unitBaisa: omrToBaisa(2.1) },
    ],
  },
  {
    code: "qahwa-7",
    venue: "Qahwa Al Qurum",
    venueArea: "Qurum, Muscat",
    table: "7",
    server: "Noor",
    coverUrl: "/images/hero-4.jpg",
    vatRate: 0.05,
    pos: "foodics",
    posOrderId: "fod_sandbox_qahwa_7",
    items: [
      { id: "c1", name: "Flat white", detail: "Oat milk", qty: 2, unitBaisa: omrToBaisa(1.8) },
      { id: "c2", name: "Date croissant", qty: 1, unitBaisa: omrToBaisa(1.4) },
      { id: "c3", name: "Avocado toast", qty: 1, unitBaisa: omrToBaisa(3.6) },
    ],
  },
  {
    code: "qahwa-3",
    venue: "Qahwa Al Qurum",
    venueArea: "Qurum, Muscat",
    table: "3",
    server: "Noor",
    coverUrl: "/images/hero-4.jpg",
    vatRate: 0.05,
    pos: "foodics",
    posOrderId: "fod_sandbox_qahwa_3",
    items: [
      { id: "d1", name: "Cappuccino", qty: 1, unitBaisa: omrToBaisa(1.6) },
      { id: "d2", name: "Blueberry muffin", qty: 1, unitBaisa: omrToBaisa(1.2) },
    ],
  },
];

export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function findBill(code: string): VenueBill | undefined {
  const n = normalizeCode(code);
  return bills.find((b) => b.code === n);
}

export function itemSubtotal(item: LineItem): number {
  return item.qty * item.unitBaisa;
}

export function billSubtotal(bill: VenueBill): number {
  return bill.items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function billVat(bill: VenueBill): number {
  return Math.round(billSubtotal(bill) * bill.vatRate);
}

export function billFoodTotal(bill: VenueBill): number {
  return billSubtotal(bill) + billVat(bill);
}

export function billTotal(bill: VenueBill): number {
  if (!bill.items.length) return 0;
  return billFoodTotal(bill) + billSplitFee(bill);
}

export function remainingFeeBaisa(bill: VenueBill, paidFeeBaisa: number): number {
  return Math.max(0, billSplitFee(bill) - paidFeeBaisa);
}

/** Allocate Split's fee for this payment. Last payment takes whatever fee is left. */
export function feeForPayment(
  payBaisa: number,
  remainingBaisa: number,
  remainingFee: number,
  people = 1,
): number {
  if (remainingFee <= 0 || payBaisa <= 0) return 0;
  if (payBaisa >= remainingBaisa) return remainingFee;
  const share = Math.round(remainingFee / Math.max(1, people));
  return Math.min(share, remainingFee);
}

export function feeForItemSelection(
  bill: VenueBill,
  qtyById: Record<string, number>,
  remainingFee: number,
): number {
  if (remainingFee <= 0) return 0;
  const selected = selectionSubtotal(bill, qtyById);
  const all = billSubtotal(bill);
  if (selected <= 0) return 0;
  if (selected >= all) return remainingFee;
  return Math.min(Math.round((billSplitFee(bill) * selected) / all), remainingFee);
}

export function selectionSubtotal(bill: VenueBill, qtyById: Record<string, number>): number {
  return bill.items.reduce((sum, item) => {
    const qty = Math.min(Math.max(qtyById[item.id] ?? 0, 0), item.qty);
    return sum + qty * item.unitBaisa;
  }, 0);
}

export function selectionFoodTotal(bill: VenueBill, qtyById: Record<string, number>): number {
  const sub = selectionSubtotal(bill, qtyById);
  return sub + Math.round(sub * bill.vatRate);
}

export function selectionTotal(
  bill: VenueBill,
  qtyById: Record<string, number>,
  remainingFee = billSplitFee(bill),
): number {
  return selectionFoodTotal(bill, qtyById) + feeForItemSelection(bill, qtyById, remainingFee);
}
