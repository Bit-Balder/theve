export type CrtMode = "off" | "subtle";

const CRT_STORAGE_KEY = "theve.crt";

export function resolveInitialCrtMode(
  storedMode: string | null,
  prefersReducedMotion: boolean,
): CrtMode {
  if (prefersReducedMotion) {
    return "off";
  }
  return storedMode === "off" ? "off" : "subtle";
}

function readStoredCrtMode(): string | null {
  try {
    return window.localStorage.getItem(CRT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function createTvShell(): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "tv-shell";
  setCrtMode(
    shell,
    resolveInitialCrtMode(readStoredCrtMode(), prefersReducedMotion()),
    false,
  );
  return shell;
}

export function setCrtMode(
  shell: HTMLElement,
  mode: CrtMode,
  persist = true,
): void {
  shell.dataset.crt = mode;
  if (!persist) {
    return;
  }
  try {
    window.localStorage.setItem(CRT_STORAGE_KEY, mode);
  } catch {
    // Inställningen fungerar under sessionen även när lagring är blockerad.
  }
}
