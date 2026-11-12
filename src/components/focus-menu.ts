import { getNextFocusIndex, isNavigationKey } from "../core/focus-navigation";

export interface FocusMenuItem {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
}

export interface FocusMenuOptions {
  readonly items: readonly FocusMenuItem[];
  readonly onAction: (id: string, button: HTMLButtonElement) => void;
}

export function createFocusMenu(options: FocusMenuOptions): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "focus-menu";

  const buttons = options.items.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-button focus-control";
    button.dataset.action = item.id;

    const label = document.createElement("span");
    label.className = "menu-button__label";
    label.textContent = item.label;

    const hint = document.createElement("span");
    hint.className = "menu-button__hint numeric-text";
    hint.textContent = item.hint;

    button.append(label, hint);
    button.addEventListener("click", () => options.onAction(item.id, button));
    menu.append(button);
    return button;
  });

  menu.addEventListener("keydown", (event) => {
    if (!isNavigationKey(event.key)) {
      return;
    }

    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();
    buttons[getNextFocusIndex(currentIndex, event.key, buttons.length)].focus();
  });

  return menu;
}
