import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const weatherPath = fileURLToPath(
  new URL("../data/source/weather.json", import.meta.url),
);
const weather = JSON.parse(readFileSync(weatherPath, "utf8"));
const parameters = [
  "air_temperature",
  "wind_speed",
  "precipitation_amount_mean",
  "symbol_code",
].join(",");

function endpoint(location) {
  const base =
    "https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point";
  return `${base}/lon/${location.longitude}/lat/${location.latitude}/data.json?timeseries=8&parameters=${parameters}`;
}

async function fetchLocation(location) {
  const sourceUrl = endpoint(location);
  const response = await fetch(sourceUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      `SMHI svarade med HTTP ${response.status} för ${location.name}.`,
    );
  }
  const snapshot = await response.json();
  if (!Array.isArray(snapshot.timeSeries) || snapshot.timeSeries.length === 0) {
    throw new Error(`SMHI saknar prognospunkter för ${location.name}.`);
  }
  return {
    ...location,
    sourceUrl,
    forecasts: snapshot.timeSeries.map(({ time, data }) => ({
      validAt: time,
      temperatureC: data.air_temperature,
      windMps: data.wind_speed,
      precipitationMm: data.precipitation_amount_mean,
      symbolCode: data.symbol_code,
    })),
  };
}

const locations = [];
for (const location of weather.locations) {
  locations.push(await fetchLocation(location));
}
const validUntil = locations
  .flatMap((location) => location.forecasts.map((forecast) => forecast.validAt))
  .sort()
  .at(-1);
const next = {
  ...weather,
  fetchedAt: new Date().toISOString(),
  validUntil,
  locations,
};
writeFileSync(weatherPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`SMHI-snapshot uppdaterad för ${locations.length} orter.`);
