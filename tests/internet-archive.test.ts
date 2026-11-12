import { afterEach, describe, expect, it, vi } from "vitest";

import {
  InternetArchiveAdapter,
  selectArchiveMediaSources,
} from "../src/core/internet-archive";

describe("Internet Archive-adaptern", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prioriterar publik H.264-MP4 och behåller alternativa derivat", () => {
    const sources = selectArchiveMediaSources("test_item", [
      {
        name: "original.mov",
        format: "QuickTime",
        source: "original",
      },
      {
        name: "video 512kb.mp4",
        format: "512Kb MPEG4",
        source: "derivative",
        size: "2000",
      },
      {
        name: "video h264.mp4",
        format: "h.264",
        source: "derivative",
        size: "3000",
      },
      {
        name: "hemlig.mp4",
        format: "h.264",
        private: "true",
      },
      {
        name: "../annan-katalog.mp4",
        format: "h.264",
      },
    ]);

    expect(sources.map((source) => source.filename)).toEqual([
      "video h264.mp4",
      "video 512kb.mp4",
    ]);
    expect(sources[0].url).toBe(
      "https://archive.org/download/test_item/video%20h264.mp4",
    );
  });

  it("hämtar metadata via identifier och returnerar en spelbar fillista", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          metadata: { identifier: "test_item", title: "Arkivfilm" },
          files: [
            {
              name: "movie.mp4",
              format: "h.264",
              source: "derivative",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const adapter = new InternetArchiveAdapter({ fetcher, timeoutMs: 500 });

    const item = await adapter.resolve("test_item");

    expect(fetcher).toHaveBeenCalledWith(
      "https://archive.org/metadata/test_item",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(item.title).toBe("Arkivfilm");
    expect(item.sources).toHaveLength(1);
    expect(item.detailsUrl).toBe("https://archive.org/details/test_item");
  });

  it("stoppar ogiltiga identifierare innan något nätverksanrop görs", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = new InternetArchiveAdapter({ fetcher });

    await expect(adapter.resolve("../fel")).rejects.toMatchObject({
      code: "ARCHIVE_INVALID_IDENTIFIER",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rapporterar 404 som ett kontrollerat adapterfel", async () => {
    const adapter = new InternetArchiveAdapter({
      fetcher: vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("saknas", { status: 404 })),
    });

    await expect(adapter.resolve("missing_item")).rejects.toMatchObject({
      code: "ARCHIVE_HTTP_ERROR",
      retryable: false,
    });
  });

  it("avbryter en metadatahämtning som överskrider tidsgränsen", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const adapter = new InternetArchiveAdapter({ fetcher, timeoutMs: 25 });

    const result = adapter.resolve("slow_item");
    const expectation = expect(result).rejects.toMatchObject({
      code: "ARCHIVE_TIMEOUT",
    });
    await vi.advanceTimersByTimeAsync(26);

    await expectation;
  });

  it("vägrar metadata utan kompatibel publik MP4", async () => {
    const adapter = new InternetArchiveAdapter({
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            metadata: { title: "Endast text" },
            files: [{ name: "readme.txt", format: "Text" }],
          }),
          { status: 200 },
        ),
      ),
    });

    await expect(adapter.resolve("text_item")).rejects.toMatchObject({
      code: "ARCHIVE_NO_COMPATIBLE_MEDIA",
    });
  });
});
