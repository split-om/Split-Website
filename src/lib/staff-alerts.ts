import { newId } from "./id";

export type StaffAlert = {
  id: string;
  type: "waiter" | "restaurant-pay" | "order";
  code: string;
  table: string;
  venue: string;
  message: string;
  at: string;
  ack: boolean;
};

const KEY = "split-staff-alerts";

export function loadAlerts(): StaffAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StaffAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: StaffAlert[]) {
  localStorage.setItem(KEY, JSON.stringify(alerts.slice(0, 40)));
}

export function pushAlert(input: Omit<StaffAlert, "id" | "at" | "ack">): StaffAlert {
  const alert: StaffAlert = {
    ...input,
    id: newId(),
    at: new Date().toISOString(),
    ack: false,
  };
  saveAlerts([alert, ...loadAlerts()]);
  return alert;
}

export function ackAlert(id: string) {
  saveAlerts(loadAlerts().map((a) => (a.id === id ? { ...a, ack: true } : a)));
}

export function clearAlertsForCode(code: string) {
  saveAlerts(loadAlerts().filter((a) => a.code !== code));
}

export function openAlertsForTable(table: string) {
  return loadAlerts().filter((a) => a.table === table && !a.ack);
}
