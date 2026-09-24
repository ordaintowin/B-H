import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export type AfroCartRole = "customer" | "super_admin" | "rider";

declare global {
  namespace Express {
    interface Request {
      afrocartUserId?: string;
      afrocartRole?: AfroCartRole;
    }
  }
}

function roleFromClaims(claims: Record<string, unknown> | null | undefined): AfroCartRole {
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? claims?.public_metadata) as Record<string, unknown> | undefined;
  const role = metadata?.role;
  if (role === "super_admin" || role === "rider" || role === "customer") return role;
  return "customer";
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let auth: ReturnType<typeof getAuth> | null = null;
  try {
    auth = getAuth(req);
  } catch {
    // Local preview runs without Clerk middleware and uses the guarded
    // x-demo-role header instead.
  }
  const userId = auth?.userId;
  const demoRole = req.header("x-demo-role");
  const demoModeEnabled = process.env.NODE_ENV !== "production";
  const normalizedDemoRole = demoRole === "admin" ? "super_admin" : demoRole;
  if (!userId && demoModeEnabled && (normalizedDemoRole === "customer" || normalizedDemoRole === "super_admin" || normalizedDemoRole === "rider")) {
    req.afrocartUserId = `demo:${normalizedDemoRole}`;
    req.afrocartRole = normalizedDemoRole;
    return next();
  }
  if (!userId) return res.status(401).json({ error: "Sign in to continue" });
  req.afrocartUserId = userId;
  req.afrocartRole = roleFromClaims(auth?.sessionClaims as Record<string, unknown> | null | undefined);
  return next();
}

export function requireRole(...allowedRoles: AfroCartRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.afrocartUserId) return res.status(401).json({ error: "Sign in to continue" });
    if (!allowedRoles.includes(req.afrocartRole ?? "customer")) {
      return res.status(403).json({ error: "You do not have access to this area" });
    }
    return next();
  };
}