import municipalityData from "../../data/municipalities.json";

export interface Municipality {
  readonly id: string;
  readonly region: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface WeatherPreferences {
  readonly selectedId: string | null;
  readonly favorites: readonly string[];
}

export const MUNICIPALITIES: readonly Municipality[] =
  municipalityData.municipalities;

export const REGIONS: readonly string[] = [
  ...new Set(MUNICIPALITIES.map((municipality) => municipality.region)),
].sort((a, b) => a.localeCompare(b, "sv"));

const STORAGE_KEY = "theve.weather.preferences.v1";
const MAX_FAVORITES = 5;

export function municipalitiesInRegion(
  region: string,
): readonly Municipality[] {
  return MUNICIPALITIES.filter(
    (municipality) => municipality.region === region,
  ).sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export function findMunicipality(id: string | null): Municipality | null {
  return MUNICIPALITIES.find((municipality) => municipality.id === id) ?? null;
}

export function readWeatherPreferences(): WeatherPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { selectedId: null, favorites: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { selectedId: null, favorites: [] };
    }
    const record = parsed as { selectedId?: unknown; favorites?: unknown };
    const selectedId =
      typeof record.selectedId === "string" &&
      findMunicipality(record.selectedId)
        ? record.selectedId
        : null;
    const favorites = Array.isArray(record.favorites)
      ? [
          ...new Set(
            record.favorites.filter(
              (id): id is string =>
                typeof id === "string" && Boolean(findMunicipality(id)),
            ),
          ),
        ].slice(0, MAX_FAVORITES)
      : [];
    return { selectedId, favorites };
  } catch {
    return { selectedId: null, favorites: [] };
  }
}

export function saveWeatherPreferences(preferences: WeatherPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Lokal lagring är valfri om enheten blockerar den.
  }
}

export function chooseMunicipality(
  preferences: WeatherPreferences,
  id: string,
): WeatherPreferences {
  if (!findMunicipality(id)) return preferences;
  return { ...preferences, selectedId: id };
}

export function toggleFavorite(
  preferences: WeatherPreferences,
  id: string,
): WeatherPreferences {
  if (!findMunicipality(id)) return preferences;
  const favorites = preferences.favorites.includes(id)
    ? preferences.favorites.filter((favorite) => favorite !== id)
    : [...preferences.favorites, id].slice(-MAX_FAVORITES);
  return { ...preferences, favorites };
}
