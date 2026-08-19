import { bills, findBill, type VenueBill } from "@/lib/bills";
import { formatOMR, omrToBaisa } from "@/lib/money";

export type FoodicsCheck = {
  id: string;
  reference: string;
  table: string;
  branch: string;
  status: "open" | "paid";
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  source: "foodics-live" | "foodics-sandbox";
};

const paidOrders = new Map<string, boolean>();

export function foodicsConfigured() {
  return Boolean(process.env.FOODICS_ACCESS_TOKEN?.trim());
}

export function foodicsBaseUrl() {
  return process.env.FOODICS_ENV === "live"
    ? "https://api.foodics.com/v5"
    : "https://api-sandbox.foodics.com/v5";
}

/** Maps a Split table code to a Foodics-shaped open check (sandbox). */
export function sandboxCheck(code: string): FoodicsCheck | null {
  const bill = findBill(code);
  if (!bill) return null;
  const subtotal = bill.items.reduce((s, i) => s + i.qty * i.unitBaisa, 0);
  const tax = Math.round(subtotal * bill.vatRate);
  const id = bill.posOrderId || `fod_sandbox_${bill.code}`;
  return {
    id,
    reference: bill.code,
    table: bill.table,
    branch: bill.venue,
    status: paidOrders.get(id) ? "paid" : "open",
    products: bill.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.qty,
      unit_price: Number(formatOMR(i.unitBaisa)),
      total_price: Number(formatOMR(i.qty * i.unitBaisa)),
    })),
    subtotal: Number(formatOMR(subtotal)),
    tax: Number(formatOMR(tax)),
    total: Number(formatOMR(subtotal + tax)),
    source: "foodics-sandbox",
  };
}

export function checkToBill(check: FoodicsCheck, fallback?: VenueBill): VenueBill {
  const base = fallback ?? bills.find((b) => b.code === check.reference);
  return {
    code: check.reference,
    venue: check.branch,
    venueArea: base?.venueArea ?? "Muscat",
    table: check.table,
    server: base?.server ?? "Server",
    coverUrl: base?.coverUrl ?? "/images/hero-4.jpg",
    vatRate: 0.05,
    pos: "foodics",
    posOrderId: check.id,
    items: check.products.map((p) => ({
      id: p.id,
      name: p.name,
      qty: p.quantity,
      unitBaisa: omrToBaisa(p.unit_price),
    })),
  };
}

export async function fetchFoodicsOrder(orderId: string): Promise<FoodicsCheck | null> {
  const token = process.env.FOODICS_ACCESS_TOKEN?.trim();
  if (!token) return null;
  const res = await fetch(`${foodicsBaseUrl()}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, unknown> };
  const data = json.data;
  if (!data) return null;
  return {
    id: String(data.id ?? orderId),
    reference: String(data.reference ?? orderId),
    table: String((data.table as { name?: string } | undefined)?.name ?? ""),
    branch: String((data.branch as { name?: string } | undefined)?.name ?? "Foodics"),
    status: data.status === 4 || data.status === "paid" ? "paid" : "open",
    products: [],
    subtotal: Number(data.subtotal_price ?? 0),
    tax: Number(data.total_tax ?? 0),
    total: Number(data.total_price ?? 0),
    source: "foodics-live",
  };
}

export function markSandboxPaid(orderId: string) {
  paidOrders.set(orderId, true);
}

export function isSandboxPaid(orderId: string) {
  return paidOrders.get(orderId) === true;
}

export function foodicsStatus() {
  return {
    provider: "foodics" as const,
    configured: foodicsConfigured(),
    mode: foodicsConfigured() ? ("live" as const) : ("sandbox" as const),
    inventory: "owned-by-pos" as const,
    note: foodicsConfigured()
      ? "Using Foodics API. Inventory and kitchen tickets stay in Foodics."
      : "Sandbox: demo checks look like Foodics. Add FOODICS_ACCESS_TOKEN to go live.",
  };
}
