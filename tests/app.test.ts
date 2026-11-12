import { describe, expect, it } from "vitest";

import { createStartViewModel } from "../src/app";

describe("Theves startvy", () => {
  it("beskriver etapp 2 och fjärrkontrollens grundflöde", () => {
    const viewModel = createStartViewModel();

    expect(viewModel.title).toBe("Theve");
    expect(viewModel.stage).toContain("ETAPP 2");
    expect(viewModel.instruction).toContain("PILARNA");
    expect(viewModel.tagline).toContain("linjär TV");
  });
});
