import type { Channel } from "./catalog-types";

export type ChannelDirection = -1 | 1;

function orderedChannels(channels: readonly Channel[]): readonly Channel[] {
  return [...channels].sort((left, right) => left.number - right.number);
}

export function getAdjacentChannel(
  channels: readonly Channel[],
  currentChannelId: string,
  direction: ChannelDirection,
): Channel | null {
  const ordered = orderedChannels(channels);
  if (ordered.length === 0) {
    return null;
  }

  const currentIndex = ordered.findIndex(
    (channel) => channel.id === currentChannelId,
  );
  const safeIndex = Math.max(currentIndex, 0);
  return ordered[(safeIndex + direction + ordered.length) % ordered.length];
}

export function findChannelByNumber(
  channels: readonly Channel[],
  channelNumber: number,
): Channel | null {
  return channels.find((channel) => channel.number === channelNumber) ?? null;
}
