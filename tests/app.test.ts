import { describe, expect, it } from "vitest";

import { createStartViewModel } from "../src/app";

describe("Theves startvy", () => {
  it("beskriver projektgrunden utan att låsa framtida kanal- eller fontval", () => {
    const viewModel = createStartViewModel();

    expect(viewModel.title).toBe("Theve");
    expect(viewModel.stage).toContain("Etapp 1");
    expect(viewModel.status).toBe("Körbar grund");
    expect(viewModel.tagline).toContain("linjär TV");
  });
});
