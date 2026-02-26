import "dotenv/config";
import { execSync } from "child_process";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });

async function resetDatabase() {
  try {
    console.log("🧹 Dropping public schema (cascade)...");
    await client`DROP SCHEMA IF EXISTS public CASCADE;`;

    console.log("📦 Recreating public schema...");
    await client`CREATE SCHEMA IF NOT EXISTS public;`;
    await client`GRANT ALL ON SCHEMA public TO public;`;
    await client`GRANT ALL ON SCHEMA public TO CURRENT_USER;`;
  } finally {
    await client.end();
  }

  console.log("📜 Running migrations with drizzle-kit push...");
  execSync("bunx drizzle-kit push", { stdio: "inherit" });

  // console.log("🌱 Seeding database...");
  // execSync("bun tsx scripts/seed.ts", { stdio: "inherit" });

  console.log("✅ Database reset complete.");
}

resetDatabase().catch((error) => {
  console.error("❌ Reset failed:", error);
  process.exit(1);
});
