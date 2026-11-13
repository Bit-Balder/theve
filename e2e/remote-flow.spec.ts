import { expect, test } from "@playwright/test";

test("hela TV-flödet fungerar med tangentbord som fjärrkontroll", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fixedNow = Date.parse("2026-11-12T05:05:00.000Z");
    Date.now = () => fixedNow;
  });
  await page.goto("/");

  await expect(page.getByText("ETAPP 7 · KANALIDENTITETER")).toBeVisible();
  await expect(page.getByRole("button", { name: /starta tv/i })).toBeFocused();
  await page.keyboard.press("Enter");

  const tv = page.getByRole("region", { name: "Theve sändning" });
  await expect(tv).toBeVisible();
  await expect(tv).toHaveAttribute("data-channel-id", "tv1");
  await expect(page.getByText("TV1 · Nyheter och kultur").first()).toBeVisible();
  await expect(page.locator(".channel-bug__logo")).toHaveAttribute(
    "src",
    "assets/logos/tv1-bug.svg",
  );

  await page.keyboard.press("ArrowUp");
  await expect(tv).toHaveAttribute("data-channel-id", "tv2");

  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(tv).toHaveAttribute("data-channel-id", "tv4");

  await page.keyboard.press("9");
  await expect(page.locator(".direct-number")).toHaveText("KANAL _9");
  await expect(tv).toHaveAttribute("data-channel-id", "natur", {
    timeout: 2_000,
  });
  await expect(page.locator(".direct-number")).toBeHidden();

  await page.keyboard.press("g");
  const guide = page.getByRole("dialog", { name: "PROGRAMGUIDE" });
  await expect(guide).toBeVisible();
  await expect(
    guide.locator('[data-channel-id="natur"]'),
  ).toBeFocused();
  await expect(guide.locator(".channel-guide__row")).toHaveCount(9);
  await expect(guide.locator(".channel-guide__next button")).toHaveCount(0);

  await page.keyboard.press("ArrowDown");
  await expect(guide.locator('[data-channel-id="tv1"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(guide).toBeHidden();
  await expect(tv).toHaveAttribute("data-channel-id", "tv1");
  await expect(tv).toBeFocused();

  await page.keyboard.press("g");
  await expect(guide).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();
  await expect(tv).toBeFocused();

  await page.keyboard.press("t");
  const teletext = page.getByRole("dialog", { name: "Theve Text-TV" });
  await expect(teletext).toBeVisible();
  await expect(teletext.getByText("THEVE TEXT-TV").first()).toBeVisible();
  await page.keyboard.press("4");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(teletext.getByText("BARN OCH FAMILJ")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(teletext).toBeHidden();
  await expect(tv).toBeFocused();
});
