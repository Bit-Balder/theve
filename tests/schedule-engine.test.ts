import { describe, expect, it } from "vitest";

import {
  type CompiledSchedule,
  type CompiledScheduleSlot,
  getScheduleState,
} from "../src/core/schedule-engine";

function slot(
  id: string,
  startsAtUtc: string,
  endsAtUtc: string,
  type: CompiledScheduleSlot["type"] = "program",
): CompiledScheduleSlot {
  return {
    id,
    channelId: "test-kanal",
    type,
    catalogItemId: type === "program" ? "test-program" : null,
    label: type === "program" ? null : "Testläge",
    startsAtUtc,
    endsAtUtc,
    durationSeconds: (Date.parse(endsAtUtc) - Date.parse(startsAtUtc)) / 1000,
    localDate: "2026-11-02",
    localStart: "23:59",
    utcOffset: "+01:00",
  };
}

function schedule(slots: readonly CompiledScheduleSlot[]): CompiledSchedule {
  return {
    schemaVersion: "2.0.0",
    revision: "test-revision",
    timezone: "Europe/Stockholm",
    horizon: {
      startsAtUtc: "2026-11-02T22:00:00Z",
      endsAtUtc: "2026-11-03T02:00:00Z",
    },
    slots,
  };
}

describe("schemamotorns publika API", () => {
  const beforeMidnight = slot(
    "sondag-sent",
    "2026-11-02T22:59:00Z",
    "2026-11-02T23:00:00Z",
  );
  const afterMidnight = slot(
    "mandag-tidigt",
    "2026-11-02T23:00:00Z",
    "2026-11-02T23:15:00Z",
    "ident",
  );
  const fixture = schedule([beforeMidnight, afterMidnight]);

  it("byter slot exakt på millisekundgränsen vid midnatt", () => {
    const oneMillisecondBefore = getScheduleState(
      fixture,
      "test-kanal",
      Date.parse("2026-11-02T22:59:59.999Z"),
    );
    const atBoundary = getScheduleState(
      fixture,
      "test-kanal",
      Date.parse("2026-11-02T23:00:00.000Z"),
    );

    expect(oneMillisecondBefore.current?.id).toBe("sondag-sent");
    expect(oneMillisecondBefore.offsetMs).toBe(59_999);
    expect(atBoundary.current?.id).toBe("mandag-tidigt");
    expect(atBoundary.offsetMs).toBe(0);
  });

  it("ger samma nu, nästa och offset i två separata sessioner", () => {
    const now = Date.parse("2026-11-02T23:04:12.345Z");
    const firstSession = getScheduleState(fixture, "test-kanal", now);
    const secondSession = getScheduleState(
      structuredClone(fixture),
      "test-kanal",
      now,
    );

    expect(secondSession).toEqual(firstSession);
    expect(firstSession.offsetMs).toBe(252_345);
  });

  it("returnerar reservläge när horisonten är för gammal", () => {
    const state = getScheduleState(
      fixture,
      "test-kanal",
      Date.parse("2026-11-03T02:00:00Z"),
    );

    expect(state.status).toBe("horizon_expired");
    expect(state.errorCode).toBe("SCHEDULE_HORIZON_EXPIRED");
    expect(state.reserveMessage).toContain("uppdateras");
  });

  it("representerar ident och sändningsuppehåll som vanliga slottyper", () => {
    const identState = getScheduleState(
      fixture,
      "test-kanal",
      Date.parse("2026-11-02T23:01:00Z"),
    );
    const offAirFixture = schedule([
      slot("natt", "2026-11-02T23:15:00Z", "2026-11-03T01:00:00Z", "off_air"),
    ]);
    const offAirState = getScheduleState(
      offAirFixture,
      "test-kanal",
      Date.parse("2026-11-02T23:30:00Z"),
    );

    expect(identState.current?.type).toBe("ident");
    expect(offAirState.current?.type).toBe("off_air");
  });
});
