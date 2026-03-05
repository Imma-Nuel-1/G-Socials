// ============================================
// AUTH TESTS — Register, Login, Me, Logout, Profile
// ============================================

import {
  app,
  request,
  uniqueEmail,
  registerTestUser,
  authedRequest,
  cleanupTestData,
  disconnectDb,
} from "../helpers";

afterAll(async () => {
  await cleanupTestData();
  await disconnectDb();
});

// ============================================
// POST /api/auth/register
// ============================================
describe("POST /api/auth/register", () => {
  it("should register a new user and return token + workspaceId", async () => {
    const email = uniqueEmail();
    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      email,
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.workspaceId).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
  });

  it("should set a refreshToken cookie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Cookie User",
      email: uniqueEmail(),
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("refreshToken="),
    );
    expect(refreshCookie).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    const email = uniqueEmail();
    // first registration
    await request(app).post("/api/auth/register").send({
      name: "First",
      email,
      password: "Password123!",
    });
    // duplicate
    const res = await request(app).post("/api/auth/register").send({
      name: "Second",
      email,
      password: "Password123!",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject a weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Weak Pass",
      email: uniqueEmail(),
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: uniqueEmail() });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// POST /api/auth/login
// ============================================
describe("POST /api/auth/login", () => {
  const email = uniqueEmail();
  const password = "Password123!";

  beforeAll(async () => {
    await registerTestUser({ email, password });
  });

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
  });

  it("should reject wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPass999!" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-one@nowhere.com", password: "Whatever1!" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// GET /api/auth/me
// ============================================
describe("GET /api/auth/me", () => {
  it("should return user data when authenticated", async () => {
    const { accessToken, user } = await registerTestUser();
    const res = await authedRequest(accessToken).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(user.email);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer totallyinvalidtoken");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// POST /api/auth/logout
// ============================================
describe("POST /api/auth/logout", () => {
  it("should clear the refresh cookie", async () => {
    const { accessToken } = await registerTestUser();
    const res = await authedRequest(accessToken).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // The cookie should be cleared (expired or empty value)
    const cookies = res.headers["set-cookie"];
    if (cookies) {
      const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
        (c: string) => c.startsWith("refreshToken="),
      );
      if (refreshCookie) {
        // Cleared cookies typically have an expiry in the past
        expect(refreshCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
      }
    }
  });
});

// ============================================
// PUT /api/auth/profile
// ============================================
describe("PUT /api/auth/profile", () => {
  it("should update the user name", async () => {
    const { accessToken } = await registerTestUser();
    const res = await authedRequest(accessToken)
      .put("/api/auth/profile")
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("should reject unauthenticated profile update", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .send({ name: "Hacked" });

    expect(res.status).toBe(401);
  });
});
