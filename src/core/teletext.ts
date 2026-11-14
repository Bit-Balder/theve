import type { Channel } from "./catalog-types";
import {
  type CompiledSchedule,
  type CompiledScheduleSlot,
  getScheduleState,
} from "./schedule-engine";

export const TELETEXT_COLUMNS = 40;
export const TELETEXT_ROWS = 24;
export const TELETEXT_PAGE_NUMBERS = [
  "100",
  "300",
  "301",
  "302",
  "303",
  "304",
  "400",
  "500",
] as const;

export interface WeatherForecast {
  readonly validAt: string;
  readonly temperatureC: number;
  readonly windMps: number;
  readonly precipitationMm: number;
  readonly symbolCode: number;
}

export interface WeatherLocation {
  readonly id: string;
  readonly name: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly sourceUrl: string;
  readonly forecasts: readonly WeatherForecast[];
}

export interface WeatherSnapshot {
  readonly schemaVersion: string;
  readonly source: {
    readonly name: "SMHI";
    readonly dataset: "SNOW1G";
    readonly license: "CC BY 4.0";
    readonly licenseUrl: string;
    readonly termsUrl: string;
    readonly attribution: string;
    readonly modificationNotice: string;
  };
  readonly fetchedAt: string;
  readonly validUntil: string;
  readonly locations: readonly WeatherLocation[];
}

export interface TeletextPage {
  readonly number: string;
  readonly title: string;
  readonly rows: readonly string[];
  readonly status: "ready" | "stale" | "missing";
}

export interface TeletextPageContext {
  readonly channelName: string;
  readonly channels: readonly Channel[];
  readonly schedule: CompiledSchedule;
  readonly weather: WeatherSnapshot | null;
  readonly nowEpochMs: number;
  readonly selectedMunicipalityName?: string;
  readonly selectedWeather?: WeatherLocation | null;
  readonly localWeatherStatus?: "loading" | "error" | "ready";
  readonly isSelectedFavorite?: boolean;
}

function characters(value: string): string[] {
  return Array.from(value);
}

export function formatTeletextLine(value: string): string {
  return characters(value)
    .slice(0, TELETEXT_COLUMNS)
    .join("")
    .padEnd(TELETEXT_COLUMNS);
}

export function wrapTeletextText(value: string): readonly string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const originalWord of words) {
    let word = originalWord;
    while (characters(word).length > TELETEXT_COLUMNS) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(characters(word).slice(0, TELETEXT_COLUMNS).join(""));
      word = characters(word).slice(TELETEXT_COLUMNS).join("");
    }
    const candidate = line ? `${line} ${word}` : word;
    if (characters(candidate).length <= TELETEXT_COLUMNS) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line || lines.length === 0) {
    lines.push(line);
  }
  return lines;
}

function formatTime(epochMs: number): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(epochMs)
    .replace(":", ".");
}

function formatStamp(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(Date.parse(value))
    .replace(":", ".")
    .toUpperCase();
}

function joinColumns(left: string, right: string): string {
  const leftCharacters = characters(left);
  const rightCharacters = characters(right);
  const availableLeft = Math.max(
    0,
    TELETEXT_COLUMNS - rightCharacters.length - 1,
  );
  const clippedLeft = leftCharacters.slice(0, availableLeft).join("");
  return `${clippedLeft}${" ".repeat(
    TELETEXT_COLUMNS - characters(clippedLeft).length - rightCharacters.length,
  )}${right}`;
}

function pageRows(
  number: string,
  title: string,
  content: readonly string[],
  nowEpochMs: number,
): readonly string[] {
  const rows = [
    joinColumns("THEVE TEXT-TV", `${number} ${formatTime(nowEpochMs)}`),
    title,
    "",
    ...content.flatMap((row) => (row ? wrapTeletextText(row) : [""])),
  ];
  while (rows.length < TELETEXT_ROWS - 1) {
    rows.push("");
  }
  rows.length = TELETEXT_ROWS - 1;
  rows.push("100 START 300 VÄDER 400 TV 500 BARN");
  return rows.map(formatTeletextLine);
}

function slotTitle(slot: CompiledScheduleSlot | null): string {
  return slot?.catalogTitle ?? slot?.label ?? "INGEN TABLÅUPPGIFT";
}

function createStartPage(context: TeletextPageContext): TeletextPage {
  return {
    number: "100",
    title: "THEVE TEXT-TV",
    status: "ready",
    rows: pageRows(
      "100",
      "THEVE TEXT-TV",
      [
        "300  VÄDERÖVERSIKT",
        "301  VÄLJ LÄN OCH KOMMUN",
        "302  DINA VÄDERFAVORITER",
        "303  TIMPROGNOS FÖR DIN KOMMUN",
        "304  VÄDERÖVERSIKT SVERIGE",
        "400  TV-TABLÅ JUST NU",
        "500  BARNENS SIDA",
        "",
        "SKRIV TRE SIFFROR FÖR ATT VÄLJA SIDA",
        "BACK ELLER T ÅTERGÅR TILL TV",
        "",
        `ÖPPNAD FRÅN ${context.channelName.toUpperCase()}`,
      ],
      context.nowEpochMs,
    ),
  };
}

