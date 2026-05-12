import type { Server } from "socket.io";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import * as driveEventPublisher from "../../src/services/driveEventPublisher.service.js";
import { startExpireDrivesPoller } from "../../src/services/expireDrivesPoller.service.js";

const POLL_INTERVAL_MS = 10_000;
const LOOKBACK_MS = 15_000;

const baseConfig = {
  nextInternalBaseUrl: "http://localhost:3000",
  nextInternalSecret: "internal-secret",
  intervalMs: POLL_INTERVAL_MS,
  lookbackMs: LOOKBACK_MS,
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "ERR",
    json: async () => body,
  } as Response;
}

function createIoMock(): Server {
  return { emit: vi.fn() } as unknown as Server;
}

describe("startExpireDrivesPoller", () => {
  let publishSpy: MockInstance<typeof driveEventPublisher.publishDriveUpdated>;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00.000Z") });
    publishSpy = vi
      .spyOn(driveEventPublisher, "publishDriveUpdated")
      .mockImplementation((_io, ddid) => ({
        type: "drive-updated",
        ddid,
        at: new Date().toISOString(),
      }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls expire-drives with lookback query and Bearer secret, then publishes each ddid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        ddids: ["a", "b"],
        count: 2,
        serverNow: "",
      }),
    );
    globalThis.fetch = fetchMock;

    const io = createIoMock();
    startExpireDrivesPoller(io, baseConfig);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0]?.[0];
    expect(calledUrl).toBeInstanceOf(URL);
    const url = calledUrl as URL;
    expect(url.pathname).toBe("/api/cron/expire-drives");
    expect(url.origin).toBe("http://localhost:3000");
    expect(url.searchParams.get("lookbackMs")).toBe(String(LOOKBACK_MS));

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer internal-secret" },
    });

    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenCalledWith(io, "a");
    expect(publishSpy).toHaveBeenCalledWith(io, "b");
  });

  it("does not publish when the HTTP response is not ok", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, ddids: ["x"] }, false));

    startExpireDrivesPoller(createIoMock(), baseConfig);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(publishSpy).not.toHaveBeenCalled();
  });

  it("does not publish when the JSON body is invalid", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: false, ddids: [] }));

    startExpireDrivesPoller(createIoMock(), baseConfig);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(publishSpy).not.toHaveBeenCalled();
  });

  it("does not publish when ddids is not an array", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, ddids: "not-array" }));

    startExpireDrivesPoller(createIoMock(), baseConfig);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(publishSpy).not.toHaveBeenCalled();
  });

  it("dedupes the same ddid within the TTL window across ticks", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, ddids: ["same"] }));

    startExpireDrivesPoller(createIoMock(), baseConfig);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(publishSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it("publishes again after the dedupe TTL has elapsed", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, ddids: ["same"] }));

    startExpireDrivesPoller(createIoMock(), baseConfig);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(publishSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenNthCalledWith(1, expect.anything(), "same");
    expect(publishSpy).toHaveBeenNthCalledWith(2, expect.anything(), "same");
  });

  it("does not start a second poll while the first fetch is still pending", async () => {
    let finishFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      finishFetch = resolve;
    });

    const emptyPoll = jsonResponse({ ok: true, ddids: [] });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValue(emptyPoll);
    globalThis.fetch = fetchMock;

    startExpireDrivesPoller(createIoMock(), baseConfig);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    finishFetch(emptyPoll);
    await Promise.resolve();
    await Promise.resolve();
  });
});
