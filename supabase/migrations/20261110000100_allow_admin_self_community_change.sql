-- Allow an admin to change only their own community through the audited RPC.
-- The role check below still rejects this exception for every other role.
do $migration$
declare
  routine_definition text;
  old_guard text := $guard$
  if p_actor_user_id = p_target_user_id then
    raise exception
      'Use o perfil pessoal para alterar os próprios dados.';
  end if;
$guard$;
  old_admin_guard text := $guard$
  if target_role = 'admin' then
    raise exception
      'Administradores não podem ser alterados por este fluxo.';
  end if;
$guard$;
  new_guard text := $guard$
  if p_actor_user_id = p_target_user_id
    and not (
      p_changes is not null
      and jsonb_typeof(p_changes) = 'object'
      and p_changes ? 'comunity'
      and (select count(*) from jsonb_object_keys(p_changes)) = 1
    ) then
    raise exception
      'Na própria conta, o administrador pode alterar somente a comunidade.';
  end if;
$guard$;
  new_admin_guard text := $guard$
  if target_role = 'admin'
    and not (
      p_actor_user_id = p_target_user_id
      and actor_role = 'admin'
      and p_changes ? 'comunity'
      and (select count(*) from jsonb_object_keys(p_changes)) = 1
    ) then
    raise exception
      'Administradores não podem ser alterados por este fluxo.';
  end if;
$guard$;
begin
  select pg_get_functiondef(
    'public.admin_apply_user_update(uuid,uuid,jsonb,text,text[],jsonb,text,text)'::regprocedure
  ) into routine_definition;

  if position(old_guard in routine_definition) = 0 then
    raise exception 'Não foi possível localizar a validação de autoedição esperada.';
  end if;

  routine_definition := replace(routine_definition, old_guard, new_guard);
  if position(old_admin_guard in routine_definition) = 0 then
    raise exception 'Não foi possível localizar a validação de role admin esperada.';
  end if;
  routine_definition := replace(routine_definition, old_admin_guard, new_admin_guard);
  execute routine_definition;
end;
$migration$;
