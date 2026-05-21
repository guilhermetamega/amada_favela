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
begin
  if input_sponsor_id is null then
    raise exception 'sponsor_id is required';
  end if;

  generated_slug := regexp_replace(lower(input_title), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.sponsor_raffles (
    sponsor_id,
    slug,
    title,
    description,
    sales_end_at,
    total_numbers,
    number_price_cents
  )
  values (
    input_sponsor_id,
    generated_slug,
    input_title,
    input_description,
    input_sales_end_at,
    input_total_numbers,
    input_number_price_cents
  )
  returning id into new_id;

  return new_id;
end;
$$;
