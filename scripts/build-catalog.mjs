import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPublicData,
  formatGeneratedJson,
  loadProjectData,
} from "./lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = join(projectRoot, "public", "data");
const checkOnly = process.argv.includes("--check");
const generated = buildPublicData(loadProjectData(projectRoot));
const staleFiles = [];

if (!checkOnly) {
  mkdirSync(outputRoot, { recursive: true });
}

for (const [fileName, value] of Object.entries(generated)) {
  const path = join(outputRoot, fileName);
  const expected = formatGeneratedJson(value);

  if (checkOnly) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== expected) {
      staleFiles.push(fileName);
    }
  } else {
    writeFileSync(path, expected);
  }
}

if (staleFiles.length > 0) {
  throw new Error(
    `Genererad data är inaktuell: ${staleFiles.join(", ")}. Kör npm run data:build.`,
  );
}

const action = checkOnly ? "kontrollerad" : "genererad";
console.log(
  `Publik Theve-data ${action}: ${Object.keys(generated).length} filer.`,
);
