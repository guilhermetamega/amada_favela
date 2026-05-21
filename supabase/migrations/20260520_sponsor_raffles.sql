create extension if not exists pgcrypto;

create table if not exists public.sponsor_raffles (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null,
  slug text not null unique,
  title text not null,
  description text not null,
  sales_end_at timestamptz not null,
  total_numbers int not null check (total_numbers between 1 and 10000),
  number_price_cents int not null check (number_price_cents > 0),
  image_paths text[] not null default '{}',
  status text not null default 'active' check (status in ('draft','active','closed')),
  winning_number int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raffle_tickets (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.sponsor_raffles(id) on delete cascade,
  ticket_number int not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_instagram text,
  buyer_email text,
  payment_id uuid,
  created_at timestamptz not null default now(),
  unique (raffle_id, ticket_number)
);

alter table public.sponsor_raffles enable row level security;
alter table public.raffle_tickets enable row level security;

create policy "public can read active raffles"
on public.sponsor_raffles for select
using (true);

create policy "sponsor manages own raffles"
on public.sponsor_raffles for all
using (auth.uid() = sponsor_id)
with check (auth.uid() = sponsor_id);

create policy "public can read tickets"
on public.raffle_tickets for select
using (true);

create policy "service inserts tickets"
on public.raffle_tickets for insert
to service_role
with check (true);

create or replace function public.create_sponsor_raffle(
  input_title text,
  input_description text,
  input_sales_end_at timestamptz,
  input_total_numbers int,
  input_number_price_cents int
) returns uuid
language plpgsql
security definer
as $$
declare new_id uuid;
declare generated_slug text;
begin
  generated_slug := regexp_replace(lower(input_title), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6);
  insert into public.sponsor_raffles (sponsor_id, slug, title, description, sales_end_at, total_numbers, number_price_cents)
  values (auth.uid(), generated_slug, input_title, input_description, input_sales_end_at, input_total_numbers, input_number_price_cents)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.get_public_raffle(input_slug text)
returns jsonb
language plpgsql
security definer
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', r.id,
    'sponsor_id', r.sponsor_id,
    'slug', r.slug,
    'title', r.title,
    'description', r.description,
    'sales_end_at', r.sales_end_at,
    'total_numbers', r.total_numbers,
    'number_price_cents', r.number_price_cents,
    'status', r.status,
    'winning_number', r.winning_number,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'images', r.image_paths,
    'sold_numbers', coalesce((select jsonb_agg(ticket_number) from public.raffle_tickets t where t.raffle_id = r.id), '[]'::jsonb)
  ) into result
  from public.sponsor_raffles r
  where r.slug = input_slug
  limit 1;
  return result;
end;
$$;

insert into storage.buckets(id, name, public) values ('sponsor-raffles','sponsor-raffles', true)
on conflict (id) do nothing;

create policy "public read raffle images" on storage.objects for select using (bucket_id = 'sponsor-raffles');
create policy "sponsor upload raffle images" on storage.objects for insert to authenticated with check (bucket_id = 'sponsor-raffles');
