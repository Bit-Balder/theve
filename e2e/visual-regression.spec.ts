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

async function selectFirstChannel(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("dialog", { name: "PROGRAMGUIDE" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Theve sändning" })).toBeVisible();
}

test("kanalguiden är blå, har rätt proportioner och visar stora logotyper", async ({
  page,
}) => {
  const guide = page.getByRole("dialog", { name: "PROGRAMGUIDE" });
  await expect(guide).toBeVisible();
  const focused = guide.locator(".channel-guide__row:focus-visible");
  await expect(focused).toHaveCount(1);
  await expect(focused).toHaveCSS("background-color", "rgb(24, 38, 96)");
  await expect(guide.locator(".channel-guide__number")).toHaveCount(0);
  const logo = guide.locator(".channel-guide__logo").first();
  await expect(logo).toBeVisible();
  const box = await logo.boundingBox();
  expect(box?.width).toBeGreaterThan(80);
  const screen = await page.locator(".screen43").boundingBox();
  expect((screen?.width ?? 0) / (screen?.height ?? 1)).toBeCloseTo(4 / 3, 2);
});

test("kanallogotyp och GUIDE TXT INFO visas när kanalen öppnas", async ({
  page,
}) => {
  await selectFirstChannel(page);
  await expect(page.locator(".channel-bug__logo")).toBeVisible();
  const actions = page.locator(".tv-actions");
  await expect(actions).toBeVisible();
  await expect(actions.locator("button")).toHaveCount(3);
  await expect(actions).toBeHidden({ timeout: 7_000 });
});

test("Text-TV med VT323", async ({ page }) => {
  await selectFirstChannel(page);
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
  await selectFirstChannel(page);
  await page.keyboard.press("8");
  await expect(page.locator(".tv-experience__off-air-card")).toBeVisible();
  await expect(page.locator(".tv-experience__off-air-card")).toHaveAttribute(
    "src",
    "assets/cards/barn-off-air.svg",
  );
});
