export type CrtMode = "off" | "subtle";

export function createTvShell(): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "tv-shell";
  setCrtMode(shell, "subtle");
  return shell;
}

export function setCrtMode(shell: HTMLElement, mode: CrtMode): void {
  shell.dataset.crt = mode;
}
