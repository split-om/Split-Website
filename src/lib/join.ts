export const venueTypes = [
  { id: "restaurant", label: "Restaurant", hint: "Dine-in, casual or fine dining" },
  { id: "cafe", label: "Café / coffee shop", hint: "Coffee, bakery, light bites" },
  { id: "hotel", label: "Hotel F&B", hint: "Lobby, restaurant, or room service" },
  { id: "cloud", label: "Cloud kitchen", hint: "Delivery and takeaway only" },
] as const;

export const products = [
  { id: "pay-at-table", label: "Pay-at-Table" },
  { id: "order-and-pay", label: "Order-and-Pay" },
  { id: "digital-menu", label: "Digital menu" },
  { id: "payment-links", label: "Payment links" },
  { id: "softpos", label: "SoftPOS terminal" },
  { id: "rewards", label: "Split+ rewards" },
] as const;

export const posCatalog = [
  {
    id: "foodics",
    label: "Foodics",
    mode: "api" as const,
    headline: "Best fit for Oman cafés and restaurants",
    connect:
      "Split reads the open table check from Foodics, takes payment, then marks that check paid. Inventory stays in Foodics — if a guest later orders from the QR, we send the order into Foodics so their stock and kitchen ticket update.",
    guestTable: "qahwa-7",
  },
  {
    id: "micros",
    label: "Oracle MICROS",
    mode: "partner" as const,
    headline: "Hotels and large groups",
    connect:
      "We connect through a hotel POS partner after go-live. Pay-at-Table still works; inventory stays in MICROS.",
    guestTable: "pearl-12",
  },
  {
    id: "other-cloud",
    label: "Other cloud POS",
    mode: "later" as const,
    headline: "Toast, Lightspeed, Square, Revel…",
    connect:
      "We can launch Pay-at-Table with a mapped bill while we add that POS. We will not promise QR ordering or stock updates until the API is live.",
    guestTable: "mutrah-4",
  },
  {
    id: "none",
    label: "No POS yet",
    mode: "tablet" as const,
    headline: "Till, Excel, or paper",
    connect:
      "No inventory sync. Staff enter the bill on a tablet, guests scan and pay. When you add Foodics later, we switch you to a full connection.",
    guestTable: "qahwa-7",
  },
];

export const posOptions = posCatalog.map((p) => p.label);

export function posPlan(label: string) {
  return (
    posCatalog.find((p) => p.label === label) ??
    posCatalog.find((p) => p.id === "other-cloud")!
  );
}

export const tableRanges = ["1–10", "11–25", "26–50", "51–100", "100+"];

export type JoinApplication = {
  id: string;
  submittedAt: string;
  status: "received" | "in-review" | "approved";
  venueType: string;
  venueName: string;
  brandName: string;
  city: string;
  area: string;
  tables: string;
  locations: string;
  products: string[];
  pos: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  posConnected?: boolean;
  posConnectedAt?: string;
};

export const emptyDraft: Omit<JoinApplication, "id" | "submittedAt" | "status"> = {
  venueType: "",
  venueName: "",
  brandName: "",
  city: "Muscat",
  area: "",
  tables: "11–25",
  locations: "1",
  products: ["pay-at-table"],
  pos: "Foodics",
  firstName: "",
  lastName: "",
  role: "Owner",
  email: "",
  phone: "+968 ",
  notes: "",
};

const KEY = "split-join-applications";

export function loadApplications(): JoinApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JoinApplication[]) : [];
  } catch {
    return [];
  }
}

export function saveApplication(
  draft: Omit<JoinApplication, "id" | "submittedAt" | "status">,
): JoinApplication {
  const app: JoinApplication = {
    ...draft,
    id: `SPL-${Date.now().toString(36).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    status: "received",
  };
  const all = [app, ...loadApplications()];
  localStorage.setItem(KEY, JSON.stringify(all));
  return app;
}

export function findApplication(id: string): JoinApplication | undefined {
  return loadApplications().find((a) => a.id === id);
}

export function updateApplication(id: string, patch: Partial<JoinApplication>) {
  const all = loadApplications().map((a) => (a.id === id ? { ...a, ...patch } : a));
  localStorage.setItem(KEY, JSON.stringify(all));
  return all.find((a) => a.id === id);
}

export function clearApplications() {
  localStorage.removeItem(KEY);
}

export const sampleCafe: Omit<JoinApplication, "id" | "submittedAt" | "status"> = {
  venueType: "cafe",
  venueName: "Qahwa Al Qurum",
  brandName: "Qahwa",
  city: "Muscat",
  area: "Qurum",
  tables: "11–25",
  locations: "1",
  products: ["pay-at-table", "order-and-pay", "digital-menu"],
  pos: "Foodics",
  firstName: "Maha",
  lastName: "Al-Riyami",
  role: "Owner",
  email: "maha@qahwa.om",
  phone: "+968 9123 4567",
  notes: "Busy weekend brunch. Guests wait too long for the card machine.",
};

export function venueTypeLabel(id: string) {
  return venueTypes.find((v) => v.id === id)?.label ?? id;
}

export function productLabel(id: string) {
  return products.find((p) => p.id === id)?.label ?? id;
}
