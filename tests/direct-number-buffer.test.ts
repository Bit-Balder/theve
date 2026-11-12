import { afterEach, describe, expect, it, vi } from "vitest";

import { DirectNumberBuffer } from "../src/core/direct-number-buffer";

describe("direktnummer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("visar sifferbufferten och väljer kanal efter tidsgränsen", async () => {
    vi.useFakeTimers();
    const changes: string[] = [];
    const commits: number[] = [];
    const buffer = new DirectNumberBuffer({
      timeoutMs: 500,
      onChange: (digits) => changes.push(digits),
      onCommit: (channel) => commits.push(channel),
    });

    buffer.push("1");
    buffer.push("2");
    expect(buffer.digits).toBe("12");
    expect(changes).toEqual(["1", "12"]);

    await vi.advanceTimersByTimeAsync(499);
    expect(commits).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);

    expect(commits).toEqual([12]);
    expect(buffer.digits).toBe("");
    expect(changes.at(-1)).toBe("");
  });

  it("kan bekräftas direkt och ignorerar andra tecken", () => {
    const commits: number[] = [];
    const buffer = new DirectNumberBuffer({
      onChange: () => {},
      onCommit: (channel) => commits.push(channel),
    });

    buffer.push("x");
    expect(buffer.confirm()).toBe(false);
    buffer.push("4");
    expect(buffer.confirm()).toBe(true);
    expect(commits).toEqual([4]);
  });
});
