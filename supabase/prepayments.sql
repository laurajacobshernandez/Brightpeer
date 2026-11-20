-- Prepayment-only billing for the start (owner, 20.11.2026): companies top up a balance first,
-- approved hours are paid from that balance. (Already applied to the live Supabase project.)
create table if not exists public.prepayments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  amount numeric not null check (amount > 0 and amount <= 1000000),
  status text not null default 'requested' check (status in ('requested','open','paid','cancelled')),
  payment_link text,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists prepayments_company_idx on public.prepayments(company_id);
alter table public.prepayments enable row level security;

create policy p_prep_admin on public.prepayments for all using (public.is_admin()) with check (public.is_admin());
create policy p_prep_select on public.prepayments for select using (company_id = auth.uid() or public.is_admin());
create policy p_prep_request on public.prepayments for insert
  with check (company_id = auth.uid() and status = 'requested' and payment_link is null and paid_at is null);

-- Balance = paid prepayments minus approved hours x client rate
create or replace function public.company_balance(p_company uuid default null)
returns table(paid numeric, used numeric, balance numeric)
language sql stable security definer set search_path to 'public'
as $$
  with cid as (
    select case when public.is_admin() and p_company is not null then p_company else auth.uid() end as id
  ),
  p as (select coalesce(sum(amount), 0) v from prepayments, cid where company_id = cid.id and status = 'paid'),
  u as (select coalesce(round(sum(t.hours * c.client_rate), 2), 0) v
        from timesheets t join contracts c on c.id = t.contract_id, cid
        where c.company_id = cid.id and t.status = 'approved')
  select p.v, u.v, p.v - u.v from p, u;
$$;
revoke all on function public.company_balance(uuid) from public, anon;
grant execute on function public.company_balance(uuid) to authenticated;
