create table if not exists public.sponsor_mercadopago_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
