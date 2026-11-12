import { describe, expect, it, vi } from "vitest";

import type { ArchiveMediaSource } from "../src/core/internet-archive";
import {
  clampMediaOffset,
  type MediaElementPort,
  PlayerController,
} from "../src/core/player-controller";

type MediaBehavior =
  | "success"
  | "load-error"
  | "play-error"
  | "blocked"
  | "hang";

class FakeMediaElement extends EventTarget implements MediaElementPort {
  src = "";
  currentTime = 0;
  duration = 120;
  preload = "";
  muted = false;
  playCalls = 0;
  pauseCalls = 0;
  readonly behavior = new Map<string, MediaBehavior>();

  load(): void {
    const behavior = this.behavior.get(this.src);
    if (!this.src || behavior === "hang") {
      return;
    }
    queueMicrotask(() => {
      this.dispatchEvent(
        new Event(behavior === "load-error" ? "error" : "loadedmetadata"),
      );
    });
  }

  pause(): void {
    this.pauseCalls += 1;
  }

  play(): Promise<void> {
    this.playCalls += 1;
    const behavior = this.behavior.get(this.src);
    if (behavior === "blocked") {
      const error = new Error("Playback blocked");
      error.name = "NotAllowedError";
      return Promise.reject(error);
    }
    if (behavior === "play-error") {
      return Promise.reject(new Error("Decode error"));
    }
    return Promise.resolve();
  }

  removeAttribute(name: string): void {
    if (name === "src") {
      this.src = "";
    }
  }

  emitDecodeError(): void {
    this.dispatchEvent(new Event("error"));
  }
}

function source(url: string): ArchiveMediaSource {
  return {
    url,
    filename: url.split("/").at(-1) ?? "video.mp4",
    mimeType: "video/mp4",
    format: "h.264",
    derivative: true,
    sizeBytes: 100,
  };
}

describe("player controller", () => {
  it("kräver Starta TV innan uppspelning med ljud", async () => {
    const media = new FakeMediaElement();
    media.behavior.set("https://media/program.mp4", "success");
    const player = new PlayerController(media);

    const waiting = await player.playSlot({
      slotId: "slot-1",
      offsetMs: 30_000,
      sources: [source("https://media/program.mp4")],
    });

    expect(waiting.phase).toBe("awaiting_user_action");
    expect(media.playCalls).toBe(0);

    const playing = await player.activate();
    expect(playing.phase).toBe("playing");
    expect(media.playCalls).toBe(1);
    expect(media.currentTime).toBe(30);
  });

  it("klampar offset till en giltig position i mediet", async () => {
    const media = new FakeMediaElement();
    media.duration = 10;
    media.behavior.set("https://media/short.mp4", "success");
    const player = new PlayerController(media);
    await player.activate();

    const state = await player.playSlot({
      slotId: "kort",
      offsetMs: 99_000,
      sources: [source("https://media/short.mp4")],
    });

    expect(state.offsetSeconds).toBeCloseTo(9.95);
    expect(media.currentTime).toBeCloseTo(9.95);
    expect(clampMediaOffset(-1, 10)).toBe(0);
    expect(clampMediaOffset(1_000, Number.NaN)).toBe(0);
  });

  it("provar nästa derivative när den föredragna filen är trasig", async () => {
    const media = new FakeMediaElement();
    media.behavior.set("https://media/broken.mp4", "load-error");
    media.behavior.set("https://media/fallback.mp4", "success");
    const player = new PlayerController(media);
    await player.activate();

    const state = await player.playSlot({
      slotId: "slot-med-reservfil",
      offsetMs: 45_000,
      sources: [
        source("https://media/broken.mp4"),
        source("https://media/fallback.mp4"),
      ],
    });

    expect(state.phase).toBe("playing");
    expect(state.sourceUrl).toBe("https://media/fallback.mp4");
    expect(state.attemptedSources).toBe(2);
    expect(state.offsetSeconds).toBe(45);
  });

  it("visar reservbild när 404-, timeout- eller decodefel tömmer fillistan", async () => {
    vi.useFakeTimers();
    const media = new FakeMediaElement();
    media.behavior.set("https://media/404.mp4", "load-error");
    media.behavior.set("https://media/decode.mp4", "play-error");
    media.behavior.set("https://media/timeout.mp4", "hang");
    const player = new PlayerController(media, { loadTimeoutMs: 25 });
    await player.activate();

    const result = player.playSlot({
      slotId: "trasig-slot",
      offsetMs: 0,
      sources: [
        source("https://media/404.mp4"),
        source("https://media/decode.mp4"),
        source("https://media/timeout.mp4"),
      ],
    });
    await vi.advanceTimersByTimeAsync(26);
    const state = await result;

    expect(state.phase).toBe("reserve");
    expect(state.errorCode).toBe("PLAYER_SOURCES_EXHAUSTED");
    expect(state.attemptedSources).toBe(3);
    vi.useRealTimers();
  });

  it("avbryter gammal laddning när kanal eller slot ändras", async () => {
    const media = new FakeMediaElement();
    media.behavior.set("https://media/slow.mp4", "hang");
    media.behavior.set("https://media/new.mp4", "success");
    const player = new PlayerController(media);
    await player.activate();

    const oldLoad = player.playSlot({
      slotId: "gammal",
      offsetMs: 0,
      sources: [source("https://media/slow.mp4")],
    });
    await Promise.resolve();
    const latest = await player.playSlot({
      slotId: "ny",
      offsetMs: 5_000,
      sources: [source("https://media/new.mp4")],
    });
    await oldLoad;

    expect(latest.phase).toBe("playing");
    expect(player.state.slotId).toBe("ny");
    expect(player.state.sourceUrl).toBe("https://media/new.mp4");
  });

  it("startar nästa slot på ordinarie signal även efter föregående fel", async () => {
    const media = new FakeMediaElement();
    media.behavior.set("https://media/first-broken.mp4", "load-error");
    media.behavior.set("https://media/next.mp4", "success");
    const player = new PlayerController(media);
    await player.activate();

    const failed = await player.playSlot({
      slotId: "forsta",
      offsetMs: 10_000,
      sources: [source("https://media/first-broken.mp4")],
    });
    const next = await player.playSlot({
      slotId: "nasta",
      offsetMs: 0,
      sources: [source("https://media/next.mp4")],
    });

    expect(failed.phase).toBe("reserve");
    expect(next.phase).toBe("playing");
    expect(next.slotId).toBe("nasta");
    expect(next.offsetSeconds).toBe(0);
  });

  it("byter till alternativ fil om ett decodefel uppstår under uppspelning", async () => {
    const media = new FakeMediaElement();
    media.behavior.set("https://media/first.mp4", "success");
    media.behavior.set("https://media/second.mp4", "success");
    const player = new PlayerController(media);
    await player.activate();
    await player.playSlot({
      slotId: "decode",
      offsetMs: 20_000,
      sources: [
        source("https://media/first.mp4"),
        source("https://media/second.mp4"),
      ],
    });

    media.emitDecodeError();
    await vi.waitFor(() => {
      expect(player.state.sourceUrl).toBe("https://media/second.mp4");
      expect(player.state.phase).toBe("playing");
    });
  });
});
