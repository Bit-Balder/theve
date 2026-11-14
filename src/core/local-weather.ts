import type { WeatherLocation } from "./teletext";
import type { Municipality } from "./weather-places";

const PARAMETERS =
  "air_temperature,wind_speed,precipitation_amount_mean,symbol_code";
const CACHE_AGE_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = "theve.weather.forecast.v1.";

export interface CachedForecast {
  readonly fetchedAt: string;
  readonly location: WeatherLocation;
}

export function smhiPointUrl(municipality: Municipality): string {
  return (
    "https://opendata-download-metfcst.smhi.se/api/category/snow1g/" +
    "version/1/geotype/point/lon/" +
    municipality.longitude +
    "/lat/" +
    municipality.latitude +
    "/data.json?timeseries=8&parameters=" +
    PARAMETERS
  );
}

export function readCachedForecast(
  municipality: Municipality,
  nowEpochMs = Date.now(),
): CachedForecast | null {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + municipality.id);
    if (!value) return null;
    const parsed = JSON.parse(value) as CachedForecast;
    if (!parsed.location || !Array.isArray(parsed.location.forecasts))
      return null;
    if (nowEpochMs - Date.parse(parsed.fetchedAt) > CACHE_AGE_MS) return null;
    if (nowEpochMs < Date.parse(parsed.fetchedAt)) return null;
    if (
      !parsed.location.forecasts.some(
        (forecast) => Date.parse(forecast.validAt) >= nowEpochMs,
      )
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchMunicipalityWeather(
  municipality: Municipality,
  fetcher: typeof fetch = fetch,
): Promise<CachedForecast> {
  const cached = readCachedForecast(municipality);
  if (cached) return cached;
  const sourceUrl = smhiPointUrl(municipality);
  const response = await fetcher(sourceUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error("SMHI svarade HTTP " + response.status + ".");
  }
  const snapshot = (await response.json()) as {
    timeSeries?: {
      time: string;
      data: {
        air_temperature: number;
        wind_speed: number;
        precipitation_amount_mean: number;
        symbol_code: number;
      };
    }[];
  };
  if (!Array.isArray(snapshot.timeSeries) || snapshot.timeSeries.length === 0) {
    throw new Error("SMHI saknar prognos för kommunen.");
  }
  const forecasts = snapshot.timeSeries
    .filter((item) => item.data && typeof item.time === "string")
    .map((item) => ({
      validAt: item.time,
      temperatureC: item.data.air_temperature,
      windMps: item.data.wind_speed,
      precipitationMm: item.data.precipitation_amount_mean,
      symbolCode: item.data.symbol_code,
    }));
  if (forecasts.length === 0)
    throw new Error("SMHI skickade inga prognosvärden.");
  const result: CachedForecast = {
    fetchedAt: new Date().toISOString(),
    location: {
      id: municipality.id,
      name: municipality.name,
      latitude: municipality.latitude,
      longitude: municipality.longitude,
      sourceUrl,
      forecasts,
    },
  };
  try {
    localStorage.setItem(
      STORAGE_PREFIX + municipality.id,
      JSON.stringify(result),
    );
  } catch {
    // Prognosen går att visa utan lokal cache.
  }
  return result;
}
