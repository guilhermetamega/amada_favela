begin;

alter table public.users
  add column if not exists stripe_customer_id text unique;

alter table public.association
  add column if not exists stripe_account_id text,
  add column if not exists stripe_third_party_account_id text,
  add column if not exists stripe_third_party_label text,
  add column if not exists billing_enabled boolean not null default false;

alter table public.membership_payments
  add column if not exists transfer_group text,
  add column if not exists checkout_mode text,
  add column if not exists platform_retained_cents integer,
  add column if not exists third_party_cents integer,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_event_id text,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists notes text;

create table if not exists public.membership_payment_transfers (
  id uuid primary key default gen_random_uuid(),
  membership_payment_id uuid not null references public.membership_payments(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('kayo', 'third_party', 'association')),
  recipient_account_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  stripe_transfer_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_membership_payments_user_id
  on public.membership_payments(user_id);

create index if not exists idx_membership_payments_status
  on public.membership_payments(status);

create index if not exists idx_membership_payments_subscription_id
  on public.membership_payments(stripe_subscription_id);

create index if not exists idx_membership_payments_checkout_session_id
  on public.membership_payments(stripe_checkout_session_id);

create index if not exists idx_membership_payments_invoice_id
  on public.membership_payments(stripe_invoice_id);

create index if not exists idx_membership_payment_transfers_payment_id
  on public.membership_payment_transfers(membership_payment_id);

commit;
