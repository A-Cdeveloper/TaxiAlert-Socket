export const DRIVE_LIFECYCLE_EVENT_TYPES = [
  "drive.picked_up",
  "drive.released",
  "drive.completed",
] as const;

export type DriveLifecycleEventType =
  (typeof DRIVE_LIFECYCLE_EVENT_TYPES)[number];

export type DriveLifecyclePayload = {
  clientId: string;
  driveId: string;
  eventType: DriveLifecycleEventType;
  occurredAt: string;
};
