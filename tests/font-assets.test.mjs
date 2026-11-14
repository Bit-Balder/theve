import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const font = readFileSync(
  new URL("../src/assets/fonts/TDAText.ttf", import.meta.url),
);
const css = readFileSync(
  new URL("../src/styles/fonts.css", import.meta.url),
  "utf8",
);

function table(tag) {
  const count = font.readUInt16BE(4);
  for (let index = 0; index < count; index++) {
    const start = 12 + index * 16;
    if (font.toString("ascii", start, start + 4) === tag) {
      return {
        offset: font.readUInt32BE(start + 8),
        length: font.readUInt32BE(start + 12),
      };
    }
  }
  return null;
}

describe("lokalt TDAText-typsnitt", () => {
  it("är en riktig TrueType-fil med teckenkonturer", () => {
    expect(font.readUInt32BE(0)).toBe(0x00010000);
    expect(font.readUInt16BE(4)).toBeGreaterThan(0);
    expect(table("glyf")?.length).toBeGreaterThan(0);
    expect(table("loca")?.length).toBeGreaterThan(0);
    expect(table("cmap")?.length).toBeGreaterThan(0);
    for (const name of ["glyf", "loca", "cmap"]) {
      const entry = table(name);
      expect(entry).not.toBeNull();
      expect(entry.offset + entry.length).toBeLessThanOrEqual(font.length);
    }
  });

  it("laddas från den lokala TTF-filen med korrekt format", () => {
    expect(css).toContain('url("../assets/fonts/TDAText.ttf")');
    expect(css).toContain('format("truetype")');
    expect(css).not.toContain("TDAText.woff2");
  });
});
