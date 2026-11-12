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

export interface ScheduleSlotSource {
  readonly id: string;
  readonly channelId: string;
  readonly catalogItemId: string;
  readonly order: number;
  readonly plannedDurationSeconds: number;
}
