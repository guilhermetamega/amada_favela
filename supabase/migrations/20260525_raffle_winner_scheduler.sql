create or replace function public.assign_closed_raffle_winners()
returns integer
language plpgsql
security definer
as $$
declare
  raffle_row record;
  picked int;
  updated_count int := 0;
begin
  for raffle_row in
    select id from public.sponsor_raffles
    where sales_end_at <= now()
      and status = 'active'
      and winning_number is null
  loop
    select ticket_number into picked
    from public.raffle_tickets
    where raffle_id = raffle_row.id
    order by random()
    limit 1;

    update public.sponsor_raffles
      set winning_number = picked,
          status = 'closed',
          updated_at = now()
    where id = raffle_row.id;

    updated_count := updated_count + 1;
  end loop;

  return updated_count;
end;
$$;
