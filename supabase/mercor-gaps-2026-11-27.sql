-- Brightpeer – 27.11.2026: what was still missing compared with Mercor (owner: "2. 3. 4. 6. 7. machen wir").
-- 2) quality rating of the work, 3) help assistant (usage log), 4) ID check with selfie,
-- 6) background check (consent + status), 7) time tracking with start/stop.
-- Additive and safe to run again.

-- 2) Quality: the company (or admin) rates each week of work 1–5 stars with an optional note.
alter table public.timesheets add column if not exists quality smallint check (quality between 1 and 5);
alter table public.timesheets add column if not exists quality_note text;
alter table public.timesheets add column if not exists rated_at timestamptz;

create or replace function public.rate_timesheet(p_id uuid, p_quality int, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_quality is null or p_quality < 1 or p_quality > 5 then raise exception 'invalid rating'; end if;
  if not public.is_admin() and not exists (
    select 1 from timesheets t join contracts c on c.id = t.contract_id where t.id = p_id and c.company_id = auth.uid()
  ) then raise exception 'not allowed'; end if;
  update timesheets set quality = p_quality, quality_note = nullif(left(trim(coalesce(p_note, '')), 1000), ''), rated_at = now()
   where id = p_id and status <> 'rejected';
end $$;
revoke execute on function public.rate_timesheet(uuid, int, text) from public, anon;
grant execute on function public.rate_timesheet(uuid, int, text) to authenticated;

-- the company's hours list now also returns the rating
drop function if exists public.company_timesheets();
create or replace function public.company_timesheets()
returns table(id uuid, title text, expert_first_name text, week_start date, hours numeric, note text, status text, review_note text, quality smallint, quality_note text)
language sql stable security definer set search_path = public as $$
  select t.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), t.week_start, t.hours, t.note, t.status, t.review_note, t.quality, t.quality_note
  from timesheets t
  join contracts c on c.id = t.contract_id
  left join roles r on r.id = c.role_id
  join profiles p on p.id = t.expert_id
  where c.company_id = auth.uid()
  order by t.week_start desc;
$$;
revoke execute on function public.company_timesheets() from public, anon;
grant execute on function public.company_timesheets() to authenticated;

-- average quality per expert (admin only)
create or replace function public.admin_expert_quality() returns table(expert_id uuid, avg_quality numeric, ratings bigint)
language sql stable security definer set search_path = public as $$
  select t.expert_id, round(avg(t.quality)::numeric, 1), count(*) from timesheets t
  where t.quality is not null and public.is_admin() group by t.expert_id;
$$;
revoke execute on function public.admin_expert_quality() from public, anon;
grant execute on function public.admin_expert_quality() to authenticated;

-- 4) ID check: ID document + selfie holding the ID; the admin compares and verifies.
alter table public.expert_documents drop constraint if exists expert_documents_kind_check;
alter table public.expert_documents add constraint expert_documents_kind_check
  check (kind in ('diploma', 'certificate', 'id', 'photo', 'portfolio', 'tax_form', 'selfie'));
alter table public.experts add column if not exists id_status text not null default 'none'
  check (id_status in ('none', 'submitted', 'verified', 'rejected'));
alter table public.experts add column if not exists id_note text;
alter table public.experts add column if not exists id_checked_at timestamptz;

-- 6) Background check: the expert consents, the admin records the result of the external check.
alter table public.experts add column if not exists background_status text not null default 'none'
  check (background_status in ('none', 'consented', 'requested', 'passed', 'failed'));
alter table public.experts add column if not exists background_consent_at timestamptz;
alter table public.experts add column if not exists background_checked_at timestamptz;

-- Experts may only move these checks forward themselves (submit ID, give consent); everything else is admin-only.
create or replace function public.guard_expert_checks() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.id_status is distinct from old.id_status
     and not (new.id_status = 'submitted' and old.id_status in ('none', 'rejected')) then new.id_status := old.id_status; end if;
  new.id_note := old.id_note; new.id_checked_at := old.id_checked_at;
  if new.background_status is distinct from old.background_status
     and not (new.background_status = 'consented' and old.background_status = 'none') then new.background_status := old.background_status; end if;
  if new.background_status = 'consented' and old.background_status = 'none' then new.background_consent_at := now();
  else new.background_consent_at := old.background_consent_at; end if;
  new.background_checked_at := old.background_checked_at;
  return new;
end $$;
drop trigger if exists guard_expert_checks on public.experts;
create trigger guard_expert_checks before update on public.experts for each row execute function public.guard_expert_checks();

-- 7) Time tracking: one running timer per expert; stopping it adds the time to that week's hours.
create table if not exists public.work_timers (
  expert_id uuid primary key references public.experts(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  started_at timestamptz not null default now()
);
alter table public.work_timers enable row level security;
drop policy if exists p_wt_own on public.work_timers;
create policy p_wt_own on public.work_timers for all to authenticated using (expert_id = auth.uid()) with check (expert_id = auth.uid());
grant select, insert, update, delete on public.work_timers to authenticated;

create or replace function public.add_timer_hours(p_contract uuid, p_week date, p_hours numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare cur timesheets%rowtype; h numeric;
begin
  if p_hours is null or p_hours <= 0 or p_hours > 24 then raise exception 'invalid hours'; end if;
  if not exists (select 1 from contracts where id = p_contract and expert_id = auth.uid() and status = 'active') then raise exception 'not allowed'; end if;
  h := round(p_hours * 4) / 4; if h < 0.25 then h := 0.25; end if;
  select * into cur from timesheets where contract_id = p_contract and week_start = p_week;
  if found then
    if cur.status <> 'submitted' then raise exception 'week_locked'; end if;
    update timesheets set hours = least(80, cur.hours + h), note = coalesce(note, 'Time tracker') where id = cur.id;
    return least(80, cur.hours + h);
  end if;
  insert into timesheets (contract_id, expert_id, week_start, hours, note) values (p_contract, auth.uid(), p_week, h, 'Time tracker');
  return h;
end $$;
revoke execute on function public.add_timer_hours(uuid, date, numeric) from public, anon;
grant execute on function public.add_timer_hours(uuid, date, numeric) to authenticated;

-- 3) Help assistant: one row per question, so the Edge Function can limit questions per day.
create table if not exists public.assistant_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists assistant_log_user on public.assistant_log (user_id, created_at);
alter table public.assistant_log enable row level security;
drop policy if exists p_al_admin on public.assistant_log;
create policy p_al_admin on public.assistant_log for select using (public.is_admin());
