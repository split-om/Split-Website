import type { PaymentMethodId } from "./types";

export const AMWAL_DISPLAY_NAME = "Amwal Pay";

export function methodLabel(method: PaymentMethodId) {
  if (method === "apple") return "Apple Pay";
  if (method === "google") return "Google Pay";
  if (method === "restaurant") return "Pay in restaurant";
  if (method === "pos") return "Bank POS";
  return "Card";
}

export type { PaymentMethodId } from "./types";
