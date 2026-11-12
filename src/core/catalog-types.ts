export type ReviewStatus = "approved" | "review_required" | "rejected";
export type AvailabilityStatus =
  | "available"
  | "unavailable"
  | "unknown"
  | "test_only";

export interface Channel {
  readonly id: string;
  readonly number: number;
  readonly name: string;
  readonly kind: "info" | "video";
  readonly audience: "children" | "family" | "general";
  readonly signOffAt: string | null;
}

export interface CatalogItem {
  readonly id: string;
  readonly title: string;
  readonly channelId: string;
  readonly durationSeconds: number;
  readonly source: {
    readonly type: "generated_test_pattern" | "internet_archive" | "local_test";
    readonly mediaRef: string;
  };
  readonly availabilityStatus: AvailabilityStatus;
  readonly familyStatus: ReviewStatus;
}

export interface RightsEntry {
  readonly catalogItemId: string;
  readonly status: ReviewStatus;
  readonly basis: string;
  readonly evidenceUrl: string | null;
  readonly reviewedAt: string | null;
  readonly publicationAllowed: boolean;
  readonly notes: string;
}

export type ScheduleSlotType = "program" | "ident" | "off_air";

export interface WeeklyScheduleSlot {
  readonly id: string;
  readonly type: ScheduleSlotType;
  readonly startLocal: string;
  readonly durationSeconds?: number;
  readonly endLocal?: string;
  readonly catalogItemId?: string;
  readonly label?: string;
}

export interface WeeklyScheduleTemplate {
  readonly id: string;
  readonly channelId: string;
  readonly daysOfWeek: readonly number[];
  readonly slots: readonly WeeklyScheduleSlot[];
}

export interface WeeklyScheduleSource {
  readonly schemaVersion: "2.0.0";
  readonly timezone: "Europe/Stockholm";
  readonly horizon: {
    readonly startDate: string;
    readonly weeks: number;
  };
  readonly templates: readonly WeeklyScheduleTemplate[];
}
