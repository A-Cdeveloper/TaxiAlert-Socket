import { Router } from "express";
import type { Server } from "socket.io";

import { createPublishDriveUpdatedController } from "../controllers/driveEvents.controller.js";
import { requirePublishAuth } from "../middleware/requirePublishAuth.js";

export function createDriveEventsRouter(io: Server): Router {
  const router = Router();

  router.post(
    "/drive-updated",
    requirePublishAuth,
    createPublishDriveUpdatedController(io),
  );

  return router;
}
