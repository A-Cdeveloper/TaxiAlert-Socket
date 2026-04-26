import { Router } from "express";
import type { Server } from "socket.io";

import { createPublishDriveUpdatedController } from "../controllers/driveEvents.controller.js";
import { requirePublishAuth } from "../middleware/requirePublishAuth.js";
import { createPublishDriveLifecycleController } from "../controllers/driveLifecycle.controller.js";

/**
 * Creates the `/events` router with secured publish endpoints.
 */
export function createDriveEventsRouter(io: Server): Router {
  const router = Router();

  router.post(
    "/drive-updated",
    requirePublishAuth,
    createPublishDriveUpdatedController(io),
  );

  router.post(
    "/drive-lifecycle",
    requirePublishAuth,
    createPublishDriveLifecycleController(io),
  );

  return router;
}
