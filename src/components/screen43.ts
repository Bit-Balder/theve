export interface Screen43Elements {
  readonly screen: HTMLElement;
  readonly safeArea: HTMLElement;
}

export function createScreen43(): Screen43Elements {
  const screen = document.createElement("main");
  screen.className = "screen43";
  screen.setAttribute("aria-label", "Theves TV-yta i formatet fyra gånger tre");

  const safeArea = document.createElement("div");
  safeArea.className = "screen43__safe-area";

  return { screen, safeArea };
}
