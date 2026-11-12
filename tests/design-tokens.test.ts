import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../src/styles/components.css", import.meta.url),
  "utf8",
);
const tokensCss = readFileSync(
  new URL("../src/styles/tokens.css", import.meta.url),
  "utf8",
);

describe("designsystemets CSS-kontrakt", () => {
  it("definierar projektets fem färger centralt", () => {
    for (const color of [
      "#182660",
      "#f4c94b",
      "#e97867",
      "#f5eacd",
      "#000000",
    ]) {
      expect(tokensCss).toContain(color);
    }
  });

  it("håller komponentstilar fria från duplicerade hexvärden", () => {
    expect(componentsCss).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it("har 4:3-token och stänger av rörligt CRT-brus vid reducerad rörelse", () => {
    expect(tokensCss).toContain("--screen-ratio: 4 / 3");
    expect(componentsCss).toContain("prefers-reduced-motion: reduce");
    expect(componentsCss).toMatch(
      /prefers-reduced-motion[\s\S]*animation:\s*none/,
    );
  });
});
