import { describe, expect, it } from "vitest";

import type { Channel } from "../src/core/catalog-types";
import {
  findChannelByNumber,
  getAdjacentChannel,
} from "../src/core/channel-navigation";

const channels: readonly Channel[] = [
  {
    id: "nio",
    number: 9,
    name: "Nio",
    kind: "video",
    audience: "family",
    signOffAt: null,
    profile: "Natur",
    theme: "yellow",
    logo: {
      fullColor: "assets/logos/natur.svg",
      cream: "assets/logos/natur-cream.svg",
      black: "assets/logos/natur-black.svg",
      compact: "assets/logos/natur-bug.svg",
      viewBox: "0 0 320 96",
    },
  },
  {
    id: "tva",
    number: 2,
    name: "Två",
    kind: "video",
    audience: "general",
    signOffAt: null,
    profile: "Samhälle",
    theme: "cream",
    logo: {
      fullColor: "assets/logos/tv2.svg",
      cream: "assets/logos/tv2-cream.svg",
      black: "assets/logos/tv2-black.svg",
      compact: "assets/logos/tv2-bug.svg",
      viewBox: "0 0 320 96",
    },
  },
  {
    id: "fem",
    number: 5,
    name: "Fem",
    kind: "video",
    audience: "general",
    signOffAt: null,
    profile: "Film",
    theme: "cream",
    logo: {
      fullColor: "assets/logos/tv5.svg",
      cream: "assets/logos/tv5-cream.svg",
      black: "assets/logos/tv5-black.svg",
      compact: "assets/logos/tv5-bug.svg",
      viewBox: "0 0 320 96",
    },
  },
];

describe("kanalnavigation", () => {
  it("byter i kanalnummerordning och går runt i båda riktningarna", () => {
    expect(getAdjacentChannel(channels, "tva", 1)?.id).toBe("fem");
    expect(getAdjacentChannel(channels, "nio", 1)?.id).toBe("tva");
    expect(getAdjacentChannel(channels, "tva", -1)?.id).toBe("nio");
  });

  it("slår upp direktnummer utan att anta arrayposition", () => {
    expect(findChannelByNumber(channels, 9)?.id).toBe("nio");
    expect(findChannelByNumber(channels, 7)).toBeNull();
  });
});
