import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = join(projectRoot, "dist");
const outputRoot = join(projectRoot, "artifacts", "quality");

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

const files = collectFiles(distRoot).map((path) => ({
  path: relative(distRoot, path),
  bytes: statSync(path).size,
  extension: extname(path).toLowerCase(),
}));
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const scriptBytes = files
  .filter(({ extension }) => extension === ".js")
  .reduce((sum, file) => sum + file.bytes, 0);
const stylesheetBytes = files
  .filter(({ extension }) => extension === ".css")
  .reduce((sum, file) => sum + file.bytes, 0);
const mediaFiles = files.filter(({ extension }) =>
  [".m4v", ".mov", ".mp4", ".mpeg", ".mpg", ".ogv", ".webm"].includes(
    extension,
  ),
);

const budgets = {
  totalBytes: 1_500_000,
  scriptBytes: 200_000,
  stylesheetBytes: 80_000,
};
const report = {
  generatedAt: new Date().toISOString(),
  totalBytes,
  scriptBytes,
  stylesheetBytes,
  fileCount: files.length,
  mediaFiles: mediaFiles.map(({ path }) => path),
  budgets,
  passed:
    totalBytes <= budgets.totalBytes &&
    scriptBytes <= budgets.scriptBytes &&
    stylesheetBytes <= budgets.stylesheetBytes &&
    mediaFiles.length === 0,
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(
  join(outputRoot, "dist-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `Distributionskontroll: ${files.length} filer, ${totalBytes} byte totalt, ${scriptBytes} byte JavaScript, ${stylesheetBytes} byte CSS.`,
);
if (!report.passed) {
  throw new Error(
    "Distributionsbygget överskrider budget eller innehåller video.",
  );
}
