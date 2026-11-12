import { project } from "./core/project";

export interface StartViewModel {
  readonly eyebrow: string;
  readonly title: string;
  readonly tagline: string;
  readonly stage: string;
  readonly status: string;
  readonly description: string;
}

export function createStartViewModel(): StartViewModel {
  return {
    eyebrow: "THEVE PROJEKTGRUND",
    title: project.name,
    tagline: project.tagline,
    stage: project.stage,
    status: project.status,
    description:
      "Design, kanaler och innehåll byggs stegvis från en liten och testbar grund.",
  };
}

function addTextElement(
  parent: HTMLElement,
  tagName: "p" | "h1",
  className: string,
  text: string,
): void {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

export function mountStartView(
  root: HTMLElement,
  viewModel: StartViewModel = createStartViewModel(),
): void {
  const screen = document.createElement("section");
  screen.className = "start-view";
  screen.setAttribute("aria-labelledby", "theve-title");

  addTextElement(screen, "p", "start-view__eyebrow", viewModel.eyebrow);
  addTextElement(screen, "h1", "start-view__title", viewModel.title);
  screen.querySelector("h1")?.setAttribute("id", "theve-title");
  addTextElement(screen, "p", "start-view__tagline", viewModel.tagline);

  const status = document.createElement("div");
  status.className = "start-view__status";
  status.setAttribute("aria-label", "Projektstatus");
  addTextElement(status, "p", "start-view__stage", viewModel.stage);
  addTextElement(status, "p", "start-view__badge", viewModel.status);
  screen.append(status);

  addTextElement(screen, "p", "start-view__description", viewModel.description);

  root.replaceChildren(screen);
}
