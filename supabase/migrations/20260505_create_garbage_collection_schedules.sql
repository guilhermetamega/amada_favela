begin;

create table if not exists public.garbage_collection_schedules (
  id uuid primary key default gen_random_uuid(),
  community text not null,
  weekday text not null check (weekday in ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
  pass_time time not null,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community, weekday, pass_time)
);

create index if not exists idx_garbage_collection_schedules_community
  on public.garbage_collection_schedules(community);

alter table public.garbage_collection_schedules enable row level security;

drop policy if exists "garbage schedules read same community" on public.garbage_collection_schedules;
create policy "garbage schedules read same community"
  on public.garbage_collection_schedules
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.comunity = garbage_collection_schedules.community
    )
  );

drop policy if exists "garbage schedules manage by staff" on public.garbage_collection_schedules;
create policy "garbage schedules manage by staff"
  on public.garbage_collection_schedules
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.comunity = garbage_collection_schedules.community
        and u.role in ('employee','president','admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.comunity = garbage_collection_schedules.community
        and u.role in ('employee','president','admin')
    )
  );

comment on table public.garbage_collection_schedules is
  'Base para contador regressivo de coleta e futura notificação push via Firebase.';

commit;
