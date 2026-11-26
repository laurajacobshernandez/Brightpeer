-- Brightpeer – 26.11.2026: disputes on hours (reason + correction), weekly payout statements, tax details of experts.
-- Additive and safe to run again.

-- 5) Disputes: a rejection carries a reason; the expert sees it and can correct and resend the hours.
alter table public.timesheets add column if not exists review_note text;
alter table public.timesheets add column if not exists reviewed_at timestamptz;

drop function if exists public.review_timesheet(uuid, text);
create or replace function public.review_timesheet(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  if not public.is_admin() and not exists (
    select 1 from timesheets t join contracts c on c.id = t.contract_id
    where t.id = p_id and c.company_id = auth.uid()
  ) then raise exception 'not allowed'; end if;
  update timesheets
     set status = p_status, reviewed_at = now(),
         review_note = case when p_status = 'rejected' then nullif(left(trim(coalesce(p_note, '')), 1000), '') else review_note end
   where id = p_id;
end $$;
revoke execute on function public.review_timesheet(uuid, text, text) from public, anon;
grant execute on function public.review_timesheet(uuid, text, text) to authenticated;

-- Expert corrects rejected hours and sends them again. created_at is reset, so the automatic approval
-- (run_automation: "submitted and older than N days") gives the company the full time again.
create or replace function public.resubmit_timesheet(p_id uuid, p_hours numeric, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_hours is null or p_hours <= 0 or p_hours > 80 then raise exception 'invalid hours'; end if;
  update timesheets
     set hours = p_hours, note = nullif(left(trim(coalesce(p_note, '')), 500), ''), status = 'submitted', created_at = now()
   where id = p_id and expert_id = auth.uid() and status = 'rejected'
     and public.my_active_contract(contract_id);
  if not found then raise exception 'not allowed'; end if;
end $$;
revoke execute on function public.resubmit_timesheet(uuid, numeric, text) from public, anon;
grant execute on function public.resubmit_timesheet(uuid, numeric, text) to authenticated;

drop function if exists public.company_timesheets();
create function public.company_timesheets()
returns table (id uuid, title text, expert_first_name text, week_start date, hours numeric, note text, status text, review_note text)
language sql stable security definer set search_path = public as $$
  select t.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), t.week_start, t.hours, t.note, t.status, t.review_note
  from timesheets t
  join contracts c on c.id = t.contract_id
  left join roles r on r.id = c.role_id
  join profiles p on p.id = t.expert_id
  where c.company_id = auth.uid()
  order by t.week_start desc;
$$;
revoke execute on function public.company_timesheets() from public, anon;
grant execute on function public.company_timesheets() to authenticated;

-- 8) Tax details of experts (self-employed abroad). The expert fills them in; used on payout statements and in the accounting.
alter table public.experts add column if not exists tax_country text;
alter table public.experts add column if not exists tax_status text;
alter table public.experts drop constraint if exists experts_tax_status_check;
alter table public.experts add constraint experts_tax_status_check check (tax_status is null or tax_status in ('individual','company'));
alter table public.experts add column if not exists business_name text;
alter table public.experts add column if not exists tax_id text;
alter table public.experts add column if not exists billing_address text;
alter table public.experts add column if not exists tax_confirmed_at timestamptz;
