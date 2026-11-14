import { createHash } from "node:crypto";

export const MAX_REVIEW_ITEMS = 40;
const CHANNELS = {
  "01": "tv1", "02": "tv2", "03": "tv3", "04": "tv4", "05": "tv5",
  "06": "tv6", "07": "tv7", "08": "barn", "09": "natur",
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
  if (typeof body !== "string" || !body.startsWith("THEVE_REVIEW_V1\n")) {
    throw new Error("Ärendet saknar THEVE_REVIEW_V1.");
  }
  if (body.length > 14_000) throw new Error("Ärendet är för stort.");
  const data = JSON.parse(body.slice("THEVE_REVIEW_V1\n".length));
  const decisions = ["selected", "approved", "rejected"];
  if (
    data?.version !== 1 ||
    !decisions.includes(data.decision) ||
    !Array.isArray(data.identifiers) ||
    data.identifiers.length < 1 ||
    data.identifiers.length > MAX_REVIEW_ITEMS ||
    !data.identifiers.every((id) => typeof id === "string" && IDENTIFIER.test(id)) ||
    new Set(data.identifiers).size !== data.identifiers.length ||
    data.confirmedScope !== true
  ) {
    throw new Error("Felaktig begäran, saknade identifierare eller obekräftad omfattning.");
  }
  if (data.channelId && !Object.values(CHANNELS).includes(data.channelId)) {
    throw new Error("Okänd TV-kanal.");
  }
  if (typeof data.notes !== "string" || data.notes.trim().length < 8 || data.notes.length > 1200) {
    throw new Error("Skriv en motivering på minst åtta tecken.");
  }
  if (data.decision === "approved") {
    if (typeof data.basis !== "string" || data.basis.trim().length < 20 || data.basis.length > 1200) {
      throw new Error("Godkännande kräver ett tydligt rättighetsunderlag.");
    }
    if (!validUrl(data.evidenceUrl)) {
      throw new Error("Godkännande kräver en publik HTTPS-länk till rättighetsunderlaget.");
    }
    if (data.confirmedRightsForAll !== true) {
      throw new Error("Bekräfta att rättighetsunderlaget gäller alla valda poster.");
    }
  }
  return {
    version: 1,
    identifiers: data.identifiers,
    decision: data.decision,
    notes: data.notes.trim(),
    basis: data.decision === "approved" ? data.basis.trim() :
      data.decision === "selected" ? "Utvald för fortsatt rättighetsgranskning." :
      "Innehållet har avvisats i redaktionell granskning.",
    evidenceUrl: data.decision === "approved" ? data.evidenceUrl : null,
    channelId: data.channelId || null,
    groupLabel: typeof data.groupLabel === "string" ? data.groupLabel.trim().slice(0, 120) : "",
  };
}

export function catalogIdFromIdentifier(identifier) {
  const slug = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  const suffix = createHash("sha256").update(identifier).digest("hex").slice(0, 8);
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
}) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(reviewer)) throw new Error("Ogiltigt granskar-ID.");
  if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new Error("Ogiltigt ärendenummer.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt)) throw new Error("Ogiltigt granskningsdatum.");
  const byId = new Map(candidates.map((candidate) => [candidate.identifier, candidate]));
  const existingCatalog = new Map(catalog.items.map((item) => [item.id, item]));
  const existingRights = new Map(rights.entries.map((row) => [row.catalogItemId, row]));
  const reviews = new Map((journal.entries || []).map((entry) => [entry.identifier, entry]));

  // Validate every selected entry before changing any record.
  const selected = request.identifiers.map((id) => {
    const candidate = byId.get(id);
    if (!candidate) throw new Error("Arkivposten " + id + " saknas i kandidatlistan.");
    const itemId = catalogIdFromIdentifier(id);
    const previous = existingRights.get(itemId);
    if (previous?.publicationAllowed) {
      throw new Error("Arkivposten " + id + " är redan publicerad. Använd en separat granskningsändring.");
    }
    if (request.decision === "approved") {
      if (!validUrl(candidate.licenseUrl)) {
        throw new Error(id + " saknar giltig licenslänk i Internet Archives metadata.");
      }
    }
    if (request.decision !== "rejected") {
      if (!IDENTIFIER.test(id)) throw new Error("Ogiltig identifierare " + id);
      const duration = candidate.media?.durationSeconds;
      if (!Number.isFinite(duration) || duration < 1 || !/\.mp4$/i.test(candidate.media?.preferredFile || "")) {
        throw new Error(id + " saknar MP4 eller speltid. Kontrollera källan.");
      }
    }
    return { candidate, itemId };
  });

  for (const { candidate, itemId } of selected) {
    const channelId = request.channelId || CHANNELS[candidate.suggestedChannel];
    if (!channelId) throw new Error("Ingen giltig kanal för " + candidate.identifier);
    reviews.set(candidate.identifier, {
      identifier: candidate.identifier,
      catalogItemId: itemId,
      title: candidate.title,
      channelId,
      groupLabel: request.groupLabel,
      decision: request.decision,
      basis: request.basis,
      evidenceUrl: request.evidenceUrl,
      licenseUrl: candidate.licenseUrl || null,
      notes: request.notes,
      issueNumber,
      reviewedBy: reviewer,
      reviewedAt,
    });

    if (request.decision !== "approved") {
      if (existingRights.has(itemId)) {
        existingRights.set(itemId, {
          ...existingRights.get(itemId),
          status: "rejected",
          publicationAllowed: false,
          basis: request.basis,
          evidenceUrl: null,
          reviewedAt,
          notes: request.notes,
        });
      }
      continue;
    }

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
      notes: "Redaktionell granskning #" + issueNumber + ". " + request.notes +
        " Uppspelning, familjegranskning och tablå återstår.",
    });
  }

  return {
    catalog: {
      ...catalog,
      items: [...existingCatalog.values()].sort((a, b) => a.id.localeCompare(b.id, "sv")),
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
