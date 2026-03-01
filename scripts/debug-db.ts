import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../core/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!);
const db = drizzle(client, { schema });

async function debug() {
    console.log("Deleting 'My Business'...");
    await db.delete(schema.businesses).where(eq(schema.businesses.name, "My Business"));

    console.log("\nBusinesses in DB:");
    const businesses = await db.select().from(schema.businesses);
    console.log(businesses);

    console.log("\nCustomers in DB:");
    const customers = await db.select().from(schema.customers);
    console.log(`Found ${customers.length} customers.`);

    process.exit(0);
}

debug();
