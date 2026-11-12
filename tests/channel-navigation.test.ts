import { describe, expect, it } from "vitest";

import type { Channel } from "../src/core/catalog-types";
import {
  findChannelByNumber,
  getAdjacentChannel,
} from "../src/core/channel-navigation";

const channels: readonly Channel[] = [
  {
    id: "tre",
    number: 3,
    name: "Tre",
    kind: "video",
    audience: "family",
    signOffAt: null,
  },
  {
    id: "noll",
    number: 0,
    name: "Noll",
    kind: "info",
    audience: "family",
    signOffAt: null,
  },
  {
    id: "ett",
    number: 1,
    name: "Ett",
    kind: "video",
    audience: "children",
    signOffAt: null,
  },
];

describe("kanalnavigation", () => {
  it("byter i kanalnummerordning och går runt i båda riktningarna", () => {
    expect(getAdjacentChannel(channels, "noll", 1)?.id).toBe("ett");
    expect(getAdjacentChannel(channels, "tre", 1)?.id).toBe("noll");
    expect(getAdjacentChannel(channels, "noll", -1)?.id).toBe("tre");
  });

  it("slår upp direktnummer utan att anta arrayposition", () => {
    expect(findChannelByNumber(channels, 3)?.id).toBe("tre");
    expect(findChannelByNumber(channels, 2)).toBeNull();
  });
});
