create table if not exists public.sponsor_mercadopago_accounts (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null unique references public.sponsors(id) on delete cascade,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status text not null default 'pending',
  mp_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_sponsor_raffle(
  input_title text,
  input_description text,
  input_sales_end_at timestamptz,
  input_total_numbers int,
  input_number_price_cents int,
  input_sponsor_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
  generated_slug text;
  has_active_mp boolean;
begin
  if input_sponsor_id is null then
    raise exception 'sponsor_id is required';
  end if;

  select exists (
    select 1
    from public.sponsor_mercadopago_accounts sma
    where sma.sponsor_id = input_sponsor_id
      and sma.status = 'active'
      and coalesce(sma.access_token, '') <> ''
  ) into has_active_mp;

  if not has_active_mp then
    raise exception 'mercadopago_not_connected';
  end if;

  generated_slug := regexp_replace(lower(input_title), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.sponsor_raffles (
    sponsor_id, slug, title, description, sales_end_at, total_numbers, number_price_cents
  )
  values (
    input_sponsor_id, generated_slug, input_title, input_description, input_sales_end_at, input_total_numbers, input_number_price_cents
  )
  returning id into new_id;

  return new_id;
end;
$$;
