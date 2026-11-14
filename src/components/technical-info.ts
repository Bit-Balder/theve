export interface TechnicalInfoData {
  readonly version: string;
  readonly dataRevision: string;
  readonly sourceRevision: string;
}

export interface TechnicalInfoController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (data: TechnicalInfoData) => void;
  readonly close: () => void;
}

export interface TechnicalInfoOptions {
  readonly onRequestClose: () => void;
}

export function createTechnicalInfo(
  options: TechnicalInfoOptions,
): TechnicalInfoController {
  const root = document.createElement("section");
  root.className = "technical-info";
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "technical-info-title");

  const header = document.createElement("header");
  header.className = "technical-info__header";
  const heading = document.createElement("h2");
  heading.id = "technical-info-title";
  heading.textContent = "TEKNISK INFORMATION";
  const closeHint = document.createElement("span");
  closeHint.className = "numeric-text";
  closeHint.textContent = "BACK - STÄNG";
  header.append(heading, closeHint);

  const list = document.createElement("dl");
  list.className = "technical-info__list";
  root.append(header, list);

  let restoreTarget: HTMLElement | null = null;

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      options.onRequestClose();
    }
  });

  return {
    element: root,
    isOpen: () => !root.hidden,
    open(data) {
      restoreTarget =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const rows: readonly [string, string][] = [
        ["VERSION", data.version],
        ["DATAREVISION", data.dataRevision],
        ["KÄLLREVISION", data.sourceRevision],
        ["TIDSZON", "EUROPE/STOCKHOLM"],
        ["DISTRIBUTION", "GITHUB PAGES"],
      ];
      list.replaceChildren(
        ...rows.flatMap(([label, value]) => {
          const term = document.createElement("dt");
          term.textContent = label;
          const description = document.createElement("dd");
          description.className = "numeric-text";
          description.textContent = value;
          return [term, description];
        }),
      );
      root.hidden = false;
      root.focus();
    },
    close() {
      root.hidden = true;
      list.replaceChildren();
      restoreTarget?.focus();
      restoreTarget = null;
    },
  };
}
