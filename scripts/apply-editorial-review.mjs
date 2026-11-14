import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyReviewRequest, parseReviewRequest } from "./lib/editorial-review.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const save = (path, value) => {
  const location = join(root, path);
  writeFileSync(location, JSON.stringify(value, null, 2) + "\n");
};
const filePath = process.env.THEVE_CANDIDATE_PATH;
if (!filePath || !existsSync(filePath)) {
  throw new Error("Kandidatlistan från Internet Archive saknas.");
}
const request = parseReviewRequest(process.env.THEVE_REVIEW_BODY);
const updated = applyReviewRequest({
  request,
  candidates: JSON.parse(readFileSync(filePath, "utf8")),
  catalog: read("data/source/catalog.json"),
  rights: read("data/source/rights.json"),
  journal: read("data/editorial/reviews.json"),
  reviewer: process.env.THEVE_REVIEW_AUTHOR,
  issueNumber: Number(process.env.THEVE_REVIEW_ISSUE),
  reviewedAt: process.env.THEVE_REVIEW_DATE?.slice(0, 10),
});
mkdirSync(join(root, "data/editorial"), { recursive: true });
save("data/source/catalog.json", updated.catalog);
save("data/source/rights.json", updated.rights);
save("data/editorial/reviews.json", updated.journal);
console.log(
  "Granskade poster: " + updated.processed +
    ". Ingen post har automatiskt lagts i tablån eller publicerats.",
);