function weatherState(
  weather: WeatherSnapshot | null,
  nowEpochMs: number,
): "ready" | "stale" | "missing" {
  if (!weather || weather.locations.length === 0) {
    return "missing";
  }
  return nowEpochMs > Date.parse(weather.validUntil) ? "stale" : "ready";
}

function currentForecast(
  location: WeatherLocation,
  nowEpochMs: number,
): WeatherForecast | null {
  return (
    location.forecasts.find(
      (forecast) => Date.parse(forecast.validAt) >= nowEpochMs,
    ) ?? null
  );
}

function weatherUnavailableRows(
  state: "ready" | "stale" | "missing",
  weather: WeatherSnapshot | null,
): readonly string[] {
  if (state === "missing" || !weather) {
    return [
      "VÄDERDATA SAKNAS",
      "INGA PROGNOSVÄRDEN VISAS",
      "",
      "KÄLLA SKA VARA SMHI ÖPPNA DATA",
      "BEARBETNING SKA ANGES AV THEVE",
    ];
  }
  return [
    "VÄDERDATA ÄR INAKTUELL",
    "PROGNOSEN VISAS INTE SOM AKTUELL",
    "",
    `HÄMTAD ${formatStamp(weather.fetchedAt)}`,
    `GÄLLDE TILL ${formatStamp(weather.validUntil)}`,
    "",
    weather.source.attribution.toUpperCase(),
    weather.source.modificationNotice.toUpperCase(),
  ];
}

function createWeatherOverview(
  context: TeletextPageContext,
  number = "300",
): TeletextPage {
  const status = weatherState(context.weather, context.nowEpochMs);
  const weather = context.weather;
  if (status !== "ready" || !weather) {
    return {
      number,
      title: "VÄDER",
      status,
      rows: pageRows(
        number,
        "VÄDER",
        weatherUnavailableRows(status, weather),
        context.nowEpochMs,
      ),
    };
  }

  const locationRows = weather.locations.flatMap((location) => {
    const forecast = currentForecast(location, context.nowEpochMs);
    if (!forecast) {
      return [`${location.name.toUpperCase()}  UPPGIFT SAKNAS`];
    }
    return [
      joinColumns(
        location.name.toUpperCase(),
        `${Math.round(forecast.temperatureC)}°C`,
      ).trimEnd(),
      `VIND ${forecast.windMps.toFixed(1)} M/S  NEDERB ${forecast.precipitationMm.toFixed(1)} MM`,
    ];
  });
  return {
    number,
    title: "VÄDERÖVERSIKT",
    status,
    rows: pageRows(
      number,
      "VÄDERÖVERSIKT",
      [
        ...locationRows,
        "",
        "301  TIMPROGNOS FÖR VALDA ORTER",
        "",
        weather.source.attribution.toUpperCase(),
        weather.source.modificationNotice.toUpperCase(),
        `HÄMTAD ${formatStamp(weather.fetchedAt)}`,
      ],
      context.nowEpochMs,
    ),
  };
}

function createWeatherLocations(context: TeletextPageContext): TeletextPage {
  const status = weatherState(context.weather, context.nowEpochMs);
  const weather = context.weather;
  if (status !== "ready" || !weather) {
    return {
      number: "301",
      title: "VALDA ORTER",
      status,
      rows: pageRows(
        "301",
        "VALDA ORTER",
        weatherUnavailableRows(status, weather),
        context.nowEpochMs,
      ),
    };
  }
  const rows = weather.locations.flatMap((location) => {
    const forecasts = location.forecasts
      .filter((forecast) => Date.parse(forecast.validAt) >= context.nowEpochMs)
      .slice(0, 3);
    return [
      location.name.toUpperCase(),
      ...forecasts.map(
        (forecast) =>
          `${formatTime(Date.parse(forecast.validAt))}  ${Math.round(
            forecast.temperatureC,
          )}°C  ${forecast.windMps.toFixed(1)} M/S  ${forecast.precipitationMm.toFixed(1)} MM`,
      ),
      "",
    ];
  });
  return {
    number: "301",
    title: "VALDA ORTER",
    status,
    rows: pageRows(
      "301",
      "VALDA ORTER",
      [
        ...rows,
        weather.source.attribution.toUpperCase(),
        weather.source.modificationNotice.toUpperCase(),
      ],
      context.nowEpochMs,
    ),
  };
}

