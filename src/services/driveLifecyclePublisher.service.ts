import type { Server } from "socket.io";
import type { DriveLifecyclePayload } from "../types/index.js";

/**
 * Emits lifecycle updates only to the target client room.
 */
export function publishDriveLifecycle(
  io: Server,
  payload: DriveLifecyclePayload,
): void {
  const room = `client:${payload.clientId}`;
  io.to(room).emit("drive-lifecycle", payload);
}
