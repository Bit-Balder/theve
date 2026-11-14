const SWEDISH_WORDS =
  /swedish|svensk|svenskt|svenska|svenskdubb|svt|bolibompa|björne|bjorne|bamse|barnprogram|barnfilm|barn-tv|tecknat|sagostund|nyhetssändning|svenskt tal|öppet arkiv/i;

export function textValue(value) {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(" ");
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

export function declaredYear(metadata) {
  for (const field of ["year", "date"]) {
    const value = textValue(metadata?.[field]);
    const match = value.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
    if (match) return Number(match[1]);
  }
  return null;
}

export function periodStatus(year, period) {
  if (year === null) return "unknown";
  return year >= period.start && year <= period.end
    ? "within_period"
    : "outside_period";
}

export function hasSwedishSignal(metadata, summary = {}) {
  const language = textValue(metadata?.language || summary.language).toLowerCase();
  if (/(^|[\s,;])(sv|swe|sv-se|swedish|svenska)([\s,;]|$)/i.test(language)) {
    return true;
  }
  const searchable = [
    metadata?.title,
    metadata?.description,
    metadata?.subject,
    summary.title,
    summary.description,
    summary.subject,
  ]
    .map(textValue)
    .join(" ");
  return SWEDISH_WORDS.test(searchable);
}

export function playableFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .filter((file) => {
      const name = textValue(file?.name);
      return /\.(mp4|m4v|webm|ogv)$/i.test(name) && Number(file.size || 1) !== 0;
    })
    .map((file) => ({
      name: textValue(file.name),
      format: textValue(file.format),
      sizeBytes: Number(file.size) || null,
      durationSeconds: parseDuration(file.length),
    }))
    .sort((a, b) => mediaPriority(a.name) - mediaPriority(b.name));
}

function mediaPriority(name) {
  if (/\.mp4$/i.test(name)) return 0;
  if (/\.m4v$/i.test(name)) return 1;
  if (/\.webm$/i.test(name)) return 2;
  return 3;
}

export function parseDuration(input) {
  const text = textValue(input);
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  if (!/^\d{1,2}(:\d{1,2}){1,2}$/.test(text)) return null;
  return text.split(":").map(Number).reduce((total, part) => total * 60 + part, 0);
}

export function searchUrl(query, page, rows) {
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", query);
  url.searchParams.set("output", "json");
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("page", String(page));
  url.searchParams.append("sort[]", "publicdate asc");
  for (const field of ["identifier", "title", "date", "year", "language", "description", "subject"]) {
    url.searchParams.append("fl[]", field);
  }
  return url.toString();
}

export function metadataUrl(identifier) {
  return "https://archive.org/metadata/" + encodeURIComponent(identifier);
}

export function makeCandidate(payload, summary, search, period, checkedAt) {
  const metadata = payload?.metadata || {};
  const identifier = textValue(metadata.identifier || summary.identifier);
  if (!identifier) return { reason: "missing_identifier" };
  const files = playableFiles(payload?.files);
  if (files.length === 0) return { reason: "no_playable_file" };
  const year = declaredYear(metadata);
  const periodMatch = periodStatus(year, period);
  if (periodMatch === "outside_period") return { reason: "outside_period" };
  if (!hasSwedishSignal(metadata, summary)) return { reason: "not_swedish" };
  const title = textValue(metadata.title || summary.title || identifier);
  const description = textValue(metadata.description || summary.description)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 500);
  const language = textValue(metadata.language || summary.language);
  const preferred = files[0];
  return {
    candidate: {
      identifier,
      title,
      year,
      periodMatch,
      language,
      description,
      sourceUrl: "https://archive.org/details/" + encodeURIComponent(identifier),
      suggestedChannel: search.channel,
      matchingSearches: [search.id],
      media: {
        preferredFile: preferred.name,
        format: preferred.format,
        sizeBytes: preferred.sizeBytes,
        durationSeconds: preferred.durationSeconds,
        fileCount: files.length,
        availabilityStatus: "file_listed_not_playback_verified",
      },
      licenseUrl: textValue(metadata.licenseurl),
      creator: textValue(metadata.creator),
      rightsStatus: "review_required",
      familyStatus: "review_required",
      discoveredAt: checkedAt,
    },
  };
}

