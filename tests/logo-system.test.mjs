import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildLogoManifest,
  buildLogoSvg,
  logoDefinitions,
  palette,
} from "../scripts/lib/logo-system.mjs";

const logoRoot = new URL("../public/assets/logos/", import.meta.url);

describe("etapp 7:s gemensamma logotypsystem", () => {
  it("innehåller Theve och nio egna kanalidentiteter", () => {
    expect(logoDefinitions.map((logo) => logo.id)).toEqual([
      "theve",
      "tv1",
      "tv2",
      "tv3",
      "tv4",
      "tv5",
      "tv6",
      "tv7",
      "barn",
      "natur",
    ]);
  });

  it("bygger fyra deterministiska SVG-varianter per märke", () => {
    for (const definition of logoDefinitions) {
      for (const [variant, suffix] of [
        ["full", ""],
        ["cream", "-cream"],
        ["black", "-black"],
        ["bug", "-bug"],
      ]) {
        const generated = buildLogoSvg(definition, variant);
        const file = readFileSync(
          new URL(`${definition.id}${suffix}.svg`, logoRoot),
          "utf8",
        );
        expect(file).toBe(generated);
        expect(file).toContain("<title");
        expect(file).not.toMatch(/<(?:filter|linearGradient|radialGradient)/);
      }
    }
  });

  it("håller de tre linjerna lika höga och jämnt placerade", () => {
    const svg = buildLogoSvg(logoDefinitions[1], "full");
    expect(svg).toContain('y="73" width="200" height="3"');
    expect(svg).toContain('y="81" width="200" height="3"');
    expect(svg).toContain('y="89" width="200" height="3"');
  });

  it("använder endast projektets fem fastställda färger", () => {
    const allowed = new Set(
      Object.values(palette).map((color) => color.toLowerCase()),
    );
    for (const definition of logoDefinitions) {
      for (const variant of ["full", "cream", "black", "bug"]) {
        const colors = buildLogoSvg(definition, variant).match(
          /#[0-9a-f]{6}/gi,
        );
        expect(colors?.every((color) => allowed.has(color.toLowerCase()))).toBe(
          true,
        );
      }
    }
  });

  it("dokumenterar viewBox, minsta storlek och tillåtna bakgrunder", () => {
    const manifest = buildLogoManifest();
    expect(manifest.construction.mainViewBox).toBe("0 0 320 96");
    expect(manifest.construction.safeAreaPercent).toBe(5);
    expect(manifest.logos).toHaveLength(10);
    expect(manifest.logos[1].minimumWidthPx.compact).toBe(72);
    expect(manifest.logos[1].allowedBackgrounds.fullColor).toEqual([
      "tv-blue",
      "black",
    ]);
  });
});
