export type CompiledSlotType = "program" | "ident" | "off_air";

export interface CompiledScheduleSlot {
  readonly id: string;
  readonly channelId: string;
  readonly type: CompiledSlotType;
  readonly catalogItemId: string | null;
  readonly label: string | null;
  readonly asset?: string | null;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
  readonly durationSeconds: number;
  readonly localDate: string;
  readonly localStart: string;
  readonly utcOffset: string;
  readonly catalogTitle?: string | null;
}

export interface CompiledSchedule {
  readonly schemaVersion: string;
  readonly revision: string;
  readonly timezone: "Europe/Stockholm";
  readonly horizon: {
    readonly startsAtUtc: string;
    readonly endsAtUtc: string;
  };
  readonly slots: readonly CompiledScheduleSlot[];
}

export type ScheduleStateStatus =
  | "on_air"
  | "gap"
  | "horizon_not_started"
  | "horizon_expired"
  | "channel_not_found";

export interface ScheduleState {
  readonly status: ScheduleStateStatus;
  readonly current: CompiledScheduleSlot | null;
  readonly next: CompiledScheduleSlot | null;
  readonly offsetMs: number | null;
  readonly errorCode: string | null;
  readonly reserveMessage: string | null;
}

function slotStart(slot: CompiledScheduleSlot): number {
  return Date.parse(slot.startsAtUtc);
}

function slotEnd(slot: CompiledScheduleSlot): number {
  return Date.parse(slot.endsAtUtc);
}

function reserveState(
  status: Exclude<ScheduleStateStatus, "on_air" | "gap">,
  errorCode: string,
  reserveMessage: string,
  next: CompiledScheduleSlot | null = null,
): ScheduleState {
  return {
    status,
    current: null,
    next,
    offsetMs: null,
    errorCode,
    reserveMessage,
  };
}

export function getScheduleState(
  schedule: CompiledSchedule,
  channelId: string,
  nowEpochMs: number,
): ScheduleState {
  if (!Number.isFinite(nowEpochMs)) {
    throw new RangeError("nowEpochMs måste vara ett ändligt millisekundvärde.");
  }

  const channelSlots = schedule.slots
    .filter((slot) => slot.channelId === channelId)
    .sort((left, right) => slotStart(left) - slotStart(right));

  if (channelSlots.length === 0) {
    return reserveState(
      "channel_not_found",
      "SCHEDULE_CHANNEL_NOT_FOUND",
      "Kanalen saknar tablå. Visar reservbild.",
    );
  }

  const horizonStart = Date.parse(schedule.horizon.startsAtUtc);
  const horizonEnd = Date.parse(schedule.horizon.endsAtUtc);

  if (nowEpochMs < horizonStart) {
    return reserveState(
      "horizon_not_started",
      "SCHEDULE_HORIZON_NOT_STARTED",
      "Tablån har inte börjat ännu. Visar reservbild.",
      channelSlots[0],
    );
  }

  if (nowEpochMs >= horizonEnd) {
    return reserveState(
      "horizon_expired",
      "SCHEDULE_HORIZON_EXPIRED",
      "Tablån behöver uppdateras. Visar reservbild.",
    );
  }

  const currentIndex = channelSlots.findIndex(
    (slot) => slotStart(slot) <= nowEpochMs && nowEpochMs < slotEnd(slot),
  );

  if (currentIndex >= 0) {
    const current = channelSlots[currentIndex];
    return {
      status: "on_air",
      current,
      next: channelSlots[currentIndex + 1] ?? null,
      offsetMs: nowEpochMs - slotStart(current),
      errorCode: null,
      reserveMessage: null,
    };
  }

  return {
    status: "gap",
    current: null,
    next: channelSlots.find((slot) => slotStart(slot) > nowEpochMs) ?? null,
    offsetMs: null,
    errorCode: null,
    reserveMessage: "Inget program pågår. Visar kanalens reservbild.",
  };
}
