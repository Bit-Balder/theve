import { expect, test } from "@playwright/test";

test("hela TV-flödet fungerar med tangentbord som fjärrkontroll", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fixedNow = Date.parse("2026-11-13T13:05:00.000Z");
    Date.now = () => fixedNow;
  });
  await page.goto("/");

  await expect(page.getByText("ETAPP 9 · TEXT-TV")).toBeVisible();
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
  await expect(teletext.locator(".teletext__row")).toHaveCount(24);
  const widths = await teletext.locator(".teletext__row").evaluateAll((rows) =>
    rows.map((row) => Array.from(row.textContent ?? "").length),
  );
  expect(widths.every((width) => width === 40)).toBe(true);
  await page.keyboard.press("3");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(teletext).toHaveAttribute("data-page-number", "300");
  await expect(teletext.getByText("VÄDERÖVERSIKT")).toBeVisible();
  await expect(teletext.getByText(/KÄLLA: SMHI ÖPPNA DATA/)).toBeVisible();
  await page.keyboard.press("3");
  await page.keyboard.press("0");
  await page.keyboard.press("1");
  await expect(teletext).toHaveAttribute("data-page-number", "301");
  await expect(teletext.getByText("GÖTEBORG")).toBeVisible();
  await page.keyboard.press("4");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(teletext).toHaveAttribute("data-page-number", "400");
  await expect(teletext.getByText("TV-TABLÅ JUST NU")).toBeVisible();
  await page.keyboard.press("5");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(teletext).toHaveAttribute("data-page-number", "500");
  await expect(teletext.getByText("Å Ä Ö · SVENSKA TECKEN")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(teletext).toBeHidden();
  await expect(tv).toBeFocused();
});

test("Barn följer 18.55, 19.00 och 06.00 utan omladdning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let currentNow = Date.parse("2026-11-13T17:54:00.000Z");
    let realAnchor = performance.now();
    Date.now = () => currentNow + performance.now() - realAnchor;
    Object.defineProperty(window, "__setTheveNow", {
      value: (iso: string) => {
        currentNow = Date.parse(iso);
        realAnchor = performance.now();
      },
    });
  });
  const setNow = async (iso: string) => {
    await page.evaluate((next) => {
      (
        window as typeof window & {
          __setTheveNow: (value: string) => void;
        }
      ).__setTheveNow(next);
    }, iso);
  };
  const retuneBarn = async () => {
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowDown");
  };

  await page.goto("/");
  await page.keyboard.press("Enter");
  const tv = page.getByRole("region", { name: "Theve sändning" });
  await expect(tv).toBeFocused();

  await page.keyboard.press("8");
  await expect(tv).toHaveAttribute("data-channel-id", "barn", {
    timeout: 2_000,
  });
  await expect(page.getByText("Barn · Dagens program").first()).toBeVisible();

  await setNow("2026-11-13T17:54:59.500Z");
  await retuneBarn();
  await expect(page.getByText("Barn önskar god natt").first()).toBeVisible();

  await setNow("2026-11-13T17:59:59.500Z");
  await retuneBarn();
  const endCard = page.locator(".tv-experience__off-air-card");
  await expect(endCard).toBeVisible();
  await expect(endCard).toHaveAttribute(
    "src",
    "assets/cards/barn-off-air.svg",
  );
  await expect(page.locator(".player-surface")).toBeHidden();

  await page.keyboard.press("ArrowUp");
  await expect(tv).toHaveAttribute("data-channel-id", "natur");
  await page.keyboard.press("ArrowDown");
  await expect(tv).toHaveAttribute("data-channel-id", "barn");
  await expect(endCard).toBeVisible();

  await setNow("2026-11-14T04:59:59.500Z");
  await retuneBarn();
  await expect(endCard).toBeHidden();
  await expect(page.getByText("Barn · Dagens program").first()).toBeVisible();
});
