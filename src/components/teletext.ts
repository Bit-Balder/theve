import type { TeletextPage } from "../core/teletext";

export interface TeletextOptions {
  readonly getPage: (number: string, channelName: string) => TeletextPage;
}

export interface TeletextController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (channelName: string) => void;
  readonly close: () => void;
  readonly pushDigit: (digit: string) => void;
}

export function createTeletext(options: TeletextOptions): TeletextController {
  const root = document.createElement("section");
  root.className = "teletext";
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Theve Text-TV");

  const grid = document.createElement("div");
  grid.className = "teletext__grid";
  grid.setAttribute("role", "document");
  const input = document.createElement("output");
  input.className = "teletext__input numeric-text";
  input.hidden = true;
  input.setAttribute("aria-live", "assertive");
  root.append(grid, input);

  let digits = "";
  let channelName = "";
  let restoreTarget: HTMLElement | null = null;

  function renderPage(number: string): void {
    const page = options.getPage(number, channelName);
    root.dataset.pageNumber = page.number;
    root.dataset.status = page.status;
    grid.replaceChildren(
      ...page.rows.map((row, index) => {
        const line = document.createElement("p");
        line.className = "teletext__row";
        line.dataset.row = String(index + 1);
        if (index === 0) line.classList.add("teletext__row--header");
        if (index === 1) line.classList.add("teletext__row--title");
        if (index === page.rows.length - 1) {
          line.classList.add("teletext__row--footer");
        }
        line.textContent = row;
        return line;
      }),
    );
  }

  return {
    element: root,
    isOpen: () => !root.hidden,
    open(nextChannelName) {
      restoreTarget =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      channelName = nextChannelName;
      digits = "";
      input.hidden = true;
      renderPage("100");
      root.hidden = false;
      root.focus();
    },
    close() {
      root.hidden = true;
      digits = "";
      input.hidden = true;
      restoreTarget?.focus();
      restoreTarget = null;
    },
    pushDigit(digit) {
      digits = `${digits}${digit}`.slice(-3);
      input.hidden = false;
      input.textContent = digits.padEnd(3, "_");
      if (digits.length === 3) {
        renderPage(digits);
        digits = "";
        input.hidden = true;
      }
    },
  };
}
