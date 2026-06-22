CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "app_settings_userId_idx";--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "business_id" uuid PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_settings_businessId_idx" ON "app_settings" USING btree ("business_id");--> statement-breakpoint
ALTER TABLE "app_settings" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "user_id";