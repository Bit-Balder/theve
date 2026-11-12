import { describe, expect, it } from "vitest";

import { compileWeeklySchedule } from "../scripts/lib/schedule-compiler.mjs";

function source(startDate, daysOfWeek, startLocal, weeks = 1) {
  return {
    schemaVersion: "2.0.0",
    timezone: "Europe/Stockholm",
    horizon: { startDate, weeks },
    templates: [
      {
        id: "testmall",
        channelId: "test-kanal",
        daysOfWeek,
        slots: [
          {
            id: "test",
            type: "ident",
            startLocal,
            durationSeconds: 60,
            label: "Test",
          },
        ],
      },
    ],
  };
}

describe("veckoschema till UTC", () => {
  it("genererar minst åtta veckor från en lokal måndag", () => {
    const compiled = compileWeeklySchedule(
      source("2026-10-19", [1], "08:00", 8),
    );

    expect(compiled.horizon.weeks).toBe(8);
    expect(compiled.horizon.startLocalDate).toBe("2026-10-19");
    expect(compiled.horizon.endLocalDateExclusive).toBe("2026-12-14");
    expect(compiled.slots).toHaveLength(8);
  });

  it("använder svensk vinter- och sommartid oberoende av datorns tidszon", () => {
    const winter = compileWeeklySchedule(source("2026-01-05", [1], "08:00"));
    const summer = compileWeeklySchedule(source("2026-07-06", [1], "08:00"));

    expect(winter.slots[0].startsAtUtc).toBe("2026-01-05T07:00:00Z");
    expect(winter.slots[0].utcOffset).toBe("+01:00");
    expect(summer.slots[0].startsAtUtc).toBe("2026-07-06T06:00:00Z");
    expect(summer.slots[0].utcOffset).toBe("+02:00");
  });

  it("flyttar en obefintlig vårtid framåt enligt compatible-policyn", () => {
    const compiled = compileWeeklySchedule(source("2026-03-23", [7], "02:30"));

    expect(compiled.slots[0].startsAtUtc).toBe("2026-03-29T01:30:00Z");
    expect(compiled.slots[0].utcOffset).toBe("+02:00");
  });

  it("väljer den tidigare förekomsten vid upprepad hösttid", () => {
    const compiled = compileWeeklySchedule(source("2026-10-19", [7], "02:30"));

    expect(compiled.slots[0].startsAtUtc).toBe("2026-10-25T00:30:00Z");
    expect(compiled.slots[0].utcOffset).toBe("+02:00");
  });

  it("låter sändningsuppehåll sluta på rätt lokalt klockslag vid vintertid", () => {
    const input = source("2026-10-19", [6], "19:00");
    input.templates[0].slots[0] = {
      id: "natt",
      type: "off_air",
      startLocal: "19:00",
      endLocal: "06:00",
      label: "Stängt till 06:00",
    };
    const compiled = compileWeeklySchedule(input);

    expect(compiled.slots[0].startsAtUtc).toBe("2026-10-24T17:00:00Z");
    expect(compiled.slots[0].endsAtUtc).toBe("2026-10-25T05:00:00Z");
    expect(compiled.slots[0].durationSeconds).toBe(43_200);
  });

  it("behåller söndag och måndag i korrekt UTC-ordning vid veckobyte", () => {
    const compiled = compileWeeklySchedule(
      source("2026-11-02", [1, 7], "23:59", 2),
    );

    expect(compiled.slots.map((slot) => slot.localDate)).toEqual([
      "2026-11-02",
      "2026-11-08",
      "2026-11-09",
      "2026-11-15",
    ]);
  });
});
