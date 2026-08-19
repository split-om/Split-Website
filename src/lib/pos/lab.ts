import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type PosId = "foodics" | "micros" | "toast" | "lightspeed" | "square" | "revel" | "tablet";

export type PosSystem = {
  id: PosId;
  name: string;
  where: string;
  connectHow: string;
  canReadCheck: boolean;
  canMarkPaid: boolean;
  canSendOrder: boolean;
  inventory: string;
  docs: string;
};

export const posSystems: PosSystem[] = [
  {
    id: "foodics",
    name: "Foodics",
    where: "Most Oman / GCC cafés and restaurants",
    connectHow: "OAuth in the Foodics console. Restaurant clicks Allow Split. You get a token and read /orders.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: true,
    inventory: "Foodics keeps stock. QR orders POST into Foodics so recipes deduct there.",
    docs: "https://developers.foodics.com",
  },
  {
    id: "micros",
    name: "Oracle MICROS",
    where: "Hotels and large groups",
    connectHow: "Not self-serve. You go through an Oracle / hotel PMS partner. Check comes as a check number + tenders.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: false,
    inventory: "MICROS / hotel inventory. You never touch it.",
    docs: "Oracle Simphony Transaction Services",
  },
  {
    id: "toast",
    name: "Toast",
    where: "US-style groups; rare in Oman but good practice",
    connectHow: "Toast partner API. Restaurant authorises your app. You poll orders by table.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: true,
    inventory: "Toast inventory. Same rule: send the order in, don’t count cups yourself.",
    docs: "https://doc.toasttab.com",
  },
  {
    id: "lightspeed",
    name: "Lightspeed Restaurant (K-Series)",
    where: "Some hotel F&B and independents",
    connectHow: "Lightspeed OAuth. Business ID + token. Open tables via financial / order endpoints.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: false,
    inventory: "Lightspeed. Pay-at-Table only until order-in is certified.",
    docs: "Lightspeed Restaurant API",
  },
  {
    id: "square",
    name: "Square for Restaurants",
    where: "Small venues, pop-ups",
    connectHow: "Square OAuth. Location ID. Orders API + Payments API.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: true,
    inventory: "Square catalog/stock. Optional.",
    docs: "https://developer.squareup.com",
  },
  {
    id: "revel",
    name: "Revel",
    where: "Multi-site groups",
    connectHow: "Revel API key + establishment. Checks as orders with dining table resource.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: false,
    inventory: "Revel. Mark tender paid; don’t rewrite recipes.",
    docs: "Revel Systems API",
  },
  {
    id: "tablet",
    name: "No POS / Split tablet",
    where: "Paper till, Excel, or first-week pop-up",
    connectHow: "No API. Staff type the bill on a tablet. Guest still scans and pays.",
    canReadCheck: true,
    canMarkPaid: true,
    canSendOrder: false,
    inventory: "None. Do not promise stock.",
    docs: "Internal tablet check",
  },
];

export function findPos(id: string) {
  return posSystems.find((p) => p.id === id);
}

/** Native-looking sandbox payloads so you practice mapping, not just pretty UI. */
export function samplePayload(id: PosId) {
  switch (id) {
    case "foodics":
      return {
        data: {
          id: "fod_lab_88",
          status: 2,
          table: { name: "7" },
          branch: { name: "Qahwa Al Qurum" },
          products: [
            { name: "Flat white", quantity: 2, unit_price: 1.8, total_price: 3.6 },
            { name: "Date croissant", quantity: 1, unit_price: 1.4, total_price: 1.4 },
          ],
          subtotal_price: 5.0,
          total_tax: 0.25,
          total_price: 5.25,
        },
      };
    case "micros":
      return {
        CheckNumber: 44012,
        RVC: "All Day Dining",
        TableName: "12",
        Employee: "Fatima",
        Detail: [
          { Name: "Hammour mashwi", Qty: 1, Amount: 8.5 },
          { Name: "Mint lemonade", Qty: 2, Amount: 3.6 },
        ],
        Subtotal: 12.1,
        Tax: 0.605,
        TotalDue: 12.705,
      };
    case "toast":
      return {
        guid: "toast-chk-19",
        table: { name: "4" },
        restaurantName: "Mutrah Kitchen",
        checks: [
          {
            selections: [
              { displayName: "Truffle tagliatelle", quantity: 1, price: 6.4 },
              { displayName: "Tiramisu", quantity: 1, price: 2.6 },
            ],
            amount: 9.0,
            taxAmount: 0.45,
            totalAmount: 9.45,
          },
        ],
      };
    case "lightspeed":
      return {
        id: "ls-k-221",
        tableName: "8",
        account: { name: "Qurum Coast" },
        items: [
          { name: "Catch of the day", quantity: 1, price: 9.5 },
          { name: "Saffron rice", quantity: 1, price: 1.8 },
        ],
        totals: { net: 11.3, tax: 0.565, due: 11.865 },
      };
    case "square":
      return {
        order: {
          id: "sq_ord_55",
          location_id: "LOC_MCT",
          line_items: [
            { name: "Cappuccino", quantity: "1", base_price_money: { amount: 1600, currency: "OMR" } },
            { name: "Muffin", quantity: "1", base_price_money: { amount: 1200, currency: "OMR" } },
          ],
          net_amounts: { total_money: { amount: 2940, currency: "OMR" } },
        },
      };
    case "revel":
      return {
        id: 90210,
        establishment: "Seeb Social",
        dining_table: { number: "3" },
        items: [
          { product_name: "Shuwa slider", quantity: 2, price: 3.2 },
        ],
        subtotal: 6.4,
        tax: 0.32,
        final_total: 6.72,
      };
    case "tablet":
      return {
        entered_by: "Noor",
        table: "5",
        lines: [
          { name: "Americano", qty: 1, omr: 1.4 },
          { name: "Cheese toastie", qty: 1, omr: 2.1 },
        ],
        vat_rate: 0.05,
      };
  }
}

