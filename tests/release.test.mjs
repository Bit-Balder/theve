import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { THEVE_VERSION } from "../src/core/release.ts";

const packageDocument = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packageLockDocument = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

describe("release candidate", () => {
  it("visar samma versionsnummer i appen och paketet", () => {
    expect(THEVE_VERSION).toBe("1.0.0-rc.1");
    expect(packageDocument.version).toBe(THEVE_VERSION);
    expect(packageLockDocument.version).toBe(THEVE_VERSION);
    expect(packageLockDocument.packages[""].version).toBe(THEVE_VERSION);
  });
});
