--
-- PostgreSQL database cluster dump
--

\restrict YeweE8bbXajrr0kgUbHIm17oiEyj1ttHBaUP6vUmg4c6L981rDk3gvCHYPiBd2a

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:sKt2WV1e2zY/k0b7oOYZew==$7KkNmyi01derm2r/AVZWcIRA0eFjZlzNrU25Of9dUGw=:d7JlprD2ivJSh3YzBItcA31pkdccdIeZoSHm5TdPeCI=';

--
-- User Configurations
--








\unrestrict YeweE8bbXajrr0kgUbHIm17oiEyj1ttHBaUP6vUmg4c6L981rDk3gvCHYPiBd2a

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict mdtOKa53b5IcSuZcY4LmzBhWpekKyFbSoBGqdICSRlFKefbHPgjCho177ZLzvqs

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict mdtOKa53b5IcSuZcY4LmzBhWpekKyFbSoBGqdICSRlFKefbHPgjCho177ZLzvqs

--
-- Database "LSsoftdev" dump
--

--
-- PostgreSQL database dump
--

\restrict pKrgJBadpBtJaqEPIC1OIpWvJchliPshWA6LTd4yXcdWoXrSHQkLtvIQAyAKGLj

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: LSsoftdev; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "LSsoftdev" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE "LSsoftdev" OWNER TO postgres;

\unrestrict pKrgJBadpBtJaqEPIC1OIpWvJchliPshWA6LTd4yXcdWoXrSHQkLtvIQAyAKGLj
\connect "LSsoftdev"
\restrict pKrgJBadpBtJaqEPIC1OIpWvJchliPshWA6LTd4yXcdWoXrSHQkLtvIQAyAKGLj

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: customer_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customer_type_enum AS ENUM (
    'B2C',
    'B2B'
);


ALTER TYPE public.customer_type_enum OWNER TO postgres;

--
-- Name: expense_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expense_category_enum AS ENUM (
    'WATER',
    'ELEC',
    'SALARY',
    'FUEL',
    'MAINTENANCE',
    'OTHER'
);


ALTER TYPE public.expense_category_enum OWNER TO postgres;

--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'PENDING',
    'PICKUP',
    'WASHING',
    'PACKING',
    'DELIVERY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_enum AS ENUM (
    'ADMIN',
    'STAFF',
    'DRIVER'
);


ALTER TYPE public.role_enum OWNER TO postgres;

--
-- Name: sub_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sub_status_enum AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public.sub_status_enum OWNER TO postgres;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    label character varying(50) NOT NULL,
    address_detail text NOT NULL,
    sub_district character varying(100) NOT NULL,
    district character varying(100) DEFAULT 'Lat Krabang'::character varying NOT NULL,
    province character varying(100) DEFAULT 'Bangkok'::character varying NOT NULL,
    zip_code character varying(5) DEFAULT '10520'::character varying NOT NULL,
    google_map_link text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: bank_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    matched_order_id uuid NOT NULL,
    transaction_date date NOT NULL,
    transaction_time time without time zone,
    amount numeric(10,2) NOT NULL,
    bank_source character varying(100),
    description text,
    is_reconciled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bank_transactions OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    business_name character varying(200) NOT NULL,
    price_per_kg numeric(10,2) NOT NULL,
    credit_term_days integer DEFAULT 30,
    contract_start date NOT NULL,
    contract_end date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: customer_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    remaining_quota integer NOT NULL,
    status public.sub_status_enum DEFAULT 'ACTIVE'::public.sub_status_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_subscriptions OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    fname character varying(100) NOT NULL,
    lname character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(10) NOT NULL,
    line_user_id character varying(100) NOT NULL,
    type public.customer_type_enum DEFAULT 'B2C'::public.customer_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dept_name character varying(100) NOT NULL,
    dept_code character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    department_id uuid,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    fname character varying(100) NOT NULL,
    lname character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(10) NOT NULL,
    "position" character varying(100),
    role public.role_enum DEFAULT 'STAFF'::public.role_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recorded_by_employee_id uuid,
    title character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    category public.expense_category_enum NOT NULL,
    expense_date date DEFAULT CURRENT_DATE,
    receipt_image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    service_name character varying(100) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit character varying(20) NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    changed_by_employee_id uuid,
    status_from character varying(50),
    status_to character varying(50),
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_logs OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    address_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    tracking_code character varying(20) NOT NULL,
    status public.order_status_enum DEFAULT 'PENDING'::public.order_status_enum,
    total_price numeric(10,2) DEFAULT 0.00,
    delivery_fee numeric(10,2) DEFAULT 0.00,
    is_paid boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    quota_limit integer NOT NULL,
    duration_days integer DEFAULT 30,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, customer_id, label, address_detail, sub_district, district, province, zip_code, google_map_link, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: bank_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_transactions (id, matched_order_id, transaction_date, transaction_time, amount, bank_source, description, is_reconciled, created_at) FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, customer_id, business_name, price_per_kg, credit_term_days, contract_start, contract_end, created_at) FROM stdin;