export function mappedCheck(id: PosId) {
  const raw = samplePayload(id);
  switch (id) {
    case "foodics": {
      const d = (raw as { data: Record<string, number | string | object> }).data;
      return {
        posCheckId: String(d.id),
        venue: "Qahwa Al Qurum",
        table: "7",
        items: [
          { name: "Flat white", qty: 2, omr: 1.8 },
          { name: "Date croissant", qty: 1, omr: 1.4 },
        ],
        foodVat: 5.25,
      };
    }
    case "micros":
      return {
        posCheckId: "44012",
        venue: "Hotel All Day Dining",
        table: "12",
        items: [
          { name: "Hammour mashwi", qty: 1, omr: 8.5 },
          { name: "Mint lemonade", qty: 2, omr: 1.8 },
        ],
        foodVat: 12.705,
      };
    case "toast":
      return {
        posCheckId: "toast-chk-19",
        venue: "Mutrah Kitchen",
        table: "4",
        items: [
          { name: "Truffle tagliatelle", qty: 1, omr: 6.4 },
          { name: "Tiramisu", qty: 1, omr: 2.6 },
        ],
        foodVat: 9.45,
      };
    case "lightspeed":
      return {
        posCheckId: "ls-k-221",
        venue: "Qurum Coast",
        table: "8",
        items: [
          { name: "Catch of the day", qty: 1, omr: 9.5 },
          { name: "Saffron rice", qty: 1, omr: 1.8 },
        ],
        foodVat: 11.865,
      };
    case "square":
      return {
        posCheckId: "sq_ord_55",
        venue: "Corniche Cart",
        table: "1",
        items: [
          { name: "Cappuccino", qty: 1, omr: 1.6 },
          { name: "Muffin", qty: 1, omr: 1.2 },
        ],
        foodVat: 2.94,
      };
    case "revel":
      return {
        posCheckId: "90210",
        venue: "Seeb Social",
        table: "3",
        items: [{ name: "Shuwa slider", qty: 2, omr: 3.2 }],
        foodVat: 6.72,
      };
    case "tablet":
      return {
        posCheckId: "tab-5",
        venue: "Pop-up stall",
        table: "5",
        items: [
          { name: "Americano", qty: 1, omr: 1.4 },
          { name: "Cheese toastie", qty: 1, omr: 2.1 },
        ],
        foodVat: 3.675,
      };
  }
}

type LabState = {
  connected: Partial<Record<PosId, string>>;
  lastCheck: Partial<Record<PosId, { at: string; status: "open" | "paid" }>>;
  log: Array<{ at: string; pos: PosId; action: string; detail: string }>;
};

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "pos-lab.json");

function read(): LabState {
  try {
    if (!existsSync(FILE)) return { connected: {}, lastCheck: {}, log: [] };
    return JSON.parse(readFileSync(FILE, "utf8")) as LabState;
  } catch {
    return { connected: {}, lastCheck: {}, log: [] };
  }
}

function write(state: LabState) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8");
}

function log(state: LabState, pos: PosId, action: string, detail: string) {
  state.log = [{ at: new Date().toISOString(), pos, action, detail }, ...state.log].slice(0, 40);
}

export function labSnapshot() {
  return read();
}

export function labConnect(id: PosId) {
  const pos = findPos(id);
  if (!pos) throw new Error("Unknown POS");
  const state = read();
  state.connected[id] = new Date().toISOString();
  log(state, id, "connect", `Sandbox authorised for ${pos.name}`);
  write(state);
  return state;
}

export function labFetch(id: PosId) {
  const pos = findPos(id);
  if (!pos) throw new Error("Unknown POS");
  const state = read();
  if (!state.connected[id]) throw new Error("Connect this POS first.");
  state.lastCheck[id] = { at: new Date().toISOString(), status: "open" };
  log(state, id, "fetch-check", `Open check mapped from ${pos.name}`);
  write(state);
  return { state, raw: samplePayload(id), mapped: mappedCheck(id) };
}

export function labMarkPaid(id: PosId) {
  const pos = findPos(id);
  if (!pos) throw new Error("Unknown POS");
  const state = read();
  if (!state.lastCheck[id]) throw new Error("Fetch a check first.");
  state.lastCheck[id] = { at: new Date().toISOString(), status: "paid" };
  log(state, id, "mark-paid", `Tender posted. ${pos.inventory}`);
  write(state);
  return state;
}

export function labSendOrder(id: PosId) {
  const pos = findPos(id);
  if (!pos) throw new Error("Unknown POS");
  if (!pos.canSendOrder) throw new Error(`${pos.name} practice is Pay-at-Table only. No QR order-in yet.`);
  const state = read();
  if (!state.connected[id]) throw new Error("Connect this POS first.");
  log(state, id, "send-order", "Sandbox order sent. Kitchen ticket + stock stay in the POS.");
  write(state);
  return state;
}
