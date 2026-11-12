import { createFocusMenu } from "./components/focus-menu";
import { createScreen43 } from "./components/screen43";
import { createTvShell, setCrtMode } from "./components/tv-shell";
import { project } from "./core/project";

export interface StartViewModel {
  readonly eyebrow: string;
  readonly title: string;
  readonly tagline: string;
  readonly stage: string;
  readonly timeLabel: string;
  readonly instruction: string;
}

export function createStartViewModel(): StartViewModel {
  return {
    eyebrow: "SVENSK FAMILJE-TV · FORMTEST",
    title: project.name,
    tagline: project.tagline,
    stage: project.stage,
    timeLabel: "20:45",
    instruction: "ANVÄND PILARNA OCH ENTER",
  };
}

function createBrand(): HTMLElement {
  const brand = document.createElement("div");
  brand.className = "brand";
  brand.setAttribute("aria-label", "Theve");

  const sun = document.createElement("span");
  sun.className = "brand__sun";
  sun.setAttribute("aria-hidden", "true");

  const lockup = document.createElement("span");
  lockup.className = "brand__lockup";

  const wordmark = document.createElement("span");
  wordmark.className = "brand__wordmark";
  wordmark.textContent = project.name;

  const lines = document.createElement("span");
  lines.className = "brand__lines";
  lines.setAttribute("aria-hidden", "true");
  for (const tone of ["yellow", "coral", "cream"] as const) {
    const line = document.createElement("span");
    line.className = `brand__line brand__line--${tone}`;
    lines.append(line);
  }

  lockup.append(wordmark, lines);
  brand.append(sun, lockup);

  return brand;
}

function createFocusProof(): HTMLElement {
  const section = document.createElement("section");
  section.className = "focus-proof";
  section.setAttribute("aria-labelledby", "focus-proof-title");

  const title = document.createElement("h2");
  title.id = "focus-proof-title";
  title.className = "focus-proof__title";
  title.textContent = "FOKUSRING · FÄRGPROV";

  const grid = document.createElement("div");
  grid.className = "focus-proof__grid";
  for (const sample of [
    ["blue", "TV-BLÅ"],
    ["black", "SVART"],
    ["yellow", "GUL"],
    ["coral", "KORALL"],
  ] as const) {
    const background = document.createElement("div");
    background.className = `focus-proof__sample focus-proof__sample--${sample[0]}`;

    const target = document.createElement("span");
    target.className = "focus-proof__target";
    target.textContent = sample[1];
    background.append(target);
    grid.append(background);
  }

  section.append(title, grid);
  return section;
}

export function mountStartView(
  root: HTMLElement,
  viewModel: StartViewModel = createStartViewModel(),
): void {
  const shell = createTvShell();
  const { screen, safeArea } = createScreen43();

  const topbar = document.createElement("header");
  topbar.className = "topbar";
  topbar.append(createBrand());

  const clock = document.createElement("p");
  clock.className = "topbar__clock numeric-text";
  clock.setAttribute("aria-label", `Formprov klockan ${viewModel.timeLabel}`);
  clock.textContent = viewModel.timeLabel;
  topbar.append(clock);

  const content = document.createElement("div");
  content.className = "start-layout";

  const intro = document.createElement("section");
  intro.className = "start-layout__intro";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = viewModel.eyebrow;

  const title = document.createElement("h1");
  title.className = "start-title";
  title.textContent = viewModel.title;

  const tagline = document.createElement("p");
  tagline.className = "start-tagline";
  tagline.textContent = viewModel.tagline;

  const stage = document.createElement("p");
  stage.className = "stage-label numeric-text";
  stage.textContent = viewModel.stage;

  intro.append(eyebrow, title, tagline, stage);

  const controls = document.createElement("section");
  controls.className = "start-layout__controls";
  controls.setAttribute("aria-labelledby", "menu-title");

  const menuTitle = document.createElement("h2");
  menuTitle.id = "menu-title";
  menuTitle.className = "menu-title";
  menuTitle.textContent = "TV-MENY";

  const status = document.createElement("p");
  status.className = "menu-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = viewModel.instruction;

  const menu = createFocusMenu({
    items: [
      { id: "start", label: "STARTA TV", hint: "ENTER" },
      { id: "focus", label: "VISA FOKUSPROV", hint: "PIL NED" },
      { id: "crt", label: "CRT · DISKRET", hint: "PÅ" },
    ],
    onAction: (action, button) => {
      if (action === "start") {
        status.textContent = "SÄNDNING OCH KANALER KOMMER I EN SENARE ETAPP";
      }

      if (action === "focus") {
        const proof = safeArea.querySelector<HTMLElement>(".focus-proof");
        proof?.classList.toggle("focus-proof--highlighted");
        status.textContent = "SAMMA FOKUSRING VISAS PÅ FYRA BAKGRUNDER";
      }

      if (action === "crt") {
        const nextMode = shell.dataset.crt === "subtle" ? "off" : "subtle";
        setCrtMode(shell, nextMode);
        const label = button.querySelector<HTMLElement>(".menu-button__label");
        const hint = button.querySelector<HTMLElement>(".menu-button__hint");
        if (label && hint) {
          label.textContent =
            nextMode === "subtle" ? "CRT · DISKRET" : "CRT · AV";
          hint.textContent = nextMode === "subtle" ? "PÅ" : "AV";
        }
        status.textContent =
          nextMode === "subtle"
            ? "DISKRET BILDRÖRSEFFEKT PÅ"
            : "BILDRÖRSEFFEKT AV";
      }
    },
  });

  controls.append(menuTitle, menu, status);
  content.append(intro, controls);
  safeArea.append(topbar, content, createFocusProof());
  screen.append(safeArea);
  shell.append(screen);
  root.replaceChildren(shell);

  requestAnimationFrame(() => {
    menu.querySelector<HTMLButtonElement>("button")?.focus();
  });
}
