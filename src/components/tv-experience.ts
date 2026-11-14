export interface TvExperienceElements {
  readonly root: HTMLElement;
  readonly picture: HTMLElement;
  readonly identLogo: HTMLImageElement;
  readonly offAirCard: HTMLImageElement;
  readonly pictureLabel: HTMLElement;
  readonly channelBug: HTMLElement;
  readonly channelLogo: HTMLImageElement;
  readonly channelLabel: HTMLElement;
  readonly banner: HTMLElement;
  readonly bannerProgram: HTMLElement;
  readonly bannerNext: HTMLElement;
  readonly numberBuffer: HTMLElement;
  readonly status: HTMLElement;
  readonly guideButton: HTMLButtonElement;
  readonly txtButton: HTMLButtonElement;
  readonly crtButton: HTMLButtonElement;
  readonly infoButton: HTMLButtonElement;
}

export function createTvExperience(): TvExperienceElements {
  const root = document.createElement("section");
  root.className = "tv-experience";
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute("aria-label", "Theve sändning");

  const picture = document.createElement("div");
  picture.className = "tv-experience__picture";

  const identLogo = document.createElement("img");
  identLogo.className = "tv-experience__ident-logo";
  identLogo.alt = "";

  const offAirCard = document.createElement("img");
  offAirCard.className = "tv-experience__off-air-card";
  offAirCard.hidden = true;

  const pictureLabel = document.createElement("p");
  pictureLabel.className = "tv-experience__picture-label";
  pictureLabel.textContent = "RESERVBILD";
  picture.append(identLogo, offAirCard, pictureLabel);

  const channelBug = document.createElement("aside");
  channelBug.className = "channel-bug";
  channelBug.setAttribute("aria-label", "Aktuell kanal");

  const channelLogo = document.createElement("img");
  channelLogo.className = "channel-bug__logo";
  const channelLabel = document.createElement("span");
  channelLabel.className = "channel-bug__label numeric-text";
  channelBug.append(channelLogo, channelLabel);

  const banner = document.createElement("aside");
  banner.className = "program-banner";
  banner.setAttribute("aria-live", "polite");

  const bannerProgram = document.createElement("strong");
  bannerProgram.className = "program-banner__program";
  const bannerNext = document.createElement("span");
  bannerNext.className = "program-banner__next";
  banner.append(bannerProgram, bannerNext);

  const numberBuffer = document.createElement("output");
  numberBuffer.className = "direct-number numeric-text";
  numberBuffer.hidden = true;
  numberBuffer.setAttribute("aria-live", "assertive");

  const status = document.createElement("p");
  status.className = "tv-experience__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent =
    "PIL UPP/NED - KANAL  -  G - GUIDE  -  T - TEXT-TV  -  I - INFO";

  const actions = document.createElement("nav");
  actions.className = "tv-actions";
  actions.setAttribute("aria-label", "TV-funktioner");

  const guideButton = document.createElement("button");
  guideButton.type = "button";
  guideButton.className = "tv-action-button guide-button focus-control";
  guideButton.textContent = "GUIDE";
  guideButton.setAttribute("aria-label", "Öppna programguide");

  const txtButton = document.createElement("button");
  txtButton.type = "button";
  txtButton.className = "tv-action-button txt-button focus-control";
  txtButton.textContent = "TXT";
  txtButton.setAttribute("aria-label", "Öppna Text-TV");

  const crtButton = document.createElement("button");
  crtButton.type = "button";
  crtButton.className = "tv-action-button crt-button focus-control";
  crtButton.textContent = "CRT";
  crtButton.setAttribute("aria-label", "Växla bildrörseffekt");

  const infoButton = document.createElement("button");
  infoButton.type = "button";
  infoButton.className = "tv-action-button info-button focus-control";
  infoButton.textContent = "INFO";
  infoButton.setAttribute("aria-label", "Öppna teknisk information");
  actions.append(guideButton, txtButton, crtButton, infoButton);

  root.append(picture, channelBug, banner, numberBuffer, actions, status);

  return {
    root,
    picture,
    identLogo,
    offAirCard,
    pictureLabel,
    channelBug,
    channelLogo,
    channelLabel,
    banner,
    bannerProgram,
    bannerNext,
    numberBuffer,
    status,
    guideButton,
    txtButton,
    crtButton,
    infoButton,
  };
}
