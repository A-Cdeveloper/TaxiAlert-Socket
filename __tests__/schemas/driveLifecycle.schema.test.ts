import { describe, expect, it } from "vitest";

import { driveLifecycleBodySchema } from "../../src/schemas/driveLifecycle.schema.js";

const validBase = {
  clientId: "client-1",
  driveId: "drive-1",
  eventType: "drive.picked_up" as const,
  occurredAt: "2026-04-26T12:34:56.000Z",
};

const validDriver = {
  did: "driver-1",
  firstname: "A",
  lastname: "B",
  phone: "+381600000000",
  car: "Model",
  plateNumber: "BG123AB",
};

describe("driveLifecycleBodySchema", () => {
  it("accepts a minimal valid payload without driver", () => {
    const result = driveLifecycleBodySchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.driver).toBeUndefined();
    }
  });

  it("accepts a valid payload with full driver object", () => {
    const result = driveLifecycleBodySchema.safeParse({
      ...validBase,
      driver: validDriver,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.driver).toEqual(validDriver);
    }
  });

  it("rejects invalid eventType", () => {
    const result = driveLifecycleBodySchema.safeParse({
      ...validBase,
      eventType: "drive.unknown",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid occurredAt (not an ISO datetime string)", () => {
    const result = driveLifecycleBodySchema.safeParse({
      ...validBase,
      occurredAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing clientId", () => {
    const result = driveLifecycleBodySchema.safeParse({
      driveId: validBase.driveId,
      eventType: validBase.eventType,
      occurredAt: validBase.occurredAt,
    });
    expect(result.success).toBe(false);
  });

  it("rejects partial driver when driver is present", () => {
    const result = driveLifecycleBodySchema.safeParse({
      ...validBase,
      driver: { did: "x" },
    });
    expect(result.success).toBe(false);
  });
});
