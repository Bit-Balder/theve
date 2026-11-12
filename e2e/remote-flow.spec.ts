import { expect, test } from "@playwright/test";

test("hela TV-flödet fungerar med tangentbord som fjärrkontroll", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fixedNow = Date.parse("2026-11-12T05:05:00.000Z");
    Date.now = () => fixedNow;
  });
  await page.goto("/");

  await expect(page.getByText("ETAPP 6 · KANALER OCH GUIDE")).toBeVisible();
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");

  const tv = page.getByRole("region", { name: "Theve sändning" });
  await expect(tv).toBeVisible();
  await expect(tv).toHaveAttribute("data-channel-id", "barnkanalen");
  await expect(page.getByText("Barnmorgon · testbild").first()).toBeVisible();

  await page.keyboard.press("ArrowUp");
  await expect(tv).toHaveAttribute("data-channel-id", "tecknat");

  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(tv).toHaveAttribute("data-channel-id", "retro-tv");

  await page.keyboard.press("3");
  await expect(page.locator(".direct-number")).toHaveText("KANAL _3");
  await expect(tv).toHaveAttribute("data-channel-id", "natur-tv", {
    timeout: 2_000,
  });
  await expect(page.locator(".direct-number")).toBeHidden();

  await page.keyboard.press("g");
  const guide = page.getByRole("dialog", { name: "PROGRAMGUIDE" });
  await expect(guide).toBeVisible();
  await expect(
    guide.locator('[data-channel-id="natur-tv"]'),
  ).toBeFocused();
  await expect(guide.locator(".channel-guide__next button")).toHaveCount(0);

  await page.keyboard.press("ArrowDown");
  await expect(guide.locator('[data-channel-id="retro-tv"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(guide).toBeHidden();
  await expect(tv).toHaveAttribute("data-channel-id", "retro-tv");
  await expect(tv).toBeFocused();

  await page.keyboard.press("g");
  await expect(guide).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();
  await expect(tv).toBeFocused();
});
