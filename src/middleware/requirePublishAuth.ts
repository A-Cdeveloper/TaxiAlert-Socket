import type { NextFunction, Request, Response } from "express";

export function requirePublishAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expectedSecret = process.env.WS_PUBLISH_SECRET;

  if (!expectedSecret) {
    res
      .status(500)
      .json({ ok: false, error: "WS_PUBLISH_SECRET is not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (token !== expectedSecret) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  next();
}
