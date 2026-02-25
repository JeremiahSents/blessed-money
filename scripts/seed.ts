import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { parseCurrency } from "../lib/utils";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
    console.log("Seeding database...");

    try {
        // 0. Create a dummy user for the customer relation
        console.log("Creating dummy user...");
        const [dummyUser] = await db.insert(schema.user).values({
            id: "system-seed-user",
            name: "System Admin",
            email: "admin@blessedmoney.local",
            emailVerified: true,
        }).onConflictDoUpdate({
            target: schema.user.id,
            set: { name: "System Admin" }
        }).returning();

        // 1. Create a customer
        console.log("Creating customer...");
        const [customer] = await db.insert(schema.customers).values({
            userId: dummyUser.id,
            name: "Alice Johnson",
            email: "alice@example.com",
            phone: "+1 555-0100",
            nationalIdType: "Driver's License",
            nationalIdNumber: "DL-9876543",
            nationalIdImagePaths: [],
            notes: "VIP customer. Good payment history.",
        }).returning();

        // 2. Create a loan
        console.log("Creating loan...");
        const principalCents = parseCurrency("5000.00").toString();
        const [loan] = await db.insert(schema.loans).values({
            customerId: customer.id,
            principalAmount: principalCents,
            interestRate: "0.1500", // 15%
            status: "active",
            startDate: "2024-01-01",
            dueDate: "2024-12-31",
            notes: "Personal loan for home renovation.",
        }).returning();

        // 3. Create collateral
        console.log("Adding collateral...");
        await db.insert(schema.collateral).values({
            loanId: loan.id,
            description: "2018 Honda Civic",
            estimatedValue: parseCurrency("12000.00").toString(),
            serialNumber: "VIN-1HGBB12345",
            imagePaths: [],
        });

        // 4. Create closed billing cycle (Cycle 1)
        console.log("Creating billing cycles...");
        const cycle1Interest = parseCurrency("750.00").toString(); // 15% of 5000
        const [cycle1] = await db.insert(schema.billingCycles).values({
            loanId: loan.id,
            cycleNumber: 1,
            cycleStartDate: "2024-01-01",
            cycleEndDate: "2024-02-01",
            openingPrincipal: principalCents,
            interestCharged: cycle1Interest,
            totalDue: (BigInt(principalCents) + BigInt(cycle1Interest)).toString(), // $5750
            totalPaid: (BigInt(principalCents) + BigInt(cycle1Interest)).toString(), // Fully paid
            balance: "0.00",
            status: "closed",
        }).returning();

        // 5. Create Payment for Cycle 1
        console.log("Recording payment...");
        await db.insert(schema.payments).values({
            loanId: loan.id,
            cycleId: cycle1.id,
            amount: (BigInt(principalCents) + BigInt(cycle1Interest)).toString(),
            paidAt: "2024-01-28",
            note: "Paid in full via Bank Transfer.",
        });

        // 6. Create active billing cycle (Cycle 2)
        await db.insert(schema.billingCycles).values({
            loanId: loan.id,
            cycleNumber: 2,
            cycleStartDate: "2024-02-01",
            cycleEndDate: "2024-03-01",
            openingPrincipal: "0.00",
            interestCharged: "0.00",
            totalDue: "0.00",
            totalPaid: "0.00",
            balance: "0.00",
            status: "open",
        }).returning();

        // 7. Second loan for the same customer (Overdue)
        console.log("Creating overdue loan...");
        const loan2Principal = parseCurrency("1000.00").toString();
        const [loan2] = await db.insert(schema.loans).values({
            customerId: customer.id,
            principalAmount: loan2Principal,
            interestRate: "0.2000",
            status: "overdue",
            startDate: "2023-11-01",
            dueDate: "2024-05-01",
            notes: "Emergency cash loan.",
        }).returning();

        const loan2Interest = parseCurrency("200.00").toString();
        await db.insert(schema.billingCycles).values({
            loanId: loan2.id,
            cycleNumber: 1,
            cycleStartDate: "2023-11-01",
            cycleEndDate: "2023-12-01",
            openingPrincipal: loan2Principal,
            interestCharged: loan2Interest,
            totalDue: (BigInt(loan2Principal) + BigInt(loan2Interest)).toString(),
            totalPaid: "0.00", // Unpaid
            balance: (BigInt(loan2Principal) + BigInt(loan2Interest)).toString(), // 1200
            status: "overdue",
        });

        console.log("✅ Seeding complete!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        process.exit(0);
    }
}

seed();
