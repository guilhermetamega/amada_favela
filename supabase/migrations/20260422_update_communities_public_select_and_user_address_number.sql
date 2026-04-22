alter table public.users
add column if not exists address_number text;

drop policy if exists "communities_select_all_authenticated" on public.communities;

drop policy if exists "communities_select_public" on public.communities;
create policy "communities_select_public"
on public.communities
for select
to anon, authenticated
using (true);