\.


--
-- Data for Name: customer_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_subscriptions (id, customer_id, plan_id, start_date, end_date, remaining_quota, status, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, username, password_hash, fname, lname, email, phone, line_user_id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, dept_name, dept_code, created_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, department_id, username, password_hash, fname, lname, email, phone, "position", role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, recorded_by_employee_id, title, amount, category, expense_date, receipt_image_url, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, service_name, quantity, unit, price) FROM stdin;
\.


--
-- Data for Name: order_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_logs (id, order_id, changed_by_employee_id, status_from, status_to, "timestamp") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, customer_id, address_id, driver_id, tracking_code, status, total_price, delivery_fee, is_paid, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, price, quota_limit, duration_days, description, is_active, created_at) FROM stdin;
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: bank_transactions bank_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: customer_subscriptions customer_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_line_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_line_user_id_key UNIQUE (line_user_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_username_key UNIQUE (username);


--
-- Name: departments departments_dept_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_dept_code_key UNIQUE (dept_code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_username_key UNIQUE (username);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_logs order_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_logs
    ADD CONSTRAINT order_logs_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_tracking_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tracking_code_key UNIQUE (tracking_code);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: idx_addresses_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_addresses_customer_id ON public.addresses USING btree (customer_id);


--
-- Name: idx_bank_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_transactions_date ON public.bank_transactions USING btree (transaction_date);


--
-- Name: idx_bank_transactions_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_transactions_order_id ON public.bank_transactions USING btree (matched_order_id);


--
-- Name: idx_contracts_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_customer_id ON public.contracts USING btree (customer_id);


--
-- Name: idx_customers_line_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_line_id ON public.customers USING btree (line_user_id);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_customers_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_username ON public.customers USING btree (username);


--
-- Name: idx_employees_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_department_id ON public.employees USING btree (department_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_expenses_recorded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_recorded_by ON public.expenses USING btree (recorded_by_employee_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_logs_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_logs_order_id ON public.order_logs USING btree (order_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_driver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_driver_id ON public.orders USING btree (driver_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_subscriptions_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_customer_id ON public.customer_subscriptions USING btree (customer_id);


--
-- Name: idx_subscriptions_plan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_plan_id ON public.customer_subscriptions USING btree (plan_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.customer_subscriptions USING btree (status);


--
-- Name: customers update_customers_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_timestamp BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: employees update_employees_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_employees_timestamp BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: orders update_orders_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: addresses addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: bank_transactions bank_transactions_matched_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_matched_order_id_fkey FOREIGN KEY (matched_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_subscriptions customer_subscriptions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_subscriptions customer_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_recorded_by_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_recorded_by_employee_id_fkey FOREIGN KEY (recorded_by_employee_id) REFERENCES public.employees(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_logs order_logs_changed_by_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_logs
    ADD CONSTRAINT order_logs_changed_by_employee_id_fkey FOREIGN KEY (changed_by_employee_id) REFERENCES public.employees(id);


--
-- Name: order_logs order_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_logs
    ADD CONSTRAINT order_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.employees(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict pKrgJBadpBtJaqEPIC1OIpWvJchliPshWA6LTd4yXcdWoXrSHQkLtvIQAyAKGLj

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict NJ9IDIfTg9WpTXDM67IxBjbFhBQ5Ud5iNL4FjF4XiYOVF7x7mbdhFzoyaeMpWXv

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict NJ9IDIfTg9WpTXDM67IxBjbFhBQ5Ud5iNL4FjF4XiYOVF7x7mbdhFzoyaeMpWXv

--
-- PostgreSQL database cluster dump complete
--

