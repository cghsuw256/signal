export function todayStamp(timeZone = "Asia/Seoul"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftDate(stamp: string, days: number): string {
  const t = Date.parse(`${stamp}T00:00:00Z`) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export function rangeForPreset(days: 7 | 14 | 30): { from: string; to: string } {
  const to = todayStamp();
  return { from: shiftDate(to, -(days - 1)), to };
}

export function rangeForMorning(): { from: string; to: string } {
  const to = todayStamp();
  return { from: shiftDate(to, -1), to };
}

export function isMorningRange(from: string, to: string): boolean {
  const m = rangeForMorning();
  return m.from === from && m.to === to;
}

export function formatMorningTitle(stamp: string): string {
  const [y, m, d] = stamp.split("-").map(Number);
  if (!y || !m || !d) return "아침 브리핑";
  return `${y}년 ${m}월 ${d}일 아침 브리핑`;
}

export function formatKoRange(from: string, to: string): string {
  const a = formatKoDay(from);
  const b = formatKoDay(to);
  return from === to ? a : `${a} – ${b}`;
}

export function formatKoDay(stamp: string): string {
  const [y, m, d] = stamp.split("-").map(Number);
  if (!y || !m || !d) return stamp;
  return `${y}. ${m}. ${d}.`;
}

export function formatKoShort(stamp: string): string {
  const [, m, d] = stamp.split("-").map(Number);
  if (!m || !d) return stamp;
  return `${m}/${d}`;
}
