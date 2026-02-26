CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "billing_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"cycle_start_date" date NOT NULL,
	"cycle_end_date" date NOT NULL,
	"opening_principal" numeric(12, 2) NOT NULL,
	"interest_charged" numeric(12, 2) NOT NULL,
	"total_due" numeric(12, 2) NOT NULL,
	"total_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(12, 2) NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collateral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"loan_id" uuid NOT NULL,
	"description" text NOT NULL,
	"estimated_value" numeric(12, 2),
	"serial_number" text,
	"image_paths" text[],
	"returned_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"national_id_number" text,
	"national_id_type" text,
	"national_id_expiry" date,
	"national_id_image_paths" text[],
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"principal_amount" numeric(12, 2) NOT NULL,
	"interest_rate" numeric(5, 4) DEFAULT '0.2000' NOT NULL,
	"start_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"loan_id" uuid NOT NULL,
	"cycle_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"paid_at" date NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral" ADD CONSTRAINT "collateral_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_cycle_id_billing_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."billing_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");