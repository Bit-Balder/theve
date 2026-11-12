import { describe, expect, it } from "vitest";

import { getNextFocusIndex } from "../src/core/focus-navigation";

describe("fjärrkontrollens fokusnavigation", () => {
  it("flyttar fokus med pilar och går runt i båda riktningar", () => {
    expect(getNextFocusIndex(0, "ArrowDown", 3)).toBe(1);
    expect(getNextFocusIndex(2, "ArrowRight", 3)).toBe(0);
    expect(getNextFocusIndex(0, "ArrowUp", 3)).toBe(2);
    expect(getNextFocusIndex(1, "ArrowLeft", 3)).toBe(0);
  });

  it("stöder början och slut utan mus", () => {
    expect(getNextFocusIndex(1, "Home", 3)).toBe(0);
    expect(getNextFocusIndex(1, "End", 3)).toBe(2);
  });

  it("returnerar minus ett för en tom kontrollgrupp", () => {
    expect(getNextFocusIndex(0, "ArrowDown", 0)).toBe(-1);
  });
});
