import type { RequestHandler } from "express";
import type { Server } from "socket.io";

import { driveUpdatedBodySchema } from "../schemas/driveEvents.schema.js";
import { publishDriveUpdated } from "../services/driveEventPublisher.service.js";

/**
 * Creates a handler for secured HTTP publish requests of `drive-updated`.
 */
export function createPublishDriveUpdatedController(io: Server): RequestHandler {
  return (req, res) => {
    const parsed = driveUpdatedBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      res.status(400).json({ ok: false, error: issue?.message ?? "Invalid payload" });
      return;
    }

    publishDriveUpdated(io, parsed.data.ddid);
    res.json({ ok: true });
  };
}
