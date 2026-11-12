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

function retroProgramSlot(data) {
  return data.schedule.templates.find(
    (template) => template.channelId === "retro-tv",
  ).slots[0];
}

describe("Etapp 4:s datarör", () => {
  it("bygger samma publika data deterministiskt", () => {
    const first = buildPublicData(freshData());
    const second = buildPublicData(freshData());

    expect(second).toEqual(first);
    expect(first["manifest.json"].counts).toEqual({
      channels: 5,
      catalogItems: 4,
      scheduleSlots: 448,
    });
  });

  it("stoppar en okänd programreferens med begripligt fel", () => {
    const data = freshData();
    data.schedule.templates[0].slots[0].catalogItemId = "saknat-program";

    expect(() => validateProjectData(data)).toThrow(
      'slot "barnkanalen-daglig/morgon" hänvisar till okänt katalogobjekt "saknat-program"',
    );
  });

  it("stoppar review_required från publicerad tablå", () => {
    const data = freshData();
    retroProgramSlot(data).catalogItemId = "retro-arkiv-kandidat";

    expect(() => buildPublicData(data)).toThrow(
      'slot "retro-tv-daglig/kvall" får inte publiceras: rättighetsstatus är "review_required"',
    );
  });

  it("stoppar rejected från publicerad tablå", () => {
    const data = freshData();
    retroProgramSlot(data).catalogItemId = "avvisat-rattighetsexempel";
    retroProgramSlot(data).durationSeconds = 600;

    expect(() => buildPublicData(data)).toThrow(
      'slot "retro-tv-daglig/kvall" får inte publiceras: rättighetsstatus är "rejected"',
    );
  });

  it("validerar tillgänglighet och rättigheter som separata statusfält", () => {
    const data = freshData();
    data.catalog.items[0].availabilityStatus = "unavailable";

    expect(() => buildPublicData(data)).toThrow(
      'slot "barnkanalen-daglig/morgon" får inte publiceras: tillgänglighet är "unavailable"',
    );
  });

  it("stoppar dubbla kanalnummer", () => {
    const data = freshData();
    data.channels.channels[2].number = data.channels.channels[1].number;

    expect(() => validateProjectData(data)).toThrow(
      'kanalnummer "1" är inte unikt',
    );
  });

  it("tillåter flera veckomallar för samma kanal", () => {
    const data = freshData();
    data.schedule.templates.push({
      id: "retro-tv-lordagsvinjett",
      channelId: "retro-tv",
      daysOfWeek: [6],
      slots: [
        {
          id: "lordagsvinjett",
          type: "ident",
          startLocal: "19:55",
          durationSeconds: 300,
          label: "Lördagskväll på Retro TV",
        },
      ],
    });

    expect(() => validateProjectData(data)).not.toThrow();
  });

  it("kräver att tablåhorisonten börjar på en måndag", () => {
    const data = freshData();
    data.schedule.horizon.startDate = "2026-10-20";

    expect(() => validateProjectData(data)).toThrow(
      "tablåhorisontens startdatum måste vara en måndag",
    );
  });

  it("validerar obligatoriska schemafält", () => {
    const data = freshData();
    delete data.catalog.items[0].title;

    expect(() => validateProjectData(data)).toThrow(/catalog\/items\/0.*title/);
  });
});
