export function slugifyName(name: string) {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return s || "venue";
}

export function tableCountFromRange(range: string) {
  const t = range.replace("–", "-");
  if (t.startsWith("1-10")) return 8;
  if (t.startsWith("11")) return 16;
  if (t.startsWith("26")) return 32;
  if (t.startsWith("51")) return 60;
  if (t.startsWith("100")) return 80;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 80) : 10;
}
