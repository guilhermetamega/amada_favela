begin;

create table if not exists public.garbage_collection_dispatcher_runs (
  id uuid primary key default gen_random_uuid(),
  source text,
  status text not null check (status in ('no_matching_schedules', 'finished', 'error')),
  time_zone text not null,
  target jsonb not null,
  target_iso timestamptz not null,
  active_schedules_same_weekday integer not null default 0,
  matching_schedules integer not null default 0,
  duplicate_schedules integer not null default 0,
  schedules_without_tokens integer not null default 0,
  firebase_auth_requested boolean not null default false,
  fcm_send_attempts integer not null default 0,
  dispatched integer not null default 0,
  success integer not null default 0,
  failed integer not null default 0,
  details jsonb not null default '[]'::jsonb,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_garbage_collection_dispatcher_runs_created_at
  on public.garbage_collection_dispatcher_runs(created_at desc);

alter table public.garbage_collection_dispatcher_runs enable row level security;

drop policy if exists "garbage dispatcher runs staff read" on public.garbage_collection_dispatcher_runs;
create policy "garbage dispatcher runs staff read"
  on public.garbage_collection_dispatcher_runs
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('employee','president','admin')
    )
  );

comment on table public.garbage_collection_dispatcher_runs is
  'Diagnostic history for garbage collection push dispatcher cron runs.';

commit;
