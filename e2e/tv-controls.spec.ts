import { expect, test } from "@playwright/test";

test("kanalguiden behåller blå fokusbakgrund och visar bara logotyp", async ({
  page,
}) => {
  await page.goto("/");
  const guide = page.getByRole("dialog", { name: "PROGRAMGUIDE" });
  await expect(guide).toBeVisible();
  const row = guide.locator('[data-channel-id="tv1"]');
  await expect(row).toBeFocused();
  await expect(row).toHaveCSS("background-color", "rgb(24, 38, 96)");
  const logoArea = row.locator(".channel-guide__channel");
  await expect(logoArea.locator("img")).toBeVisible();
  await expect(logoArea.locator("span")).toHaveCount(0);
  const bounds = await logoArea.boundingBox();
  const logoBounds = await logoArea.locator("img").boundingBox();
  expect(bounds).not.toBeNull();
  expect(logoBounds).not.toBeNull();
  if (!bounds || !logoBounds) throw new Error("Kanalbilden saknar storlek");
  expect(logoBounds.width / bounds.width).toBeGreaterThan(0.8);
  await page.keyboard.press("ArrowDown");
  await expect(guide.locator('[data-channel-id="tv2"]')).toBeFocused();
  await expect(guide.locator('[data-channel-id="tv2"]')).toHaveCSS(
    "background-color",
    "rgb(24, 38, 96)",
  );
});

test("snabbmenyn döljs automatiskt och styrs med vänster och höger", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Enter");
  const tv = page.getByRole("region", { name: "Theve sändning" });
  await expect(tv).toBeVisible();
  const actions = tv.locator(".tv-actions");
  const buttons = actions.locator("button");
  await expect(actions).toBeVisible();
  await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(0)).toHaveText("GUIDE");
  await expect(buttons.nth(1)).toHaveText("TXT");
  await expect(buttons.nth(2)).toHaveText("INFO");

  await expect(actions).toBeHidden({ timeout: 7_000 });
  await expect(tv.locator(".tv-experience__status")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(actions).toBeVisible();
  await expect(buttons.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(2)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  const teletext = page.getByRole("dialog", { name: "Theve Text-TV" });
  await expect(teletext).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(teletext).toBeHidden();

  await page.keyboard.press("ArrowLeft");
  await expect(buttons.nth(2)).toBeFocused();
  await page.keyboard.press("Enter");
  const info = page.getByRole("dialog", { name: "TEKNISK INFORMATION" });
  await expect(info).toBeVisible();
  await expect(actions).toBeHidden();
  const crt = info.getByRole("button", { name: "Växla bildrörseffekt" });
  await expect(crt).toBeFocused();
  const previousMode = await page.locator(".tv-shell").getAttribute("data-crt");
  await page.keyboard.press("Enter");
  const expected = previousMode === "subtle" ? "off" : "subtle";
  await expect(page.locator(".tv-shell")).toHaveAttribute("data-crt", expected);
  await expect(crt).toHaveAttribute(
    "aria-pressed",
    String(expected === "subtle"),
  );
  await page.keyboard.press("Escape");
  await expect(info).toBeHidden();
  await expect(tv).toBeFocused();
});
