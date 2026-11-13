import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPublicData,
  loadProjectData,
  validateProjectData,
} from "../scripts/lib/catalog-pipeline.mjs";
import { getScheduleState } from "../src/core/schedule-engine.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function freshData() {
  return structuredClone(loadProjectData(projectRoot));
}

function programSlot(data, channelId) {
  return data.schedule.templates.find(
    (template) => template.channelId === channelId,
  ).slots[0];
}

describe("Etapp 4:s datarör", () => {
  it("bygger samma publika data deterministiskt", () => {
    const first = buildPublicData(freshData());
    const second = buildPublicData(freshData());

    expect(second).toEqual(first);
    expect(first["manifest.json"].counts).toEqual({
      channels: 9,
      catalogItems: 9,
      scheduleSlots: 616,
      weatherLocations: 3,
    });
    expect(first["teletext.json"].grid).toEqual({ columns: 40, rows: 24 });
  });

  it("stoppar en okänd programreferens med begripligt fel", () => {
    const data = freshData();
    data.schedule.templates[0].slots[0].catalogItemId = "saknat-program";

    expect(() => validateProjectData(data)).toThrow(
      'slot "tv1-daglig/dygn" hänvisar till okänt katalogobjekt "saknat-program"',
    );
  });

  it("stoppar review_required från publicerad tablå", () => {
    const data = freshData();
    programSlot(data, "tv7").catalogItemId = "tv7-arkiv-kandidat";
    programSlot(data, "tv7").durationSeconds = 1800;

    expect(() => buildPublicData(data)).toThrow(
      'slot "tv7-daglig/dygn" får inte publiceras: rättighetsstatus är "review_required"',
    );
  });

  it("stoppar rejected från publicerad tablå", () => {
    const data = freshData();
    programSlot(data, "tv5").catalogItemId = "tv5-avvisat-rattighetsexempel";
    programSlot(data, "tv5").durationSeconds = 600;

    expect(() => buildPublicData(data)).toThrow(
      'slot "tv5-daglig/dygn" får inte publiceras: rättighetsstatus är "rejected"',
    );
  });

  it("validerar tillgänglighet och rättigheter som separata statusfält", () => {
    const data = freshData();
    data.catalog.items[0].availabilityStatus = "unavailable";

    expect(() => buildPublicData(data)).toThrow(
      'slot "tv1-daglig/dygn" får inte publiceras: tillgänglighet är "unavailable"',
    );
  });

  it("stoppar dubbla kanalnummer", () => {
    const data = freshData();
    data.channels.channels[2].number = data.channels.channels[1].number;

    expect(() => validateProjectData(data)).toThrow(
      'kanalnummer "2" är inte unikt',
    );
  });

  it("kräver den fastställda kanalplanen 01–09", () => {
    const data = freshData();
    data.channels.channels[8].number = 8;

    expect(() => validateProjectData(data)).toThrow(
      "kanalplanen måste innehålla exakt kanal 01–09",
    );
  });

  it("kräver att tablåhorisonten börjar på en måndag", () => {
    const data = freshData();
    data.schedule.horizon.startDate = "2026-10-20";

    expect(() => validateProjectData(data)).toThrow(
      "tablåhorisontens startdatum måste vara en måndag",
    );
  });

  it("växlar Barn 18.55, 19.00 och 06.00 exakt", () => {
    const schedule = buildPublicData(freshData())["schedule.json"];

    expect(
      getScheduleState(schedule, "barn", Date.parse("2026-11-13T17:54:00Z"))
        .current?.type,
    ).toBe("program");
    expect(
      getScheduleState(schedule, "barn", Date.parse("2026-11-13T17:55:00Z"))
        .current?.type,
    ).toBe("ident");
    expect(
      getScheduleState(schedule, "barn", Date.parse("2026-11-13T18:00:00Z"))
        .current?.type,
    ).toBe("off_air");
    expect(
      getScheduleState(schedule, "barn", Date.parse("2026-11-14T04:59:59Z"))
        .current?.type,
    ).toBe("off_air");
    expect(
      getScheduleState(schedule, "barn", Date.parse("2026-11-14T05:00:00Z"))
        .current?.type,
    ).toBe("program");
  });

  it("validerar obligatoriska schemafält", () => {
    const data = freshData();
    delete data.catalog.items[0].title;

    expect(() => validateProjectData(data)).toThrow(/catalog\/items\/0.*title/);
  });

  it("stoppar väderdata med omvänd giltighetstid", () => {
    const data = freshData();
    data.weather.validUntil = data.weather.fetchedAt;

    expect(() => validateProjectData(data)).toThrow(
      "vädersnapshotens giltighet måste sluta efter hämtningstiden",
    );
  });
});
