import { describe, expect, it } from "vitest";

import { driveUpdatedBodySchema } from "../../src/schemas/driveEvents.schema.js";

describe("driveUpdatedBodySchema", () => {
  it("accepts a non-empty trimmed ddid", () => {
    const result = driveUpdatedBodySchema.safeParse({ ddid: "drive-123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ddid).toBe("drive-123");
    }
  });

  it("rejects missing ddid", () => {
    const result = driveUpdatedBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty ddid", () => {
    const result = driveUpdatedBodySchema.safeParse({ ddid: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Drive ID is required");
    }
  });

  it("rejects whitespace-only ddid after trim", () => {
    const result = driveUpdatedBodySchema.safeParse({ ddid: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects non-string ddid", () => {
    const result = driveUpdatedBodySchema.safeParse({ ddid: 123 });
    expect(result.success).toBe(false);
  });
});
