import { describe, expect, it } from "vitest";

import { normalizeRemoteInput } from "../src/core/remote-input";

describe("plattformens fjärradapter", () => {
  it.each([
    ["ArrowUp", undefined, "channel_up"],
    ["ChannelDown", undefined, "channel_down"],
    ["Guide", undefined, "guide"],
    ["T", undefined, "teletext"],
    ["I", undefined, "info"],
    ["C", undefined, "crt"],
    ["BrowserBack", undefined, "back"],
    ["OK", undefined, "confirm"],
    ["", 427, "channel_up"],
    ["", 428, "channel_down"],
    ["", 458, "guide"],
    ["", 459, "teletext"],
    ["", 457, "info"],
    ["", 461, "back"],
  ])("översätter %s/%s till %s", (key, keyCode, expected) => {
    expect(normalizeRemoteInput({ key, keyCode })?.type).toBe(expected);
  });

  it("stöder både sifferrad och numeriskt tangentbord", () => {
    expect(normalizeRemoteInput({ key: "3" })).toEqual({
      type: "digit",
      digit: "3",
    });
    expect(normalizeRemoteInput({ key: "", code: "Numpad7" })).toEqual({
      type: "digit",
      digit: "7",
    });
  });

  it("ignorerar okända knappar", () => {
    expect(normalizeRemoteInput({ key: "F12" })).toBeNull();
  });
});
