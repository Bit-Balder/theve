import { createHash } from "node:crypto";

import { buildPublicData } from "./catalog-pipeline.mjs";

function createRevision(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

function sourceRevision(data) {
  return createRevision({
    channels: data.channels,
    catalog: data.catalog,
    rights: data.rights,
    schedule: data.schedule,
    weather: data.weather,
  });
}

function firstString(value) {
  if (Array.isArray(value)) {
    return value.find((candidate) => typeof candidate === "string") ?? null;
  }
  return typeof value === "string" ? value : null;
}

function normalizeLicenseUrl(value) {
  return value?.trim().replace(/\/$/, "").toLowerCase() ?? null;
}

async function auditArchiveItem(item, rights, fetcher) {
  const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(
    item.source.mediaRef,
  )}`;
  try {
    const response = await fetcher(metadataUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return {
        severity: "blocker",
        code: "source_unavailable",
        catalogItemId: item.id,
        message: `Internet Archive svarade med HTTP ${response.status}.`,
      };
    }
    const payload = await response.json();
    const actualLicenseUrl = firstString(
      payload?.metadata?.licenseurl ?? payload?.metadata?.license,
    );
    if (
      normalizeLicenseUrl(actualLicenseUrl) !==
      normalizeLicenseUrl(rights.licenseUrl)
    ) {
      return {
        severity: "blocker",
        code: "license_changed",
        catalogItemId: item.id,
        message: `Licensen avviker från låst licenseUrl. Förväntad: ${rights.licenseUrl ?? "saknas"}. Aktuell: ${actualLicenseUrl ?? "saknas"}.`,
      };
    }
    return {
      severity: "ok",
      code: "archive_verified",
      catalogItemId: item.id,
      message: "Internet Archive-källan svarar och licensen matchar journalen.",
    };
  } catch (error) {
    return {
      severity: "blocker",
      code: "source_unavailable",
      catalogItemId: item.id,
      message: error instanceof Error ? error.message : "Okänt nätverksfel.",
    };
  }
}

export async function createCatalogAudit(
  data,
  {
    fetcher = fetch,
    nowEpochMs = Date.now(),
    commitSha = process.env.GITHUB_SHA ?? null,
  } = {},
) {
  const findings = [];
  let publicData = null;
  try {
    publicData = buildPublicData(data);
  } catch (error) {
    findings.push({
      severity: "blocker",
      code: "validation_failed",
      catalogItemId: null,
      message: error instanceof Error ? error.message : "Okänt valideringsfel.",
    });
  }

  const rightsById = new Map(
    data.rights.entries.map((entry) => [entry.catalogItemId, entry]),
  );
  for (const item of data.catalog.items) {
    const rights = rightsById.get(item.id);
    if (!rights) {
      continue;
    }
    if (rights.status !== "approved" || !rights.publicationAllowed) {
      findings.push({
        severity: "info",
        code: "publication_blocked",
        catalogItemId: item.id,
        message: `Objektet är blockerat med rättighetsstatus ${rights.status}.`,
      });
      continue;
    }
    if (item.source.type === "internet_archive") {
      findings.push(await auditArchiveItem(item, rights, fetcher));
    }
  }

  const weatherStatus =
    nowEpochMs <= Date.parse(data.weather.validUntil) ? "fresh" : "stale";
  findings.push({
    severity: weatherStatus === "fresh" ? "ok" : "warning",
    code: `weather_${weatherStatus}`,
    catalogItemId: null,
    message:
      weatherStatus === "fresh"
        ? `Vädersnapshoten gäller till ${data.weather.validUntil}.`
        : `Vädersnapshoten gick ut ${data.weather.validUntil}.`,
  });

  const blockers = findings.filter(({ severity }) => severity === "blocker");
  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date(nowEpochMs).toISOString(),
    commitSha,
    sourceRevision: sourceRevision(data),
    publicRevision: publicData?.["manifest.json"].revision ?? null,
    passed: blockers.length === 0,
    summary: {
      channels: data.channels.channels.length,
      catalogItems: data.catalog.items.length,
      approvedRights: data.rights.entries.filter(
        ({ status, publicationAllowed }) =>
          status === "approved" && publicationAllowed,
      ).length,
      blockedRights: data.rights.entries.filter(
        ({ status, publicationAllowed }) =>
          status !== "approved" || !publicationAllowed,
      ).length,
      weatherLocations: data.weather.locations.length,
      blockers: blockers.length,
    },
    findings,
  };
}

export function formatCatalogAuditMarkdown(report) {
  const lines = [
    "# Theve katalograpport",
    "",
    `Status: ${report.passed ? "GODKÄND" : "BLOCKERAD"}`,
    `Genererad: ${report.generatedAt}`,
    `Commit: ${report.commitSha ?? "lokal körning"}`,
    `Källrevision: ${report.sourceRevision}`,
    `Publik revision: ${report.publicRevision ?? "saknas"}`,
    "",
    "## Sammanfattning",
    "",
    `- Kanaler: ${report.summary.channels}`,
    `- Katalogobjekt: ${report.summary.catalogItems}`,
    `- Godkända rättighetsrader: ${report.summary.approvedRights}`,
    `- Blockerade rättighetsrader: ${report.summary.blockedRights}`,
    `- Väderområden: ${report.summary.weatherLocations}`,
    `- Blockerande fel: ${report.summary.blockers}`,
    "",
    "## Kontroller",
    "",
    ...report.findings.map(
      (finding) =>
        `- [${finding.severity.toUpperCase()}] ${finding.code}${
          finding.catalogItemId ? ` · ${finding.catalogItemId}` : ""
        }: ${finding.message}`,
    ),
    "",
  ];
  return lines.join("\n");
}
