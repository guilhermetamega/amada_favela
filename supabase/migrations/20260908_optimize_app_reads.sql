begin;

create index if not exists idx_polls_community_visible_created
  on public.polls (community, visible_until, created_at desc);

create index if not exists idx_poll_options_poll_position
  on public.poll_options (poll_id, position);

create index if not exists idx_poll_votes_poll_option
  on public.poll_votes (poll_id, option_id);

create index if not exists idx_poll_votes_poll_user
  on public.poll_votes (poll_id, user_id);

create index if not exists idx_payments_user_purpose_status_created
  on public.payments (user_id, purpose, status, created_at desc);

create or replace function public.get_polls_with_results(
  input_manageable boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_community text;
  current_user_role text;
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  select u.comunity, u.role
    into current_user_community, current_user_role
  from public.users as u
  where u.id = current_user_id;

  if not found or current_user_community is null then
    raise exception 'Perfil ou comunidade do usuário não encontrado.'
      using errcode = '42501';
  end if;

  if input_manageable
    and (
      current_user_role is null
      or current_user_role not in ('employee', 'president', 'admin')
    ) then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;

  with eligible_polls as (
    select
      p.id,
      p.community,
      p.title,
      p.description,
      p.status,
      p.created_by,
      p.voting_ends_at,
      p.visible_until,
      p.created_at,
      p.updated_at
    from public.polls as p
    where p.community = current_user_community
      and p.visible_until >= now()
  ),
  vote_counts as (
    select
      v.poll_id,
      v.option_id,
      count(*)::integer as votes_count
    from public.poll_votes as v
    inner join eligible_polls as p on p.id = v.poll_id
    group by v.poll_id, v.option_id
  ),
  poll_totals as (
    select
      vc.poll_id,
      sum(vc.votes_count)::integer as total_votes
    from vote_counts as vc
    group by vc.poll_id
  ),
  poll_options_json as (
    select
      o.poll_id,
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'poll_id', o.poll_id,
          'label', o.label,
          'position', o.position,
          'votes_count', coalesce(vc.votes_count, 0),
          'percentage', case
            when coalesce(pt.total_votes, 0) > 0 then
              round(coalesce(vc.votes_count, 0) * 100.0 / pt.total_votes)::integer
            else 0
          end
        )
        order by o.position
      ) as options
    from public.poll_options as o
    inner join eligible_polls as p on p.id = o.poll_id
    left join vote_counts as vc
      on vc.poll_id = o.poll_id and vc.option_id = o.id
    left join poll_totals as pt on pt.poll_id = o.poll_id
    group by o.poll_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'community', p.community,
        'title', p.title,
        'description', p.description,
        'status', p.status,
        'created_by', p.created_by,
        'voting_ends_at', p.voting_ends_at,
        'visible_until', p.visible_until,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'options', coalesce(po.options, '[]'::jsonb),
        'total_votes', coalesce(pt.total_votes, 0),
        'has_voted', uv.option_id is not null,
        'user_vote_option_id', uv.option_id,
        'voting_open', p.voting_ends_at >= now() and p.status = 'active',
        'visible_now', p.visible_until >= now()
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
    into result
  from eligible_polls as p
  left join poll_options_json as po on po.poll_id = p.id
  left join poll_totals as pt on pt.poll_id = p.id
  left join lateral (
    select v.option_id
    from public.poll_votes as v
    where v.poll_id = p.id
      and v.user_id = current_user_id
    limit 1
  ) as uv on true;

  return result;
end;
$$;

revoke all on function public.get_polls_with_results(boolean) from public;
grant execute on function public.get_polls_with_results(boolean) to authenticated;

create or replace function public.get_open_membership_payment()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', p.id,
    'status', p.status,
    'created_at', p.created_at,
    'checkout_mode', p.checkout_mode,
    'stripe_checkout_session_id', p.stripe_checkout_session_id
  )
    into result
  from public.payments as p
  where p.user_id = current_user_id
    and p.purpose = 'partner_membership'
    and p.status in ('pending', 'processing', 'requires_action')
  order by p.created_at desc
  limit 1;

  return result;
end;
$$;

revoke all on function public.get_open_membership_payment() from public;
grant execute on function public.get_open_membership_payment() to authenticated;

commit;
