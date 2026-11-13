import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(
  new URL("../src/styles/tokens.css", import.meta.url),
  "utf8",
);

function rgb(token) {
  const match = tokens.match(new RegExp(`--${token}:\\s*#([0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Saknad färgtoken: ${token}`);
  return [0, 2, 4].map((offset) =>
    Number.parseInt(match[1].slice(offset, offset + 2), 16),
  );
}

function luminance(color) {
  const channels = color.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const brighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (brighter + 0.05) / (darker + 0.05);
}

describe("kritiska färgkontraster", () => {
  for (const [foreground, background] of [
    ["color-cream", "color-tv-blue"],
    ["color-yellow", "color-tv-blue"],
    ["color-teletext", "color-yellow"],
    ["color-teletext", "color-coral"],
  ]) {
    it(`${foreground} mot ${background} klarar WCAG AA för normal text`, () => {
      expect(contrast(rgb(foreground), rgb(background))).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  }
});
