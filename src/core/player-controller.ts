import type { ArchiveMediaSource } from "./internet-archive";

export type PlayerPhase =
  | "idle"
  | "awaiting_user_action"
  | "loading"
  | "playing"
  | "reserve";

export interface PlayerState {
  readonly phase: PlayerPhase;
  readonly slotId: string | null;
  readonly sourceUrl: string | null;
  readonly attemptedSources: number;
  readonly offsetSeconds: number | null;
  readonly errorCode: string | null;
  readonly message: string;
}

export interface PlayerRequest {
  readonly slotId: string;
  readonly offsetMs: number;
  readonly sources: readonly ArchiveMediaSource[];
}

export interface MediaElementPort extends EventTarget {
  src: string;
  currentTime: number;
  readonly duration: number;
  preload: string;
  muted: boolean;
  load(): void;
  pause(): void;
  play(): Promise<void>;
  removeAttribute(name: string): void;
}

export interface PlayerControllerOptions {
  readonly loadTimeoutMs?: number;
  readonly onStateChange?: (state: PlayerState) => void;
}

interface ActiveRun {
  readonly generation: number;
  readonly request: PlayerRequest;
  readonly sourceIndex: number;
}

const idleState: PlayerState = {
  phase: "idle",
  slotId: null,
  sourceUrl: null,
  attemptedSources: 0,
  offsetSeconds: null,
  errorCode: null,
  message: "Spelaren väntar på en tablåslot.",
};

function isNotAllowedError(error: unknown): boolean {
  return error instanceof Error && error.name === "NotAllowedError";
}

