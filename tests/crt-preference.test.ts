import { describe, expect, it } from "vitest";

import { resolveInitialCrtMode } from "../src/components/tv-shell";

describe("CRT-inställningen", () => {
  it("stänger av effekten vid reducerad rörelse", () => {
    expect(resolveInitialCrtMode("subtle", true)).toBe("off");
  });

  it("behåller ett uttryckligt av-val", () => {
    expect(resolveInitialCrtMode("off", false)).toBe("off");
  });

  it("använder diskret CRT när ingen annan preferens finns", () => {
    expect(resolveInitialCrtMode(null, false)).toBe("subtle");
  });
});
