import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
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
const packageDocument = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const manifest = JSON.parse(
  readFileSync(join(distRoot, "data", "manifest.json"), "utf8"),
);
const sensitivePatterns = [
  {
    name: "private_key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { name: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "aws_access_key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "embedded_secret",
    pattern: /(?:api[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"']{8,}["']/i,
  },
];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".svg",
  ".txt",
]);
const sensitiveFindings = files.flatMap((file) => {
  if (!textExtensions.has(file.extension)) {
    return [];
  }
  const content = readFileSync(join(distRoot, file.path), "utf8");
  return sensitivePatterns
    .filter(({ pattern }) => pattern.test(content))
    .map(({ name }) => ({ path: file.path, pattern: name }));
});

const budgets = {
  totalBytes: 1_500_000,
  scriptBytes: 200_000,
  stylesheetBytes: 80_000,
};
const report = {
  generatedAt: new Date().toISOString(),
  version: packageDocument.version,
  dataRevision: manifest.revision,
  sourceRevision: manifest.sourceRevision,
  totalBytes,
  scriptBytes,
  stylesheetBytes,
  fileCount: files.length,
  mediaFiles: mediaFiles.map(({ path }) => path),
  sensitiveFindings,
  budgets,
  passed:
    totalBytes <= budgets.totalBytes &&
    scriptBytes <= budgets.scriptBytes &&
    stylesheetBytes <= budgets.stylesheetBytes &&
    mediaFiles.length === 0 &&
    sensitiveFindings.length === 0,
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(
  join(outputRoot, "dist-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `Distributionskontroll ${packageDocument.version}: ${files.length} filer, ${totalBytes} byte totalt, ${scriptBytes} byte JavaScript, ${stylesheetBytes} byte CSS, revision ${manifest.revision}.`,
);
if (!report.passed) {
  throw new Error(
    "Distributionsbygget överskrider budget, innehåller video eller matchar ett hemlighetsmönster.",
  );
}
