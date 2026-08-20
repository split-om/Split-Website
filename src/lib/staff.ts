import { createHash, randomBytes } from "crypto";
import { ALL_ACCESS, WAITER_ACCESS, type StaffUser } from "@/lib/staff-types";

export function hashPassword(password: string) {
  return createHash("sha256").update(`split:${password.trim()}`).digest("hex");
}

export function newToken() {
  return randomBytes(24).toString("hex");
}

export function seedStaff(slug: string): StaffUser[] {
  return [
    {
      id: "owner",
      slug,
      name: "Aisha",
      passwordHash: hashPassword("owner123"),
      access: ALL_ACCESS,
      locked: true,
    },
    {
      id: "noor",
      slug,
      name: "Noor",
      passwordHash: hashPassword("waiter123"),
      access: WAITER_ACCESS,
    },
  ];
}
