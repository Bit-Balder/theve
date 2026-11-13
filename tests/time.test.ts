import { describe, expect, it } from "vitest";

import {
  formatTheveClock,
  millisecondsUntilNextMinute,
  THEVE_TIME_ZONE,
} from "../src/core/time";

describe("Theves svenska klocka", () => {
  it("visar svensk vinter- och sommartid från absoluta tidstämplar", () => {
    expect(THEVE_TIME_ZONE).toBe("Europe/Stockholm");
    expect(formatTheveClock(Date.parse("2026-01-15T11:30:00Z"))).toBe("12:30");
    expect(formatTheveClock(Date.parse("2026-07-15T10:30:00Z"))).toBe("12:30");
  });

  it("planerar nästa uppdatering vid kommande minut", () => {
    expect(millisecondsUntilNextMinute(0)).toBe(60_000);
    expect(millisecondsUntilNextMinute(59_500)).toBe(500);
    expect(millisecondsUntilNextMinute(60_001)).toBe(59_999);
  });
});