function localRows(context: TeletextPageContext): readonly string[] {
  const name = (context.selectedMunicipalityName ?? "").toUpperCase();
  if (!context.selectedWeather) {
    return [
      name,
      context.localWeatherStatus === "error"
        ? "KUNDE INTE HÄMTA VÄDER FRÅN SMHI"
        : "HÄMTAR LOKAL VÄDERPROGNOS",
      "",
      "301  VÄLJ EN ANNAN KOMMUN",
      "302  SPARADE FAVORITER",
    ];
  }
  const forecast = currentForecast(context.selectedWeather, context.nowEpochMs);
  if (!forecast) {
    return [
      name,
      "VÄDERPROGNOSEN ÄR INAKTUELL",
      "301 VÄLJ ANNAN KOMMUN",
    ];
  }
  return [
    name,
    "",
    "TEMPERATUR " + Math.round(forecast.temperatureC) + "°C",
    "VIND " + forecast.windMps.toFixed(1) + " M/S",
    "NEDERBÖRD " + forecast.precipitationMm.toFixed(1) + " MM",
    "",
    "ENTER " + (context.isSelectedFavorite ? "TA BORT FAVORIT" : "SPARA FAVORIT"),
    "301  VÄLJ LÄN OCH KOMMUN",
    "302  DINA FAVORITER",
    "303  TIMPROGNOS",
    "304  SVERIGEÖVERSIKT",
    "",
    "KÄLLA: SMHI ÖPPNA DATA",
    "BEARBETAD AV THEVE",
  ];
}

function createLocalWeather(context: TeletextPageContext): TeletextPage {
  const status = context.selectedWeather && currentForecast(
    context.selectedWeather,
    context.nowEpochMs,
  ) ? "ready" : "missing";
  return {
    number: "300",
    title: "DITT LOKALA VÄDER",
    status,
    rows: pageRows(
      "300",
      "DITT LOKALA VÄDER",
      localRows(context),
      context.nowEpochMs,
    ),
  };
}

function createHourlyWeather(context: TeletextPageContext): TeletextPage {
  const location = context.selectedWeather;
  const forecasts = (location?.forecasts ?? [])
    .filter((forecast) => Date.parse(forecast.validAt) >= context.nowEpochMs)
    .slice(0, 8);
  const status = forecasts.length > 0 ? "ready" : "missing";
  return {
    number: "303",
    title: "TIMPROGNOS",
    status,
    rows: pageRows(
      "303",
      "TIMPROGNOS",
      [
        (location?.name ?? "INGEN KOMMUN VALD").toUpperCase(),
        "",
        ...forecasts.map((forecast) =>
          formatTime(Date.parse(forecast.validAt)) + "  " +
          Math.round(forecast.temperatureC) + "°C  " +
          forecast.windMps.toFixed(1) + " M/S",
        ),
        ...(forecasts.length === 0 ? ["301  VÄLJ LÄN OCH KOMMUN"] : []),
        "",
        "KÄLLA SMHI · BEARBETAD AV THEVE",
      ],
      context.nowEpochMs,
    ),
  };
}

function createSchedulePage(context: TeletextPageContext): TeletextPage {
  const rows = context.channels.map((channel) => {
    const state = getScheduleState(
      context.schedule,
      channel.id,
      context.nowEpochMs,
    );
    return `${String(channel.number).padStart(2, "0")} ${channel.name.toUpperCase()}  ${slotTitle(state.current)}`;
  });
  return {
    number: "400",
    title: "TV-TABLÅ JUST NU",
    status: "ready",
    rows: pageRows(
      "400",
      "TV-TABLÅ JUST NU",
      [
        "SAMMA SCHEMADATA SOM PROGRAMGUIDEN",
        "",
        ...rows,
        "",
        `UPPDATERAD ${formatTime(context.nowEpochMs)}`,
      ],
      context.nowEpochMs,
    ),
  };
}

function createChildrenPage(context: TeletextPageContext): TeletextPage {
  return {
    number: "500",
    title: "BARNENS SIDA",
    status: "ready",
    rows: pageRows(
      "500",
      "BARNENS SIDA",
      [
        "Å Ä Ö · SVENSKA TECKEN",
        "",
        "08 BARN SÄNDER 06.00–19.00",
        "18.55  GODNATTVINJETT",
        "19.00  SÄNDNINGSUPPEHÅLL",
        "06.00  MORGONSÄNDNING",
        "",
        "T ELLER BACK TAR DIG TILLBAKA TILL TV",
      ],
      context.nowEpochMs,
    ),
  };
}

export function createTeletextPage(
  number: string,
  context: TeletextPageContext,
): TeletextPage {
  if (number === "100") return createStartPage(context);
  if (number === "300") {
    return context.selectedMunicipalityName
      ? createLocalWeather(context)
      : createWeatherOverview(context);
  }
  if (number === "301") return createWeatherLocations(context);
  if (number === "302") {
    return {
      number: "302",
      title: "VÄDERFAVORITER",
      status: "ready",
      rows: pageRows("302", "VÄDERFAVORITER", ["301  VÄLJ KOMMUN"], context.nowEpochMs),
    };
  }
  if (number === "303") return createHourlyWeather(context);
  if (number === "304") return createWeatherOverview(context, "304");
  if (number === "400") return createSchedulePage(context);
  if (number === "500") return createChildrenPage(context);
  return {
    number,
    title: "SIDAN FINNS INTE",
    status: "missing",
    rows: pageRows(
      number,
      "SIDAN FINNS INTE",
      ["VÄLJ 100 FÖR TEXT-TV:S STARTSIDA"],
      context.nowEpochMs,
    ),
  };
}
