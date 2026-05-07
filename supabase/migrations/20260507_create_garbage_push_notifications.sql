begin;

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  community text not null,
  fcm_token text not null unique,
  platform text not null default 'web' check (platform in ('web', 'android', 'ios')),
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz
);

create index if not exists idx_user_push_tokens_user_id
  on public.user_push_tokens(user_id);

create index if not exists idx_user_push_tokens_community_enabled
  on public.user_push_tokens(community, enabled);

create table if not exists public.garbage_collection_notification_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.garbage_collection_schedules(id) on delete cascade,
  community text not null,
  target_occurrence_date date not null,
  target_occurrence_time time not null,
  notification_type text not null default 'ten_minutes_before',
  recipients_count integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (schedule_id, target_occurrence_date, notification_type)
);

create index if not exists idx_garbage_collection_notification_logs_community
  on public.garbage_collection_notification_logs(community, created_at desc);

alter table public.user_push_tokens enable row level security;
alter table public.garbage_collection_notification_logs enable row level security;

drop policy if exists "push tokens read own" on public.user_push_tokens;
create policy "push tokens read own"
  on public.user_push_tokens
  for select
  using (user_id = auth.uid());

drop policy if exists "push tokens insert own community" on public.user_push_tokens;
create policy "push tokens insert own community"
  on public.user_push_tokens
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.comunity = user_push_tokens.community
    )
  );

drop policy if exists "push tokens update own" on public.user_push_tokens;
create policy "push tokens update own"
  on public.user_push_tokens
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push tokens delete own" on public.user_push_tokens;
create policy "push tokens delete own"
  on public.user_push_tokens
  for delete
  using (user_id = auth.uid());

drop policy if exists "garbage notification logs staff read same community" on public.garbage_collection_notification_logs;
create policy "garbage notification logs staff read same community"
  on public.garbage_collection_notification_logs
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.comunity = garbage_collection_notification_logs.community
        and u.role in ('employee','president','admin')
    )
  );

comment on table public.user_push_tokens is
  'FCM registration tokens used to send garbage collection push notifications.';
comment on table public.garbage_collection_notification_logs is
  'Idempotency and delivery summary for garbage collection push notifications.';

commit;