export function clampMediaOffset(
  offsetMs: number,
  durationSeconds: number,
): number {
  if (!Number.isFinite(offsetMs) || offsetMs <= 0) {
    return 0;
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  const finalPlayablePosition = Math.max(0, durationSeconds - 0.05);
  return Math.min(offsetMs / 1_000, finalPlayablePosition);
}

export class PlayerController {
  readonly #media: MediaElementPort;
  readonly #loadTimeoutMs: number;
  readonly #onStateChange?: (state: PlayerState) => void;
  readonly #handlePlayingError: () => void;
  #activated = false;
  #generation = 0;
  #abortController: AbortController | null = null;
  #pendingRequest: PlayerRequest | null = null;
  #activeRun: ActiveRun | null = null;
  #state: PlayerState = idleState;

  constructor(media: MediaElementPort, options: PlayerControllerOptions = {}) {
    this.#media = media;
    this.#loadTimeoutMs = options.loadTimeoutMs ?? 10_000;
    this.#onStateChange = options.onStateChange;
    this.#handlePlayingError = () => {
      if (this.#state.phase !== "playing" || !this.#activeRun) {
        return;
      }
      const run = this.#activeRun;
      const currentOffsetMs = Number.isFinite(this.#media.currentTime)
        ? this.#media.currentTime * 1_000
        : run.request.offsetMs;
      void this.#startRun(
        {
          ...run.request,
          offsetMs: Math.max(run.request.offsetMs, currentOffsetMs),
        },
        run.sourceIndex + 1,
      );
    };
    this.#media.addEventListener("error", this.#handlePlayingError);
  }

  get state(): PlayerState {
    return this.#state;
  }

  get activated(): boolean {
    return this.#activated;
  }

  async activate(): Promise<PlayerState> {
    this.#activated = true;
    const pending = this.#pendingRequest;
    if (!pending) {
      return this.#state;
    }
    return this.#startRun(pending, 0);
  }

  async playSlot(request: PlayerRequest): Promise<PlayerState> {
    this.#cancelCurrentLoad();
    this.#pendingRequest = request;

    if (!this.#activated) {
      return this.#setState({
        phase: "awaiting_user_action",
        slotId: request.slotId,
        sourceUrl: null,
        attemptedSources: 0,
        offsetSeconds: null,
        errorCode: "PLAYER_USER_ACTION_REQUIRED",
        message: "Tryck på Starta TV för att tillåta uppspelning med ljud.",
      });
    }

    return this.#startRun(request, 0);
  }

  showReserve(
    slotId: string,
    errorCode: string,
    message = "Programmet kan inte visas. Kanalens reservbild används.",
  ): PlayerState {
    this.#cancelCurrentLoad();
    this.#pendingRequest = null;
    return this.#setState({
      phase: "reserve",
      slotId,
      sourceUrl: null,
      attemptedSources: 0,
      offsetSeconds: null,
      errorCode,
      message,
    });
  }

  stop(): PlayerState {
    this.#cancelCurrentLoad();
    this.#pendingRequest = null;
    return this.#setState(idleState);
  }

  destroy(): void {
    this.stop();
    this.#media.removeEventListener("error", this.#handlePlayingError);
  }

  async #startRun(
    request: PlayerRequest,
    firstSourceIndex: number,
  ): Promise<PlayerState> {
    this.#cancelCurrentLoad();
    const generation = ++this.#generation;
    const abortController = new AbortController();
    this.#abortController = abortController;
    this.#pendingRequest = request;

    for (
      let sourceIndex = firstSourceIndex;
      sourceIndex < request.sources.length;
      sourceIndex += 1
    ) {
      if (generation !== this.#generation || abortController.signal.aborted) {
        return this.#state;
      }

      const source = request.sources[sourceIndex];
      this.#activeRun = { generation, request, sourceIndex };
      this.#setState({
        phase: "loading",
        slotId: request.slotId,
        sourceUrl: source.url,
        attemptedSources: sourceIndex + 1,
        offsetSeconds: null,
        errorCode: null,
        message:
          sourceIndex === 0
            ? "Laddar programmet."
            : "Provar en alternativ mediefil.",
      });

      try {
        await this.#loadMetadata(source, abortController.signal);
        if (generation !== this.#generation || abortController.signal.aborted) {
          return this.#state;
        }

        const offsetSeconds = clampMediaOffset(
          request.offsetMs,
          this.#media.duration,
        );
        this.#media.currentTime = offsetSeconds;

        try {
          await this.#media.play();
        } catch (error) {
          if (isNotAllowedError(error)) {
            this.#activated = false;
            return this.#setState({
              phase: "awaiting_user_action",
              slotId: request.slotId,
              sourceUrl: source.url,
              attemptedSources: sourceIndex + 1,
              offsetSeconds,
              errorCode: "PLAYER_USER_ACTION_REQUIRED",
              message: "Webbläsaren kräver att Starta TV används igen.",
            });
          }
          throw error;
        }

        this.#pendingRequest = null;
        return this.#setState({
          phase: "playing",
          slotId: request.slotId,
          sourceUrl: source.url,
          attemptedSources: sourceIndex + 1,
          offsetSeconds,
          errorCode: null,
          message: "Programmet spelas.",
        });
      } catch {
        if (generation !== this.#generation || abortController.signal.aborted) {
          return this.#state;
        }
      }
    }

    this.#pendingRequest = null;
    this.#activeRun = null;
    this.#clearMedia();
    return this.#setState({
      phase: "reserve",
      slotId: request.slotId,
      sourceUrl: null,
      attemptedSources: request.sources.length,
      offsetSeconds: null,
      errorCode: "PLAYER_SOURCES_EXHAUSTED",
      message: "Alla godkända mediefiler misslyckades. Visar reservbild.",
    });
  }

  #loadMetadata(
    source: ArchiveMediaSource,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timeout);
        this.#media.removeEventListener("loadedmetadata", onLoaded);
        this.#media.removeEventListener("error", onError);
        signal.removeEventListener("abort", onAbort);
      };
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("MEDIA_LOAD_ERROR"));
      };
      const onAbort = () => {
        cleanup();
        reject(new Error("MEDIA_LOAD_ABORTED"));
      };
      timeout = setTimeout(() => {
        cleanup();
        reject(new Error("MEDIA_LOAD_TIMEOUT"));
      }, this.#loadTimeoutMs);

      this.#media.addEventListener("loadedmetadata", onLoaded, { once: true });
      this.#media.addEventListener("error", onError, { once: true });
      signal.addEventListener("abort", onAbort, { once: true });
      this.#media.preload = "metadata";
      this.#media.src = source.url;
      this.#media.load();
    });
  }

  #cancelCurrentLoad(): void {
    this.#generation += 1;
    this.#abortController?.abort();
    this.#abortController = null;
    this.#activeRun = null;
    this.#clearMedia();
  }

  #clearMedia(): void {
    this.#media.pause();
    this.#media.removeAttribute("src");
    this.#media.load();
  }

  #setState(state: PlayerState): PlayerState {
    this.#state = state;
    this.#onStateChange?.(state);
    return state;
  }
}
