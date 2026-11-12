import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const mediaExtensions = /\.(?:m4v|mov|mp4|mpeg|mpg|ogv|webm)$/i;

function collectMediaFiles(directory) {
  const matches = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        matches.push(...collectMediaFiles(join(directory, entry.name)));
      }
      continue;
    }
    if (mediaExtensions.test(entry.name)) {
      matches.push(join(directory, entry.name));
    }
  }
  return matches;
}

describe("medielagring", () => {
  it("lagrar inga videofiler i projektet", () => {
    expect(collectMediaFiles(projectRoot)).toEqual([]);
  });
});
