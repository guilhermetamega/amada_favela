-- Validate service_role using modern request.jwt.claims, with legacy GUC fallback.
-- Existing function ACL stays intact because CREATE OR REPLACE preserves privileges.
CREATE OR REPLACE FUNCTION public.admin_apply_user_update(p_actor_user_id uuid, p_target_user_id uuid, p_changes jsonb, p_action_type text, p_changed_fields text[], p_change_summary jsonb, p_verification_method text, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_role text;
  actor_community text;

  target_role text;
  target_community text;

  employee_can_edit_basic boolean;
  target_association_id uuid;

  allowed_fields constant text[] := array[
    'fullname',
    'phone',
    'address_1',
    'address_number',
    'address_2',
    'zipcode',
    'email',
    'cpf',
    'birth',
    'role',
    'comunity'
  ];

  basic_fields constant text[] := array[
    'fullname',
    'phone',
    'address_1',
    'address_number',
    'address_2',
    'zipcode'
  ];

  sensitive_fields constant text[] := array[
    'email',
    'cpf',
    'birth',
    'role',
    'comunity'
  ];

  updated_user public.users%rowtype;
begin
  if coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_setting('request.jwt.claim.role', true)
  ) is distinct from 'service_role' then
    raise exception 'Operação restrita ao backend confiável.'
      using errcode = '42501';
  end if;

  if p_actor_user_id is null
    or p_target_user_id is null then
    raise exception 'Operador e usuário são obrigatórios.';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise exception
      'Use o perfil pessoal para alterar os próprios dados.';
  end if;

  if p_changes is null
    or jsonb_typeof(p_changes) <> 'object'
    or p_changes = '{}'::jsonb then
    raise exception 'Nenhuma alteração foi informada.';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_changes) field_name
    where field_name <> all(allowed_fields)
  ) then
    raise exception
      'A solicitação contém campos não autorizados.';
  end if;

  if p_action_type not in (
    'user_basic_data_updated',
    'user_sensitive_data_updated',
    'user_email_updated',
    'user_cpf_updated',
    'user_role_updated',
    'user_community_updated'
  ) then
    raise exception 'Tipo de auditoria inválido.';
  end if;

  if p_verification_method not in (
    'document_with_photo',
    'existing_registration_confirmation',
    'in_person_confirmation'
  ) then
    raise exception 'Método de verificação inválido.';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception
      'A justificativa deve possuir pelo menos 10 caracteres.';
  end if;

  if length(trim(p_reason)) > 500 then
    raise exception
      'A justificativa deve possuir no máximo 500 caracteres.';
  end if;

  if p_change_summary is null
    or jsonb_typeof(p_change_summary) <> 'object' then
    raise exception 'Resumo de auditoria inválido.';
  end if;

  select
    app_user.role::text,
    app_user.comunity::text
  into
    actor_role,
    actor_community
  from public.users app_user
  where app_user.id = p_actor_user_id;

  if not found then
    raise exception 'Operador não encontrado.';
  end if;

  select
    app_user.role::text,
    app_user.comunity::text
  into
    target_role,
    target_community
  from public.users app_user
  where app_user.id = p_target_user_id
  for update;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  if actor_role not in (
    'admin',
    'president',
    'employee'
  ) then
    raise exception 'Operador sem função administrativa.';
  end if;

  if target_role = 'admin' then
    raise exception
      'Administradores não podem ser alterados por este fluxo.';
  end if;

  if actor_role = 'president' then
    if actor_community is distinct from target_community then
      raise exception
        'O usuário pertence a outra comunidade.';
    end if;

    if target_role not in ('user', 'employee') then
      raise exception
        'O presidente não pode alterar este usuário.';
    end if;

    if p_changes ? 'comunity' then
      raise exception
        'O presidente não pode alterar a comunidade.';
    end if;

    if p_changes ? 'role'
      and p_changes->>'role' not in (
        'user',
        'employee'
      ) then
      raise exception
        'O presidente só pode definir usuário ou funcionário.';
    end if;
  end if;

  if actor_role = 'employee' then
    if actor_community is distinct from target_community then
      raise exception
        'O usuário pertence a outra comunidade.';
    end if;

    if target_role <> 'user' then
      raise exception
        'O funcionário só pode alterar usuários comuns.';
    end if;

    if exists (
      select 1
      from jsonb_object_keys(p_changes) field_name
      where field_name = any(sensitive_fields)
    ) then
      raise exception
        'Funcionários não podem alterar dados sensíveis.';
    end if;

    select
      permission_row.can_edit_user_basic_data
    into
      employee_can_edit_basic
    from public.user_admin_permissions permission_row
    where permission_row.user_id = p_actor_user_id
      and permission_row.community = actor_community
    limit 1;

    if coalesce(
      employee_can_edit_basic,
      false
    ) is false then
      raise exception
        'O funcionário não possui permissão de edição.';
    end if;
  end if;

  if actor_role = 'admin'
    and p_changes ? 'role'
    and p_changes->>'role' not in (
      'user',
      'employee',
      'president'
    ) then
    raise exception
      'A função administrativa informada é inválida.';
  end if;

  if p_changes ? 'comunity' then
    if not exists (
      select 1
      from public.communities community_row
      where community_row.key =
        p_changes->>'comunity'
        and community_row.active is true
    ) then
      raise exception
        'A comunidade informada não existe ou está inativa.';
    end if;
  end if;

  update public.users
  set
    fullname = case
      when p_changes ? 'fullname'
        then p_changes->>'fullname'
      else fullname
    end,

    phone = case
      when p_changes ? 'phone'
        then p_changes->>'phone'
      else phone
    end,

    address_1 = case
      when p_changes ? 'address_1'
        then p_changes->>'address_1'
      else address_1
    end,

    address_number = case
      when p_changes ? 'address_number'
        then p_changes->>'address_number'
      else address_number
    end,

    address_2 = case
      when p_changes ? 'address_2'
        then nullif(
          trim(p_changes->>'address_2'),
          ''
        )
      else address_2
    end,

    zipcode = case
      when p_changes ? 'zipcode'
        then p_changes->>'zipcode'
      else zipcode
    end,

    email = case
      when p_changes ? 'email'
        then lower(trim(p_changes->>'email'))
      else email
    end,

    cpf = case
      when p_changes ? 'cpf'
        then p_changes->>'cpf'
      else cpf
    end,

    birth = case
      when p_changes ? 'birth'
        then (p_changes->>'birth')::date
      else birth
    end,

    role = case
      when p_changes ? 'role'
        then p_changes->>'role'
      else role
    end,

    comunity = case
      when p_changes ? 'comunity'
        then p_changes->>'comunity'
      else comunity
    end

  where id = p_target_user_id

  returning *
  into updated_user;

  select association_row.id
  into target_association_id
  from public.association association_row
  where association_row.community =
    updated_user.comunity
    and association_row.is_active is true
  order by
    association_row.updated_at desc nulls last,
    association_row.created_at desc
  limit 1;

  insert into public.user_admin_audit_logs (
    actor_user_id,
    target_user_id,
    association_id,
    community,
    action_type,
    changed_fields,
    change_summary,
    verification_method,
    reason
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    target_association_id,
    coalesce(
      nullif(
        trim(updated_user.comunity),
        ''
      ),
      'unassigned'
    ),
    p_action_type,
    p_changed_fields,
    p_change_summary,
    p_verification_method,
    trim(p_reason)
  );

  return jsonb_build_object(
    'id',
    updated_user.id,

    'fullname',
    updated_user.fullname,

    'role',
    updated_user.role,

    'community',
    updated_user.comunity,

    'changed_fields',
    p_changed_fields
  );
end;
$function$

