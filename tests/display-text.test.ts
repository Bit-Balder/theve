import { describe, expect, it } from "vitest";
import { displayTvText } from "../src/core/display-text";

describe("TDAText-visning", () => {
  it("visar vanliga bindestreck i programtitlar", () => {
    expect(displayTvText("TV1 · Nyheter och kultur")).toBe(
      "TV1 - Nyheter och kultur",
    );
    expect(displayTvText("NÄSTA · TV1 · Nyheter och kultur")).toBe(
      "NÄSTA - TV1 - Nyheter och kultur",
    );
  });

  it("bevarar annan interpunktion och svenska tecken", () => {
    expect(displayTvText("Å Ä Ö - Text-TV")).toBe("Å Ä Ö - Text-TV");
    expect(displayTvText("Svensk familje-TV")).toBe("Svensk familje-TV");
  });
});
