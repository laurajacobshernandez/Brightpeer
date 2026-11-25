-- Automation (25.11.2026, already applied in Supabase): settings, expert score, auto-approval of experts (off by default),
-- automatic expert proposals for new company requests, hours auto-approved after N days, weekly payouts, expenses.

-- ---------- Settings (one row) ----------------------------------------------------------------
create table if not exists public.automation_settings (
  id int primary key default 1 check (id = 1),
  auto_approve_experts boolean not null default false,
  approve_min_test int not null default 80 check (approve_min_test between 0 and 100),
  approve_min_stars int not null default 4 check (approve_min_stars between 1 and 5),
  auto_propose boolean not null default true,
  propose_count int not null default 3 check (propose_count between 1 and 10),
  auto_approve_hours boolean not null default true,
  hours_days int not null default 7 check (hours_days between 1 and 30),
  auto_payouts boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.automation_settings (id) values (1) on conflict do nothing;
alter table public.automation_settings enable row level security;
drop policy if exists p_as_admin on public.automation_settings;
create policy p_as_admin on public.automation_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Expert score (0–100): CV 20 + best test 40 + interview 40 -------------------------
create or replace function public.expert_test_pct(p_expert uuid) returns int
language sql stable security definer set search_path = public as $$
  select max(round(100.0 * mc_score / nullif(mc_max, 0)))::int from test_attempts
   where expert_id = p_expert and status in ('submitted', 'passed');
$$;

create or replace function public.expert_score(p_expert uuid) returns int
language sql stable security definer set search_path = public as $$
  select (case when e.cv_path is not null then 20 else 0 end)
       + round(coalesce(public.expert_test_pct(e.id), 0) * 0.4)::int
       + coalesce((select i.score * 8 from interviews i where i.expert_id = e.id and i.status = 'reviewed'), 0)
  from experts e where e.id = p_expert;
$$;
revoke all on function public.expert_test_pct(uuid), public.expert_score(uuid) from public, anon, authenticated;

create or replace function public.admin_expert_scores()
returns table(expert_id uuid, score int, test_pct int, interview_status text, interview_score int, has_cv boolean, ready boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
  select e.id, public.expert_score(e.id), public.expert_test_pct(e.id), i.status, i.score, e.cv_path is not null,
         (e.cv_path is not null and public.expert_test_pct(e.id) is not null and i.status = 'reviewed')
  from experts e left join interviews i on i.expert_id = e.id;
end $$;
revoke all on function public.admin_expert_scores() from public, anon;
grant execute on function public.admin_expert_scores() to authenticated;

-- ---------- Auto-approval of experts (only when switched on) ---------------------------------
create or replace function public.auto_approve_experts() returns int
language plpgsql security definer set search_path = public as $$
declare s automation_settings; n int;
begin
  select * into s from automation_settings where id = 1;
  if not s.auto_approve_experts then return 0; end if;
  update experts e set status = 'approved'
   where e.status = 'pending' and e.cv_path is not null
     and coalesce(public.expert_test_pct(e.id), -1) >= s.approve_min_test
     and exists (select 1 from interviews i where i.expert_id = e.id and i.status = 'reviewed' and i.score >= s.approve_min_stars);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.auto_approve_experts() from public, anon, authenticated;

create or replace function public.trg_auto_approve() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public.auto_approve_experts(); return null; end $$;
drop trigger if exists auto_approve_on_interview on public.interviews;
create trigger auto_approve_on_interview after update on public.interviews for each statement execute function public.trg_auto_approve();
drop trigger if exists auto_approve_on_test on public.test_attempts;
create trigger auto_approve_on_test after update on public.test_attempts for each statement execute function public.trg_auto_approve();

-- ---------- Automatic proposals for a new company request ------------------------------------
create or replace function public.auto_propose(p_request uuid) returns int
language plpgsql security definer set search_path = public as $$
declare s automation_settings; r requests; n int;
begin
  select * into s from automation_settings where id = 1;
  select * into r from requests where id = p_request;
  if r.id is null then return 0; end if;
  insert into request_candidates (request_id, expert_id, admin_note)
  select r.id, e.id, 'Matched for your request: ' || coalesce(e.years_experience::text || ' years in ', '') || e.field
         || coalesce(', field test ' || public.expert_test_pct(e.id) || ' %', '') || '.'
  from experts e
  where e.status = 'approved' and e.field = r.field
    and not exists (select 1 from request_candidates rc where rc.request_id = r.id and rc.expert_id = e.id)
  order by public.expert_score(e.id) desc, e.years_experience desc nulls last
  limit greatest(0, s.propose_count - (select count(*) from request_candidates rc where rc.request_id = r.id))
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.auto_propose(uuid) from public, anon, authenticated;

create or replace function public.trg_auto_propose() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select auto_propose from automation_settings where id = 1) then perform public.auto_propose(new.id); end if;
  return new;
end $$;
drop trigger if exists auto_propose_on_request on public.requests;
create trigger auto_propose_on_request after insert on public.requests for each row execute function public.trg_auto_propose();

-- An admin button may call auto_propose for any request; companies cannot (guard inside a wrapper)
create or replace function public.admin_auto_propose(p_request uuid) returns int
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return public.auto_propose(p_request);
end $$;
revoke all on function public.admin_auto_propose(uuid) from public, anon;
grant execute on function public.admin_auto_propose(uuid) to authenticated;

-- ---------- Daily job: hours auto-approved, weekly payouts, expert auto-approval --------------
create or replace function public.run_automation() returns json
language plpgsql security definer set search_path = public as $$
declare s automation_settings; n_hours int := 0; n_pay int := 0; n_exp int := 0;
begin
  select * into s from automation_settings where id = 1;
  if s.auto_approve_hours then
    update timesheets set status = 'approved'
     where status = 'submitted' and created_at < now() - make_interval(days => s.hours_days);
    get diagnostics n_hours = row_count;
  end if;
  if s.auto_payouts then
    insert into payouts (expert_id, week_start, hours, amount)
    select t.expert_id, t.week_start, sum(t.hours), round(sum(t.hours * c.expert_rate), 2)
      from timesheets t join contracts c on c.id = t.contract_id
     where t.status = 'approved' and t.week_start < date_trunc('week', now())::date
     group by t.expert_id, t.week_start
    on conflict (expert_id, week_start) do update set hours = excluded.hours, amount = excluded.amount
     where payouts.status = 'pending' and (payouts.hours, payouts.amount) is distinct from (excluded.hours, excluded.amount);
    get diagnostics n_pay = row_count;
  end if;
  n_exp := public.auto_approve_experts();
  return json_build_object('hours_approved', n_hours, 'payouts', n_pay, 'experts_approved', n_exp, 'at', now());
end $$;
revoke all on function public.run_automation() from public, anon, authenticated;

create or replace function public.admin_run_automation() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return public.run_automation();
end $$;
revoke all on function public.admin_run_automation() from public, anon;
grant execute on function public.admin_run_automation() to authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'brightpeer-automation';
select cron.schedule('brightpeer-automation', '7 5 * * *', 'select public.run_automation()');

-- ---------- Expenses (for the automatic bookkeeping) ------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  description text not null check (length(description) <= 300),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'CHF' check (currency in ('CHF','USD','EUR')),
  foreign_service boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
drop policy if exists p_exp_admin on public.expenses;
create policy p_exp_admin on public.expenses for all using (public.is_admin()) with check (public.is_admin());
