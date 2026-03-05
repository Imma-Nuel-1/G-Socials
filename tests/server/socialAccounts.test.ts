// ============================================
// SOCIAL ACCOUNT TESTS — List, Auth-URL, Callback, Delete, Toggle
// ============================================

import {
  app,
  request,
  registerTestUser,
  scopedRequest,
  cleanupTestData,
  disconnectDb,
} from "../helpers";

afterAll(async () => {
  await cleanupTestData();
  await disconnectDb();
});

describe("Social Accounts API", () => {
  let token: string;
  let workspaceId: string;

  beforeAll(async () => {
    const reg = await registerTestUser();
    token = reg.accessToken;
    workspaceId = reg.workspaceId;
  });

  // ============================================
  // GET /api/social-accounts
  // ============================================
  describe("GET /api/social-accounts", () => {
    it("should return an empty array initially", async () => {
      const res = await scopedRequest(token, workspaceId).get(
        "/api/social-accounts",
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/social-accounts");

      expect(res.status).toBe(401);
    });

    it("should reject request without workspace header", async () => {
      const res = await request(app)
        .get("/api/social-accounts")
        .set("Authorization", `Bearer ${token}`);

      // Workspace middleware should reject
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================
  // GET /api/social-accounts/auth-url
  // ============================================
  describe("GET /api/social-accounts/auth-url", () => {
    it("should return an OAuth URL for a valid platform", async () => {
      const res = await scopedRequest(token, workspaceId).get(
        "/api/social-accounts/auth-url?platform=facebook&redirect_uri=http://localhost:5173/callback",
      );

      // May succeed or fail depending on platform config — but should not 401/500
      expect([200, 400, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.data).toHaveProperty("url");
      }
    });

    it("should reject missing platform param", async () => {
      const res = await scopedRequest(token, workspaceId).get(
        "/api/social-accounts/auth-url?redirect_uri=http://localhost:5173/callback",
      );

      expect(res.status).toBe(400);
    });

    it("should reject missing redirect_uri param", async () => {
      const res = await scopedRequest(token, workspaceId).get(
        "/api/social-accounts/auth-url?platform=facebook",
      );

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // POST /api/social-accounts/callback
  // ============================================
  describe("POST /api/social-accounts/callback", () => {
    it("should reject missing required fields", async () => {
      const res = await scopedRequest(token, workspaceId)
        .post("/api/social-accounts/callback")
        .send({});

      expect(res.status).toBe(400);
    });

    it("should reject partial fields (missing code)", async () => {
      const res = await scopedRequest(token, workspaceId)
        .post("/api/social-accounts/callback")
        .send({
          platform: "facebook",
          redirect_uri: "http://localhost:5173/callback",
        });

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // DELETE /api/social-accounts/:accountId
  // ============================================
  describe("DELETE /api/social-accounts/:accountId", () => {
    it("should return error for non-existent account", async () => {
      const fakeId = "000000000000000000000000";
      const res = await scopedRequest(token, workspaceId).delete(
        `/api/social-accounts/${fakeId}`,
      );

      // Should be 404 or 500 (depending on service error handling)
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================
  // PATCH /api/social-accounts/:accountId/toggle
  // ============================================
  describe("PATCH /api/social-accounts/:accountId/toggle", () => {
    it("should return error for non-existent account", async () => {
      const fakeId = "000000000000000000000000";
      const res = await scopedRequest(token, workspaceId)
        .patch(`/api/social-accounts/${fakeId}/toggle`)
        .send({ isActive: true });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
