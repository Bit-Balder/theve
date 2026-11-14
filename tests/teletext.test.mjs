import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPublicData,
  loadProjectData,
} from "../scripts/lib/catalog-pipeline.mjs";
import {
  createTeletextPage,
  TELETEXT_COLUMNS,
  TELETEXT_PAGE_NUMBERS,
  TELETEXT_ROWS,
  wrapTeletextText,
} from "../src/core/teletext.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const generated = buildPublicData(loadProjectData(projectRoot));
const baseContext = {
  channelName: "TV1",
  channels: generated["channels.json"].channels,
  schedule: generated["schedule.json"],
  weather: generated["teletext.json"].weather,
  nowEpochMs: Date.parse("2026-11-13T13:05:00Z"),
};

describe("Text-TV", () => {
  it("bygger varje beslutad sida som exakt 40 × 24 tecken", () => {
    for (const number of TELETEXT_PAGE_NUMBERS) {
      const page = createTeletextPage(number, baseContext);
      expect(page.rows).toHaveLength(TELETEXT_ROWS);
      expect(
        page.rows.every((row) => Array.from(row).length === TELETEXT_COLUMNS),
      ).toBe(true);
    }
  });

  it("bryter långa datarader utan horisontell scroll", () => {
    const rows = wrapTeletextText(
      "Det här är en lång svensk Text-TV-rad med å, ä och ö som måste brytas säkert.",
    );
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((row) => Array.from(row).length <= 40)).toBe(true);
    expect(rows.join(" ")).toContain("å, ä och ö");
  });

  it("visar SMHI, bearbetning och valda orter i färsk väderdata", () => {
    const overview = createTeletextPage("300", baseContext);
    const locations = createTeletextPage("301", baseContext);
    const text = [...overview.rows, ...locations.rows].join("\n");

    expect(overview.status).toBe("ready");
    expect(text).toContain("SMHI");
    expect(text).toContain("BEARBETAD AV THEVE");
    expect(text).toContain("STOCKHOLMSOMRÅDET");
    expect(text).toContain("GÖTEBORGSOMRÅDET");
    expect(text).toContain("MALMÖOMRÅDET");
  });

  it("döljer prognosvärden när snapshoten är gammal eller saknas", () => {
    const stale = createTeletextPage("300", {
      ...baseContext,
      nowEpochMs: Date.parse("2026-11-14T00:00:00Z"),
    });
    const missing = createTeletextPage("300", {
      ...baseContext,
      weather: null,
    });

    expect(stale.status).toBe("stale");
    expect(stale.rows.join("\n")).toContain("INAKTUELL");
    expect(stale.rows.join("\n")).not.toContain("M/S");
    expect(missing.status).toBe("missing");
    expect(missing.rows.join("\n")).toContain("VÄDERDATA SAKNAS");
  });

  it("skiljer lokala Open-Meteo-data från SMHI:s Sverigeöversikt", () => {
    const local = createTeletextPage("300", {
      ...baseContext,
      selectedMunicipalityName: "Strängnäs",
      selectedWeather: {
        id: "0486",
        name: "Strängnäs",
        latitude: 59.377,
        longitude: 17.032,
        sourceUrl: "https://api.open-meteo.com/v1/forecast",
        forecasts: [
          {
            validAt: "2026-11-13T14:00:00Z",
            temperatureC: 4,
            windMps: 3,
            precipitationMm: 0.2,
          },
        ],
      },
    });
    expect(local.rows.join("\n")).toContain("OPEN-METEO.COM");
    expect(local.rows.join("\n")).not.toContain("SMHI");
    const overview = createTeletextPage("304", baseContext);
    expect(overview.rows.join("\n")).toContain("SMHI");
  });

  it("bygger sida 400 från samma aktuella schema som programguiden", () => {
    const page = createTeletextPage("400", baseContext);
    const text = page.rows.join("\n");

    expect(text).toContain("SAMMA SCHEMADATA SOM PROGRAMGUIDEN");
    expect(text).toContain("TV1 · Nyheter och kultur");
    expect(text).toContain("08 BARN");
  });

  it("renderar svenska bokstäver i den egna barnsidans innehåll", () => {
    expect(createTeletextPage("500", baseContext).rows.join("\n")).toContain(
      "Å Ä Ö",
    );
  });
});
