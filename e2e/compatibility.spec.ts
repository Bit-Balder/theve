import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => Date.parse("2026-11-13T13:05:00.000Z");
  });
});

test("4:3-ytan ryms och endast lokala resurser laddas", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Theve sändning" })).toBeVisible();

  const screen = await page.locator(".screen43").boundingBox();
  expect(screen).not.toBeNull();
  expect(screen?.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  expect(screen?.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
  expect((screen?.width ?? 0) / (screen?.height ?? 1)).toBeCloseTo(4 / 3, 2);
  expect(externalRequests).toEqual([]);
});

test("fokus, guide och Text-TV fungerar i motsvarande 200 procents zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 400, height: 300 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Theve sändning" })).toBeVisible();
  await page.keyboard.press("g");
  await expect(page.getByRole("dialog", { name: "PROGRAMGUIDE" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await expect(page.getByRole("dialog", { name: "Theve Text-TV" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("reducerad rörelse stänger av CRT och identitetsanimation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".tv-shell")).toHaveAttribute("data-crt", "off");
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".tv-experience__ident-logo")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("CRT kan stängas av och valet ligger kvar", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".tv-shell")).toHaveAttribute(
    "data-crt",
    "subtle",
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator(".tv-shell")).toHaveAttribute("data-crt", "off");
  await page.reload();
  await expect(page.locator(".tv-shell")).toHaveAttribute("data-crt", "off");
});
