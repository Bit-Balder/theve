import { createHash } from "node:crypto";

export const MAX_REVIEW_ITEMS = 40;
export const PRIVATE_RIGHTS_BASIS =
  "Rättigheter verifierade. Privat underlag finns i GitHub Secrets.";
const CHANNELS = {
  "01": "tv1",
  "02": "tv2",
  "03": "tv3",
  "04": "tv4",
  "05": "tv5",
  "06": "tv6",
  "07": "tv7",
  "08": "barn",
  "09": "natur",
};
const IDENTIFIER = /^[A-Za-z0-9_-]{5,80}$/;

function validUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function parseReviewRequest(body) {
  if (typeof body !== "string" || !body.startsWith("THEVE_REVIEW_V2\n")) {
    throw new Error(
      "Ärendet måste använda THEVE_REVIEW_V2 utan privata underlag.",
    );
  }
  if (body.length > 14_000) throw new Error("Ärendet är för stort.");
  const data = JSON.parse(body.slice("THEVE_REVIEW_V2\n".length));
  if (
    Object.hasOwn(data ?? {}, "basis") ||
    Object.hasOwn(data ?? {}, "evidenceUrl")
  ) {
    throw new Error(
      "Privat rättighetsunderlag får inte finnas i ett offentligt ärende.",
    );
  }
  const decisions = ["selected", "approved", "rejected"];
  if (
    data?.version !== 2 ||
    !decisions.includes(data.decision) ||
    !Array.isArray(data.identifiers) ||
    data.identifiers.length < 1 ||
    data.identifiers.length > MAX_REVIEW_ITEMS ||
    !data.identifiers.every(
      (id) => typeof id === "string" && IDENTIFIER.test(id),
    ) ||
    new Set(data.identifiers).size !== data.identifiers.length ||
    data.confirmedScope !== true
  ) {
    throw new Error(
      "Felaktig begäran, saknade identifierare eller obekräftad omfattning.",
    );
  }
  if (data.channelId && !Object.values(CHANNELS).includes(data.channelId)) {
    throw new Error("Okänd TV-kanal.");
  }
  if (
    typeof data.notes !== "string" ||
    data.notes.trim().length < 8 ||
    data.notes.length > 1200
  ) {
    throw new Error("Skriv en motivering på minst åtta tecken.");
  }
  if (data.decision === "approved" && data.confirmedRightsForAll !== true) {
    throw new Error(
      "Bekräfta din manuella rättighetsgranskning för alla valda poster.",
    );
  }
  return {
    version: 2,
    identifiers: data.identifiers,
    decision: data.decision,
    notes: data.notes.trim(),
    basis:
      data.decision === "approved"
        ? PRIVATE_RIGHTS_BASIS
        : data.decision === "selected"
          ? "Utvald för fortsatt rättighetsgranskning."
          : "Innehållet har avvisats i redaktionell granskning.",
    evidenceUrl: null,
    channelId: data.channelId || null,
    groupLabel:
      typeof data.groupLabel === "string"
        ? data.groupLabel.trim().slice(0, 120)
        : "",
  };
}

/**
 * GitHub Secret THEVE_PRIVATE_RIGHTS_RECORDS is only read during the Action.
 * Neither the secret nor its values may enter a public JSON file.
 */
export function verifyPrivateRightsRecord(
  recordsJson,
  issueNumber,
  identifiers,
) {
  if (typeof recordsJson !== "string" || !recordsJson.trim()) {
    throw new Error(
      "Lägg först till ärendets privata underlag i GitHub Secret THEVE_PRIVATE_RIGHTS_RECORDS. Öppna sedan ärendet igen.",
    );
  }
  let records;
  try {
    records = JSON.parse(recordsJson);
  } catch {
    throw new Error(
      "GitHub Secret THEVE_PRIVATE_RIGHTS_RECORDS innehåller ogiltig JSON.",
    );
  }
  const record = records?.[String(issueNumber)];
  if (
    !record ||
    !Array.isArray(record.identifiers) ||
    !Array.isArray(identifiers) ||
    record.identifiers.length !== identifiers.length ||
    !identifiers.every((id) => record.identifiers.includes(id)) ||
    new Set(record.identifiers).size !== identifiers.length ||
    typeof record.basis !== "string" ||
    record.basis.trim().length < 20 ||
    !validUrl(record.evidenceUrl)
  ) {
    throw new Error(
      "Privat rättighetsunderlag för ärendet saknas, är ofullständigt eller omfattar inte alla valda arkivposter.",
    );
  }
  return true;
}

