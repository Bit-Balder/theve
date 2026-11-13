import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function workflow(name) {
  return readFileSync(`${projectRoot}/.github/workflows/${name}`, "utf8");
}

describe("Etapp 10:s GitHub Actions", () => {
  it("publicerar Pages först efter hela kvalitetsgrinden på main", () => {
    const quality = workflow("quality.yml");

    expect(quality).toContain("needs: verify");
    expect(quality).toContain("github.ref == 'refs/heads/main'");
    expect(quality).toContain("github.event_name != 'pull_request'");
    expect(quality).toContain("actions/upload-pages-artifact@v5");
    expect(quality).toContain("actions/deploy-pages@v5");
    expect(
      existsSync(`${projectRoot}/.github/workflows/deploy-pages.yml`),
    ).toBe(false);
  });

  it("kör nattkontrollen 03.17 svensk tid med endast läsrättighet", () => {
    const nightly = workflow("nightly-catalog.yml");

    expect(nightly).toContain('cron: "17 3 * * *"');
    expect(nightly).toContain('timezone: "Europe/Stockholm"');
    expect(nightly).toMatch(/permissions:\n {2}contents: read/);
    expect(nightly).not.toMatch(/contents: write|pages: write|id-token: write/);
    expect(nightly).toContain("npm run weather:update");
    expect(nightly).toContain("npm run data:build");
    expect(nightly).toContain("npm run catalog:audit");
    expect(nightly).toContain("actions/upload-artifact@v6");
  });

  it("refererar inte till repository secrets", () => {
    expect(
      `${workflow("quality.yml")}\n${workflow("nightly-catalog.yml")}`,
    ).not.toContain("secrets.");
  });
});
