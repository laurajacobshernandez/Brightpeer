-- Fixes from 25.11.2026 (already applied in Supabase).

-- 1) Interview: experts could not submit the last answer (status in_progress -> submitted was blocked by RLS).
drop policy if exists p_int_update on public.interviews;
create policy p_int_update on public.interviews for update
  using ((expert_id = auth.uid() and status = 'in_progress') or public.is_admin())
  with check ((expert_id = auth.uid() and status in ('in_progress','submitted')) or public.is_admin());

-- 2) Hours: experts could not log hours, because the policy checked contracts, which experts cannot read.
create or replace function public.my_active_contract(p_contract uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from contracts where id = p_contract and expert_id = auth.uid() and status = 'active');
$$;
revoke all on function public.my_active_contract(uuid) from public, anon;
grant execute on function public.my_active_contract(uuid) to authenticated;
drop policy if exists p_ts_insert on public.timesheets;
create policy p_ts_insert on public.timesheets for insert
  with check (expert_id = auth.uid() and status = 'submitted' and public.my_active_contract(contract_id));

-- 3) Hardening (Supabase security advisor)
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.guard_expert() set search_path = public;
