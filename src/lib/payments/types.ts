export type PaymentMethodId = "apple" | "google" | "card" | "restaurant";

export type PaymentProvider = "amwal";

export type CreatePaymentInput = {
  amountBaisa: number;
  foodBaisa: number;
  feeBaisa: number;
  tipBaisa: number;
  tableCode: string;
  venue: string;
  table: string;
  description: string;
  returnUrl: string;
  customerName?: string;
};

export type CreatePaymentResult = {
  provider: PaymentProvider;
  providerName: string;
  mode: "live" | "stub";
  sessionId: string;
  checkoutUrl?: string;
  message: string;
};

export type GatewayConfig = {
  merchantId: string;
  terminalId: string;
  secureHashKey: string;
  environment: "test" | "live";
};
