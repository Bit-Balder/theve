const ARCHIVE_ORIGIN = "https://archive.org";
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{5,80}$/;

export type ArchiveAdapterErrorCode =
  | "ARCHIVE_INVALID_IDENTIFIER"
  | "ARCHIVE_ABORTED"
  | "ARCHIVE_TIMEOUT"
  | "ARCHIVE_NETWORK_ERROR"
  | "ARCHIVE_HTTP_ERROR"
  | "ARCHIVE_INVALID_METADATA"
  | "ARCHIVE_ITEM_UNAVAILABLE"
  | "ARCHIVE_NO_COMPATIBLE_MEDIA";

export class ArchiveAdapterError extends Error {
  readonly code: ArchiveAdapterErrorCode;
  readonly retryable: boolean;

  constructor(
    code: ArchiveAdapterErrorCode,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.name = "ArchiveAdapterError";
    this.code = code;
    this.retryable = retryable;
  }
}

interface ArchiveFileRecord {
  readonly name?: unknown;
  readonly format?: unknown;
  readonly source?: unknown;
  readonly size?: unknown;
  readonly private?: unknown;
}

interface ArchiveMetadataRecord {
  readonly identifier?: unknown;
  readonly title?: unknown;
}

interface ArchiveMetadataPayload {
  readonly is_dark?: unknown;
  readonly metadata?: ArchiveMetadataRecord;
  readonly files?: unknown;
}

export interface ArchiveMediaSource {
  readonly url: string;
  readonly filename: string;
  readonly mimeType: "video/mp4";
  readonly format: string;
  readonly derivative: boolean;
  readonly sizeBytes: number | null;
}

export interface ArchiveMediaItem {
  readonly identifier: string;
  readonly title: string;
  readonly detailsUrl: string;
  readonly metadataUrl: string;
  readonly sources: readonly ArchiveMediaSource[];
}

export interface InternetArchiveAdapterOptions {
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

function textValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return textValue(value[0]);
  }
  return null;
}

