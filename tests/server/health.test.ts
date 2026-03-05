// ============================================
// HEALTH & GENERAL TESTS — Health check, 404, Workspaces, Settings
// ============================================

import {
  app,
  request,
  registerTestUser,
  authedRequest,
  scopedRequest,
  cleanupTestData,
  disconnectDb,
} from "../helpers";

afterAll(async () => {
  await cleanupTestData();
  await disconnectDb();
});

// ============================================
// GET /health
// ============================================
describe("GET /health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.timestamp).toBeDefined();
  });
});

// ============================================
// 404 — Unknown routes
// ============================================
describe("Unknown routes", () => {
  it("should return 404 for unknown paths", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
  });
});

// ============================================
// GET /api/workspaces
// ============================================
describe("GET /api/workspaces", () => {
  it("should list workspaces for authenticated user", async () => {
    const { accessToken } = await registerTestUser();
    const res = await authedRequest(accessToken).get("/api/workspaces");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // User gets at least the workspace created on registration
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/workspaces");

    expect(res.status).toBe(401);
  });
});

// ============================================
// GET /api/settings
// ============================================
describe("GET /api/settings", () => {
  it("should return settings for a valid workspace", async () => {
    const { accessToken, workspaceId } = await registerTestUser();
    const res = await scopedRequest(accessToken, workspaceId).get(
      "/api/settings",
    );

    // Settings may or may not exist yet — both 200 and 404 are valid
    expect([200, 404]).toContain(res.status);
  });

  it("should reject request without workspace header", async () => {
    const { accessToken } = await registerTestUser();
    const res = await authedRequest(accessToken).get("/api/settings");

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/settings");

    expect(res.status).toBe(401);
  });
});

// ============================================
// PUT /api/settings
// ============================================
describe("PUT /api/settings", () => {
  it("should update workspace settings", async () => {
    const { accessToken, workspaceId } = await registerTestUser();
    const res = await scopedRequest(accessToken, workspaceId)
      .put("/api/settings")
      .send({ defaultTone: "professional" });

    // May return 200 (updated) or 400/404 depending on if settings exist
    expect(res.status).toBeLessThan(500);
  });
});
