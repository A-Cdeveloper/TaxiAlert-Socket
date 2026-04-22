import type { RequestHandler } from "express";
import type { Server } from "socket.io";

import { publishDriveUpdated } from "../services/driveEventPublisher.service.js";

export function createPublishDriveUpdatedController(io: Server): RequestHandler {
  return (req, res) => {
    const ddid = typeof req.body?.ddid === "string" ? req.body.ddid : undefined;

    if (!ddid) {
      res.status(400).json({ ok: false, error: "Drive ID is required" });
      return;
    }

    publishDriveUpdated(io, ddid);
    res.json({ ok: true });
  };
}
