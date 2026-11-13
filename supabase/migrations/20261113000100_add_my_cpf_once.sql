create or replace function public.set_my_cpf(p_cpf text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_cpf text;
  v_sum integer;
  v_digit integer;
  v_index integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '28000';
  end if;

  v_cpf := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');

  if length(v_cpf) <> 11 or v_cpf ~ '^([0-9])\1{10}$' then
    raise exception 'Informe um CPF válido.' using errcode = '22023';
  end if;

  v_sum := 0;
  for v_index in 1..9 loop
    v_sum := v_sum + substring(v_cpf from v_index for 1)::integer * (11 - v_index);
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then v_digit := 0; end if;
  if v_digit <> substring(v_cpf from 10 for 1)::integer then
    raise exception 'Informe um CPF válido.' using errcode = '22023';
  end if;

  v_sum := 0;
  for v_index in 1..10 loop
    v_sum := v_sum + substring(v_cpf from v_index for 1)::integer * (12 - v_index);
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then v_digit := 0; end if;
  if v_digit <> substring(v_cpf from 11 for 1)::integer then
    raise exception 'Informe um CPF válido.' using errcode = '22023';
  end if;

  update public.users
  set cpf = v_cpf
  where id = auth.uid()
    and (cpf is null or btrim(cpf) = '');

  if not found then
    raise exception 'O CPF já foi cadastrado e não pode ser alterado.' using errcode = 'P0001';
  end if;

  return true;
end;
$$;

revoke all on function public.set_my_cpf(text) from public;
grant execute on function public.set_my_cpf(text) to authenticated;
