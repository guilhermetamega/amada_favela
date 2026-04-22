update public.communities as c
set address_items = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'value', item->>'value',
        'label', trim(regexp_replace(item->>'label', '\\s*-?\\s*\\d+\\s*$', '')),
        'address_number', coalesce(
          nullif(item->>'address_number', ''),
          substring(item->>'value' from '(\\d+)\\s*$'),
          substring(item->>'label' from '(\\d+)\\s*$'),
          ''
        ),
        'type', coalesce(nullif(item->>'type', ''), 'others')
      )
    )
    from jsonb_array_elements(c.address_items) as item
  ),
  '[]'::jsonb
)
where jsonb_typeof(c.address_items) = 'array';
