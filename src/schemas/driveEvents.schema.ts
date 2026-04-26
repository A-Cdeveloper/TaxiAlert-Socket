import { z } from "zod";

export const driveUpdatedBodySchema = z.object({
  ddid: z.string().trim().min(1, "Drive ID is required"),
});
