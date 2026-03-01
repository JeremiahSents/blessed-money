import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../core/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

type SeedLoan = {
  principal: number; // UGX (shillings), stored with 2 decimals
  interestRate: string; // e.g. "0.1500"
  status: "active" | "overdue" | "settled";
  startDate: string;
  dueDate: string;
  notes?: string;
};

type SeedCustomer = {
  name: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  idExpiry?: string;
  notes?: string;
  loans: SeedLoan[];
};

const seedCustomers: SeedCustomer[] = [
  {
    name: "Amina Nakato",
    email: "amina@example.com",
    phone: "+256 701 001 001",
    idType: "NIN",
    idNumber: "CF12345678",
    notes: "Regular borrower, pays via mobile money.",
    loans: [
      { principal: 2_500_000, interestRate: "0.1800", status: "active", startDate: "2025-01-05", dueDate: "2025-06-05" },
      { principal: 1_200_000, interestRate: "0.2000", status: "settled", startDate: "2024-05-01", dueDate: "2024-09-01" },
    ],
  },
  {
    name: "Brian Kato",
    email: "brian@example.com",
    phone: "+256 778 222 333",
    idType: "Passport",
    idNumber: "B1234567",
    loans: [
      { principal: 3_800_000, interestRate: "0.1600", status: "overdue", startDate: "2024-11-15", dueDate: "2025-03-15", notes: "Missed last cycle." },
    ],
  },
  {
    name: "Carol Mirembe",
    email: "carol@example.com",
    phone: "+256 702 444 555",
    idType: "NIN",
    idNumber: "CF87654321",
    loans: [
      { principal: 1_500_000, interestRate: "0.1500", status: "active", startDate: "2025-02-01", dueDate: "2025-05-01" },
    ],
  },
  {
    name: "Denis Ocen",
    email: "denis@example.com",
    phone: "+256 773 888 999",
    idType: "NIN",
    idNumber: "CF11223344",
    loans: [
      { principal: 5_000_000, interestRate: "0.1400", status: "active", startDate: "2024-12-10", dueDate: "2025-06-10" },
    ],
  },
  {
    name: "Evelyn Atwine",
    email: "evelyn@example.com",
    phone: "+256 704 111 222",
    idType: "NIN",
    idNumber: "CF55667788",
    loans: [
      { principal: 900_000, interestRate: "0.2000", status: "settled", startDate: "2024-01-01", dueDate: "2024-04-01" },
    ],
  },
  {
    name: "Frank Mugisha",
    email: "frank@example.com",
    phone: "+256 709 123 123",
    idType: "NIN",
    idNumber: "CF99887766",
    loans: [
      { principal: 2_200_000, interestRate: "0.1750", status: "overdue", startDate: "2024-09-20", dueDate: "2025-02-20" },
    ],
  },
  {
    name: "Grace Namara",
    email: "grace@example.com",
    phone: "+256 772 010 010",
    idType: "NIN",
    idNumber: "CF44556677",
    loans: [
      { principal: 1_000_000, interestRate: "0.1800", status: "active", startDate: "2025-01-20", dueDate: "2025-05-20" },
    ],
  },
  {
    name: "Harriet Ayo",
    email: "harriet@example.com",
    phone: "+256 775 555 777",
    idType: "NIN",
    idNumber: "CF33445566",
    loans: [
      { principal: 4_500_000, interestRate: "0.1500", status: "active", startDate: "2024-08-01", dueDate: "2025-02-01" },
    ],
  },
  {
    name: "Isaac Kasule",
    email: "isaac@example.com",
    phone: "+256 703 808 909",
    idType: "Passport",
    idNumber: "B7654321",
    loans: [
      { principal: 3_000_000, interestRate: "0.1900", status: "overdue", startDate: "2024-10-10", dueDate: "2025-03-10" },
    ],
  },
  {
    name: "Joan Kirabo",
    email: "joan@example.com",
    phone: "+256 706 606 707",
    idType: "NIN",
    idNumber: "CF22334455",
    loans: [
      { principal: 750_000, interestRate: "0.2100", status: "settled", startDate: "2023-12-01", dueDate: "2024-03-01" },
      { principal: 1_300_000, interestRate: "0.1700", status: "active", startDate: "2025-01-10", dueDate: "2025-04-10" },
    ],
  },
];

function toAmount(value: number): string {
  // store as numeric(12,2) string
  return value.toFixed(2);
}

async function seed() {
  console.log("🗑️  Dropping existing data...");

  try {
    await client`
      TRUNCATE TABLE
        payments,
        billing_cycles,
        collateral,
        loans,
        customers
      CASCADE
    `;
    console.log("✅ Tables cleared.");
  } catch (error) {
    console.error("❌ Failed to clear tables:", error);
    process.exit(1);
  }

  console.log("🌱 Seeding database with UGX fixtures...");

  try {
    console.log("Ensuring seed user...");
    const seedUserId = "DPP7Eva9thOBdVLwEUoMz1MApvK8U9se";

    console.log("Creating default business...");
    const [seedBusiness] = await db
      .insert(schema.businesses)
      .values({
        userId: seedUserId,
        name: "Blessed Money Seed Business",
      })
      .returning();

    console.log("Initializing settings...");
    await db.insert(schema.appSettings).values({
      businessId: seedBusiness.id,
      workingCapital: "50000000.00", // 50M base for seed
    });

    for (const customerData of seedCustomers) {
      const [customer] = await db
        .insert(schema.customers)
        .values({
          businessId: seedBusiness.id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          nationalIdType: customerData.idType,
          nationalIdNumber: customerData.idNumber,
          nationalIdExpiry: customerData.idExpiry,
          nationalIdImagePaths: [],
          notes: customerData.notes,
        })
        .returning();

      for (const loanData of customerData.loans) {
        const [loan] = await db
          .insert(schema.loans)
          .values({
            customerId: customer.id,
            principalAmount: toAmount(loanData.principal),
            interestRate: loanData.interestRate,
            status: loanData.status,
            startDate: loanData.startDate,
            dueDate: loanData.dueDate,
            notes: loanData.notes,
          })
          .returning();

        // One billing cycle per loan for test data
        const interest = loanData.principal * parseFloat(loanData.interestRate);
        const totalDue = loanData.principal + interest;
        const paid = loanData.status === "settled" ? totalDue : loanData.status === "active" ? totalDue * 0.5 : 0;
        const balance = totalDue - paid;

        const [cycle] = await db
          .insert(schema.billingCycles)
          .values({
            loanId: loan.id,
            cycleNumber: 1,
            cycleStartDate: loanData.startDate,
            cycleEndDate: loanData.dueDate,
            openingPrincipal: toAmount(loanData.principal),
            interestCharged: toAmount(interest),
            totalDue: toAmount(totalDue),
            totalPaid: toAmount(paid),
            balance: toAmount(balance),
            status: balance <= 0 ? "closed" : loanData.status === "overdue" ? "overdue" : "open",
          })
          .returning();

        if (paid > 0) {
          await db.insert(schema.payments).values({
            loanId: loan.id,
            cycleId: cycle.id,
            amount: toAmount(paid),
            paidAt: loanData.dueDate,
            note: loanData.status === "active" ? "Partial payment" : "Paid in full",
          });
        }
      }
    }

    console.log("✅ Seeding complete (10 customers, mixed loans)");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();