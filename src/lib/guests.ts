import type { VenueBill } from "@/lib/bills";
import type { TableSession } from "@/lib/pay-session";

export type GuestAccount = {
  id: string;
  slug: string;
  name: string;
  phone: string;
};

export type Diner = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
};

export type StoredReceipt = {
  id: string;
  slug: string;
  code: string;
  table: string;
  at: string;
  guestName?: string;
  guestPhone?: string;
  bill: VenueBill;
  session: TableSession;
};

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("968") && digits.length >= 11) return digits.slice(0, 11);
  if (digits.length === 8) return `968${digits}`;
  return digits;
}
