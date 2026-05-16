create table if not exists public.bingos (
  id uuid primary key default gen_random_uuid(),
  community text not null,
  title text not null,
  scheduled_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  drawn_numbers integer[] not null default '{}',
  current_number integer check (current_number between 1 and 75),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bingo_cards (
  id uuid primary key default gen_random_uuid(),
  bingo_id uuid not null references public.bingos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  community text not null,
  numbers integer[] not null,
  marked_numbers integer[] not null default '{}',
  rerolled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bingo_id, user_id)
);

create index if not exists bingos_community_scheduled_at_idx
  on public.bingos (community, scheduled_at desc);

create index if not exists bingo_cards_bingo_user_idx
  on public.bingo_cards (bingo_id, user_id);

alter table public.bingos enable row level security;
alter table public.bingo_cards enable row level security;

create or replace function public.current_user_community()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.comunity
  from public.users u
  where u.id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
$$;

create or replace function public.is_current_user_bingo_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('employee', 'president', 'admin'), false)
$$;

create or replace function public.is_current_user_partner_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() in ('admin', 'president')
    or exists (
      select 1
      from public.partners p
      where p.user_id = auth.uid()
        and p.expires_at >= now()
        and coalesce(p.status, 'active') not in ('expired', 'cancelled', 'past_due')
    ),
    false
  )
$$;

drop policy if exists "Bingos visible in user community" on public.bingos;
create policy "Bingos visible in user community"
  on public.bingos
  for select
  using (community = public.current_user_community());

drop policy if exists "Managers insert bingos in community" on public.bingos;
create policy "Managers insert bingos in community"
  on public.bingos
  for insert
  with check (
    public.is_current_user_bingo_manager()
    and community = public.current_user_community()
    and created_by = auth.uid()
  );

drop policy if exists "Managers update bingos in community" on public.bingos;
create policy "Managers update bingos in community"
  on public.bingos
  for update
  using (
    public.is_current_user_bingo_manager()
    and community = public.current_user_community()
  )
  with check (
    public.is_current_user_bingo_manager()
    and community = public.current_user_community()
  );

drop policy if exists "Users select own bingo cards" on public.bingo_cards;
create policy "Users select own bingo cards"
  on public.bingo_cards
  for select
  using (
    user_id = auth.uid()
    and community = public.current_user_community()
  );

drop policy if exists "Users insert own bingo cards" on public.bingo_cards;
create policy "Users insert own bingo cards"
  on public.bingo_cards
  for insert
  with check (
    user_id = auth.uid()
    and community = public.current_user_community()
  );

drop policy if exists "Paid users update own bingo cards" on public.bingo_cards;
create policy "Paid users update own bingo cards"
  on public.bingo_cards
  for update
  using (
    user_id = auth.uid()
    and community = public.current_user_community()
    and public.is_current_user_partner_active()
  )
  with check (
    user_id = auth.uid()
    and community = public.current_user_community()
    and public.is_current_user_partner_active()
  );

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_bingos_updated_at on public.bingos;
create trigger touch_bingos_updated_at
  before update on public.bingos
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_bingo_cards_updated_at on public.bingo_cards;
create trigger touch_bingo_cards_updated_at
  before update on public.bingo_cards
  for each row execute function public.touch_updated_at();

create or replace function public.generate_bingo_card_numbers()
returns integer[]
language sql
volatile
as $$
  with picked as (
    select number
    from generate_series(1, 75) as number
    order by random()
    limit 24
  ), positioned as (
    select number, row_number() over () as position
    from picked
  )
  select array_agg(
    case when slot = 13 then null else p.number end
    order by slot
  )
  from generate_series(1, 25) as slot
  left join positioned p
    on p.position = case when slot < 13 then slot else slot - 1 end
$$;

create or replace function public.create_bingo(
  input_title text,
  input_scheduled_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  profile record;
  new_bingo_id uuid;
begin
  select id, role, comunity into profile
  from public.users
  where id = auth.uid();

  if profile.id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if profile.role not in ('employee', 'president', 'admin') then
    raise exception 'Acesso não autorizado.';
  end if;

  if nullif(trim(profile.comunity), '') is null then
    raise exception 'Seu perfil não possui comunidade definida.';
  end if;

  if nullif(trim(input_title), '') is null then
    raise exception 'Informe o título do bingo.';
  end if;

  insert into public.bingos (community, title, scheduled_at, created_by)
  values (profile.comunity, trim(input_title), input_scheduled_at, profile.id)
  returning id into new_bingo_id;

  return new_bingo_id;
end;
$$;

create or replace function public.draw_bingo_number(input_bingo_id uuid)
returns public.bingos
language plpgsql
security definer
set search_path = public
as $$
declare
  profile record;
  bingo_row public.bingos%rowtype;
  available_numbers integer[];
  next_number integer;
begin
  select id, role, comunity into profile
  from public.users
  where id = auth.uid();

  if profile.id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if profile.role not in ('employee', 'president', 'admin') then
    raise exception 'Acesso não autorizado.';
  end if;

  select * into bingo_row
  from public.bingos
  where id = input_bingo_id
  for update;

  if bingo_row.id is null then
    raise exception 'Bingo não encontrado.';
  end if;

  if bingo_row.community <> profile.comunity then
    raise exception 'Acesso não autorizado.';
  end if;

  if bingo_row.status <> 'active' then
    raise exception 'Este bingo está arquivado.';
  end if;

  select array_agg(number)
  into available_numbers
  from generate_series(1, 75) as number
  where not (number = any(bingo_row.drawn_numbers));

  if available_numbers is null or array_length(available_numbers, 1) = 0 then
    raise exception 'Todos os números já foram sorteados.';
  end if;

  select number into next_number
  from unnest(available_numbers) as number
  order by random()
  limit 1;

  update public.bingos
  set drawn_numbers = array_append(bingo_row.drawn_numbers, next_number),
      current_number = next_number
  where id = input_bingo_id
  returning * into bingo_row;

  return bingo_row;
end;
$$;

create or replace function public.get_or_create_bingo_card(input_bingo_id uuid)
returns public.bingo_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  profile record;
  bingo_row public.bingos%rowtype;
  card_row public.bingo_cards%rowtype;
begin
  select id, comunity into profile
  from public.users
  where id = auth.uid();

  if profile.id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into bingo_row
  from public.bingos
  where id = input_bingo_id
    and status = 'active';

  if bingo_row.id is null or bingo_row.community <> profile.comunity then
    raise exception 'Bingo não encontrado.';
  end if;

  select * into card_row
  from public.bingo_cards
  where bingo_id = input_bingo_id
    and user_id = profile.id;

  if card_row.id is not null then
    return card_row;
  end if;

  insert into public.bingo_cards (bingo_id, user_id, community, numbers)
  values (
    input_bingo_id,
    profile.id,
    profile.comunity,
    public.generate_bingo_card_numbers()
  )
  returning * into card_row;

  return card_row;
end;
$$;

create or replace function public.reroll_bingo_card(input_bingo_id uuid)
returns public.bingo_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  card_row public.bingo_cards%rowtype;
begin
  if not public.is_current_user_partner_active() then
    raise exception 'Apenas usuários pagantes podem roletar a cartela.';
  end if;

  card_row := public.get_or_create_bingo_card(input_bingo_id);

  if card_row.rerolled_at is not null then
    raise exception 'Você já roletou a cartela deste bingo.';
  end if;

  update public.bingo_cards
  set numbers = public.generate_bingo_card_numbers(),
      marked_numbers = '{}',
      rerolled_at = now()
  where id = card_row.id
  returning * into card_row;

  return card_row;
end;
$$;
