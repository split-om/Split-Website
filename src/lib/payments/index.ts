import { createAmwalPayment, getAmwalConfig } from "./amwal";
import type { CreatePaymentInput, CreatePaymentResult } from "./types";
import { AMWAL_DISPLAY_NAME } from "./public";

export { AMWAL_DISPLAY_NAME, methodLabel } from "./public";
export { getAmwalConfig } from "./amwal";
export type { CreatePaymentInput, CreatePaymentResult, PaymentMethodId } from "./types";

/** Active acquirer. Swap this function when another Oman gateway is added. */
export async function createCheckout(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  return createAmwalPayment(input);
}

export function gatewayStatus() {
  const configured = Boolean(getAmwalConfig());
  return {
    provider: "amwal" as const,
    name: AMWAL_DISPLAY_NAME,
    configured,
    mode: configured ? ("live" as const) : ("stub" as const),
  };
}
