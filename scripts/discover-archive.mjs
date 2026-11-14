import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverArchive,
  formatReport,
  validateConfig,
} from "./lib/archive-discovery.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = join(root, "data", "archive-searches.json");
const outputDir = join(root, "data", "discovery", "internet-archive");
const reportDir = join(root, "artifacts", "archive-discovery");

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Theve-Archive-Discovery/1.0 (metadata research only)",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        const error = new Error("Internet Archive HTTP " + response.status);
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } else {
        return await response.json();
      }
    } catch (error) {
      lastError = error;
      if (
        error.message?.startsWith("Internet Archive HTTP 4") &&
        !error.message.endsWith("429")
      ) {
        throw error;
      }
    }
    if (attempt < 2) await delay(700 * 2 ** attempt);
  }
  throw lastError;
}

async function main() {
  const config = validateConfig(readJson(source, null));
  if (process.argv.includes("--validate-config")) {
    console.log("Archive discovery configuration valid.");
    return;
  }

  const rejected = readJson(join(root, "data", "editorial", "reviews.json"), {
    entries: [],
  })
    .entries.filter((entry) => entry.decision === "rejected")
    .map((entry) => entry.identifier);
  const result = await discoverArchive({
    config,
    excludedIdentifiers: rejected,
    existingCandidates: readJson(join(outputDir, "candidates.json"), []),
    previousState: readJson(join(outputDir, "state.json"), {}),
    requestJson: async (url) => {
      await delay(180);
      return requestJson(url);
    },
  });
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  writeJson(join(outputDir, "candidates.json"), result.candidates);
  writeJson(join(outputDir, "state.json"), result.state);
  writeJson(join(reportDir, "report.json"), result.report);
  writeFileSync(join(reportDir, "report.md"), formatReport(result.report));
  console.log(
    "Archive discovery: " +
      result.report.added +
      " new, " +
      result.report.totalCandidates +
      " total, " +
      result.report.errors.length +
      " errors.",
  );
  if (result.report.searched.length === 0) {
    throw new Error(
      "All Internet Archive searches failed. Review the report artifact.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
