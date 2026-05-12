import type { Server } from "socket.io";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishDriveUpdated } from "../../src/services/driveEventPublisher.service.js";

describe("publishDriveUpdated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits drive-updated with payload and returns the same payload", () => {
    const emit = vi.fn();
    const io = { emit } as unknown as Server;

    const returned = publishDriveUpdated(io, "drive-abc");

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      "drive-updated",
      expect.objectContaining({
        type: "drive-updated",
        ddid: "drive-abc",
        at: expect.any(String),
      }),
    );

    const emitted = emit.mock.calls[0]?.[1] as {
      type: string;
      ddid: string;
      at: string;
    };
    expect(emitted).toBeDefined();
    expect(Number.isNaN(Date.parse(emitted.at))).toBe(false);
    expect(returned).toEqual(emitted);
    expect(returned).toBe(emitted);
  });
});
