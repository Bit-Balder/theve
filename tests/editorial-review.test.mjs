import { describe, expect, it } from "vitest";
import {
  applyReviewRequest,
  catalogIdFromIdentifier,
  parseReviewRequest,
} from "../scripts/lib/editorial-review.mjs";

const candidates = [
  {
    identifier: "mysiga-serien-s01e01",
    title: "Mysiga serien s01e01",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    suggestedChannel: "08",
    media: { preferredFile: "episode1.mp4", durationSeconds: 1412.5 },
  },
  {
    identifier: "mysiga-serien-s01e02",
    title: "Mysiga serien s01e02",
    licenseUrl: "",
    suggestedChannel: "08",
    media: { preferredFile: "episode2.mp4", durationSeconds: 1450 },
  },
];
const catalog = { schemaVersion: "1.0.0", items: [] };
const rights = { schemaVersion: "1.0.0", entries: [] };
const journal = { schemaVersion: 1, entries: [] };

const base = {
  version: 1,
  identifiers: candidates.map((x) => x.identifier),
  decision: "selected",
  notes: "Serien är intressant för Theve.",
  basis: "",
  evidenceUrl: null,
  confirmedScope: true,
  confirmedRightsForAll: false,
};

function run(request, sourceCatalog = catalog, sourceRights = rights) {
  return applyReviewRequest({
    request,
    candidates,
    catalog: sourceCatalog,
    rights: sourceRights,
    journal,
    reviewer: "Bit-Balder",
    issueNumber: 35,
    reviewedAt: "2026-11-14",
  });
}

describe("programgranskning", () => {
  it("kräver tydliga, unika identifierare och en bekräftad omfattning", () => {
    expect(parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify(base))).toMatchObject({
      decision: "selected",
      identifiers: base.identifiers,
    });
    expect(() => parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify({
      ...base, confirmedScope: false,
    }))).toThrow();
    expect(() => parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify({
      ...base, identifiers: [base.identifiers[0], base.identifiers[0]],
    }))).toThrow();
  });

  it("massväljer en säsong utan att publicera eller godkänna rättigheter", () => {
    const result = run(parseReviewRequest(
      "THEVE_REVIEW_V1\n" + JSON.stringify(base),
    ));
    expect(result.processed).toBe(2);
    expect(result.catalog.items).toHaveLength(2);
    expect(result.rights.entries.every((item) => item.status === "review_required")).toBe(true);
    expect(result.rights.entries.every((item) => item.publicationAllowed === false)).toBe(true);
    expect(result.catalog.items.every((item) => item.familyStatus === "review_required")).toBe(true);
    expect(result.catalog.items.every((item) => item.availabilityStatus === "unknown")).toBe(true);
    expect(result.journal.entries).toHaveLength(2);
  });

  it("avvisar alla valda även om upphovsrättslicens saknas", () => {
    const request = parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify({
      ...base, decision: "rejected", notes: "Tillståndet går inte att verifiera.",
    }));
    const result = run(request);
    expect(result.journal.entries.map((item) => item.decision)).toEqual([
      "rejected", "rejected",
    ]);
    expect(result.catalog.items).toHaveLength(0);
  });

  it("kräver underlag för att godkänna rättigheter till en hel säsong", () => {
    const approved = {
      ...base, decision: "approved", confirmedRightsForAll: true,
      basis: "Tillstånd från ansvarig rättighetsinnehavare för alla avsnitt.",
      evidenceUrl: "https://example.org/licenses/season-1",
    };
    const request = parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify(approved));
    expect(() => run(request)).toThrow("saknar giltig licenslänk");
    expect(() => parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify({
      ...approved, confirmedRightsForAll: false,
    }))).toThrow("Bekräfta");
  });

  it("godkänner rättigheter utan att lägga en rad i tablån", () => {
    const approved = {
      ...base,
      identifiers: [candidates[0].identifier],
      decision: "approved",
      confirmedRightsForAll: true,
      basis: "Verifierad tillåtelse för programmet och den svenska dubbningen.",
      evidenceUrl: "https://example.org/permission",
    };
    const result = run(parseReviewRequest(
      "THEVE_REVIEW_V1\n" + JSON.stringify(approved),
    ));
    expect(result.rights.entries[0].status).toBe("approved");
    expect(result.rights.entries[0].licenseUrl).toBe(candidates[0].licenseUrl);
    expect(result.rights.entries[0].publicationAllowed).toBe(false);
    expect(result.catalog.items[0].source.mediaRef).toBe(candidates[0].identifier);
    expect(result.catalog.items[0].durationSeconds).toBe(1412);
  });

  it("skyddar redan publicerade program och använder stabila katalog-id", () => {
    const itemId = catalogIdFromIdentifier(candidates[0].identifier);
    expect(itemId).toBe(catalogIdFromIdentifier(candidates[0].identifier));
    const publishedRights = {
      ...rights,
      entries: [{
        catalogItemId: itemId,
        status: "approved",
        publicationAllowed: true,
      }],
    };
    const request = parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify({
      ...base, identifiers: [candidates[0].identifier], decision: "rejected",
    }));
    expect(() => run(request, catalog, publishedRights)).toThrow("redan publicerad");
  });
});
