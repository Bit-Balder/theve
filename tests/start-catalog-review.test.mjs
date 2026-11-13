import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildPublicData,
  loadProjectData,
} from "../scripts/lib/catalog-pipeline.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

describe("startkatalogens tekniska granskningsgrind", () => {
  it("publicerar endast familje- och rättighetsgodkända original", () => {
    const source = loadProjectData(projectRoot);
    const publicCatalog = buildPublicData(source)["catalog.json"].items;
    const rightsById = new Map(
      source.rights.entries.map((entry) => [entry.catalogItemId, entry]),
    );

    expect(publicCatalog).toHaveLength(9);
    for (const item of publicCatalog) {
      expect(item.familyStatus).toBe("approved");
      expect(item.rightsStatus).toBe("approved");
      expect(item.source.type).toBe("generated_test_pattern");
      expect(rightsById.get(item.id)).toMatchObject({
        status: "approved",
        publicationAllowed: true,
      });
    }
  });
});
