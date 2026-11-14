import { describe, expect, it } from "vitest";
import {
  declaredYear,
  discoverArchive,
  hasSwedishSignal,
  makeCandidate,
  metadataUrl,
  parseDuration,
  playableFiles,
  searchUrl,
  validateConfig,
} from "../scripts/lib/archive-discovery.mjs";

const config = {
  schemaVersion: 1,
  period: { start: 1980, end: 2004 },
  settings: { searchesPerRun: 1, resultsPerSearch: 2, maxMetadataChecks: 2 },
  queries: [
    { id: "barn", channel: "08", query: "mediatype:movies AND title:barn" },
  ],
};

const metadata = {
  metadata: {
    identifier: "test-svenskt",
    title: "Svenskt barnprogram",
    date: "1993-02-01",
    language: ["Swedish"],
    licenseurl: "https://creativecommons.org/licenses/by/4.0/",
  },
  files: [
    { name: "thumb.jpg", size: "1000" },
    { name: "video.webm", size: "2000" },
    { name: "video.mp4", size: "3000", length: "10:15" },
  ],
};

describe("Internet Archive discovery", () => {
  it("searches public JSON endpoints with pagination", () => {
    const url = new URL(searchUrl("mediatype:movies", 3, 12));
    expect(url.hostname).toBe("archive.org");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("rows")).toBe("12");
    expect(url.searchParams.getAll("fl[]")).toContain("identifier");
    expect(metadataUrl("a b")).toContain("a%20b");
  });

  it("extracts years and ranks MP4 before other media", () => {
    expect(declaredYear(metadata.metadata)).toBe(1993);
    expect(parseDuration("10:15")).toBe(615);
    expect(playableFiles(metadata.files).map((file) => file.name)).toEqual([
      "video.mp4",
      "video.webm",
    ]);
  });

  it("identifies Swedish metadata without relying on file names", () => {
    expect(hasSwedishSignal({ language: "swe" })).toBe(true);
    expect(hasSwedishSignal({ title: "Bolibompa" })).toBe(true);
    expect(hasSwedishSignal({ title: "Generic English material" })).toBe(false);
  });

  it("never approves an item or claims streaming was tested", () => {
    const result = makeCandidate(
      metadata,
      {},
      config.queries[0],
      config.period,
      "2026-11-14T00:00:00Z",
    );
    expect(result.candidate.rightsStatus).toBe("review_required");
    expect(result.candidate.familyStatus).toBe("review_required");
    expect(result.candidate.media.availabilityStatus).toBe(
      "file_listed_not_playback_verified",
    );
    expect(result.candidate.media.durationSeconds).toBe(615);
  });

  it("rejects a known year outside the requested period", () => {
    const result = makeCandidate(
      { ...metadata, metadata: { ...metadata.metadata, year: "1975" } },
      {},
      config.queries[0],
      config.period,
      "2026-11-14T00:00:00Z",
    );
    expect(result.reason).toBe("outside_period");
  });

  it("deduplicates and continues with the next search page", async () => {
    const requests = [];
    const requestJson = async (url) => {
      requests.push(url);
      if (url.includes("advancedsearch.php")) {
        return {
          response: { numFound: 4, docs: [{ identifier: "test-svenskt" }] },
        };
      }
      return metadata;
    };
    const first = await discoverArchive({ config, requestJson });
    expect(first.report.added).toBe(1);
    expect(first.state.pages.barn).toBe(2);
    const second = await discoverArchive({
      config,
      requestJson,
      existingCandidates: first.candidates,
      previousState: first.state,
    });
    expect(second.report.added).toBe(0);
    expect(second.report.duplicates).toBe(1);
    expect(requests.some((url) => url.includes("page=2"))).toBe(true);
  });

  it("does not advance a page after a failed metadata request", async () => {
    const result = await discoverArchive({
      config,
      requestJson: async (url) => {
        if (url.includes("advancedsearch.php")) {
          return {
            response: { numFound: 10, docs: [{ identifier: "test-svenskt" }] },
          };
        }
        throw new Error("Temporary outage");
      },
    });
    expect(result.state.pages.barn).toBeUndefined();
    expect(result.report.errors).toHaveLength(1);
  });

  it("validates channel identifiers and request budgets", () => {
    expect(validateConfig(config)).toBe(config);
    expect(() =>
      validateConfig({
        ...config,
        queries: [{ id: "x", channel: "0", query: "a" }],
      }),
    ).toThrow();
  });
});
