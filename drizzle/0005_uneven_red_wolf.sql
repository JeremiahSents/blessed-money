ALTER TABLE "businesses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "businesses" CASCADE;--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_business_id_businesses_id_fk";
--> statement-breakpoint
DROP INDEX "app_settings_businessId_idx";--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "business_id";