export function catalogIdFromIdentifier(identifier) {
  const slug = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  const suffix = createHash("sha256")
    .update(identifier)
    .digest("hex")
    .slice(0, 8);
  return "ia-" + slug + "-" + suffix;
}

export function applyReviewRequest({
  request,
  candidates,
  catalog,
  rights,
  journal,
  reviewer,
  issueNumber,
  reviewedAt,
  rightsRecordsJson = "",
}) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(reviewer))
    throw new Error("Ogiltigt granskar-ID.");
  if (!Number.isInteger(issueNumber) || issueNumber < 1)
    throw new Error("Ogiltigt ärendenummer.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt))
    throw new Error("Ogiltigt granskningsdatum.");
  if (request.decision === "approved") {
    verifyPrivateRightsRecord(
      rightsRecordsJson,
      issueNumber,
      request.identifiers,
    );
  }
  const byId = new Map(
    candidates.map((candidate) => [candidate.identifier, candidate]),
  );
  const existingCatalog = new Map(catalog.items.map((item) => [item.id, item]));
  const existingRights = new Map(
    rights.entries.map((row) => [row.catalogItemId, row]),
  );
  const reviews = new Map(
    (journal.entries || []).map((entry) => [entry.identifier, entry]),
  );

  // Validate every selected entry before changing any record.
  const selected = request.identifiers.map((id) => {
    const candidate = byId.get(id);
    if (!candidate)
      throw new Error("Arkivposten " + id + " saknas i kandidatlistan.");
    const itemId = catalogIdFromIdentifier(id);
    const previous = existingRights.get(itemId);
    if (previous?.publicationAllowed) {
      throw new Error(
        "Arkivposten " +
          id +
          " är redan publicerad. Använd en separat granskningsändring.",
      );
    }
    const duration = candidate.media?.durationSeconds;
    const catalogReady =
      Number.isFinite(duration) &&
      duration >= 1 &&
      /\.mp4$/i.test(candidate.media?.preferredFile || "");
    return { candidate, itemId, catalogReady };
  });

  for (const { candidate, itemId, catalogReady } of selected) {
    const channelId = request.channelId || CHANNELS[candidate.suggestedChannel];
    if (!channelId)
      throw new Error("Ingen giltig kanal för " + candidate.identifier);
    reviews.set(candidate.identifier, {
      identifier: candidate.identifier,
      catalogItemId: itemId,
      title: candidate.title,
      channelId,
      groupLabel: request.groupLabel,
      decision: request.decision,
      catalogPending: !catalogReady && request.decision !== "rejected",
      basis: request.basis,
      evidenceUrl: request.evidenceUrl,
      licenseUrl: candidate.licenseUrl || null,
      notes: request.notes,
      issueNumber,
      reviewedBy: reviewer,
      reviewedAt,
    });

    if (request.decision === "rejected") {
      // Rejected drafts disappear from the catalog and remain in the journal.
      // Active published entries were already blocked above.
      existingCatalog.delete(itemId);
      existingRights.delete(itemId);
      continue;
    }

    // Keep the decision, but never invent a duration or video format.
    if (!catalogReady) continue;

    existingCatalog.set(itemId, {
      id: itemId,
      title: candidate.title,
      channelId,
      durationSeconds: Math.floor(candidate.media.durationSeconds),
      source: { type: "internet_archive", mediaRef: candidate.identifier },
      availabilityStatus: "unknown",
      familyStatus: "review_required",
    });
    existingRights.set(itemId, {
      catalogItemId: itemId,
      status: request.decision === "approved" ? "approved" : "review_required",
      basis: request.basis,
      evidenceUrl: request.evidenceUrl,
      reviewedAt,
      publicationAllowed: false,
      licenseUrl: candidate.licenseUrl || null,
      notes:
        "Redaktionell granskning #" +
        issueNumber +
        ". " +
        request.notes +
        " Uppspelning, familjegranskning och tablå återstår.",
    });
  }

  return {
    catalog: {
      ...catalog,
      items: [...existingCatalog.values()].sort((a, b) =>
        a.id.localeCompare(b.id, "sv"),
      ),
    },
    rights: {
      ...rights,
      entries: [...existingRights.values()].sort((a, b) =>
        a.catalogItemId.localeCompare(b.catalogItemId, "sv"),
      ),
    },
    journal: {
      schemaVersion: 1,
      entries: [...reviews.values()].sort((a, b) =>
        a.identifier.localeCompare(b.identifier, "sv"),
      ),
    },
    processed: selected.length,
  };
}
