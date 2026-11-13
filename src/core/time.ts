export const THEVE_TIME_ZONE = "Europe/Stockholm";

export function formatTheveClock(epochMs: number = Date.now()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: THEVE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(epochMs);
}

export function millisecondsUntilNextMinute(epochMs: number): number {
  const elapsed = ((epochMs % 60_000) + 60_000) % 60_000;
  return elapsed === 0 ? 60_000 : 60_000 - elapsed;
}
