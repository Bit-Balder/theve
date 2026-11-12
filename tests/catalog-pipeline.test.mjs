import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPublicData,
  loadProjectData,
  validateProjectData,
} from "../scripts/lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function freshData() {
  return structuredClone(loadProjectData(projectRoot));
}

describe("Etapp 3:s datarör", () => {
  it("bygger samma publika data deterministiskt", () => {
    const first = buildPublicData(freshData());
    const second = buildPublicData(freshData());

    expect(second).toEqual(first);
    expect(first["manifest.json"].counts).toEqual({
      channels: 5,
      catalogItems: 3,
      scheduleSlots: 3,
    });
  });

  it("stoppar en okänd programreferens med begripligt fel", () => {
    const data = freshData();
    data.schedule.slots[0].catalogItemId = "saknat-program";

    expect(() => validateProjectData(data)).toThrow(
      'slot "barnkanalen-000" hänvisar till okänt katalogobjekt "saknat-program"',
    );
  });

  it("stoppar review_required från publicerad tablå", () => {
    const data = freshData();
    data.schedule.slots.push({
      id: "retro-tv-000",
      channelId: "retro-tv",
      catalogItemId: "retro-arkiv-kandidat",
      order: 0,
      plannedDurationSeconds: 1800,
    });

    expect(() => buildPublicData(data)).toThrow(
      'slot "retro-tv-000" får inte publiceras: rättighetsstatus är "review_required"',
    );
  });

  it("stoppar rejected från publicerad tablå", () => {
    const data = freshData();
    data.schedule.slots.push({
      id: "retro-tv-000",
      channelId: "retro-tv",
      catalogItemId: "avvisat-rattighetsexempel",
      order: 0,
      plannedDurationSeconds: 600,
    });

    expect(() => buildPublicData(data)).toThrow(
      'slot "retro-tv-000" får inte publiceras: rättighetsstatus är "rejected"',
    );
  });

  it("validerar tillgänglighet och rättigheter som separata statusfält", () => {
    const data = freshData();
    data.catalog.items[0].availabilityStatus = "unavailable";

    expect(() => buildPublicData(data)).toThrow(
      'slot "barnkanalen-000" får inte publiceras: tillgänglighet är "unavailable"',
    );
  });

  it("stoppar dubbla kanalnummer", () => {
    const data = freshData();
    data.channels.channels[2].number = data.channels.channels[1].number;

    expect(() => validateProjectData(data)).toThrow(
      'kanalnummer "1" är inte unikt',
    );
  });

  it("validerar obligatoriska schemafält", () => {
    const data = freshData();
    delete data.catalog.items[0].title;

    expect(() => validateProjectData(data)).toThrow(/catalog\/items\/0.*title/);
  });
});
