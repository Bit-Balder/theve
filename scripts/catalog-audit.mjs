import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createCatalogAudit,
  formatCatalogAuditMarkdown,
} from "./lib/catalog-audit.mjs";
import { loadProjectData } from "./lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputArgumentIndex = process.argv.indexOf("--output-dir");
const outputRoot = resolve(
  projectRoot,
  outputArgumentIndex >= 0
    ? process.argv[outputArgumentIndex + 1]
    : "artifacts/catalog-audit",
);
const report = await createCatalogAudit(loadProjectData(projectRoot));

mkdirSync(outputRoot, { recursive: true });
writeFileSync(
  join(outputRoot, "catalog-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
writeFileSync(
  join(outputRoot, "catalog-report.md"),
  formatCatalogAuditMarkdown(report),
);
console.log(
  `Katalograpport ${report.passed ? "godkänd" : "blockerad"}: ${outputRoot}`,
);
if (!report.passed) {
  process.exitCode = 1;
}
