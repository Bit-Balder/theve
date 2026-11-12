export type RemoteAction =
  | { readonly type: "channel_up" }
  | { readonly type: "channel_down" }
  | { readonly type: "guide" }
  | { readonly type: "back" }
  | { readonly type: "confirm" }
  | { readonly type: "digit"; readonly digit: string };

export interface RemoteKeyLike {
  readonly key: string;
  readonly code?: string;
  readonly keyCode?: number;
}

const channelUpKeys = new Set(["ArrowUp", "ChannelUp", "PageUp"]);
const channelDownKeys = new Set(["ArrowDown", "ChannelDown", "PageDown"]);
const guideKeys = new Set(["Guide", "g", "G"]);
const backKeys = new Set([
  "Escape",
  "Backspace",
  "BrowserBack",
  "GoBack",
  "Back",
]);
const confirmKeys = new Set(["Enter", "Accept", "OK", "Select"]);

function digitFromKey(input: RemoteKeyLike): string | null {
  if (/^\d$/.test(input.key)) {
    return input.key;
  }
  const codeMatch = input.code?.match(/^(?:Digit|Numpad)(\d)$/);
  if (codeMatch) {
    return codeMatch[1];
  }
  if (input.keyCode && input.keyCode >= 48 && input.keyCode <= 57) {
    return String(input.keyCode - 48);
  }
  if (input.keyCode && input.keyCode >= 96 && input.keyCode <= 105) {
    return String(input.keyCode - 96);
  }
  return null;
}

export function normalizeRemoteInput(
  input: RemoteKeyLike,
): RemoteAction | null {
  const digit = digitFromKey(input);
  if (digit) {
    return { type: "digit", digit };
  }
  if (channelUpKeys.has(input.key) || input.keyCode === 427) {
    return { type: "channel_up" };
  }
  if (channelDownKeys.has(input.key) || input.keyCode === 428) {
    return { type: "channel_down" };
  }
  if (guideKeys.has(input.key) || input.keyCode === 458) {
    return { type: "guide" };
  }
  if (
    backKeys.has(input.key) ||
    input.keyCode === 8 ||
    input.keyCode === 27 ||
    input.keyCode === 461
  ) {
    return { type: "back" };
  }
  if (confirmKeys.has(input.key) || input.keyCode === 13) {
    return { type: "confirm" };
  }
  return null;
}
