import type { RequestHandler } from "express";
import type { Server } from "socket.io";

import { driveLifecycleBodySchema } from "../schemas/driveLifecycle.schema.js";
import { publishDriveLifecycle } from "../services/driveLifecyclePublisher.service.js";
import type { DriveLifecyclePayload } from "../types/index.js";

/**
 * Creates a handler for secured HTTP publish requests of `drive-lifecycle`.
 */
export function createPublishDriveLifecycleController(
  io: Server,
): RequestHandler {
  return (req, res) => {
    const parsed = driveLifecycleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      res.status(400).json({ ok: false, error: issue?.message ?? "Invalid payload" });
      return;
    }

    const { driver, ...rest } = parsed.data;
    const payload: DriveLifecyclePayload = driver
      ? { ...rest, driver }
      : { ...rest };

    publishDriveLifecycle(io, payload);
    res.json({ ok: true });
  };
}
