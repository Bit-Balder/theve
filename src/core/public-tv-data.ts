import type { CatalogItem, Channel } from "./catalog-types";
import type { CompiledSchedule } from "./schedule-engine";
import type { WeatherSnapshot } from "./teletext";

export interface PublicCatalogItem extends CatalogItem {
  readonly rightsStatus: "approved";
}

export interface PublicTvData {
  readonly revision: string;
  readonly sourceRevision: string;
  readonly channels: readonly Channel[];
  readonly catalogItems: readonly PublicCatalogItem[];
  readonly schedule: CompiledSchedule;
  readonly weather: WeatherSnapshot | null;
}

interface ManifestDocument {
  readonly revision: string;
  readonly sourceRevision: string;
}

interface ChannelsDocument {
  readonly revision: string;
  readonly channels: readonly Channel[];
}

interface CatalogDocument {
  readonly revision: string;
  readonly items: readonly PublicCatalogItem[];
}

interface TeletextDocument {
  readonly revision: string;
  readonly grid: { readonly columns: 40; readonly rows: 24 };
  readonly weather: WeatherSnapshot;
}

async function loadJson<T>(path: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(path, {
    cache: "no-cache",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Kunde inte läsa ${path}: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loadPublicTvData(
  fetcher: typeof fetch = fetch,
): Promise<PublicTvData> {
  const [manifest, channels, catalog, schedule, teletext] = await Promise.all([
    loadJson<ManifestDocument>("./data/manifest.json", fetcher),
    loadJson<ChannelsDocument>("./data/channels.json", fetcher),
    loadJson<CatalogDocument>("./data/catalog.json", fetcher),
    loadJson<CompiledSchedule>("./data/schedule.json", fetcher),
    loadJson<TeletextDocument>("./data/teletext.json", fetcher).catch(
      () => null,
    ),
  ]);

  const revisions = new Set([
    manifest.revision,
    channels.revision,
    catalog.revision,
    schedule.revision,
    ...(teletext ? [teletext.revision] : []),
  ]);
  if (revisions.size !== 1) {
    throw new Error("Theves publicerade data har olika revisioner.");
  }

  return {
    revision: manifest.revision,
    sourceRevision: manifest.sourceRevision,
    channels: channels.channels,
    catalogItems: catalog.items,
    schedule,
    weather: teletext?.weather ?? null,
  };
}
