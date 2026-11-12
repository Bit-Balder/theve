import { describe, expect, it, vi } from "vitest";

import { InternetArchiveAdapter } from "../src/core/internet-archive";
import { ArchivePlaybackService } from "../src/core/playback-service";
import {
  type MediaElementPort,
  PlayerController,
} from "../src/core/player-controller";

class ImmediateMediaElement extends EventTarget implements MediaElementPort {
  src = "";
  currentTime = 0;
  duration = 120;
  preload = "";
  muted = false;
  playCalls = 0;

  load(): void {
    if (this.src) {
      queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata")));
    }
  }

  pause(): void {}

  play(): Promise<void> {
    this.playCalls += 1;
    return Promise.resolve();
  }

  removeAttribute(name: string): void {
    if (name === "src") {
      this.src = "";
    }
  }
}

function metadata(identifier: string): Response {
  return new Response(
    JSON.stringify({
      metadata: { identifier, title: identifier },
      files: [
        {
          name: `${identifier}.mp4`,
          format: "h.264",
          source: "derivative",
        },
      ],
    }),
    { status: 200 },
  );
}

describe("Archive playback service", () => {
  it("låter senaste kanalvalet vinna över en gammal metadatahämtning", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
      if (String(input).endsWith("/old_item")) {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      }
      return Promise.resolve(metadata("new_item"));
    });
    const media = new ImmediateMediaElement();
    const player = new PlayerController(media);
    const service = new ArchivePlaybackService(
      new InternetArchiveAdapter({ fetcher }),
      player,
    );
    await service.activate();

    const oldTune = service.tune({
      slotId: "gammal-slot",
      archiveIdentifier: "old_item",
      offsetMs: 0,
    });
    await Promise.resolve();
    const latest = await service.tune({
      slotId: "ny-slot",
      archiveIdentifier: "new_item",
      offsetMs: 30_000,
    });
    await oldTune;

    expect(latest.phase).toBe("playing");
    expect(player.state.slotId).toBe("ny-slot");
    expect(player.state.offsetSeconds).toBe(30);
    expect(player.state.sourceUrl).toContain("new_item.mp4");
  });

  it("återhämtar nästa slot på ordinarie anrop efter metadata-404", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation((input) =>
        Promise.resolve(
          String(input).endsWith("/missing_item")
            ? new Response("saknas", { status: 404 })
            : metadata("working_item"),
        ),
      );
    const media = new ImmediateMediaElement();
    const player = new PlayerController(media);
    const service = new ArchivePlaybackService(
      new InternetArchiveAdapter({ fetcher }),
      player,
    );
    await service.activate();

    const failed = await service.tune({
      slotId: "trasig-slot",
      archiveIdentifier: "missing_item",
      offsetMs: 0,
    });
    const next = await service.tune({
      slotId: "nasta-slot",
      archiveIdentifier: "working_item",
      offsetMs: 0,
    });

    expect(failed.phase).toBe("reserve");
    expect(failed.errorCode).toBe("ARCHIVE_HTTP_ERROR");
    expect(next.phase).toBe("playing");
    expect(next.slotId).toBe("nasta-slot");
  });
});
