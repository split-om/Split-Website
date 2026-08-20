export type StaffAccess = {
  floor: boolean;
  till: boolean;
  menu: boolean;
  people: boolean;
};

export type StaffUser = {
  id: string;
  slug: string;
  name: string;
  passwordHash: string;
  access: StaffAccess;
  locked?: boolean;
};

export type StaffPublic = {
  id: string;
  slug: string;
  name: string;
  access: StaffAccess;
  locked?: boolean;
};

export type StaffToken = {
  token: string;
  slug: string;
  userId: string;
  at: string;
};

export const ACCESS_KEYS: Array<{ key: keyof StaffAccess; label: string; hint: string }> = [
  { key: "floor", label: "Floor", hint: "See tables, orders, and waiter calls" },
  { key: "till", label: "Till", hint: "Type or send a bill to the guest QR" },
  { key: "menu", label: "Edit menu", hint: "Change dishes and prices guests see" },
  { key: "people", label: "Manage people", hint: "Add staff and choose what they can do" },
];

export const ALL_ACCESS: StaffAccess = { floor: true, till: true, menu: true, people: true };
export const WAITER_ACCESS: StaffAccess = { floor: true, till: true, menu: false, people: false };

export function toPublic(u: StaffUser): StaffPublic {
  return { id: u.id, slug: u.slug, name: u.name, access: u.access, locked: u.locked };
}
