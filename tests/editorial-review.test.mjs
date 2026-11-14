import { describe, expect, it } from "vitest";
import {
  applyReviewRequest,
  catalogIdFromIdentifier,
  PRIVATE_RIGHTS_BASIS,
  parseReviewRequest,
  verifyPrivateRightsRecord,
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
  version: 2,
  identifiers: candidates.map((x) => x.identifier),
  decision: "selected",
  notes: "Serien är intressant för Theve.",
  confirmedScope: true,
  confirmedRightsForAll: false,
};
const privateBasis =
  "Privat verifiering av tillstånd för hela säsongen och svensk dubbning.";
const privateUrl = "https://private.example.org/confidential/permission";

function secretFor(ids = base.identifiers, issue = 35) {
  return JSON.stringify({
    [String(issue)]: {
      identifiers: ids,
      basis: privateBasis,
      evidenceUrl: privateUrl,
    },
  });
}
function request(value = base) {
  return parseReviewRequest("THEVE_REVIEW_V2\n" + JSON.stringify(value));
}
function run(
  value,
  {
    sourceCatalog = catalog,
    sourceRights = rights,
    sourceCandidates = candidates,
    rightsRecordsJson = "",
    issueNumber = 35,
  } = {},
) {
  return applyReviewRequest({
    request: value,
    candidates: sourceCandidates,
    catalog: sourceCatalog,
    rights: sourceRights,
    journal,
    reviewer: "Bit-Balder",
    issueNumber,
    reviewedAt: "2026-11-14",
    rightsRecordsJson,
  });
}

describe("programgranskning med privat rättighetsunderlag", () => {
  it("kräver unik identifierare och bekräftat urval", () => {
    expect(request()).toMatchObject({
      version: 2,
      identifiers: base.identifiers,
    });
    expect(() => request({ ...base, confirmedScope: false })).toThrow();
    expect(() =>
      request({
        ...base,
        identifiers: [base.identifiers[0], base.identifiers[0]],
      }),
    ).toThrow();
  });

  it("avvisar äldre offentliga rättighetsfält och förra ärendeformatet", () => {
    expect(() =>
      parseReviewRequest("THEVE_REVIEW_V1\n" + JSON.stringify(base)),
    ).toThrow();
    expect(() => request({ ...base, basis: "Hemligt dokument" })).toThrow(
      "Privat rättighetsunderlag",
    );
    expect(() => request({ ...base, evidenceUrl: privateUrl })).toThrow(
      "Privat rättighetsunderlag",
    );
  });

  it("massväljer en säsong utan publicering", () => {
    const result = run(request());
    expect(result.processed).toBe(2);
    expect(result.catalog.items).toHaveLength(2);
    expect(
      result.rights.entries.every((item) => item.status === "review_required"),
    ).toBe(true);
    expect(
      result.rights.entries.every((item) => item.publicationAllowed === false),
    ).toBe(true);
    expect(result.journal.entries).toHaveLength(2);
  });

  it("avvisar poster utan licens och tar bort gamla katalogutkast", () => {
    const shortlist = run(request());
    const result = run(
      request({
        ...base,
        decision: "rejected",
        notes: "Säsongen ska inte användas i Theve.",
      }),
      {
        sourceCatalog: shortlist.catalog,
        sourceRights: shortlist.rights,
      },
    );
    expect(result.journal.entries.map((item) => item.decision)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(result.catalog.items).toHaveLength(0);
    expect(result.rights.entries).toHaveLength(0);
  });

  it("godkänner ogranskade poster trots saknad licensetikett", () => {
    const approved = request({
      ...base,
      decision: "approved",
      confirmedRightsForAll: true,
    });
    const result = run(approved, {
      rightsRecordsJson: secretFor(),
    });
    expect(result.rights.entries).toHaveLength(2);
    expect(result.rights.entries.every((r) => r.status === "approved")).toBe(
      true,
    );
    expect(
      result.rights.entries.every((r) => r.publicationAllowed === false),
    ).toBe(true);
    expect(result.rights.entries[0].basis).toBe(PRIVATE_RIGHTS_BASIS);
    expect(result.rights.entries[0].evidenceUrl).toBeNull();
    expect(result.rights.entries.some((r) => r.licenseUrl === null)).toBe(true);
    const publicJson = JSON.stringify(result);
    expect(publicJson).not.toContain(privateUrl);
    expect(publicJson).not.toContain(privateBasis);
  });

  it("kräver privat dokumentation för exakt ärende och alla arkivposter", () => {
    const approved = request({
      ...base,
      decision: "approved",
      confirmedRightsForAll: true,
    });
    expect(() => run(approved)).toThrow("GitHub Secret");
    expect(() =>
      run(approved, { rightsRecordsJson: secretFor(base.identifiers, 99) }),
    ).toThrow("Privat rättighetsunderlag");
    expect(() =>
      run(approved, { rightsRecordsJson: secretFor([base.identifiers[0]]) }),
    ).toThrow("Privat rättighetsunderlag");
    expect(verifyPrivateRightsRecord(secretFor(), 35, base.identifiers)).toBe(
      true,
    );
    expect(() =>
      request({
        ...base,
        decision: "approved",
        confirmedRightsForAll: false,
      }),
    ).toThrow("Bekräfta");
  });

  it("sparar även beslut om arkivpostens videodata är ofullständiga", () => {
    const unavailable = candidates.map((candidate) => ({
      ...candidate,
      media: { preferredFile: "unknown.webm", durationSeconds: null },
    }));
    const result = run(request(), { sourceCandidates: unavailable });
    expect(result.journal.entries).toHaveLength(2);
    expect(result.journal.entries.every((entry) => entry.catalogPending)).toBe(
      true,
    );
    expect(result.catalog.items).toHaveLength(0);
    expect(result.rights.entries).toHaveLength(0);
  });

  it("skyddar redan publicerade program och använder stabila ID:n", () => {
    const itemId = catalogIdFromIdentifier(candidates[0].identifier);
    expect(itemId).toBe(catalogIdFromIdentifier(candidates[0].identifier));
    const publishedRights = {
      ...rights,
      entries: [
        {
          catalogItemId: itemId,
          status: "approved",
          publicationAllowed: true,
        },
      ],
    };
    const reject = request({
      ...base,
      identifiers: [candidates[0].identifier],
      decision: "rejected",
    });
    expect(() => run(reject, { sourceRights: publishedRights })).toThrow(
      "redan publicerad",
    );
  });
});
