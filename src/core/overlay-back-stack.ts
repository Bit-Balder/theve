export interface OverlayEntry {
  readonly id: string;
  readonly close: () => void;
}

export class OverlayBackStack {
  readonly #entries: OverlayEntry[] = [];

  get size(): number {
    return this.#entries.length;
  }

  push(entry: OverlayEntry): void {
    const existingIndex = this.#entries.findIndex(
      (candidate) => candidate.id === entry.id,
    );
    if (existingIndex >= 0) {
      this.#entries.splice(existingIndex, 1);
    }
    this.#entries.push(entry);
  }

  remove(id: string): void {
    const index = this.#entries.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      this.#entries.splice(index, 1);
    }
  }

  back(): boolean {
    const entry = this.#entries.pop();
    if (!entry) {
      return false;
    }
    entry.close();
    return true;
  }

  clear(): void {
    while (this.back()) {
      // Close from the top until no overlay remains.
    }
  }
}
