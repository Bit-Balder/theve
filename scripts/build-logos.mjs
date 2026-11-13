import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildLogoManifest,
  buildLogoSvg,
  logoDefinitions,
} from "./lib/logo-system.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(projectRoot, "public", "assets", "logos");
const checkOnly = process.argv.includes("--check");
const outputs = new Map();

for (const definition of logoDefinitions) {
  for (const [variant, suffix] of [
    ["full", ""],
    ["cream", "-cream"],
    ["black", "-black"],
    ["bug", "-bug"],
  ]) {
    outputs.set(
      `${definition.id}${suffix}.svg`,
      buildLogoSvg(definition, variant),
    );
  }
}
outputs.set(
  "manifest.json",
  `${JSON.stringify(buildLogoManifest(), null, 2)}\n`,
);

mkdirSync(outputRoot, { recursive: true });
const mismatches = [];
for (const [name, content] of outputs) {
  const outputPath = join(outputRoot, name);
  if (checkOnly) {
    let existing = null;
    try {
      existing = readFileSync(outputPath, "utf8");
    } catch {
      // Reported as a mismatch below.
    }
    if (existing !== content) {
      mismatches.push(name);
    }
    continue;
  }
  writeFileSync(outputPath, content);
}

if (mismatches.length > 0) {
  throw new Error(
    `Genererade logotyper avviker: ${mismatches.join(", ")}. Kör npm run logos:build.`,
  );
}

console.log(
  checkOnly
    ? `Logotypsystem kontrollerat: ${outputs.size} filer.`
    : `Logotypsystem byggt: ${outputs.size} filer.`,
);
