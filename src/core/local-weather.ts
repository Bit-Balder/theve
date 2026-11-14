import type { WeatherLocation } from "./teletext";
import type { Municipality } from "./weather-places";

const CACHE_AGE_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = "theve.weather.forecast.v2.";
const OPEN_METEO_ORIGIN = "https://api.open-meteo.com";
const HOURLY_FIELDS = "temperature_2m,precipitation,wind_speed_10m";

export interface CachedForecast {
  readonly fetchedAt: string;
  readonly location: WeatherLocation;
}

interface ForecastApiResponse {
  readonly hourly?: {
    readonly time?: readonly number[];
    readonly temperature_2m?: readonly (number | null)[];
    readonly precipitation?: readonly (number | null)[];
    readonly wind_speed_10m?: readonly (number | null)[];
  };
}

export function describeWeatherError(error: unknown): string {
  if (error instanceof Error) {
    const httpMatch = error.message.match(
      /^Open-Meteo svarade HTTP (\d{3})\.$/,
    );
    if (httpMatch) return "OPEN-METEO SVARADE HTTP " + httpMatch[1];
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return "VÄDERTJÄNSTEN SVARADE INTE I TID";
    }
    if (error instanceof SyntaxError) {
      return "VÄDERTJÄNSTEN SKICKADE FELAKTIG DATA";
    }
    if (error instanceof TypeError) {
      return "NÄTVERK ELLER WEBBLÄSARE STOPPADE DATA";
    }
  }
  return "LOKAL VÄDERPROGNOS KUNDE INTE HÄMTAS";
}

export function openMeteoForecastUrl(municipality: Municipality): string {
  const url = new URL("/v1/forecast", OPEN_METEO_ORIGIN);
  url.searchParams.set("latitude", String(municipality.latitude));
  url.searchParams.set("longitude", String(municipality.longitude));
  url.searchParams.set("hourly", HOURLY_FIELDS);
  url.searchParams.set("wind_speed_unit", "ms");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("forecast_days", "2");
  return url.toString();
}

export function readCachedForecast(
  municipality: Municipality,
  nowEpochMs = Date.now(),
): CachedForecast | null {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + municipality.id);
    if (!value) return null;
    const parsed = JSON.parse(value) as CachedForecast;
    const fetchedAtEpoch = Date.parse(parsed.fetchedAt);
    if (!Number.isFinite(fetchedAtEpoch)) return null;
    if (nowEpochMs - fetchedAtEpoch > CACHE_AGE_MS) return null;
    if (nowEpochMs < fetchedAtEpoch) return null;
    if (!parsed.location?.sourceUrl.startsWith(OPEN_METEO_ORIGIN)) return null;
    if (!Array.isArray(parsed.location.forecasts)) return null;
    if (
      !parsed.location.forecasts.some(
        (forecast) => Date.parse(forecast.validAt) >= nowEpochMs,
      )
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readForecasts(response: ForecastApiResponse) {
  const hourly = response.hourly;
  const times = hourly?.time;
  const temperatures = hourly?.temperature_2m;
  const precipitation = hourly?.precipitation;
  const wind = hourly?.wind_speed_10m;
  if (
    !times?.length ||
    !temperatures ||
    !precipitation ||
    !wind ||
    times.length !== temperatures.length ||
    times.length !== precipitation.length ||
    times.length !== wind.length
  ) {
    throw new Error("Vädertjänsten saknar fullständiga timprognoser.");
  }
  const forecasts = times.flatMap((time, index) => {
    const temperatureC = temperatures[index];
    const precipitationMm = precipitation[index];
    const windMps = wind[index];
    if (
      !Number.isFinite(time) ||
      !Number.isFinite(temperatureC) ||
      !Number.isFinite(precipitationMm) ||
      !Number.isFinite(windMps) ||
      temperatureC === null ||
      precipitationMm === null ||
      windMps === null
    ) {
      return [];
    }
    return [
      {
        validAt: new Date(time * 1000).toISOString(),
        temperatureC,
        precipitationMm,
        windMps,
      },
    ];
  });
  if (forecasts.length === 0) {
    throw new Error("Vädertjänsten saknar giltiga prognosvärden.");
  }
  return forecasts;
}

export async function fetchMunicipalityWeather(
  municipality: Municipality,
  fetcher: typeof fetch = fetch,
): Promise<CachedForecast> {
  const cached = readCachedForecast(municipality);
  if (cached) return cached;
  const sourceUrl = openMeteoForecastUrl(municipality);
  const response = await fetcher(sourceUrl, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error("Open-Meteo svarade HTTP " + response.status + ".");
  }
  const forecasts = readForecasts(
    (await response.json()) as ForecastApiResponse,
  );
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
    // Prognosen går att visa även när lokal lagring saknas.
  }
  return result;
}
