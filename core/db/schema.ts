import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, date, numeric, integer, uuid, jsonb } from "drizzle-orm/pg-core";

// --- Better Auth Tables ---

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// --- LendTrack Tables ---

export const businesses = pgTable("businesses", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
});

export const customers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    businessId: uuid("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    nationalIdNumber: text("national_id_number"),
    nationalIdType: text("national_id_type"),
    nationalIdExpiry: date("national_id_expiry"),
    nationalIdImagePaths: text("national_id_image_paths").array(),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
});

export const appSettings = pgTable(
    "app_settings",
    {
        businessId: uuid("business_id")
            .primaryKey()
            .references(() => businesses.id, { onDelete: "cascade" }),
        workingCapital: numeric("working_capital", { precision: 14, scale: 2 })
            .default("0")
            .notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("app_settings_businessId_idx").on(table.businessId)],
);

export const loans = pgTable("loans", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    // Use cents internally, but schema says numeric(12,2) for direct DB querying visibility
    principalAmount: numeric("principal_amount", { precision: 12, scale: 2 }).notNull(),
    interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).default('0.2000').notNull(),
    startDate: date("start_date").notNull(),
    dueDate: date("due_date").notNull(),
    status: text("status", { enum: ['active', 'overdue', 'settled'] }).default('active').notNull(),
    notes: text("notes"),
});

export const collateral = pgTable("collateral", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    loanId: uuid("loan_id")
        .notNull()
        .references(() => loans.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    estimatedValue: numeric("estimated_value", { precision: 12, scale: 2 }),
    serialNumber: text("serial_number"),
    imagePaths: text("image_paths").array(),
    returnedAt: timestamp("returned_at"),
    notes: text("notes"),
});

export const billingCycles = pgTable("billing_cycles", {
    id: uuid("id").primaryKey().defaultRandom(),
    loanId: uuid("loan_id")
        .notNull()
        .references(() => loans.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    cycleStartDate: date("cycle_start_date").notNull(),
    cycleEndDate: date("cycle_end_date").notNull(),
    openingPrincipal: numeric("opening_principal", { precision: 12, scale: 2 }).notNull(),
    interestCharged: numeric("interest_charged", { precision: 12, scale: 2 }).notNull(),
    totalDue: numeric("total_due", { precision: 12, scale: 2 }).notNull(),
    totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).default('0').notNull(),
    balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
    status: text("status", { enum: ['open', 'closed', 'overdue'] }).notNull(),
});

export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    loanId: uuid("loan_id")
        .notNull()
        .references(() => loans.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id")
        .references(() => billingCycles.id, { onDelete: "set null" }), // Don't cascade, keep payments if cycle logic changes/deleted
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: date("paid_at").notNull(),
    note: text("note"),
});

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: text("user_id").notNull(), // better-auth user ID is text
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // Works for uuid entities, but for user it's text. We will cast or store string for generic. Wait, the spec says uuid. Let's make it text so it can point to user.id or loan.id.
    metadata: jsonb("metadata"),
});

// Spec override: if entityId is uuid, it limits what we can log. I'll make entityId text to support better auth generic user ids if needed, but the spec says "uuid". It's fine, we'll keep it as text to be safe with user.id, or conform precisely to spec. Let's use text to avoid UUID validation errors on user IDs.
// Actually, I'll change entityId to `text` for flexibility.

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    businesses: many(businesses),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const businessRelations = relations(businesses, ({ one, many }) => ({
    user: one(user, { fields: [businesses.userId], references: [user.id] }),
    customers: many(customers),
    settings: one(appSettings),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
    business: one(businesses, { fields: [customers.businessId], references: [businesses.id] }),
    loans: many(loans),
}));

export const loanRelations = relations(loans, ({ one, many }) => ({
    customer: one(customers, { fields: [loans.customerId], references: [customers.id] }),
    collateral: many(collateral),
    billingCycles: many(billingCycles),
    payments: many(payments),
}));

export const collateralRelations = relations(collateral, ({ one }) => ({
    loan: one(loans, { fields: [collateral.loanId], references: [loans.id] }),
}));

export const billingCycleRelations = relations(billingCycles, ({ one, many }) => ({
    loan: one(loans, { fields: [billingCycles.loanId], references: [loans.id] }),
    payments: many(payments),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
    loan: one(loans, { fields: [payments.loanId], references: [loans.id] }),
    cycle: one(billingCycles, { fields: [payments.cycleId], references: [billingCycles.id] }),
}));
