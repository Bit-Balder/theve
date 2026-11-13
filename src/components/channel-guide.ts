import { getNextFocusIndex } from "../core/focus-navigation";

export interface ChannelGuideEntry {
  readonly channelId: string;
  readonly number: number;
  readonly name: string;
  readonly logoSrc: string;
  readonly now: string;
  readonly next: string;
}

export interface ChannelGuideOptions {
  readonly onTune: (channelId: string) => void;
  readonly onRequestClose: () => void;
}

export interface ChannelGuideController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (
    entries: readonly ChannelGuideEntry[],
    currentChannelId: string,
  ) => void;
  readonly close: () => void;
}

export function createChannelGuide(
  options: ChannelGuideOptions,
): ChannelGuideController {
  const guide = document.createElement("section");
  guide.className = "channel-guide";
  guide.hidden = true;
  guide.setAttribute("role", "dialog");
  guide.setAttribute("aria-modal", "true");
  guide.setAttribute("aria-labelledby", "channel-guide-title");

  const header = document.createElement("header");
  header.className = "channel-guide__header";

  const heading = document.createElement("h2");
  heading.id = "channel-guide-title";
  heading.textContent = "PROGRAMGUIDE";

  const closeHint = document.createElement("span");
  closeHint.className = "channel-guide__close-hint numeric-text";
  closeHint.textContent = "BACK · STÄNG";
  header.append(heading, closeHint);

  const columns = document.createElement("div");
  columns.className = "channel-guide__columns";
  for (const label of ["KANAL", "NU", "NÄSTA"]) {
    const cell = document.createElement("span");
    cell.textContent = label;
    columns.append(cell);
  }

  const rows = document.createElement("div");
  rows.className = "channel-guide__rows";
  guide.append(header, columns, rows);

  let buttons: HTMLButtonElement[] = [];
  let restoreTarget: HTMLElement | null = null;

  rows.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      options.onRequestClose();
      return;
    }
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      return;
    }

    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    if (currentIndex < 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = getNextFocusIndex(
      currentIndex,
      event.key as "ArrowUp" | "ArrowDown" | "Home" | "End",
      buttons.length,
    );
    buttons[nextIndex]?.focus();
  });

  return {
    element: guide,
    isOpen: () => !guide.hidden,
    open(entries, currentChannelId) {
      restoreTarget =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      buttons = entries.map((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "channel-guide__row focus-control";
        button.dataset.channelId = entry.channelId;
        button.tabIndex = -1;
        button.setAttribute(
          "aria-label",
          `Byt till kanal ${entry.number}, ${entry.name}. Nu: ${entry.now}. Nästa: ${entry.next}.`,
        );

        const channel = document.createElement("span");
        channel.className = "channel-guide__channel";
        const logo = document.createElement("img");
        logo.className = "channel-guide__logo";
        logo.src = entry.logoSrc;
        logo.alt = "";
        const number = document.createElement("span");
        number.className = "channel-guide__number numeric-text";
        number.textContent = String(entry.number).padStart(2, "0");
        const name = document.createElement("span");
        name.textContent = entry.name;
        channel.append(logo, number, name);

        const now = document.createElement("span");
        now.className = "channel-guide__now";
        now.textContent = entry.now;

        const next = document.createElement("span");
        next.className = "channel-guide__next";
        next.textContent = entry.next;

        button.append(channel, now, next);
        button.addEventListener("click", () => {
          options.onTune(entry.channelId);
          options.onRequestClose();
        });
        return button;
      });
      rows.replaceChildren(...buttons);
      guide.hidden = false;

      const selectedIndex = Math.max(
        0,
        entries.findIndex((entry) => entry.channelId === currentChannelId),
      );
      buttons[selectedIndex].tabIndex = 0;
      buttons[selectedIndex].focus();
    },
    close() {
      guide.hidden = true;
      buttons = [];
      rows.replaceChildren();
      restoreTarget?.focus();
      restoreTarget = null;
    },
  };
}
