/**
 * Payload emitted to clients when a drive list/map refresh is required.
 */
export type DriveUpdatedPayload = {
  type: "drive-updated";
  ddid: string;
  at: string;
};
