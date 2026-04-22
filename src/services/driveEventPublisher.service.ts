import type { Server } from "socket.io";

import type { DriveUpdatedPayload } from "../types/index.js";

export function publishDriveUpdated(io: Server, ddid: string): DriveUpdatedPayload {
  const payload: DriveUpdatedPayload = {
    type: "drive-updated",
    ddid,
    at: new Date().toISOString(),
  };

  io.emit("drive-updated", payload);
  return payload;
}
