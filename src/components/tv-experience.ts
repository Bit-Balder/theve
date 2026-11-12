export interface TvExperienceElements {
  readonly root: HTMLElement;
  readonly picture: HTMLElement;
  readonly pictureLabel: HTMLElement;
  readonly channelBug: HTMLElement;
  readonly channelNumber: HTMLElement;
  readonly channelName: HTMLElement;
  readonly banner: HTMLElement;
  readonly bannerProgram: HTMLElement;
  readonly bannerNext: HTMLElement;
  readonly numberBuffer: HTMLElement;
  readonly status: HTMLElement;
}

export function createTvExperience(): TvExperienceElements {
  const root = document.createElement("section");
  root.className = "tv-experience";
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute("aria-label", "Theve sändning");

  const picture = document.createElement("div");
  picture.className = "tv-experience__picture";

  const pictureLabel = document.createElement("p");
  pictureLabel.className = "tv-experience__picture-label";
  pictureLabel.textContent = "RESERVBILD";
  picture.append(pictureLabel);

  const channelBug = document.createElement("aside");
  channelBug.className = "channel-bug";
  channelBug.setAttribute("aria-label", "Aktuell kanal");

  const channelNumber = document.createElement("span");
  channelNumber.className = "channel-bug__number numeric-text";
  const channelName = document.createElement("span");
  channelName.className = "channel-bug__name";
  channelBug.append(channelNumber, channelName);

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
  status.textContent = "PIL UPP/NED · KANAL  ·  G · GUIDE  ·  0–9 · DIREKT";

  root.append(picture, channelBug, banner, numberBuffer, status);

  return {
    root,
    picture,
    pictureLabel,
    channelBug,
    channelNumber,
    channelName,
    banner,
    bannerProgram,
    bannerNext,
    numberBuffer,
    status,
  };
}
