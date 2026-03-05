// ============================================
// TEST HELPERS — Shared across all test suites
// ============================================

import request from "supertest";
import app from "../../server/src/app";
import prisma from "../../server/src/lib/prisma";

// Unique suffix per test run to avoid collisions
const RUN_ID = Date.now().toString(36);
let counter = 0;

/**
 * Generate a unique email for each test user.
 */
export function uniqueEmail(): string {
  return `test_${RUN_ID}_${++counter}@test.com`;
}

/**
 * Register a fresh user and return the access token, user, and workspaceId.
 */
export async function registerTestUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
}) {
  const email = overrides?.email ?? uniqueEmail();
  const name = overrides?.name ?? "Test User";
  const password = overrides?.password ?? "Password123!";

  const res = await request(app).post("/api/auth/register").send({
    name,
    email,
    password,
  });

  if (res.status !== 201) {
    throw new Error(
      `registerTestUser failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }

  return {
    accessToken: res.body.data.accessToken as string,
    user: res.body.data.user as {
      id: string;
      email: string;
      name: string;
      role: string;
    },
    workspaceId: res.body.data.workspaceId as string,
    cookies: res.headers["set-cookie"] as unknown as string[] | undefined,
  };
}

/**
 * Build a supertest agent pre-authenticated with the given token.
 */
export function authedRequest(token: string) {
  return {
    get: (url: string) =>
      request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set("Authorization", `Bearer ${token}`),
    put: (url: string) =>
      request(app).put(url).set("Authorization", `Bearer ${token}`),
    patch: (url: string) =>
      request(app).patch(url).set("Authorization", `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
}

/**
 * Build authed + workspace-scoped request helpers.
 */
export function scopedRequest(token: string, workspaceId: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "x-workspace-id": workspaceId,
  };
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string) => request(app).post(url).set(headers),
    put: (url: string) => request(app).put(url).set(headers),
    patch: (url: string) => request(app).patch(url).set(headers),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}

/**
 * Clean up all test data created during this run.
 * Call in afterAll() at the top-level describe.
 */
export async function cleanupTestData() {
  try {
    // Find test users first
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: `_${RUN_ID}_` } },
      select: { id: true },
    });
    const userIds = testUsers.map((u) => u.id);

    if (userIds.length > 0) {
      // Delete related data first (respecting foreign key constraints)
      await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.refreshToken.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.workspaceMember.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Find workspaces owned by test users
      const workspaces = await prisma.workspace.findMany({
        where: {
          members: { some: { userId: { in: userIds }, role: "OWNER" } },
        },
        select: { id: true },
      });
      const workspaceIds = workspaces.map((w) => w.id);

      if (workspaceIds.length > 0) {
        // Delete workspace-related data
        await prisma.subscription.deleteMany({
          where: { workspaceId: { in: workspaceIds } },
        });
        await prisma.workspaceSettings.deleteMany({
          where: { workspaceId: { in: workspaceIds } },
        });
        await prisma.workspace.deleteMany({
          where: { id: { in: workspaceIds } },
        });
      }

      // Finally delete the users
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Disconnect Prisma after all tests.
 */
export async function disconnectDb() {
  await prisma.$disconnect();
}

export { app, prisma, request };
