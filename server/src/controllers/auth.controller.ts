// ============================================
// AUTH CONTROLLER — HTTP ↔ Service Bridge
// ============================================

import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

function getIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.ip ??
    ""
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;
  const result = await authService.register(name, email, password, getIp(req));

  setRefreshCookie(res, result.tokens.refreshToken);

  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      workspaceId: result.workspaceId,
    },
    201,
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      sendError(res, "Email and password are required", 400);
      return;
    }

    const result = await authService.login(
      email,
      password,
      getIp(req),
      req.headers["user-agent"],
    );

    // Set HttpOnly refresh token cookie
    setRefreshCookie(res, result.tokens.refreshToken);

    // Return success response with access token
    sendSuccess(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      workspaceId: result.workspaceId,
    });
  } catch (err: any) {
    sendError(res, err.message || "Login failed", 401);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;
  if (!token) {
    sendError(res, "No refresh token provided", 401);
    return;
  }

  const tokens = await authService.refreshAccessToken(
    token,
    getIp(req),
    req.headers["user-agent"],
  );

  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, { accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const token = req.cookies?.refreshToken;

  if (token && authReq.userId) {
    await authService.logout(token, authReq.userId, getIp(req));
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  sendSuccess(res, { message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const user = await authService.getCurrentUser(authReq.userId!);
  sendSuccess(res, user);
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const authReq = req as AuthRequest;
  const user = await authService.updateProfile(
    authReq.userId!,
    req.body,
    getIp(req),
  );
  sendSuccess(res, user);
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const authReq = req as AuthRequest;
  await authService.changePassword(
    authReq.userId!,
    req.body.currentPassword,
    req.body.newPassword,
    getIp(req),
  );
  sendSuccess(res, { message: "Password changed successfully" });
}

// ---- Helper ----

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
