import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let migrated = false;

export function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";
}

export function useDb() {
  return Boolean(databaseUrl());
}

export function getSql() {
  const url = databaseUrl();
  if (!url) return null;
  if (!sql) sql = neon(url);
  return sql;
}

export async function ensureSchema() {
  const db = getSql();
  if (!db || migrated) return db;
  await db`CREATE TABLE IF NOT EXISTS venues (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    pos TEXT NOT NULL DEFAULT 'tablet',
    server TEXT NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await db`CREATE TABLE IF NOT EXISTS venue_tables (
    slug TEXT NOT NULL REFERENCES venues(slug) ON DELETE CASCADE,
    number TEXT NOT NULL,
    seats INT NOT NULL DEFAULT 4,
    bill_code TEXT,
    PRIMARY KEY (slug, number)
  )`;
  await db`CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    submitted_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    payload JSONB NOT NULL,
    venue_slug TEXT,
    owner_password TEXT
  )`;
  await db`CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    access JSONB NOT NULL,
    locked BOOLEAN DEFAULT false
  )`;
  await db`CREATE TABLE IF NOT EXISTS staff_tokens (
    token TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    user_id TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL
  )`;
  await db`CREATE TABLE IF NOT EXISTS menu_items (
    slug TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    detail TEXT,
    omr DOUBLE PRECISION NOT NULL,
    category TEXT NOT NULL,
    photo TEXT,
    sort INT DEFAULT 0,
    PRIMARY KEY (slug, id)
  )`;
  await db`CREATE TABLE IF NOT EXISTS menu_photos (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes BYTEA NOT NULL
  )`;
  await db`CREATE TABLE IF NOT EXISTS checks (
    code TEXT PRIMARY KEY,
    bill JSONB NOT NULL
  )`;
  await db`CREATE TABLE IF NOT EXISTS pay_sessions (
    code TEXT PRIMARY KEY,
    session JSONB NOT NULL
  )`;
  await db`CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  migrated = true;
  return db;
}
