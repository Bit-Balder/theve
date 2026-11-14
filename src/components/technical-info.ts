export interface TechnicalInfoData {
  readonly version: string;
  readonly dataRevision: string;
  readonly sourceRevision: string;
  readonly crtEnabled: boolean;
}

export interface TechnicalInfoController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (data: TechnicalInfoData) => void;
  readonly close: () => void;
}

export interface TechnicalInfoOptions {
  readonly onRequestClose: () => void;
  readonly onToggleCrt: () => boolean;
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

  const settings = document.createElement("section");
  settings.className = "technical-info__settings";
  const settingsHeading = document.createElement("h3");
  settingsHeading.textContent = "BILDINSTÄLLNINGAR";
  const crtButton = document.createElement("button");
  crtButton.type = "button";
  crtButton.className = "technical-info__crt-button focus-control";
  crtButton.setAttribute("aria-label", "Växla bildrörseffekt");
  const setCrtLabel = (enabled: boolean) => {
    crtButton.textContent = enabled ? "CRT - PÅ" : "CRT - AV";
    crtButton.setAttribute("aria-pressed", String(enabled));
  };
  crtButton.addEventListener("click", () => {
    setCrtLabel(options.onToggleCrt());
  });
  settings.append(settingsHeading, crtButton);
  root.append(header, list, settings);

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
      setCrtLabel(data.crtEnabled);
      root.hidden = false;
      crtButton.focus();
    },
    close() {
      root.hidden = true;
      list.replaceChildren();
      restoreTarget?.focus();
      restoreTarget = null;
    },
  };
}
