-- Remove businesses table and businessId foreign keys
-- Drop businessId FK from customers, drop businesses table, recreate app_settings as singleton

-- 1. Drop app_settings (depends on businesses)
DROP TABLE IF EXISTS "app_settings";

-- 2. Drop businessId column from customers
ALTER TABLE "customers" DROP COLUMN IF EXISTS "business_id";

-- 3. Drop businesses table
DROP TABLE IF EXISTS "businesses";

-- 4. Recreate app_settings as a singleton (no business FK)
CREATE TABLE "app_settings" (
    "id" text PRIMARY KEY DEFAULT 'singleton',
    "working_capital" numeric(14, 2) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Insert default singleton row
INSERT INTO "app_settings" ("id", "working_capital") VALUES ('singleton', '0')
ON CONFLICT ("id") DO NOTHING;
