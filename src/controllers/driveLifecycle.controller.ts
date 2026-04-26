import type { RequestHandler } from "express";
import type { Server } from "socket.io";

import { publishDriveLifecycle } from "../services/driveLifecyclePublisher.service.js";
import { DRIVE_LIFECYCLE_EVENT_TYPES } from "../types/driveLifecycle.js";
import type { DriveLifecyclePayload } from "../types/index.js";

/**
 * Basic ISO datetime validation used for lifecycle payload checks.
 */
function isValidIsoDate(value: string): boolean {
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

/**
 * Creates a handler for secured HTTP publish requests of `drive-lifecycle`.
 */
export function createPublishDriveLifecycleController(
  io: Server,
): RequestHandler {
  return (req, res) => {
    const body = req.body as Partial<DriveLifecyclePayload> | undefined;

    const clientId =
      typeof body?.clientId === "string" ? body.clientId.trim() : "";
    const driveId =
      typeof body?.driveId === "string" ? body.driveId.trim() : "";
    const occurredAt =
      typeof body?.occurredAt === "string" ? body.occurredAt : "";
    const eventType = body?.eventType;

    if (!clientId || !driveId || !occurredAt) {
      res.status(400).json({ ok: false, error: "Invalid payload" });
      return;
    }

    if (
      typeof eventType !== "string" ||
      !DRIVE_LIFECYCLE_EVENT_TYPES.includes(
        eventType as (typeof DRIVE_LIFECYCLE_EVENT_TYPES)[number],
      )
    ) {
      res.status(400).json({ ok: false, error: "Invalid eventType" });
      return;
    }

    if (!isValidIsoDate(occurredAt)) {
      res.status(400).json({ ok: false, error: "Invalid occurredAt" });
      return;
    }

    const payload: DriveLifecyclePayload = {
      clientId,
      driveId,
      eventType,
      occurredAt,
    };

    publishDriveLifecycle(io, payload);
    res.json({ ok: true });
  };
}
