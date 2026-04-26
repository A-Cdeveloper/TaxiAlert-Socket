/**
 * Allowed lifecycle event names forwarded from backend to mobile clients.
 */
export const DRIVE_LIFECYCLE_EVENT_TYPES = [
  "drive.picked_up",
  "drive.released",
  "drive.completed",
] as const;

/**
 * Union type derived from `DRIVE_LIFECYCLE_EVENT_TYPES`.
 */
export type DriveLifecycleEventType =
  (typeof DRIVE_LIFECYCLE_EVENT_TYPES)[number];

/**
 * Payload emitted to a client-specific room for lifecycle updates.
 */
export type DriveLifecycleDriver = {
  did: string;
  firstname: string;
  lastname: string;
  phone: string;
  car: string;
  plateNumber: string;
};

/**
 * Payload emitted to a client-specific room for lifecycle updates.
 */
export type DriveLifecyclePayload = {
  clientId: string;
  driveId: string;
  eventType: DriveLifecycleEventType;
  occurredAt: string;
  driver?: DriveLifecycleDriver;
};
