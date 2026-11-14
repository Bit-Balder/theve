import { describe, expect, it } from "vitest";
import {
  describeWeatherError,
  fetchMunicipalityWeather,
  openMeteoForecastUrl,
} from "../src/core/local-weather";
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

  it("visar statuskod eller nätverksfel från lokalt väder", () => {
    expect(describeWeatherError(new Error("Open-Meteo svarade HTTP 403."))).toBe(
      "OPEN-METEO SVARADE HTTP 403",
    );
    expect(describeWeatherError(new TypeError("Failed to fetch"))).toBe(
      "NÄTVERK ELLER WEBBLÄSARE STOPPADE DATA",
    );
  });

  it("söker Open-Meteo med m/s och UTC-tidsstämplar", () => {
    const municipality = findMunicipality("0486");
    expect(municipality?.name).toBe("Strängnäs");
    if (!municipality) throw new Error("Strängnäs saknas");
    const url = new URL(openMeteoForecastUrl(municipality));
    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.searchParams.get("latitude")).toBe(String(municipality.latitude));
    expect(url.searchParams.get("longitude")).toBe(String(municipality.longitude));
    expect(url.searchParams.get("wind_speed_unit")).toBe("ms");
    expect(url.searchParams.get("timeformat")).toBe("unixtime");
    expect(url.searchParams.get("hourly")).toContain("precipitation");
  });

  it("omvandlar Open-Meteos timprognos till Text-TV:s värden", async () => {
    const municipality = findMunicipality("0486");
    if (!municipality) throw new Error("Strängnäs saknas");
    const nextHour = Math.ceil(Date.now() / 3_600_000) * 3_600;
    let calls = 0;
    const fetcher = (async (url: RequestInfo | URL) => {
      calls += 1;
      expect(String(url)).toContain("api.open-meteo.com");
      return new Response(
        JSON.stringify({
          hourly: {
            time: [nextHour, nextHour + 3600],
            temperature_2m: [4.5, 3],
            precipitation: [0, 0.3],
            wind_speed_10m: [2.6, 3.4],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const result = await fetchMunicipalityWeather(municipality, fetcher);
    expect(calls).toBe(1);
    expect(result.location.sourceUrl).toContain("api.open-meteo.com");
    expect(result.location.name).toBe("Strängnäs");
    expect(result.location.forecasts).toHaveLength(2);
    expect(result.location.forecasts[0]?.temperatureC).toBe(4.5);
    expect(result.location.forecasts[1]?.precipitationMm).toBe(0.3);
    expect(result.location.forecasts[0]?.windMps).toBe(2.6);
    expect(result.location.forecasts[0]?.validAt).toBe(
      new Date(nextHour * 1000).toISOString(),
    );
  });
});
