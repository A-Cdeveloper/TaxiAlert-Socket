import { z } from "zod";

import { DRIVE_LIFECYCLE_EVENT_TYPES } from "../types/driveLifecycle.js";

const driverSchema = z.object({
  did: z.string().trim().min(1),
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  car: z.string().trim().min(1),
  plateNumber: z.string().trim().min(1),
});

export const driveLifecycleBodySchema = z.object({
  clientId: z.string().trim().min(1),
  driveId: z.string().trim().min(1),
  eventType: z.enum(DRIVE_LIFECYCLE_EVENT_TYPES),
  occurredAt: z.string().datetime(),
  driver: driverSchema.optional(),
});
