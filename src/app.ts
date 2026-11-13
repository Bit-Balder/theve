import {
  type ChannelGuideEntry,
  createChannelGuide,
} from "./components/channel-guide";
import { createFocusMenu } from "./components/focus-menu";
import { createScreen43 } from "./components/screen43";
import { createTeletext } from "./components/teletext";
import { createTvExperience } from "./components/tv-experience";
import { createTvShell, setCrtMode } from "./components/tv-shell";
import {
  findChannelByNumber,
  getAdjacentChannel,
} from "./core/channel-navigation";
import { DirectNumberBuffer } from "./core/direct-number-buffer";
import { InternetArchiveAdapter } from "./core/internet-archive";
import { OverlayBackStack } from "./core/overlay-back-stack";
import { ArchivePlaybackService } from "./core/playback-service";
import { PlayerController } from "./core/player-controller";
import { project } from "./core/project";
import { loadPublicTvData, type PublicTvData } from "./core/public-tv-data";
import { normalizeRemoteInput } from "./core/remote-input";
import {
  type CompiledScheduleSlot,
  getScheduleState,
} from "./core/schedule-engine";

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

function slotTitle(slot: CompiledScheduleSlot | null): string {
  if (!slot) {
    return "INGEN TABLÅUPPGIFT";
  }
  return slot.catalogTitle ?? slot.label ?? "PROGRAMUPPGIFT SAKNAS";
}

function createGuideEntries(
  data: PublicTvData,
  nowEpochMs: number,
): readonly ChannelGuideEntry[] {
  return data.channels.map((channel) => {
    const state = getScheduleState(data.schedule, channel.id, nowEpochMs);
    return {
      channelId: channel.id,
      number: channel.number,
      name: channel.name,
      logoSrc: channel.logo.compact,
      now: state.current
        ? slotTitle(state.current)
        : (state.reserveMessage ?? "RESERVBILD"),
      next: state.next ? slotTitle(state.next) : "INGEN UPPGIFT",
    };
  });
}

