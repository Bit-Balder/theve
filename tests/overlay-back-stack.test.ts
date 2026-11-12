import { describe, expect, it, vi } from "vitest";

import { OverlayBackStack } from "../src/core/overlay-back-stack";

describe("överläggens Back-stack", () => {
  it("stänger senaste överlägget först", () => {
    const stack = new OverlayBackStack();
    const guide = vi.fn();
    const banner = vi.fn();
    stack.push({ id: "guide", close: guide });
    stack.push({ id: "banner", close: banner });

    expect(stack.back()).toBe(true);
    expect(banner).toHaveBeenCalledOnce();
    expect(guide).not.toHaveBeenCalled();
    expect(stack.back()).toBe(true);
    expect(guide).toHaveBeenCalledOnce();
    expect(stack.back()).toBe(false);
  });

  it("ersätter samma överlägg i stället för att duplicera det", () => {
    const stack = new OverlayBackStack();
    const oldClose = vi.fn();
    const latestClose = vi.fn();
    stack.push({ id: "guide", close: oldClose });
    stack.push({ id: "guide", close: latestClose });

    expect(stack.size).toBe(1);
    stack.back();
    expect(latestClose).toHaveBeenCalledOnce();
    expect(oldClose).not.toHaveBeenCalled();
  });
});