export function validateConfig(config) {
  if (
    config?.schemaVersion !== 1 ||
    !Number.isInteger(config?.period?.start) ||
    !Number.isInteger(config?.period?.end) ||
    config.period.start > config.period.end ||
    !Array.isArray(config.queries) ||
    config.queries.length === 0
  ) {
    throw new Error("Invalid archive search configuration.");
  }
  const { searchesPerRun, resultsPerSearch, maxMetadataChecks } = config.settings || {};
  for (const count of [searchesPerRun, resultsPerSearch, maxMetadataChecks]) {
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      throw new Error("Search budgets must be integers from 1 to 500.");
    }
  }
  const ids = new Set();
  for (const search of config.queries) {
    if (
      !search.id ||
      !/^(0[1-9])$/.test(search.channel) ||
      !textValue(search.query) ||
      ids.has(search.id)
    ) {
      throw new Error("Invalid or duplicate archive search definition.");
    }
    ids.add(search.id);
  }
  return config;
}

export async function discoverArchive({
  config,
  existingCandidates = [],
  previousState = {},
  requestJson,
  now = new Date().toISOString(),
}) {
  validateConfig(config);
  const candidates = new Map(existingCandidates.map((candidate) => [candidate.identifier, candidate]));
  const state = {
    schemaVersion: 1,
    nextQueryIndex: Number.isInteger(previousState.nextQueryIndex)
      ? previousState.nextQueryIndex % config.queries.length
      : 0,
    pages: { ...(previousState.pages || {}) },
    updatedAt: now,
  };
  const report = {
    startedAt: now,
    searched: [],
    metadataChecked: 0,
    added: 0,
    duplicates: 0,
    skipped: {},
    errors: [],
    totalCandidates: 0,
  };
  const count = Math.min(config.settings.searchesPerRun, config.queries.length);
  for (let index = 0; index < count; index++) {
    const queryIndex = state.nextQueryIndex;
    const search = config.queries[queryIndex];
    state.nextQueryIndex = (queryIndex + 1) % config.queries.length;
    const page = state.pages[search.id] || 1;
    let result;
    try {
      result = await requestJson(searchUrl(search.query, page, config.settings.resultsPerSearch));
    } catch (error) {
      report.errors.push({ search: search.id, error: String(error.message || error) });
      continue;
    }
    const docs = result?.response?.docs;
    if (!Array.isArray(docs)) {
      report.errors.push({ search: search.id, error: "Search response did not contain docs." });
      continue;
    }
    let finishedPage = true;
    for (const summary of docs) {
      const identifier = textValue(summary.identifier);
      if (!identifier) continue;
      if (candidates.has(identifier)) {
        const existing = candidates.get(identifier);
        if (!existing.matchingSearches.includes(search.id)) {
          existing.matchingSearches = [...existing.matchingSearches, search.id].sort();
        }
        report.duplicates++;
        continue;
      }
      if (report.metadataChecked >= config.settings.maxMetadataChecks) {
        finishedPage = false;
        break;
      }
      let payload;
      try {
        payload = await requestJson(metadataUrl(identifier));
        report.metadataChecked++;
      } catch (error) {
        report.errors.push({ identifier, error: String(error.message || error) });
        finishedPage = false;
        break;
      }
      const result = makeCandidate(payload, summary, search, config.period, now);
      if (!result.candidate) {
        report.skipped[result.reason] = (report.skipped[result.reason] || 0) + 1;
        continue;
      }
      candidates.set(identifier, result.candidate);
      report.added++;
    }
    report.searched.push({ id: search.id, channel: search.channel, page, found: docs.length, complete: finishedPage });
    if (finishedPage) {
      const total = Number(result?.response?.numFound) || docs.length;
      const lastPage = Math.min(500, Math.max(1, Math.ceil(total / config.settings.resultsPerSearch)));
      state.pages[search.id] = page >= lastPage || docs.length === 0 ? 1 : page + 1;
    }
  }
  const sorted = [...candidates.values()].sort((a, b) =>
    a.identifier.localeCompare(b.identifier, "en"),
  );
  report.totalCandidates = sorted.length;
  return { candidates: sorted, state, report };
}

export function formatReport(report) {
  const lines = [
    "# Internet Archive — sökrapport",
    "",
    "Körning: " + report.startedAt,
    "Nya kandidater: " + report.added,
    "Totala kandidater: " + report.totalCandidates,
    "Kontrollerade arkivposter: " + report.metadataChecked,
    "Dubbletter: " + report.duplicates,
    "Fel: " + report.errors.length,
    "",
    "## Genomförda sökningar",
    "",
  ];
  for (const search of report.searched) {
    lines.push("- " + search.id + " (kanal " + search.channel + ", sida " + search.page + "): " + search.found + " träffar");
  }
  lines.push("", "## Bortfiltrerade", "");
  for (const [reason, count] of Object.entries(report.skipped)) {
    lines.push("- " + reason + ": " + count);
  }
  lines.push("", "## Fel", "");
  for (const error of report.errors) {
    lines.push("- " + (error.search || error.identifier) + ": " + error.error);
  }
  lines.push("", "Ingen kandidat är automatiskt godkänd för publicering.", "");
  return lines.join("\n");
}
