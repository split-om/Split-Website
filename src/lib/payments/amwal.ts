import { createHmac } from "crypto";
import { formatOMR } from "@/lib/money";
import { AMWAL_DISPLAY_NAME } from "./public";
import type { CreatePaymentInput, CreatePaymentResult, GatewayConfig } from "./types";

export const AMWAL_PROVIDER = "amwal" as const;
export { AMWAL_DISPLAY_NAME };

export function getAmwalConfig(): GatewayConfig | null {
  const merchantId = process.env.AMWAL_MERCHANT_ID?.trim();
  const terminalId = process.env.AMWAL_TERMINAL_ID?.trim();
  const secureHashKey = process.env.AMWAL_SECURE_HASH_KEY?.trim();
  if (!merchantId || !terminalId || !secureHashKey) return null;
  return {
    merchantId,
    terminalId,
    secureHashKey,
    environment: process.env.AMWAL_ENV === "live" ? "live" : "test",
  };
}

export function amwalCreateUrl(env: "test" | "live") {
  return env === "live"
    ? "https://webhook.amwalpg.com/MerchantOrder/CreatePaymentLink"
    : "https://test.amwalpg.com:14443/MerchantOrder/CreatePaymentLink";
}

/** HMAC-SHA256 secure hash used by Amwal Pay. Keys must be sorted A–Z. */
export function amwalSecureHash(params: Record<string, string | number>, hexKey: string): string {
  const dataString = Object.keys(params)
    .filter((key) => key !== "secureHashValue" && params[key] !== "" && params[key] !== undefined)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHmac("sha256", Buffer.from(hexKey, "hex")).update(dataString, "utf8").digest("hex").toUpperCase();
}

export async function createAmwalPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const sessionId = `spl_${input.tableCode}_${Date.now()}`;
  const config = getAmwalConfig();

  if (!config) {
    return {
      provider: AMWAL_PROVIDER,
      providerName: AMWAL_DISPLAY_NAME,
      mode: "stub",
      sessionId,
      message: "Amwal Pay is wired but merchant keys are not set. Using sandbox stub.",
    };
  }

  const amount = formatOMR(input.amountBaisa);
  const payload: Record<string, string | number> = {
    amount,
    billerRefNumber: sessionId,
    currency: 512,
    merchantId: Number(config.merchantId) || config.merchantId,
    paymentMethod: 1,
    paymentViewType: 2,
    redirectUrl: input.returnUrl,
    terminalId: Number(config.terminalId) || config.terminalId,
    payerName: input.customerName || "Split guest",
    maxNumberOfPayment: 1,
  };
  payload.secureHashValue = amwalSecureHash(payload, config.secureHashKey);

  const response = await fetch(amwalCreateUrl(config.environment), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as { success?: boolean; message?: string; data?: string };
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || "Amwal Pay did not return a checkout link.");
  }

  return {
    provider: AMWAL_PROVIDER,
    providerName: AMWAL_DISPLAY_NAME,
    mode: "live",
    sessionId,
    checkoutUrl: json.data,
    message: "Redirecting to Amwal Pay.",
  };
}
