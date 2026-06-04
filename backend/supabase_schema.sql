-- LEAFVA Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- admin_users
-- ─────────────────────────────────────────────
create table if not exists admin_users (
  id          text primary key default gen_random_uuid()::text,
  email       text unique not null,
  name        text not null default 'Admin',
  password_hash text not null,
  role        text not null default 'admin',
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- business_settings (singleton row: id = 'singleton')
-- ─────────────────────────────────────────────
create table if not exists business_settings (
  id                   text primary key default 'singleton',
  company_name         text not null default 'LEAFVA',
  tagline              text not null default 'IT Intelligence, Powered by Nature and Technology',
  ontario_reg_number   text not null default 'Ontario Reg. #XXXXXXXXX',
  business_number      text not null default '',
  address              text not null default 'Ontario, Canada',
  phone                text not null default '+1 (000) 000-0000',
  contact_email        text not null default 'hello@leafva.com',
  resend_api_key       text not null default '',
  resend_sender_email  text not null default 'noreply@leafva.com',
  resend_notify_email  text not null default 'support@leafva.com',
  groq_api_key         text not null default '',
  ai_provider          text not null default 'groq',
  ai_model             text not null default 'llama-3.3-70b-versatile',
  ai_system_prompt     text not null default '',
  created_at           text not null default now()::text,
  updated_at           text not null default now()::text
);

-- ─────────────────────────────────────────────
-- chat_sessions
-- ─────────────────────────────────────────────
create table if not exists chat_sessions (
  id               text primary key default gen_random_uuid()::text,
  visitor_id       text,
  messages         jsonb not null default '[]',
  intake_complete  boolean not null default false,
  intake_data      jsonb,
  ticket_id        text,
  created_at       text not null default now()::text,
  updated_at       text not null default now()::text
);

-- ─────────────────────────────────────────────
-- tickets
-- ─────────────────────────────────────────────
create table if not exists tickets (
  id               text primary key default gen_random_uuid()::text,
  code             text not null,
  name             text not null,
  email            text not null,
  phone            text not null default '',
  category         text not null default 'IT Support',
  urgency          text not null default 'medium',
  details          text not null default '',
  status           text not null default 'new',
  assignee         text not null default '',
  source           text not null default 'ai_chat',
  notes            jsonb not null default '[]',
  chat_session_id  text,
  created_at       text not null default now()::text,
  updated_at       text not null default now()::text
);

-- ─────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────
create table if not exists clients (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  company     text not null default '',
  email       text not null,
  phone       text not null default '',
  address     text not null default '',
  notes       text not null default '',
  tags        jsonb not null default '[]',
  status      text not null default 'lead',
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
create table if not exists projects (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  client_id   text,
  description text not null default '',
  status      text not null default 'planning',
  start_date  text,
  end_date    text,
  budget      numeric not null default 0,
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────────
create table if not exists invoices (
  id           text primary key default gen_random_uuid()::text,
  number       text not null,
  client_id    text,
  client_name  text not null default '',
  client_email text not null default '',
  issue_date   text not null default now()::text,
  due_date     text,
  lines        jsonb not null default '[]',
  subtotal     numeric not null default 0,
  tax_rate     numeric not null default 13,
  tax          numeric not null default 0,
  total        numeric not null default 0,
  status       text not null default 'draft',
  notes        text not null default '',
  created_at   text not null default now()::text,
  updated_at   text not null default now()::text
);

-- ─────────────────────────────────────────────
-- payments
-- ─────────────────────────────────────────────
create table if not exists payments (
  id          text primary key default gen_random_uuid()::text,
  invoice_id  text,
  client_id   text,
  amount      numeric not null,
  method      text not null default 'bank_transfer',
  reference   text not null default '',
  received_at text not null default now()::text,
  notes       text not null default '',
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- payment_transactions (Stripe)
-- ─────────────────────────────────────────────
create table if not exists payment_transactions (
  id              text primary key default gen_random_uuid()::text,
  session_id      text unique not null,
  invoice_id      text,
  invoice_number  text not null default '',
  amount          numeric not null default 0,
  currency        text not null default 'cad',
  status          text not null default 'initiated',
  payment_status  text not null default 'pending',
  checkout_url    text,
  created_at      text not null default now()::text,
  updated_at      text not null default now()::text
);

-- ─────────────────────────────────────────────
-- bookkeeping
-- ─────────────────────────────────────────────
create table if not exists bookkeeping (
  id          text primary key default gen_random_uuid()::text,
  date        text not null default now()::text,
  type        text not null default 'expense',
  category    text not null default 'general',
  amount      numeric not null,
  description text not null default '',
  reference   text not null default '',
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- employees
-- ─────────────────────────────────────────────
create table if not exists employees (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  email       text not null,
  role        text not null default 'Technician',
  salary      numeric not null default 0,
  status      text not null default 'active',
  hire_date   text,
  created_at  text not null default now()::text,
  updated_at  text not null default now()::text
);

-- ─────────────────────────────────────────────
-- purchase_orders
-- ─────────────────────────────────────────────
create table if not exists purchase_orders (
  id           text primary key default gen_random_uuid()::text,
  number       text not null,
  vendor       text not null default '',
  vendor_email text not null default '',
  lines        jsonb not null default '[]',
  total        numeric not null default 0,
  status       text not null default 'draft',
  notes        text not null default '',
  created_at   text not null default now()::text,
  updated_at   text not null default now()::text
);

-- ─────────────────────────────────────────────
-- email_logs
-- ─────────────────────────────────────────────
create table if not exists email_logs (
  id                  text primary key default gen_random_uuid()::text,
  "to"                text not null,
  subject             text not null,
  body                text not null,
  status              text not null default 'queued',
  error               text not null default '',
  related_ticket_id   text,
  related_invoice_id  text,
  created_at          text not null default now()::text,
  updated_at          text not null default now()::text
);

-- ─────────────────────────────────────────────
-- Row Level Security — disable for service_role (backend uses service key)
-- ─────────────────────────────────────────────
alter table admin_users         disable row level security;
alter table business_settings   disable row level security;
alter table chat_sessions        disable row level security;
alter table tickets              disable row level security;
alter table clients              disable row level security;
alter table projects             disable row level security;
alter table invoices             disable row level security;
alter table payments             disable row level security;
alter table payment_transactions disable row level security;
alter table bookkeeping          disable row level security;
alter table employees            disable row level security;
alter table purchase_orders      disable row level security;
alter table email_logs           disable row level security;
