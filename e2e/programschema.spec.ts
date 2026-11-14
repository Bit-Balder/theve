import { expect, test } from "@playwright/test";

const candidates = [
  {
    identifier: "serie-s01e01",
    title: "Favoritserien s01e01",
    year: 1993,
    periodMatch: "within_period",
    language: "swe",
    suggestedChannel: "08",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://archive.org/details/serie-s01e01",
    media: { preferredFile: "episode-1.mp4", durationSeconds: 1200, fileCount: 1 },
  },
  {
    identifier: "serie-s01e02",
    title: "Favoritserien s01e02",
    year: 1993,
    periodMatch: "within_period",
    language: "swe",
    suggestedChannel: "08",
    licenseUrl: "",
    sourceUrl: "https://archive.org/details/serie-s01e02",
    media: { preferredFile: "episode-2.mp4", durationSeconds: 1400, fileCount: 1 },
  },
  {
    identifier: "annan-film",
    title: "En annan film",
    year: null,
    periodMatch: "unknown",
    language: "swe",
    suggestedChannel: "05",
    licenseUrl: "",
    sourceUrl: "https://archive.org/details/annan-film",
    media: { preferredFile: "movie.mp4", durationSeconds: 1800, fileCount: 1 },
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/Bit-Balder/theve/**", async (route) => {
    const isCandidates = route.request().url().includes("candidates.json");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(isCandidates ? candidates : { schemaVersion: 1, entries: [] }),
    });
  });
});

test("programschema väljer en hel säsong utan att publicera", async ({ page }) => {
  await page.goto("/programschema/");
  await expect(page.getByRole("heading", { name: "PROGRAMSCHEMA" })).toBeVisible();
  await expect(page.locator(".candidate-row")).toHaveCount(3);
  await page.getByRole("button", { name: "MARKERA SÄSONG" }).click();
  await expect(page.locator("#selected-count")).toHaveText("2 VALDA ARKIVPOSTER");
  await expect(page.locator("#group-label")).toHaveValue("Favoritserien - säsong 1");

  await page.locator("#notes").fill("Säsongen kan utredas vidare.");
  await page.locator("#confirm-scope").check();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "SPARA BESLUT SOM JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("theve-review-selected.json");

  await page.locator("#decision").selectOption("approved");
  await page.locator("#basis").fill("Påstått rättighetsunderlag för säsongen behöver kontrolleras.");
  await page.locator("#evidence-url").fill("https://example.org/rights");
  await page.locator("#confirm-rights").check();
  await page.locator("#submit-review").click();
  await expect(page.locator("#review-error")).toContainText("Alla valda poster");
  await expect(page.locator("#review-error")).toContainText("licenslänk");
});

test("programschema kan välja och avvisa filtrerade kandidater", async ({ page }) => {
  await page.goto("/programschema/");
  await page.locator("#search").fill("annan film");
  await expect(page.locator(".candidate-row")).toHaveCount(1);
  await page.locator("#select-visible").click();
  await expect(page.locator("#selected-count")).toHaveText("1 VALDA ARKIVPOSTER");
  await page.locator("#decision").selectOption("rejected");
  await page.locator("#notes").fill("Rättighetsunderlag saknas för filmen.");
  await page.locator("#confirm-scope").check();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-review").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("theve-review-rejected.json");
});
