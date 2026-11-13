import { Temporal } from "@js-temporal/polyfill";

const disambiguation = "compatible";

function toZonedDateTime(date, localTime, timezone) {
  const [hour, minute] = localTime.split(":").map(Number);
  return Temporal.ZonedDateTime.from(
    {
      timeZone: timezone,
      year: date.year,
      month: date.month,
      day: date.day,
      hour,
      minute,
    },
    { disambiguation },
  );
}

function midnight(date, timezone) {
  return toZonedDateTime(date, "00:00", timezone);
}

function resolveSlotEnd(start, date, definition, timezone) {
  if (!definition.endLocal) {
    return start.add({ seconds: definition.durationSeconds });
  }

  const endDate =
    definition.endLocal <= definition.startLocal ? date.add({ days: 1 }) : date;
  return toZonedDateTime(endDate, definition.endLocal, timezone);
}

function compareSlots(left, right) {
  return (
    Date.parse(left.startsAtUtc) - Date.parse(right.startsAtUtc) ||
    left.channelId.localeCompare(right.channelId, "sv") ||
    left.id.localeCompare(right.id, "sv")
  );
}

export function compileWeeklySchedule(source) {
  const startDate = Temporal.PlainDate.from(source.horizon.startDate);
  const endDateExclusive = startDate.add({ weeks: source.horizon.weeks });
  const slots = [];

  for (let dayIndex = 0; dayIndex < source.horizon.weeks * 7; dayIndex += 1) {
    const date = startDate.add({ days: dayIndex });

    for (const template of source.templates) {
      if (!template.daysOfWeek.includes(date.dayOfWeek)) {
        continue;
      }

      for (const definition of template.slots) {
        const start = toZonedDateTime(
          date,
          definition.startLocal,
          source.timezone,
        );
        const end = resolveSlotEnd(start, date, definition, source.timezone);
        const durationSeconds = Number(
          end.toInstant().since(start.toInstant()).total({ unit: "seconds" }),
        );
        slots.push({
          id: `${template.channelId}-${date}-${template.id}-${definition.id}`,
          channelId: template.channelId,
          type: definition.type,
          catalogItemId: definition.catalogItemId ?? null,
          label: definition.label ?? null,
          ...(definition.asset ? { asset: definition.asset } : {}),
          startsAtUtc: start.toInstant().toString(),
          endsAtUtc: end.toInstant().toString(),
          durationSeconds,
          localDate: date.toString(),
          localStart: definition.startLocal,
          utcOffset: start.offset,
        });
      }
    }
  }

  slots.sort(compareSlots);
  const configuredStart = midnight(startDate, source.timezone).toInstant();
  const configuredEnd = midnight(endDateExclusive, source.timezone).toInstant();
  const lastSlotEnd = slots.reduce((latest, slot) => {
    const candidate = Temporal.Instant.from(slot.endsAtUtc);
    return Temporal.Instant.compare(candidate, latest) > 0 ? candidate : latest;
  }, configuredEnd);
  const horizonEnd =
    Temporal.Instant.compare(lastSlotEnd, configuredEnd) > 0
      ? lastSlotEnd
      : configuredEnd;

  return {
    schemaVersion: "2.0.0",
    timezone: source.timezone,
    disambiguation,
    horizon: {
      startLocalDate: startDate.toString(),
      endLocalDateExclusive: endDateExclusive.toString(),
      weeks: source.horizon.weeks,
      startsAtUtc: configuredStart.toString(),
      endsAtUtc: horizonEnd.toString(),
    },
    slots,
  };
}

export function findScheduleOverlaps(compiledSchedule) {
  const overlaps = [];
  const previousByChannel = new Map();

  for (const slot of compiledSchedule.slots) {
    const previous = previousByChannel.get(slot.channelId);
    if (
      previous &&
      Date.parse(slot.startsAtUtc) < Date.parse(previous.endsAtUtc)
    ) {
      overlaps.push(`${previous.id} överlappar ${slot.id}`);
    }
    previousByChannel.set(slot.channelId, slot);
  }

  return overlaps;
}
