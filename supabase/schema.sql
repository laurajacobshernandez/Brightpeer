-- =====================================================================
-- Brightpeer – database schema for Supabase
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'expert' check (role in ('expert','company','admin')),
  email text,
  full_name text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.experts (
  id uuid primary key references public.profiles(id) on delete cascade,
  field text,
  years_experience int,
  linkedin text,
  rate_expectation numeric,
  bio text,
  cv_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  payout_method text check (payout_method in ('bank','paypal')),
  payout_details text,
  referral_code text unique,
  referred_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key references public.profiles(id) on delete cascade,
  company_name text,
  website text,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  field text not null,
  description text,
  requirements text,
  rate_min numeric not null,
  rate_max numeric not null,
  hours_per_week text default '10–20 h / week',
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  note text,
  status text not null default 'submitted' check (status in ('submitted','shortlisted','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique (role_id, expert_id)
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  field text not null,
  experts_needed int default 1,
  hours_per_week int,
  budget text,
  description text,
  status text not null default 'new' check (status in ('new','in_progress','done','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  title text,
  expert_rate numeric not null,
  client_rate numeric not null,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz not null default now()
);

create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  week_start date not null,
  hours numeric not null check (hours > 0 and hours <= 80),
  note text,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (contract_id, week_start)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  week_start date not null,
  hours numeric not null default 0,
  amount numeric not null,
  payment_link text,
  status text not null default 'open' check (status in ('open','paid')),
  created_at timestamptz not null default now(),
  unique (company_id, week_start)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  week_start date not null,
  hours numeric not null default 0,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (expert_id, week_start)
);

-- ---------- Helpers ---------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New sign-up → profile + expert/company row (role "admin" can never be chosen here)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := coalesce(m->>'role', 'expert');
begin
  if r not in ('expert','company') then r := 'expert'; end if;
  insert into public.profiles (id, role, email, full_name, country)
  values (new.id, r, new.email, m->>'full_name', m->>'country');
  if r = 'expert' then
    insert into public.experts (id, field, years_experience, linkedin, rate_expectation, bio, referral_code, referred_by)
    values (
      new.id,
      m->>'field',
      case when (m->>'years') ~ '^\d{1,2}$' then (m->>'years')::int end,
      m->>'linkedin',
      case when (m->>'rate') ~ '^\d{1,4}(\.\d+)?$' then (m->>'rate')::numeric end,
      m->>'bio',
      substr(replace(new.id::text, '-', ''), 1, 8),
      nullif(m->>'ref', '')
    );
  else
    insert into public.companies (id, company_name, website)
    values (new.id, m->>'company_name', m->>'website');
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own row, but never their role / approval status
create or replace function public.guard_profile() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role; new.email := old.email;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

create or replace function public.guard_expert() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status; new.referral_code := old.referral_code; new.referred_by := old.referred_by;
  end if;
  return new;
end $$;
drop trigger if exists guard_expert on public.experts;
create trigger guard_expert before update on public.experts
  for each row execute function public.guard_expert();

-- ---------- Row level security ---------------------------------------

alter table public.profiles     enable row level security;
alter table public.experts      enable row level security;
alter table public.companies    enable row level security;
alter table public.roles        enable row level security;
alter table public.applications enable row level security;
alter table public.requests     enable row level security;
alter table public.contracts    enable row level security;
alter table public.timesheets   enable row level security;
alter table public.invoices     enable row level security;
alter table public.payouts      enable row level security;

-- profiles
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());

-- experts
drop policy if exists p_experts_select on public.experts;
create policy p_experts_select on public.experts for select using (id = auth.uid() or public.is_admin());
drop policy if exists p_experts_update on public.experts;
create policy p_experts_update on public.experts for update using (id = auth.uid() or public.is_admin());

-- companies
drop policy if exists p_companies_select on public.companies;
create policy p_companies_select on public.companies for select using (id = auth.uid() or public.is_admin());
drop policy if exists p_companies_update on public.companies;
create policy p_companies_update on public.companies for update using (id = auth.uid() or public.is_admin());

-- roles (job board is public)
drop policy if exists p_roles_select on public.roles;
create policy p_roles_select on public.roles for select using (status = 'open' or public.is_admin());
drop policy if exists p_roles_admin on public.roles;
create policy p_roles_admin on public.roles for all using (public.is_admin()) with check (public.is_admin());

-- applications
drop policy if exists p_apps_select on public.applications;
create policy p_apps_select on public.applications for select using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_apps_insert on public.applications;
create policy p_apps_insert on public.applications for insert with check (expert_id = auth.uid() and status = 'submitted');
drop policy if exists p_apps_delete on public.applications;
create policy p_apps_delete on public.applications for delete using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_apps_update on public.applications;
create policy p_apps_update on public.applications for update using (public.is_admin());

-- requests
drop policy if exists p_req_select on public.requests;
create policy p_req_select on public.requests for select using (company_id = auth.uid() or public.is_admin());
drop policy if exists p_req_insert on public.requests;
create policy p_req_insert on public.requests for insert with check (company_id = auth.uid() and status = 'new');
drop policy if exists p_req_update on public.requests;
create policy p_req_update on public.requests for update using (public.is_admin());

-- contracts: admin only directly (rates stay private); experts/companies use functions below
drop policy if exists p_contracts_admin on public.contracts;
create policy p_contracts_admin on public.contracts for all using (public.is_admin()) with check (public.is_admin());

-- timesheets
drop policy if exists p_ts_select on public.timesheets;
create policy p_ts_select on public.timesheets for select using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_ts_insert on public.timesheets;
create policy p_ts_insert on public.timesheets for insert with check (
  expert_id = auth.uid() and status = 'submitted'
  and exists (select 1 from public.contracts c where c.id = contract_id and c.expert_id = auth.uid() and c.status = 'active')
);
drop policy if exists p_ts_delete on public.timesheets;
create policy p_ts_delete on public.timesheets for delete using ((expert_id = auth.uid() and status = 'submitted') or public.is_admin());
drop policy if exists p_ts_update on public.timesheets;
create policy p_ts_update on public.timesheets for update using (public.is_admin());

-- invoices
drop policy if exists p_inv_select on public.invoices;
create policy p_inv_select on public.invoices for select using (company_id = auth.uid() or public.is_admin());
drop policy if exists p_inv_admin on public.invoices;
create policy p_inv_admin on public.invoices for all using (public.is_admin()) with check (public.is_admin());

-- payouts
drop policy if exists p_pay_select on public.payouts;
create policy p_pay_select on public.payouts for select using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_pay_admin on public.payouts;
create policy p_pay_admin on public.payouts for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Safe views for experts and companies ---------------------

create or replace function public.expert_contracts()
returns table (id uuid, title text, company_name text, expert_rate numeric, status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), co.company_name, c.expert_rate, c.status, c.created_at
  from contracts c
  left join roles r on r.id = c.role_id
  left join companies co on co.id = c.company_id
  where c.expert_id = auth.uid()
  order by c.created_at desc;
$$;

create or replace function public.company_contracts()
returns table (id uuid, title text, expert_first_name text, expert_field text, client_rate numeric, status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), e.field, c.client_rate, c.status, c.created_at
  from contracts c
  left join roles r on r.id = c.role_id
  join experts e on e.id = c.expert_id
  join profiles p on p.id = c.expert_id
  where c.company_id = auth.uid()
  order by c.created_at desc;
$$;

create or replace function public.company_timesheets()
returns table (id uuid, title text, expert_first_name text, week_start date, hours numeric, note text, status text)
language sql stable security definer set search_path = public as $$
  select t.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), t.week_start, t.hours, t.note, t.status
  from timesheets t
  join contracts c on c.id = t.contract_id
  left join roles r on r.id = c.role_id
  join profiles p on p.id = t.expert_id
  where c.company_id = auth.uid()
  order by t.week_start desc;
$$;

create or replace function public.review_timesheet(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  if not public.is_admin() and not exists (
    select 1 from timesheets t join contracts c on c.id = t.contract_id
    where t.id = p_id and c.company_id = auth.uid()
  ) then raise exception 'not allowed'; end if;
  update timesheets set status = p_status where id = p_id;
end $$;

create or replace function public.generate_payouts(p_week date) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  insert into payouts (expert_id, week_start, hours, amount)
  select t.expert_id, p_week, sum(t.hours), round(sum(t.hours * c.expert_rate), 2)
  from timesheets t join contracts c on c.id = t.contract_id
  where t.status = 'approved' and t.week_start = p_week
  group by t.expert_id
  on conflict (expert_id, week_start) do update
    set hours = excluded.hours, amount = excluded.amount
    where payouts.status = 'pending';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.generate_invoices(p_week date) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  insert into invoices (company_id, week_start, hours, amount)
  select c.company_id, p_week, sum(t.hours), round(sum(t.hours * c.client_rate), 2)
  from timesheets t join contracts c on c.id = t.contract_id
  where t.status = 'approved' and t.week_start = p_week
  group by c.company_id
  on conflict (company_id, week_start) do update
    set hours = excluded.hours, amount = excluded.amount
    where invoices.status = 'open';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare res json;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select json_build_object(
    'experts_total',    (select count(*) from experts),
    'experts_pending',  (select count(*) from experts where status = 'pending'),
    'experts_approved', (select count(*) from experts where status = 'approved'),
    'companies',        (select count(*) from companies),
    'open_roles',       (select count(*) from roles where status = 'open'),
    'new_requests',     (select count(*) from requests where status = 'new'),
    'active_contracts', (select count(*) from contracts where status = 'active'),
    'hours_approved',   (select coalesce(sum(hours),0) from timesheets where status = 'approved'),
    'revenue',          (select coalesce(sum(t.hours * c.client_rate),0) from timesheets t join contracts c on c.id = t.contract_id where t.status = 'approved'),
    'cost',             (select coalesce(sum(t.hours * c.expert_rate),0) from timesheets t join contracts c on c.id = t.contract_id where t.status = 'approved')
  ) into res;
  return res;
end $$;

alter function public.guard_profile() set search_path = public;
alter function public.guard_expert() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.generate_payouts(date) from public, anon;
revoke execute on function public.generate_invoices(date) from public, anon;
revoke execute on function public.review_timesheet(uuid, text) from public, anon;
revoke execute on function public.expert_contracts() from public, anon;
revoke execute on function public.company_contracts() from public, anon;
revoke execute on function public.company_timesheets() from public, anon;
grant execute on function public.admin_stats(), public.generate_payouts(date), public.generate_invoices(date), public.review_timesheet(uuid, text), public.expert_contracts(), public.company_contracts(), public.company_timesheets(), public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

-- ---------- Storage for CVs ------------------------------------------

insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
on conflict (id) do nothing;

drop policy if exists cv_insert on storage.objects;
create policy cv_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists cv_select on storage.objects;
create policy cv_select on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists cv_update on storage.objects;
create policy cv_update on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists cv_delete on storage.objects;
create policy cv_delete on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- Example roles (only if the job board is empty) -----------

insert into public.roles (title, field, description, requirements, rate_min, rate_max, hours_per_week)
select * from (values
  ('Physician – Medical AI Reviewer', 'Medicine', 'Review and improve answers of AI models to clinical questions. Write realistic patient cases and rate model reasoning.', 'Licensed physician (MD), 3+ years clinical experience, fluent English.', 120, 150, '10–20 h / week'),
  ('Lawyer – Legal Reasoning Expert', 'Law', 'Create and grade legal questions, check AI answers for accuracy across contract, corporate and civil law.', 'Admitted lawyer or law degree with 3+ years practice.', 100, 150, '10–20 h / week'),
  ('Senior Software Engineer – Code Evaluation', 'Software', 'Write coding tasks, review AI-generated code, and explain bugs and better solutions.', '5+ years professional software engineering, strong in Python or TypeScript.', 70, 150, '15–30 h / week'),
  ('Chemistry / Mathematics PhD – STEM Tutor for AI', 'Chemistry & Math', 'Design hard STEM problems with step-by-step solutions and grade model reasoning.', 'PhD or Master''s in chemistry, mathematics or physics.', 80, 120, '10–20 h / week'),
  ('Pharmacist – Medication Safety Reviewer', 'Pharmacy', 'Check AI answers about drug interactions, dosing and medication safety.', 'Licensed pharmacist, 2+ years experience.', 80, 110, '5–15 h / week'),
  ('Accountant – Finance & Tax Expert', 'Accounting', 'Create realistic accounting and tax scenarios and review AI answers.', 'CPA / certified accountant or equivalent, 3+ years experience.', 70, 100, '10–20 h / week'),
  ('German Translator – Language Quality', 'Translation (DE)', 'Translate and review English–German texts and rate AI translations for quality and tone.', 'Native German speaker, professional translation experience.', 40, 60, '10–25 h / week')
) as v(title, field, description, requirements, rate_min, rate_max, hours_per_week)
where not exists (select 1 from public.roles);

-- =====================================================================
-- MAKE YOURSELF ADMIN (run once, after you signed up on the website):
--   update public.profiles set role = 'admin' where email = 'YOUR@EMAIL.COM';
-- =====================================================================
