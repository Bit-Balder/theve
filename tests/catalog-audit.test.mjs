import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { createCatalogAudit } from "../scripts/lib/catalog-audit.mjs";
import { loadProjectData } from "../scripts/lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function freshData() {
  return structuredClone(loadProjectData(projectRoot));
}

function approveArchiveCandidate(data) {
  const item = data.catalog.items.find(({ id }) => id === "tv7-arkiv-kandidat");
  item.source.mediaRef = "test-item";
  item.availabilityStatus = "available";
  item.familyStatus = "approved";

  const rights = data.rights.entries.find(
    ({ catalogItemId }) => catalogItemId === item.id,
  );
  rights.status = "approved";
  rights.publicationAllowed = true;
  rights.reviewedAt = "2026-11-13";
  rights.licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
}

describe("Etapp 10:s katalograpport", () => {
  it("spårar normal körning till commit och källrevision", async () => {
    const report = await createCatalogAudit(freshData(), {
      commitSha: "abc123",
      nowEpochMs: Date.parse("2026-11-13T18:00:00Z"),
    });

    expect(report.passed).toBe(true);
    expect(report.commitSha).toBe("abc123");
    expect(report.sourceRevision).toMatch(/^[a-f0-9]{16}$/);
    expect(report.publicRevision).toMatch(/^[a-f0-9]{16}$/);
    expect(report.summary.blockers).toBe(0);
  });

  it("blockerar en Internet Archive-licens som har ändrats", async () => {
    const data = freshData();
    approveArchiveCandidate(data);
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        metadata: {
          licenseurl: "https://creativecommons.org/licenses/by-nc/4.0/",
        },
      }),
    });

    const report = await createCatalogAudit(data, {
      fetcher,
      nowEpochMs: Date.parse("2026-11-13T18:00:00Z"),
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "blocker",
        code: "license_changed",
        catalogItemId: "tv7-arkiv-kandidat",
      }),
    );
  });

  it("blockerar en godkänd källa som inte längre svarar", async () => {
    const data = freshData();
    approveArchiveCandidate(data);
    const report = await createCatalogAudit(data, {
      fetcher: vi.fn().mockRejectedValue(new Error("Källan svarar inte")),
      nowEpochMs: Date.parse("2026-11-13T18:00:00Z"),
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "blocker",
        code: "source_unavailable",
      }),
    );
  });
});
