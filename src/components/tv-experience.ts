export interface TvExperienceElements {
  readonly root: HTMLElement;
  readonly picture: HTMLElement;
  readonly identLogo: HTMLImageElement;
  readonly offAirCard: HTMLImageElement;
  readonly pictureLabel: HTMLElement;
  readonly channelBug: HTMLElement;
  readonly channelLogo: HTMLImageElement;
  readonly banner: HTMLElement;
  readonly bannerProgram: HTMLElement;
  readonly bannerNext: HTMLElement;
  readonly numberBuffer: HTMLElement;
  readonly status: HTMLElement;
  readonly txtButton: HTMLButtonElement;
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
  channelBug.append(channelLogo);

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
    "PIL UPP/NED - KANAL  -  G - GUIDE  -  T - TEXT-TV  -  0–9 - DIREKT";

  const txtButton = document.createElement("button");
  txtButton.type = "button";
  txtButton.className = "txt-button focus-control";
  txtButton.textContent = "TXT";
  txtButton.setAttribute("aria-label", "Öppna Text-TV");

  root.append(picture, channelBug, banner, numberBuffer, txtButton, status);

  return {
    root,
    picture,
    identLogo,
    offAirCard,
    pictureLabel,
    channelBug,
    channelLogo,
    banner,
    bannerProgram,
    bannerNext,
    numberBuffer,
    status,
    txtButton,
  };
}
