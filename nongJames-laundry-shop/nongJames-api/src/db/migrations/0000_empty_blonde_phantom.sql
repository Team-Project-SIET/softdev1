CREATE TYPE "public"."delivery_type" AS ENUM('WALK_IN', 'PICKUP', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'WASHING', 'PACKING', 'READY', 'COMPLETED', 'CANCELLED', 'pending_pickup', 'washing', 'packing', 'ready_for_delivery', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('b2c', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."order_payment_status" AS ENUM('pending', 'paid', 'partial', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('SCB_QR', 'SCB_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BANK_TRANSFER', 'LINE_PAY', 'PAYPAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."membership_level" AS ENUM('STANDARD', 'VIP');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'STAFF', 'DRIVER', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('INDIVIDUAL', 'BUSINESS', 'B2B');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('ASSIGNED', 'ON_WAY_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'ON_WAY_DELIVERY', 'ARRIVED_DELIVERY', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('utilities', 'salary', 'supplies', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('SERVICE_AGREEMENT', 'MONTHLY_SUBSCRIPTION', 'ANNUAL_MEMBERSHIP', 'CORPORATE_ACCOUNT');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('WASH', 'DRY_CLEAN', 'SPECIAL_CARE', 'RUSH_SERVICE', 'ADDITIONAL_SERVICE');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('LINE_OA', 'EMAIL', 'SMS', 'WEB_PUSH', 'IN_APP');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('ORDER_CREATED', 'ORDER_STATUS_UPDATED', 'ORDER_READY', 'DELIVERY_SCHEDULED', 'DELIVERY_IN_PROGRESS', 'DELIVERY_COMPLETED', 'PAYMENT_REQUIRED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'REFUND_ISSUED', 'LOYALTY_POINTS_EARNED', 'PROMOTION', 'SERVICE_ALERT', 'APPOINTMENT_REMINDER');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"driver_id" uuid,
	"created_by" uuid,
	"order_type" "order_type" DEFAULT 'b2c' NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"payment_status" "order_payment_status" DEFAULT 'pending' NOT NULL,
	"delivery_type" "delivery_type" DEFAULT 'WALK_IN' NOT NULL,
	"pickup_address" text,
	"delivery_address" text,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"delivery_fee" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"is_rush_service" boolean DEFAULT false,
	"rush_service_charge" numeric(10, 2),
	"is_dry_clean" boolean DEFAULT false,
	"special_notes" text,
	"loyalty_points_earned" integer DEFAULT 0,
	"received_date" timestamp with time zone DEFAULT now() NOT NULL,
	"estimated_ready_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"actual_delivery_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_number" varchar(100) NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"scb_transaction_id" varchar(255),
	"scb_reference_no" varchar(255),
	"scb_qr_code" text,
	"scb_payment_url" text,
	"proof_of_payment_url" text,
	"transaction_hash" varchar(255),
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"notes" text,
	"failure_reason" text,
	"is_refunded" boolean DEFAULT false,
	"refund_amount" numeric(12, 2),
	"refund_date" timestamp with time zone,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_number_unique" UNIQUE("payment_number"),
	CONSTRAINT "payments_scb_transaction_id_unique" UNIQUE("scb_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scb_transaction_id" varchar(255),
	"scb_reference_no" varchar(255),
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" "payment_method",
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB',
	"order_id" uuid,
	"user_id" uuid,
	"description" text,
	"category" varchar(100),
	"notes" text,
	"scb_merchant_id" varchar(100),
	"scb_channel_id" varchar(100),
	"scb_invoice_no" varchar(100),
	"scb_terminal_id" varchar(100),
	"scb_raw_response" text,
	"proof_of_payment_url" text,
	"receipt_number" varchar(100),
	"invoice_number" varchar(100),
	"is_reconciled" boolean DEFAULT false,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" uuid,
	"transaction_date" timestamp with time zone NOT NULL,
	"processed_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_scb_transaction_id_unique" UNIQUE("scb_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"line_user_id" varchar(255),
	"line_display_name" varchar(255),
	"line_picture_url" text,
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(10),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"membership_level" "membership_level" DEFAULT 'STANDARD',
	"membership_expiry_date" timestamp with time zone,
	"loyalty_points" integer DEFAULT 0,
	"license_number" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_line_user_id_unique" UNIQUE("line_user_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"line_user_id" varchar(255),
	"line_display_name" varchar(255),
	"line_picture_url" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_description" text,
	"event_location" varchar(255),
	"triggered_by" uuid,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"photo_url" text,
	"event_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_workflow_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" varchar(50),
	"to_status" varchar(50) NOT NULL,
	"changed_by" uuid,
	"reason" text,
	"notes" text,
	"transitioned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"customer_type" "customer_type" DEFAULT 'INDIVIDUAL',
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(10),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"company_name" varchar(255),
	"tax_id" varchar(50),
	"contract_id" uuid,
	"loyalty_points" integer DEFAULT 0,
	"membership_level" varchar(50) DEFAULT 'STANDARD',
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "delivery_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"assignment_type" varchar(50),
	"status" "delivery_status" DEFAULT 'ASSIGNED' NOT NULL,
	"priority" integer DEFAULT 0,
	"estimated_pickup_time" timestamp with time zone,
	"estimated_delivery_time" timestamp with time zone,
	"actual_pickup_time" timestamp with time zone,
	"actual_delivery_time" timestamp with time zone,
	"pickup_address" text,
	"pickup_latitude" numeric(10, 8),
	"pickup_longitude" numeric(11, 8),
	"pickup_photos" text,
	"pickup_signature" text,
	"pickup_notes" text,
	"delivery_address" text,
	"delivery_latitude" numeric(10, 8),
	"delivery_longitude" numeric(11, 8),
	"delivery_photos" text,
	"delivery_signature" text,
	"delivery_notes" text,
	"customer_name" varchar(255),
	"customer_phone" varchar(20),
	"failure_reason" text,
	"failure_attempts" integer DEFAULT 0,
	"estimated_distance" numeric(8, 2),
	"actual_distance" numeric(8, 2),
	"estimated_duration" integer,
	"actual_duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_location_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"assignment_id" uuid,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"accuracy" numeric(8, 2),
	"speed" numeric(5, 2),
	"heading" numeric(6, 2),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_number" varchar(50) NOT NULL,
	"license_expiry" date,
	"license_photo_url" text,
	"vehicle_type" varchar(100),
	"vehicle_plate" varchar(20),
	"registration_number" varchar(50),
	"vehicle_insurance" varchar(255),
	"vehicle_insurance_expiry" date,
	"insurance_photo_url" text,
	"document_url" text,
	"is_active" boolean DEFAULT true,
	"is_available" boolean DEFAULT true,
	"available_since" timestamp with time zone,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_deliveries" integer DEFAULT 0,
	"success_rate" numeric(5, 2) DEFAULT '0',
	"emergency_contact" varchar(20),
	"bank_account" varchar(50),
	"bank_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "drivers_license_number_unique" UNIQUE("license_number"),
	CONSTRAINT "drivers_vehicle_plate_unique" UNIQUE("vehicle_plate"),
	CONSTRAINT "drivers_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "driver_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"task_type" "task_type" NOT NULL,
	"status" "task_status" DEFAULT 'assigned' NOT NULL,
	"notes" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date NOT NULL,
	"description" text NOT NULL,
	"reference_id" varchar(255),
	"account_code" varchar(50) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"debit" numeric(12, 2) DEFAULT '0',
	"credit" numeric(12, 2) DEFAULT '0',
	"balance" numeric(12, 2) NOT NULL,
	"category" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" date NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"total_income" numeric(12, 2) DEFAULT '0' NOT NULL,
	"order_count" integer DEFAULT 0,
	"average_order_value" numeric(12, 2) DEFAULT '0',
	"total_expenses" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_profit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"profit_margin" numeric(5, 2) DEFAULT '0',
	"cash_payments" numeric(12, 2) DEFAULT '0',
	"scb_payments" numeric(12, 2) DEFAULT '0',
	"transfer_payments" numeric(12, 2) DEFAULT '0',
	"total_refunds" numeric(12, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date,
	"paid_date" date,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0',
	"tax" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"remaining_amount" numeric(12, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"invoice_document_url" text,
	"notes" text,
	"payment_terms" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"expense_date" date NOT NULL,
	"receipt_url" text,
	"receipt_number" varchar(100),
	"created_by" uuid,
	"approved_by" uuid,
	"is_approved" varchar(20) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"from_value" text,
	"to_value" text,
	"reason" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"total_price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_number" varchar(100) NOT NULL,
	"contract_type" "contract_type" NOT NULL,
	"client_id" uuid NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"tax_id" varchar(50),
	"business_registration" varchar(100),
	"contact_person" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"billing_address" text,
	"billing_city" varchar(100),
	"billing_postal_code" varchar(10),
	"delivery_address" text,
	"delivery_city" varchar(100),
	"delivery_postal_code" varchar(10),
	"delivery_latitude" numeric(10, 8),
	"delivery_longitude" numeric(11, 8),
	"status" "contract_status" DEFAULT 'DRAFT' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"auto_renewal" boolean DEFAULT false,
	"renewal_notice_days" integer DEFAULT 30,
	"monthly_base_price" numeric(10, 2),
	"annual_base_price" numeric(10, 2),
	"discount_percentage" numeric(5, 2) DEFAULT '0',
	"discount_notes" text,
	"included_services" text,
	"max_monthly_orders" integer,
	"average_monthly_orders" integer,
	"priority_pickup_delivery" boolean DEFAULT false,
	"dedicated_driver" boolean DEFAULT false,
	"preferred_driver_id" uuid,
	"payment_terms" varchar(50),
	"payment_method" varchar(50),
	"credit_limit" numeric(12, 2),
	"current_balance" numeric(12, 2) DEFAULT '0',
	"contract_document" text,
	"special_conditions" text,
	"account_manager_id" uuid,
	"is_active" boolean DEFAULT true,
	"suspension_reason" text,
	"termination_reason" text,
	"terminated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "service_pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"min_quantity" integer,
	"max_quantity" integer,
	"applicable_membership" varchar(50),
	"discount_type" varchar(20),
	"discount_value" numeric(10, 2) NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "service_category" NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"price_per_kg" numeric(10, 2),
	"price_per_item" numeric(10, 2),
	"applicable_item_types" text,
	"estimated_days" integer DEFAULT 3,
	"is_rush_available" boolean DEFAULT false,
	"rush_price" numeric(10, 2),
	"icon" varchar(255),
	"color" varchar(7),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"line_user_id" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"picture_url" text,
	"status_message" text,
	"is_friend" boolean DEFAULT true,
	"friend_since" timestamp with time zone,
	"notifications_enabled" boolean DEFAULT true,
	"language" varchar(10) DEFAULT 'th',
	"subscription_status" varchar(50),
	"last_interaction" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "line_users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "line_users_line_user_id_unique" UNIQUE("line_user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message_template" text NOT NULL,
	"variables_used" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"image_url" text,
	"order_id" uuid,
	"related_id" varchar(255),
	"action_url" text,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"is_sent" boolean DEFAULT false,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_reason" text,
	"line_message_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_workflow_history" ADD CONSTRAINT "order_workflow_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_workflow_history" ADD CONSTRAINT "order_workflow_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location_history" ADD CONSTRAINT "driver_location_history_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location_history" ADD CONSTRAINT "driver_location_history_assignment_id_delivery_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."delivery_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_tasks" ADD CONSTRAINT "driver_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_tasks" ADD CONSTRAINT "driver_tasks_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_history" ADD CONSTRAINT "contract_history_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_history" ADD CONSTRAINT "contract_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_line_items" ADD CONSTRAINT "contract_line_items_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_preferred_driver_id_users_id_fk" FOREIGN KEY ("preferred_driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_account_manager_id_users_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_pricing_rules" ADD CONSTRAINT "service_pricing_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_driver_id_idx" ON "orders" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_received_date_idx" ON "orders" USING btree ("received_date");--> statement-breakpoint
CREATE INDEX "orders_created_by_idx" ON "orders" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "orders_order_type_idx" ON "orders" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_scb_transaction_id_idx" ON "payments" USING btree ("scb_transaction_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_payment_method_idx" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "transactions_scb_transaction_id_idx" ON "transactions" USING btree ("scb_transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_order_id_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_transaction_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_line_user_id_idx" ON "users" USING btree ("line_user_id");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_accounts_provider_idx" ON "oauth_accounts" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "oauth_accounts_provider_account_id_idx" ON "oauth_accounts" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "oauth_accounts_line_user_id_idx" ON "oauth_accounts" USING btree ("line_user_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_service_id_idx" ON "order_items" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "order_events_order_id_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_events_event_type_idx" ON "order_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "order_workflow_history_order_id_idx" ON "order_workflow_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_workflow_history_to_status_idx" ON "order_workflow_history" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "delivery_assignments_order_id_idx" ON "delivery_assignments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "delivery_assignments_driver_id_idx" ON "delivery_assignments" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "delivery_assignments_status_idx" ON "delivery_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "driver_location_history_driver_id_idx" ON "driver_location_history" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_location_history_assignment_id_idx" ON "driver_location_history" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "driver_location_history_recorded_at_idx" ON "driver_location_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "drivers_user_id_idx" ON "drivers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drivers_is_available_idx" ON "drivers" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "driver_tasks_order_id_idx" ON "driver_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "driver_tasks_driver_id_idx" ON "driver_tasks" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_tasks_status_idx" ON "driver_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "driver_tasks_assigned_at_idx" ON "driver_tasks" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "account_ledger_transaction_date_idx" ON "account_ledger" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "account_ledger_account_code_idx" ON "account_ledger" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "financial_reports_report_date_idx" ON "financial_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "financial_reports_report_type_idx" ON "financial_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "invoices_order_id_idx" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expenses_created_by_idx" ON "expenses" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "contract_history_contract_id_idx" ON "contract_history" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_line_items_contract_id_idx" ON "contract_line_items" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contracts_client_id_idx" ON "contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "contracts_contract_number_idx" ON "contracts" USING btree ("contract_number");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_start_date_idx" ON "contracts" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "contracts_end_date_idx" ON "contracts" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "service_pricing_rules_service_id_idx" ON "service_pricing_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category");--> statement-breakpoint
CREATE INDEX "services_is_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "line_users_line_user_id_idx" ON "line_users" USING btree ("line_user_id");--> statement-breakpoint
CREATE INDEX "line_users_user_id_idx" ON "line_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_templates_type_idx" ON "notification_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_order_id_idx" ON "notifications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");