function isPrivateFile(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

function encodeArchivePath(filename: string): string {
  return filename.split("/").map(encodeURIComponent).join("/");
}

function isSafeArchiveFilename(filename: string): boolean {
  return (
    !filename.includes("\\") &&
    filename
      .split("/")
      .every(
        (segment) => segment.length > 0 && segment !== "." && segment !== "..",
      )
  );
}

function formatRank(format: string): number {
  const normalized = format.toLowerCase();
  if (normalized.includes("h.264") || normalized.includes("h264")) {
    return 0;
  }
  if (normalized.includes("mpeg4") || normalized.includes("mpeg-4")) {
    return 1;
  }
  return 2;
}

function toMediaSource(
  identifier: string,
  record: ArchiveFileRecord,
): ArchiveMediaSource | null {
  const filename = textValue(record.name);
  if (
    !filename?.toLowerCase().endsWith(".mp4") ||
    !isSafeArchiveFilename(filename)
  ) {
    return null;
  }
  if (isPrivateFile(record.private)) {
    return null;
  }

  const format = textValue(record.format) ?? "MP4";
  const source = textValue(record.source);
  const parsedSize = Number(record.size);

  return {
    url: `${ARCHIVE_ORIGIN}/download/${encodeURIComponent(identifier)}/${encodeArchivePath(filename)}`,
    filename,
    mimeType: "video/mp4",
    format,
    derivative: source === "derivative",
    sizeBytes:
      Number.isFinite(parsedSize) && parsedSize >= 0 ? parsedSize : null,
  };
}

export function selectArchiveMediaSources(
  identifier: string,
  files: readonly unknown[],
): readonly ArchiveMediaSource[] {
  const sources = files
    .filter(
      (file): file is ArchiveFileRecord =>
        typeof file === "object" && file !== null,
    )
    .map((file) => toMediaSource(identifier, file))
    .filter((source): source is ArchiveMediaSource => source !== null);

  sources.sort(
    (left, right) =>
      formatRank(left.format) - formatRank(right.format) ||
      Number(right.derivative) - Number(left.derivative) ||
      (left.sizeBytes ?? Number.MAX_SAFE_INTEGER) -
        (right.sizeBytes ?? Number.MAX_SAFE_INTEGER) ||
      left.filename.localeCompare(right.filename, "sv"),
  );

  return sources;
}

function normalizeArchiveMetadata(
  identifier: string,
  payload: ArchiveMetadataPayload,
): ArchiveMediaItem {
  if (payload.is_dark === true || payload.is_dark === "true") {
    throw new ArchiveAdapterError(
      "ARCHIVE_ITEM_UNAVAILABLE",
      `Internet Archive-objektet "${identifier}" är inte publikt tillgängligt.`,
    );
  }
  if (!Array.isArray(payload.files)) {
    throw new ArchiveAdapterError(
      "ARCHIVE_INVALID_METADATA",
      `Internet Archive-objektet "${identifier}" saknar en giltig fillista.`,
    );
  }

  const sources = selectArchiveMediaSources(identifier, payload.files);
  if (sources.length === 0) {
    throw new ArchiveAdapterError(
      "ARCHIVE_NO_COMPATIBLE_MEDIA",
      `Internet Archive-objektet "${identifier}" saknar en publik MP4-fil.`,
    );
  }

  return {
    identifier,
    title: textValue(payload.metadata?.title) ?? identifier,
    detailsUrl: `${ARCHIVE_ORIGIN}/details/${encodeURIComponent(identifier)}`,
    metadataUrl: `${ARCHIVE_ORIGIN}/metadata/${encodeURIComponent(identifier)}`,
    sources,
  };
}

export class InternetArchiveAdapter {
  readonly #fetcher: typeof fetch;
  readonly #timeoutMs: number;

  constructor(options: InternetArchiveAdapterOptions = {}) {
    this.#fetcher = options.fetcher ?? fetch;
    this.#timeoutMs = options.timeoutMs ?? 8_000;
  }

  async resolve(
    identifier: string,
    parentSignal?: AbortSignal,
  ): Promise<ArchiveMediaItem> {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      throw new ArchiveAdapterError(
        "ARCHIVE_INVALID_IDENTIFIER",
        "Internet Archive-identifieraren har ett ogiltigt format.",
      );
    }
    if (parentSignal?.aborted) {
      throw new ArchiveAdapterError(
        "ARCHIVE_ABORTED",
        "Metadatahämtningen avbröts innan den startade.",
      );
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.#timeoutMs);
    const abortFromParent = () => controller.abort(parentSignal?.reason);
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });

    try {
      const metadataUrl = `${ARCHIVE_ORIGIN}/metadata/${encodeURIComponent(identifier)}`;
      const response = await this.#fetcher(metadataUrl, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ArchiveAdapterError(
          "ARCHIVE_HTTP_ERROR",
          `Internet Archive svarade med HTTP ${response.status}.`,
          response.status >= 500,
        );
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ArchiveAdapterError(
          "ARCHIVE_INVALID_METADATA",
          "Internet Archive returnerade metadata som inte kunde läsas.",
        );
      }

      if (typeof payload !== "object" || payload === null) {
        throw new ArchiveAdapterError(
          "ARCHIVE_INVALID_METADATA",
          "Internet Archive returnerade metadata i ett oväntat format.",
        );
      }

      return normalizeArchiveMetadata(
        identifier,
        payload as ArchiveMetadataPayload,
      );
    } catch (error) {
      if (error instanceof ArchiveAdapterError) {
        throw error;
      }
      if (parentSignal?.aborted) {
        throw new ArchiveAdapterError(
          "ARCHIVE_ABORTED",
          "Metadatahämtningen avbröts eftersom kanal eller program ändrades.",
        );
      }
      if (timedOut) {
        throw new ArchiveAdapterError(
          "ARCHIVE_TIMEOUT",
          "Internet Archive hann inte svara i tid.",
          true,
        );
      }
      throw new ArchiveAdapterError(
        "ARCHIVE_NETWORK_ERROR",
        "Internet Archive kunde inte nås.",
        true,
      );
    } finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }
}