function createBrand(): HTMLElement {
  const brand = document.createElement("div");
  brand.className = "brand";
  brand.setAttribute("aria-label", "Theve");

  const logo = document.createElement("img");
  logo.className = "brand__logo";
  logo.src = "assets/logos/theve.svg";
  logo.alt = "Theve";
  brand.append(logo);

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
  const media = document.createElement("video");
  media.className = "player-surface";
  media.hidden = true;
  media.playsInline = true;
  media.preload = "metadata";
  media.setAttribute("aria-label", "Theves videospelare");
  const player = new PlayerController(media);
  const playback = new ArchivePlaybackService(
    new InternetArchiveAdapter(),
    player,
  );
  const tv = createTvExperience();
  const backStack = new OverlayBackStack();
  const teletext = createTeletext();
  const startScreen = document.createElement("div");
  startScreen.className = "start-screen";

  let publicData: PublicTvData | null = null;
  let publicDataPromise: Promise<PublicTvData> | null = null;
  let currentChannelId = "";
  let started = false;
  let starting = false;
  let selectionRevision = 0;
  let bannerTimer: ReturnType<typeof setTimeout> | null = null;
  let scheduleTimer: ReturnType<typeof setTimeout> | null = null;

  const closeGuide = () => {
    guide.close();
    backStack.remove("guide");
  };

  const closeTeletext = () => {
    teletext.close();
    backStack.remove("teletext");
  };

  const guide = createChannelGuide({
    onTune: (channelId) => {
      void tuneChannel(channelId);
    },
    onRequestClose: () => {
      if (!backStack.back()) {
        closeGuide();
      }
    },
  });

  const directNumber = new DirectNumberBuffer({
    timeoutMs: 1_000,
    maxDigits: 3,
    onChange: (digits) => {
      tv.numberBuffer.hidden = digits.length === 0;
      tv.numberBuffer.textContent = digits
        ? `KANAL ${digits.padStart(2, "_")}`
        : "";
    },
    onCommit: (channelNumber) => {
      if (!publicData) {
        return;
      }
      const channel = findChannelByNumber(publicData.channels, channelNumber);
      if (!channel) {
        tv.status.textContent = `KANAL ${channelNumber} FINNS INTE`;
        return;
      }
      void tuneChannel(channel.id);
    },
  });

  function getPublicData(): Promise<PublicTvData> {
    publicDataPromise ??= loadPublicTvData();
    return publicDataPromise;
  }

  function showBanner(program: string, next: string): void {
    tv.bannerProgram.textContent = program;
    tv.bannerNext.textContent = `NÄSTA · ${next}`;
    tv.banner.classList.remove("program-banner--hidden");
    if (bannerTimer) {
      clearTimeout(bannerTimer);
    }
    bannerTimer = setTimeout(() => {
      tv.banner.classList.add("program-banner--hidden");
    }, 4_000);
  }

  function scheduleNextBoundary(
    channelId: string,
    current: CompiledScheduleSlot | null,
    next: CompiledScheduleSlot | null,
    nowEpochMs: number,
  ): void {
    if (scheduleTimer) {
      clearTimeout(scheduleTimer);
      scheduleTimer = null;
    }

    const boundary = current?.endsAtUtc ?? next?.startsAtUtc;
    if (!boundary) {
      return;
    }
    const delay = Date.parse(boundary) - nowEpochMs + 25;
    if (delay <= 0) {
      return;
    }
    scheduleTimer = setTimeout(
      () => {
        if (currentChannelId === channelId) {
          void tuneChannel(channelId);
        }
      },
      Math.min(delay, 2_147_000_000),
    );
  }

  async function tuneChannel(channelId: string): Promise<void> {
    if (!publicData) {
      return;
    }
    const channel = publicData.channels.find(
      (candidate) => candidate.id === channelId,
    );
    if (!channel) {
      return;
    }

    const revision = ++selectionRevision;
    currentChannelId = channel.id;
    tv.root.dataset.channelId = channel.id;
    tv.picture.dataset.channelId = channel.id;
    tv.picture.dataset.theme = channel.theme;
    tv.picture.dataset.state = "reserve";
    tv.channelBug.dataset.theme = channel.theme;
    tv.channelLogo.src = channel.logo.compact;
    tv.channelLogo.alt = `${channel.name}, kanal ${channel.number}`;
    tv.identLogo.src = channel.logo.fullColor;
    tv.identLogo.alt = `${channel.name} kanalidentitet`;
    tv.identLogo.classList.remove("tv-experience__ident-logo--entering");
    void tv.identLogo.offsetWidth;
    tv.identLogo.classList.add("tv-experience__ident-logo--entering");
    tv.status.textContent = `KANAL ${channel.number} · ${channel.name}`;
    media.hidden = true;
    tv.picture.hidden = false;

    const nowEpochMs = Date.now();
    const scheduleState = getScheduleState(
      publicData.schedule,
      channel.id,
      nowEpochMs,
    );
    const currentTitle = scheduleState.current
      ? slotTitle(scheduleState.current)
      : (scheduleState.reserveMessage ?? "RESERVBILD");
    const nextTitle = scheduleState.next
      ? slotTitle(scheduleState.next)
      : "INGEN UPPGIFT";
    showBanner(currentTitle, nextTitle);
    scheduleNextBoundary(
      channel.id,
      scheduleState.current,
      scheduleState.next,
      nowEpochMs,
    );

    if (!scheduleState.current) {
      playback.stop();
      tv.picture.dataset.state = "reserve";
      tv.pictureLabel.textContent =
        scheduleState.reserveMessage ?? "RESERVBILD";
      return;
    }

    if (scheduleState.current.type !== "program") {
      playback.stop();
      tv.picture.dataset.state = scheduleState.current.type;
      tv.pictureLabel.textContent = slotTitle(scheduleState.current);
      return;
    }

    tv.picture.dataset.state = "program";

    const catalogItem = publicData.catalogItems.find(
      (item) => item.id === scheduleState.current?.catalogItemId,
    );
    if (!catalogItem) {
      playback.stop();
      tv.pictureLabel.textContent = "PROGRAMMET SAKNAS I KATALOGEN";
      return;
    }

    if (catalogItem.source.type !== "internet_archive") {
      playback.stop();
      tv.pictureLabel.textContent = catalogItem.title;
      return;
    }

    tv.pictureLabel.textContent = "HÄMTAR GODKÄND ARKIVSÄNDNING";
    const playerState = await playback.tune({
      slotId: scheduleState.current.id,
      archiveIdentifier: catalogItem.source.mediaRef,
      offsetMs: scheduleState.offsetMs ?? 0,
    });
    if (revision !== selectionRevision) {
      return;
    }
    if (playerState.phase === "playing") {
      tv.picture.hidden = true;
      media.hidden = false;
      return;
    }
    tv.pictureLabel.textContent = playerState.message;
  }

  function openGuide(): void {
    if (!publicData || !currentChannelId || guide.isOpen()) {
      return;
    }
    backStack.push({ id: "guide", close: guide.close });
    guide.open(createGuideEntries(publicData, Date.now()), currentChannelId);
  }

  function openTeletext(): void {
    if (!publicData || !currentChannelId || teletext.isOpen()) {
      return;
    }
    const channel = publicData.channels.find(
      (candidate) => candidate.id === currentChannelId,
    );
    if (!channel) {
      return;
    }
    directNumber.clear();
    backStack.push({ id: "teletext", close: teletext.close });
    teletext.open(channel.name);
  }

  async function startTv(): Promise<void> {
    if (started || starting) {
      return;
    }
    starting = true;
    menuStatus.textContent = "LÄSER KANALER OCH TABLÅ";
    await playback.activate();

    try {
      publicData = await getPublicData();
      const firstChannel = publicData.channels[0];
      if (!firstChannel) {
        throw new Error("Kanaldata saknas.");
      }

      started = true;
      startScreen.hidden = true;
      tv.root.hidden = false;
      tv.root.focus();
      await tuneChannel(firstChannel.id);
    } catch {
      menuStatus.textContent = "KANALDATA KUNDE INTE LÄSAS · FÖRSÖK IGEN";
      publicDataPromise = null;
    } finally {
      starting = false;
    }
  }

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

  const menuStatus = document.createElement("p");
  menuStatus.className = "menu-status";
  menuStatus.setAttribute("role", "status");
  menuStatus.setAttribute("aria-live", "polite");
  menuStatus.textContent = viewModel.instruction;

  const menu = createFocusMenu({
    items: [
      { id: "start", label: "STARTA TV", hint: "ENTER" },
      { id: "focus", label: "VISA FOKUSPROV", hint: "PIL NED" },
      { id: "crt", label: "CRT · DISKRET", hint: "PÅ" },
    ],
    onAction: (action, button) => {
      if (action === "start") {
        void startTv();
      }

      if (action === "focus") {
        const proof = safeArea.querySelector<HTMLElement>(".focus-proof");
        proof?.classList.toggle("focus-proof--highlighted");
        menuStatus.textContent = "SAMMA FOKUSRING VISAS PÅ FYRA BAKGRUNDER";
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
        menuStatus.textContent =
          nextMode === "subtle"
            ? "DISKRET BILDRÖRSEFFEKT PÅ"
            : "BILDRÖRSEFFEKT AV";
      }
    },
  });

  controls.append(menuTitle, menu, menuStatus);
  content.append(intro, controls);
  startScreen.append(topbar, content, createFocusProof());
  tv.txtButton.addEventListener("click", openTeletext);
  safeArea.append(startScreen, tv.root, guide.element, teletext.element);
  screen.append(media, safeArea);
  shell.append(screen);
  root.replaceChildren(shell);

  window.addEventListener("keydown", (event) => {
    if (!started || !publicData || event.defaultPrevented) {
      return;
    }
    const action = normalizeRemoteInput(event);
    if (!action) {
      return;
    }

    if (teletext.isOpen()) {
      event.preventDefault();
      if (action.type === "digit") {
        teletext.pushDigit(action.digit);
      } else if (action.type === "back" || action.type === "teletext") {
        if (!backStack.back()) {
          closeTeletext();
        }
      }
      return;
    }

    if (guide.isOpen()) {
      if (action.type === "back" || action.type === "guide") {
        event.preventDefault();
        backStack.back();
      }
      return;
    }

    event.preventDefault();
    if (action.type === "digit") {
      directNumber.push(action.digit);
      return;
    }
    if (action.type === "confirm") {
      directNumber.confirm();
      return;
    }
    if (action.type === "guide") {
      directNumber.clear();
      openGuide();
      return;
    }
    if (action.type === "teletext") {
      openTeletext();
      return;
    }
    if (action.type === "back") {
      directNumber.clear();
      if (!backStack.back()) {
        tv.status.textContent = "INGET ÖVERLÄGG ATT STÄNGA";
      }
      return;
    }

    directNumber.clear();
    const direction = action.type === "channel_up" ? 1 : -1;
    const channel = getAdjacentChannel(
      publicData.channels,
      currentChannelId,
      direction,
    );
    if (channel) {
      void tuneChannel(channel.id);
    }
  });

  requestAnimationFrame(() => {
    menu.querySelector<HTMLButtonElement>("button")?.focus();
  });
}
