-- Brightpeer – 26.11.2026: "How to work" per contract (owner chose: experts work in the company's own tools,
-- Brightpeer only records and approves the hours). The company (or the admin) adds instructions and an access link;
-- the expert sees them in the dashboard once the offer is accepted. Additive and safe to run again.

alter table public.contracts add column if not exists work_instructions text;
alter table public.contracts add column if not exists work_link text;
alter table public.contracts drop constraint if exists contracts_work_link_check;
alter table public.contracts add constraint contracts_work_link_check check (work_link is null or work_link ~* '^https://');

-- Experts: same as before + instructions/link, but only for accepted (active/ended) contracts.
drop function if exists public.expert_contracts();
create function public.expert_contracts()
returns table (id uuid, title text, company_name text, expert_rate numeric, status text, created_at timestamptz,
               start_date date, offer_note text, accepted_at timestamptz, hours_per_week text,
               work_instructions text, work_link text)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), co.company_name, c.expert_rate, c.status, c.created_at,
         c.start_date, c.offer_note, c.accepted_at, r.hours_per_week,
         case when c.status in ('active','ended') then c.work_instructions end,
         case when c.status in ('active','ended') then c.work_link end
  from contracts c
  left join roles r on r.id = c.role_id
  left join companies co on co.id = c.company_id
  where c.expert_id = auth.uid()
  order by c.created_at desc;
$$;
revoke execute on function public.expert_contracts() from public, anon;
grant execute on function public.expert_contracts() to authenticated;

-- Companies: same as before + their own instructions/link.
drop function if exists public.company_contracts();
create function public.company_contracts()
returns table (id uuid, title text, expert_first_name text, expert_field text, client_rate numeric, status text, created_at timestamptz,
               work_instructions text, work_link text)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), e.field, c.client_rate, c.status, c.created_at,
         c.work_instructions, c.work_link
  from contracts c
  left join roles r on r.id = c.role_id
  join experts e on e.id = c.expert_id
  join profiles p on p.id = c.expert_id
  where c.company_id = auth.uid() and c.status <> 'declined'
  order by c.created_at desc;
$$;
revoke execute on function public.company_contracts() from public, anon;
grant execute on function public.company_contracts() to authenticated;

-- Company (own contracts) or admin saves instructions + link.
create or replace function public.set_work_info(p_id uuid, p_instructions text, p_link text)
returns void language plpgsql security definer set search_path = public as $$
declare v_link text := nullif(trim(coalesce(p_link, '')), '');
begin
  if v_link is not null and v_link !~* '^https://' then raise exception 'The link must start with https://'; end if;
  if not public.is_admin() and not exists (
    select 1 from contracts where id = p_id and company_id = auth.uid() and status in ('offered','active')
  ) then raise exception 'not allowed'; end if;
  update contracts
     set work_instructions = nullif(left(trim(coalesce(p_instructions, '')), 5000), ''),
         work_link = left(v_link, 1000)
   where id = p_id;
end $$;
revoke execute on function public.set_work_info(uuid, text, text) from public, anon;
grant execute on function public.set_work_info(uuid, text, text) to authenticated;
