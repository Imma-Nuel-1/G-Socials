// ============================================
// TEST SETUP — Load env vars before anything runs
// ============================================

import dotenv from "dotenv";
import path from "path";

// Load the server's .env so tests have DATABASE_URL, JWT_SECRET, etc.
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

// Force test environment
process.env.NODE_ENV = "test";
// Disable BullMQ workers during testing
process.env.DISABLE_WORKERS = "true";
