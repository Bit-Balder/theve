interface TeletextPage {
  readonly number: string;
  readonly title: string;
  readonly rows: readonly string[];
}

const pages: Readonly<Record<string, TeletextPage>> = {
  "100": {
    number: "100",
    title: "THEVE TEXT-TV",
    rows: [
      "300  PROGRAM OCH KANALER",
      "301  PÅGÅR JUST NU",
      "400  BARN OCH FAMILJ",
      "500  HJÄLP OCH STYRNING",
      "",
      "Skriv tre siffror för att välja sida.",
    ],
  },
  "300": {
    number: "300",
    title: "PROGRAM OCH KANALER",
    rows: [
      "01 TV1   NYHETER OCH KULTUR",
      "02 TV2   POLITIK OCH SAMHÄLLE",
      "03 TV3   SERIER",
      "04 TV4   NÖJE OCH MUSIK",
      "05 TV5   FILM",
      "06 TV6   TECKNAT",
      "07 TV7   TRUE CRIME",
      "08 BARN  BARNPROGRAM",
      "09 NATUR NATUR OCH DJUR",
    ],
  },
  "301": {
    number: "301",
    title: "PÅGÅR JUST NU",
    rows: [
      "Programuppgifter hämtas från den linjära tablån.",
      "Tryck G efter att du stängt Text-TV för NU/NÄSTA.",
      "",
      "Framtida program kan inte startas i förtid.",
    ],
  },
  "400": {
    number: "400",
    title: "BARN OCH FAMILJ",
    rows: [
      "BARN SÄNDER 06.00–19.00",
      "18.55  GODNATTVINJETT",
      "19.00  SÄNDNINGSUPPEHÅLL",
      "06.00  MORGONSÄNDNING",
    ],
  },
  "500": {
    number: "500",
    title: "HJÄLP OCH STYRNING",
    rows: [
      "T / TXT    ÖPPNA ELLER STÄNG",
      "0–9        VÄLJ TRESIFFRIG SIDA",
      "BACK / ESC TILLBAKA TILL TV",
      "G          PROGRAMGUIDE I TV-LÄGET",
    ],
  },
};

export interface TeletextController {
  readonly element: HTMLElement;
  readonly isOpen: () => boolean;
  readonly open: (channelName: string) => void;
  readonly close: () => void;
  readonly pushDigit: (digit: string) => void;
}

export function createTeletext(): TeletextController {
  const root = document.createElement("section");
  root.className = "teletext";
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Theve Text-TV");

  const header = document.createElement("header");
  header.className = "teletext__header";
  const service = document.createElement("strong");
  service.textContent = "THEVE TEXT-TV";
  const context = document.createElement("span");
  context.className = "teletext__context";
  const pageNumber = document.createElement("span");
  pageNumber.className = "teletext__page numeric-text";
  header.append(service, context, pageNumber);

  const title = document.createElement("h2");
  title.className = "teletext__title";
  const content = document.createElement("div");
  content.className = "teletext__content";
  const input = document.createElement("output");
  input.className = "teletext__input numeric-text";
  input.hidden = true;
  input.setAttribute("aria-live", "assertive");
  const footer = document.createElement("p");
  footer.className = "teletext__footer";
  footer.textContent =
    "100 START · 300 PROGRAM · 400 BARN · 500 HJÄLP · BACK TV";
  root.append(header, title, content, input, footer);

  let digits = "";
  let restoreTarget: HTMLElement | null = null;

  function renderPage(number: string): void {
    const page = pages[number];
    pageNumber.textContent = number;
    title.textContent = page?.title ?? "SIDAN FINNS INTE";
    const rows = page?.rows ?? ["Välj 100 för Text-TV:s startsida."];
    content.replaceChildren(
      ...rows.map((row) => {
        const line = document.createElement("p");
        line.textContent = row || "\u00A0";
        return line;
      }),
    );
  }

  return {
    element: root,
    isOpen: () => !root.hidden,
    open(channelName) {
      restoreTarget =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      context.textContent = `FRÅN ${channelName.toUpperCase()}`;
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
