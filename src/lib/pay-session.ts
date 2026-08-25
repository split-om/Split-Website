import { billTotal, remainingFeeBaisa, type VenueBill } from "./bills";
import { newId } from "./id";
import type { PaymentMethodId } from "./payments/types";

export type PayRecord = {
  id: string;
  at: string;
  method: PaymentMethodId;
  billBaisa: number;
  foodBaisa: number;
  feeBaisa: number;
  tipBaisa: number;
  splitLabel: string;
  gatewaySessionId?: string;
  provider?: string;
  payerName?: string;
};

export type TableSession = {
  code: string;
  paidBaisa: number;
  paidFeeBaisa: number;
  payments: PayRecord[];
};

export type HqPayment = PayRecord & {
  code: string;
  venue: string;
  table: string;
};

const KEY = (code: string) => `split-pay:${code}`;
const PENDING_KEY = (code: string) => `split-pay-pending:${code}`;

export type PendingPayment = {
  sessionId: string;
  foodBaisa: number;
  feeBaisa: number;
  tipBaisa: number;
  billBaisa: number;
  splitLabel: string;
  method: PaymentMethodId;
};

export function emptySession(code: string): TableSession {
  return { code, paidBaisa: 0, paidFeeBaisa: 0, payments: [] };
}

export function loadSession(code: string): TableSession {
  if (typeof window === "undefined") return emptySession(code);
  try {
    const raw = localStorage.getItem(KEY(code));
    if (!raw) return emptySession(code);
    const parsed = JSON.parse(raw) as TableSession;
    if (parsed.code !== code) return emptySession(code);
    return {
      ...emptySession(code),
      ...parsed,
      paidFeeBaisa: parsed.paidFeeBaisa ?? 0,
    };
  } catch {
    return emptySession(code);
  }
}

export function saveSession(session: TableSession) {
  localStorage.setItem(KEY(session.code), JSON.stringify(session));
}

export function remainingBaisa(bill: VenueBill, session: TableSession): number {
  return Math.max(0, billTotal(bill) - session.paidBaisa);
}

export function remainingFee(bill: VenueBill, session: TableSession): number {
  return remainingFeeBaisa(bill, session.paidFeeBaisa);
}

export function applyPayment(
  session: TableSession,
  payment: Omit<PayRecord, "id" | "at">,
): TableSession {
  const next: TableSession = {
    ...session,
    paidBaisa: session.paidBaisa + payment.billBaisa,
    paidFeeBaisa: session.paidFeeBaisa + payment.feeBaisa,
    payments: [
      ...session.payments,
      {
        ...payment,
        id: newId(),
        at: new Date().toISOString(),
      },
    ],
  };
  saveSession(next);
  return next;
}

export function resetSession(code: string): TableSession {
  const empty = emptySession(code);
  saveSession(empty);
  clearPending(code);
  return empty;
}

export function savePending(code: string, pending: PendingPayment) {
  sessionStorage.setItem(PENDING_KEY(code), JSON.stringify(pending));
}

export function loadPending(code: string): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY(code));
    return raw ? (JSON.parse(raw) as PendingPayment) : null;
  } catch {
    return null;
  }
}

export function clearPending(code: string) {
  sessionStorage.removeItem(PENDING_KEY(code));
}
