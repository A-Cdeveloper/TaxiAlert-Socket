import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import { requirePublishAuth } from "../../src/middleware/requirePublishAuth.js";

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

function createMockReq(
  headers: Record<string, string | undefined>,
): Request {
  return { headers } as Request;
}

type RunRequirePublishAuthOptions = {
  /** Stubbed value for `WS_PUBLISH_SECRET` (same branch in middleware for `""` as for unset). */
  wsPublishSecret: string;
  authorization?: string;
};

function runRequirePublishAuth(options: RunRequirePublishAuthOptions): {
  res: Response;
  next: NextFunction;
} {
  vi.stubEnv("WS_PUBLISH_SECRET", options.wsPublishSecret);
  const headers =
    options.authorization !== undefined
      ? { authorization: options.authorization }
      : {};
  const req = createMockReq(headers);
  const res = createMockRes();
  const next = vi.fn() as NextFunction;
  requirePublishAuth(req, res, next);
  return { res, next };
}

describe("requirePublishAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 500 when WS_PUBLISH_SECRET is not configured", () => {
    const { res, next } = runRequirePublishAuth({ wsPublishSecret: "" });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "WS_PUBLISH_SECRET is not configured",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization does not use Bearer prefix", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
      authorization: "Basic abc",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer prefix is wrong case", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
      authorization: "bearer expected-token",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer token does not match the secret", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
      authorization: "Bearer wrong-token",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer token is empty", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
      authorization: "Bearer ",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when Bearer token matches WS_PUBLISH_SECRET", () => {
    const { res, next } = runRequirePublishAuth({
      wsPublishSecret: "expected-token",
      authorization: "Bearer expected-token",
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
