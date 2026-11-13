import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPublicData,
  loadProjectData,
} from "../scripts/lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const data = loadProjectData(projectRoot);
const publicData = buildPublicData(data);
const appSource = readFileSync(
  new URL("../src/app.ts", import.meta.url),
  "utf8",
);
const card = readFileSync(
  new URL("../public/assets/cards/barn-off-air.svg", import.meta.url),
  "utf8",
);

describe("Barns sändningsuppehåll", () => {
  it("beskrivs av kanal- och tablådata i stället för kanalspecifik UI-kod", () => {
    const channel = data.channels.channels.find(({ id }) => id === "barn");
    const template = data.schedule.templates.find(
      ({ channelId }) => channelId === "barn",
    );
    const offAir = template.slots.find(({ type }) => type === "off_air");

    expect(channel.signOffAt).toBe("19:00");
    expect(offAir).toMatchObject({
      startLocal: "19:00",
      endLocal: "06:00",
      asset: "assets/cards/barn-off-air.svg",
    });
    expect(appSource).not.toContain('channelId === "barn"');
  });

  it("bevarar den lokala slutskylten i det publicerade UTC-schemat", () => {
    const slot = publicData["schedule.json"].slots.find(
      ({ channelId, type }) => channelId === "barn" && type === "off_air",
    );

    expect(slot.asset).toBe("assets/cards/barn-off-air.svg");
    expect(slot.catalogItemId).toBeNull();
  });

  it("använder endast egna lokala SVG-former och projektets färger", () => {
    const allowed = new Set([
      "#182660",
      "#f4c94b",
      "#e97867",
      "#f5eacd",
      "#000000",
    ]);
    const colors = card.match(/#[0-9a-f]{6}/gi) ?? [];

    expect(card).toContain("Barn sändningsuppehåll");
    expect(card).not.toMatch(/(?:href|src)=["']https?:\/\//);
    expect(colors.every((color) => allowed.has(color.toLowerCase()))).toBe(
      true,
    );
  });

  it("behöver ingen Internet Archive-källa under natten", () => {
    const barnItems = data.catalog.items.filter(
      ({ channelId }) => channelId === "barn",
    );
    expect(barnItems).toHaveLength(1);
    expect(barnItems[0].source.type).toBe("generated_test_pattern");
  });
});
