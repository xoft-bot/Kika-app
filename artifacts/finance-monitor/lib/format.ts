export function fmtUGX(n: number): string {
  const v = Math.round(n || 0);
  return "UGX " + v.toLocaleString();
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

export function fmtDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export function fmtDateLong(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function pct(paid: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
