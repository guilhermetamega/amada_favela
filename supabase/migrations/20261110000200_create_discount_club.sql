create table if not exists public.discount_club_stores (
  id uuid primary key default gen_random_uuid(),
  api_store_id text not null,
  name text not null,
  niche text,
  community text not null,
  photo_url text,
  whatsapp text,
  premium boolean not null default false,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  source_data jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community, api_store_id)
);

create index if not exists discount_club_stores_public_idx
  on public.discount_club_stores (community, status, name);

alter table public.discount_club_stores enable row level security;

create policy "Residents can view active discount club stores in their community"
  on public.discount_club_stores for select to authenticated
  using (
    status = 'active'
    and community = (select comunity from public.users where id = auth.uid())
  );

create policy "Association staff can manage discount club stores in their community"
  on public.discount_club_stores for all to authenticated
  using (
    exists (
      select 1 from public.users actor
      where actor.id = auth.uid()
        and actor.role in ('employee', 'president', 'admin')
        and (actor.role = 'admin' or actor.comunity = discount_club_stores.community)
    )
  )
  with check (
    exists (
      select 1 from public.users actor
      where actor.id = auth.uid()
        and actor.role in ('employee', 'president', 'admin')
        and (actor.role = 'admin' or actor.comunity = discount_club_stores.community)
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('discount_club', 'discount_club', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Discount club photos are public"
  on storage.objects for select to public
  using (bucket_id = 'discount_club');

create policy "Association staff upload discount club photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'discount_club'
    and exists (
      select 1 from public.users actor
      where actor.id = auth.uid()
        and actor.role in ('employee', 'president', 'admin')
    )
  );
