import type { TeletextPage } from "../core/teletext";
import {
  findMunicipality,
  type Municipality,
  municipalitiesInRegion,
  REGIONS,
} from "../core/weather-places";

export interface TeletextOptions {
  readonly getPage: (number: string, channelName: string) => TeletextPage;
  readonly getFavorites?: () => readonly string[];
  readonly getSelectedMunicipalityId?: () => string | null;
  readonly onSelectMunicipality?: (municipality: Municipality) => void;
  readonly onToggleFavorite?: () => void;
}

export interface TeletextController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (channelName: string) => void;
  readonly close: () => void;
  readonly pushDigit: (digit: string) => void;
  readonly move: (direction: 1 | -1) => void;
  readonly confirm: () => void;
  readonly back: () => boolean;
  readonly refresh: () => void;
}

const ROWS = 24;
const COLUMNS = 40;
const VISIBLE_OPTIONS = 16;

function padded(value: string): string {
  return Array.from(value).slice(0, COLUMNS).join("").padEnd(COLUMNS);
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
  let pageNumber = "100";
  let listMode: "none" | "regions" | "municipalities" | "favorites" = "none";
  let selectedRegion = "";
  let selectedIndex = 0;

  function showRows(
    rows: readonly string[],
    status: TeletextPage["status"],
    activeRow = -1,
  ): void {
    root.dataset.pageNumber = pageNumber;
    root.dataset.status = status;
    grid.replaceChildren(
      ...rows.map((row, index) => {
        const line = document.createElement("p");
        line.className = "teletext__row";
        line.dataset.row = String(index + 1);
        if (index === 0) line.classList.add("teletext__row--header");
        if (index === 1) line.classList.add("teletext__row--title");
        if (index === rows.length - 1) {
          line.classList.add("teletext__row--footer");
        }
        if (index === activeRow) {
          line.classList.add("teletext__row--selected");
          line.setAttribute("aria-current", "true");
        }
        line.textContent = row;
        return line;
      }),
    );
  }

  function currentChoices(): readonly string[] {
    if (listMode === "regions") return REGIONS;
    if (listMode === "municipalities") {
      return municipalitiesInRegion(selectedRegion).map((place) => place.name);
    }
    if (listMode === "favorites") {
      return (options.getFavorites?.() ?? [])
        .map((id) => findMunicipality(id)?.name)
        .filter((name): name is string => Boolean(name));
    }
    return [];
  }

  function renderList(): void {
    const choices = currentChoices();
    const page = Math.floor(selectedIndex / VISIBLE_OPTIONS);
    const start = page * VISIBLE_OPTIONS;
    const slice = choices.slice(start, start + VISIBLE_OPTIONS);
    const title =
      listMode === "regions"
        ? "VÄLJ LÄN"
        : listMode === "municipalities"
          ? selectedRegion.toUpperCase()
          : "DINA VÄDERFAVORITER";
    const rows = [
      padded("THEVE TEXT-TV                  " + pageNumber),
      padded(title),
      padded("PIL UPP/NED VÄLJ  ENTER BEKRÄFTA"),
      padded(""),
      ...slice.map((name, index) =>
        padded(
          (start + index === selectedIndex ? "> " : "  ") + name.toUpperCase(),
        ),
      ),
    ];
    while (rows.length < ROWS - 1) rows.push(padded(""));
    rows.push(
      padded(
        choices.length === 0
          ? "INGA FAVORITER. 301 VÄLJ KOMMUN"
          : "SIDA " +
              (page + 1) +
              "/" +
              Math.ceil(choices.length / VISIBLE_OPTIONS) +
              "  BACK TILLBAKA",
      ),
    );
    showRows(
      rows,
      "ready",
      choices.length > 0 ? 4 + selectedIndex - start : -1,
    );
  }

  function renderPage(number: string): void {
    pageNumber = number;
    selectedIndex = 0;
    if (number === "301") {
      listMode = "regions";
      renderList();
      return;
    }
    if (number === "302") {
      listMode = "favorites";
      renderList();
      return;
    }
    listMode = "none";
    const page = options.getPage(number, channelName);
    showRows(page.rows, page.status);
  }

  function choose(): void {
    if (listMode === "regions") {
      selectedRegion = REGIONS[selectedIndex] ?? "";
      selectedIndex = 0;
      listMode = "municipalities";
      renderList();
      return;
    }
    if (listMode === "municipalities") {
      const place = municipalitiesInRegion(selectedRegion)[selectedIndex];
      if (place) {
        renderPage("300");
        options.onSelectMunicipality?.(place);
      }
      return;
    }
    if (listMode === "favorites") {
      const id = options.getFavorites?.()[selectedIndex];
      const place = id ? findMunicipality(id) : null;
      if (place) {
        renderPage("300");
        options.onSelectMunicipality?.(place);
      }
      return;
    }
    if (pageNumber === "300" && options.getSelectedMunicipalityId?.()) {
      options.onToggleFavorite?.();
      renderPage("300");
    }
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
      digits = (digits + digit).slice(-3);
      input.hidden = false;
      input.textContent = digits.padEnd(3, "_");
      if (digits.length === 3) {
        renderPage(digits);
        digits = "";
        input.hidden = true;
      }
    },
    move(direction) {
      const choices = currentChoices();
      if (choices.length === 0) return;
      selectedIndex =
        (selectedIndex + direction + choices.length) % choices.length;
      renderList();
    },
    confirm: choose,
    back() {
      if (listMode === "municipalities") {
        listMode = "regions";
        selectedIndex = Math.max(0, REGIONS.indexOf(selectedRegion));
        renderList();
        return true;
      }
      if (listMode === "regions" || listMode === "favorites") {
        renderPage("100");
        return true;
      }
      return false;
    },
    refresh() {
      if (!root.hidden) {
        if (listMode === "none") {
          const page = options.getPage(pageNumber, channelName);
          showRows(page.rows, page.status);
        } else {
          renderList();
        }
      }
    },
  };
}
