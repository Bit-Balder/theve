import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Gemensamma referensbilder");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    let currentNow = Date.parse("2026-11-13T13:05:00.000Z");
    Date.now = () => currentNow;
    Object.defineProperty(window, "__setTheveNow", {
      value: (iso: string) => {
        currentNow = Date.parse(iso);
      },
    });
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

const screenshotOptions = {
  animations: "disabled" as const,
  caret: "hide" as const,
  maxDiffPixelRatio: 0.03,
  threshold: 0.35,
};

async function startTv(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Theve sändning" })).toBeVisible();
}

test("startsida i 4:3", async ({ page }) => {
  await expect(page.locator(".screen43")).toHaveScreenshot(
    "start-4x3.png",
    screenshotOptions,
  );
});

test("programguide", async ({ page }) => {
  await startTv(page);
  await page.keyboard.press("g");
  await expect(page.getByRole("dialog", { name: "PROGRAMGUIDE" })).toBeVisible();
  await expect(page.locator(".screen43")).toHaveScreenshot(
    "programguide.png",
    screenshotOptions,
  );
});

test("Text-TV med VT323", async ({ page }) => {
  await startTv(page);
  await page.keyboard.press("t");
  await expect(page.getByRole("dialog", { name: "Theve Text-TV" })).toBeVisible();
  const screen = await page.locator(".screen43").boundingBox();
  const textGrid = await page.locator(".teletext__grid").boundingBox();
  expect(screen).not.toBeNull();
  expect(textGrid).not.toBeNull();
  if (!screen || !textGrid) throw new Error("Text-TV saknar yta");
  expect(textGrid.width / screen.width).toBeGreaterThan(0.75);
  expect(textGrid.height / screen.height).toBeGreaterThan(0.75);
  const header = await page.locator(".teletext__row--header").boundingBox();
  expect(header).not.toBeNull();
  if (!header) throw new Error("Text-TV saknar rubrikrad");
  expect(header.width / screen.width).toBeGreaterThan(0.85);
  await expect(page.locator(".teletext__row")).toHaveCount(24);
});

test("Barns analoga slutskylt", async ({ page }) => {
  await page.evaluate(() => {
    (
      window as typeof window & {
        __setTheveNow: (value: string) => void;
      }
    ).__setTheveNow("2026-11-13T18:00:00.000Z");
  });
  await startTv(page);
  await page.keyboard.press("8");
  await expect(page.locator(".tv-experience__off-air-card")).toBeVisible();
  await expect(page.locator(".screen43")).toHaveScreenshot(
    "barn-slutskylt.png",
    screenshotOptions,
  );
});
