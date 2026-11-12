export interface DirectNumberBufferOptions {
  readonly timeoutMs?: number;
  readonly maxDigits?: number;
  readonly onChange: (digits: string) => void;
  readonly onCommit: (channelNumber: number) => void;
}

export class DirectNumberBuffer {
  readonly #timeoutMs: number;
  readonly #maxDigits: number;
  readonly #onChange: (digits: string) => void;
  readonly #onCommit: (channelNumber: number) => void;
  #digits = "";
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: DirectNumberBufferOptions) {
    this.#timeoutMs = options.timeoutMs ?? 1_200;
    this.#maxDigits = options.maxDigits ?? 3;
    this.#onChange = options.onChange;
    this.#onCommit = options.onCommit;
  }

  get digits(): string {
    return this.#digits;
  }

  push(digit: string): void {
    if (!/^\d$/.test(digit)) {
      return;
    }

    this.#digits = `${this.#digits}${digit}`.slice(-this.#maxDigits);
    this.#onChange(this.#digits);
    this.#restartTimer();
  }

  confirm(): boolean {
    if (!this.#digits) {
      return false;
    }

    const channelNumber = Number(this.#digits);
    this.clear();
    this.#onCommit(channelNumber);
    return true;
  }

  clear(): void {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#digits = "";
    this.#onChange("");
  }

  destroy(): void {
    this.clear();
  }

  #restartTimer(): void {
    if (this.#timer) {
      clearTimeout(this.#timer);
    }
    this.#timer = setTimeout(() => this.confirm(), this.#timeoutMs);
  }
}
