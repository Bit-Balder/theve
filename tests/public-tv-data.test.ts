import { describe, expect, it } from "vitest";

import { loadPublicTvData } from "../src/core/public-tv-data";

const revision = "test-revision";
const sourceRevision = "test-source-revision";
const baseDocuments: Readonly<Record<string, unknown>> = {
  "./data/manifest.json": { revision, sourceRevision },
  "./data/channels.json": { revision, channels: [] },
  "./data/catalog.json": { revision, items: [] },
  "./data/schedule.json": {
    schemaVersion: "2.0.0",
    revision,
    timezone: "Europe/Stockholm",
    horizon: {
      startsAtUtc: "2026-11-01T00:00:00Z",
      endsAtUtc: "2026-12-01T00:00:00Z",
    },
    slots: [],
  },
};

function fetcher(documents: Readonly<Record<string, unknown>>): typeof fetch {
  return (async (input) => {
    const path = String(input);
    const document = documents[path];
    return document
      ? new Response(JSON.stringify(document), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      : new Response("saknas", { status: 404 });
  }) as typeof fetch;
}

describe("publik Text-TV-data", () => {
  it("låter videokanalerna starta när Text-TV-snapshoten saknas", async () => {
    const data = await loadPublicTvData(fetcher(baseDocuments));

    expect(data.revision).toBe(revision);
    expect(data.sourceRevision).toBe(sourceRevision);
    expect(data.weather).toBeNull();
  });

  it("stoppar en Text-TV-snapshot från en annan datarevision", async () => {
    const documents = {
      ...baseDocuments,
      "./data/teletext.json": {
        revision: "annan-revision",
        grid: { columns: 40, rows: 24 },
        weather: null,
      },
    };

    await expect(loadPublicTvData(fetcher(documents))).rejects.toThrow(
      "Theves publicerade data har olika revisioner",
    );
  });
});
