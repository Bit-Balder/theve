import {
  ArchiveAdapterError,
  type InternetArchiveAdapter,
} from "./internet-archive";
import type { PlayerController, PlayerState } from "./player-controller";

export interface ArchivePlaybackRequest {
  readonly slotId: string;
  readonly archiveIdentifier: string;
  readonly offsetMs: number;
}

export class ArchivePlaybackService {
  readonly #adapter: InternetArchiveAdapter;
  readonly #player: PlayerController;
  #generation = 0;
  #metadataAbort: AbortController | null = null;

  constructor(adapter: InternetArchiveAdapter, player: PlayerController) {
    this.#adapter = adapter;
    this.#player = player;
  }

  activate(): Promise<PlayerState> {
    return this.#player.activate();
  }

  async tune(request: ArchivePlaybackRequest): Promise<PlayerState> {
    this.#metadataAbort?.abort();
    const generation = ++this.#generation;
    const controller = new AbortController();
    this.#metadataAbort = controller;
    this.#player.stop();

    try {
      const item = await this.#adapter.resolve(
        request.archiveIdentifier,
        controller.signal,
      );
      if (generation !== this.#generation) {
        return this.#player.state;
      }
      return this.#player.playSlot({
        slotId: request.slotId,
        offsetMs: request.offsetMs,
        sources: item.sources,
      });
    } catch (error) {
      if (generation !== this.#generation) {
        return this.#player.state;
      }
      if (
        error instanceof ArchiveAdapterError &&
        error.code === "ARCHIVE_ABORTED"
      ) {
        return this.#player.state;
      }
      const errorCode =
        error instanceof ArchiveAdapterError
          ? error.code
          : "ARCHIVE_UNKNOWN_ERROR";
      return this.#player.showReserve(
        request.slotId,
        errorCode,
        "Programkällan kunde inte laddas. Visar reservbild till nästa slot.",
      );
    }
  }

  stop(): PlayerState {
    this.#generation += 1;
    this.#metadataAbort?.abort();
    this.#metadataAbort = null;
    return this.#player.stop();
  }
}
