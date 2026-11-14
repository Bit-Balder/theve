import { describe, expect, it } from "vitest";
import { describeWeatherError, smhiPointUrl } from "../src/core/local-weather";
import {
  chooseMunicipality,
  findMunicipality,
  MUNICIPALITIES,
  municipalitiesInRegion,
  REGIONS,
  toggleFavorite,
} from "../src/core/weather-places";

describe("Väderregioner, kommuner och favoriter", () => {
  it("har 21 län och 290 unika kommuner", () => {
    expect(REGIONS).toHaveLength(21);
    expect(MUNICIPALITIES).toHaveLength(290);
    expect(new Set(MUNICIPALITIES.map((place) => place.id)).size).toBe(290);
  });

  it("visar bara kommuner i valt län", () => {
    const region = "Stockholms län";
    const cities = municipalitiesInRegion(region);
    expect(cities.length).toBeGreaterThan(20);
    expect(cities.every((municipality) => municipality.region === region)).toBe(
      true,
    );
    expect(
      cities.some((municipality) => municipality.name === "Stockholm"),
    ).toBe(true);
    expect(cities.some((municipality) => municipality.name === "Malmö")).toBe(
      false,
    );
  });

  it("sparar högst fem favoriter och kan ta bort en favorit", () => {
    const ids = MUNICIPALITIES.slice(0, 6).map((place) => place.id);
    let preferences = {
      selectedId: null as string | null,
      favorites: [] as readonly string[],
    };
    for (const id of ids) {
      preferences = toggleFavorite(preferences, id);
    }
    expect(preferences.favorites).toHaveLength(5);
    expect(preferences.favorites).not.toContain(ids[0]);
    preferences = toggleFavorite(preferences, ids[2]);
    expect(preferences.favorites).not.toContain(ids[2]);
    preferences = chooseMunicipality(preferences, ids[1]);
    expect(preferences.selectedId).toBe(ids[1]);
  });

  it("bevarar kommunnamn som slutar med s", () => {
    expect(findMunicipality("0486")?.name).toBe("Strängnäs");
    expect(MUNICIPALITIES.some((place) => place.name === "Västerås")).toBe(
      true,
    );
    expect(MUNICIPALITIES.some((place) => place.name === "Höganäs")).toBe(true);
  });

  it("visar statuskod eller nätverksfel från SMHI", () => {
    expect(describeWeatherError(new Error("SMHI svarade HTTP 403."))).toBe(
      "SMHI SVARADE HTTP 403",
    );
    expect(describeWeatherError(new TypeError("Failed to fetch"))).toBe(
      "NÄTVERK ELLER WEBBLÄSARE STOPPADE SMHI",
    );
  });

  it("söker en SMHI-prognos för vald kommuns punkt", () => {
    const municipality = findMunicipality("0180");
    expect(municipality?.name).toBe("Stockholm");
    if (!municipality) throw new Error("Stockholm saknas");
    const url = smhiPointUrl(municipality);
    expect(url).toContain("snow1g");
    expect(url).toContain("lon/");
    expect(url).toContain("lat/");
    expect(url).toContain("timeseries=8");
  });
});
