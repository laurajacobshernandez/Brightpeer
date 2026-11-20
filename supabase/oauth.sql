-- =====================================================================
-- Brightpeer – sign-in with Google / Microsoft (20.11.2026)
-- Run once in Supabase → SQL Editor (already applied to the live project).
-- A new Google/Microsoft account gets the default role "expert" (the provider sends no role).
-- oauth_finish() runs right after that first sign-in and, when the person started on the
-- company sign-up page, turns the brand-new, still empty expert account into a company account.
-- It only works within 1 hour of account creation and only while the expert profile is untouched,
-- so nobody can switch roles later. Admin can never be chosen.
-- =====================================================================
-- guard_expert as before, plus one exception: oauth_finish() may set referred_by once (flag only settable server-side).
create or replace function public.guard_expert() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status; new.referral_code := old.referral_code;
    if not (current_setting('bp.oauth_finish', true) = 'on' and old.referred_by is null) then
      new.referred_by := old.referred_by;
    end if;
  end if;
  return new;
end $$;

create or replace function public.oauth_finish(kind text, company_name text default null, website text default null, ref text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  p public.profiles%rowtype;
  e public.experts%rowtype;
begin
  if uid is null then return 'no_session'; end if;
  select * into p from public.profiles where id = uid;
  if not found or p.role <> 'expert' or p.created_at < now() - interval '1 hour' then return 'unchanged'; end if;
  select * into e from public.experts where id = uid;
  if kind = 'company' then
    if e.field is not null or e.bio is not null or e.cv_path is not null
       or exists (select 1 from public.applications a where a.expert_id = uid) then return 'unchanged'; end if;
    delete from public.profiles where id = uid;            -- removes the empty expert row (cascade)
    insert into public.profiles (id, role, email, full_name, country) values (uid, 'company', p.email, p.full_name, p.country);
    insert into public.companies (id, company_name, website) values (uid, nullif(left(trim(company_name), 200), ''), nullif(left(trim(website), 300), ''));
    return 'company';
  elsif kind = 'expert' and coalesce(trim(ref), '') <> '' and e.referred_by is null then
    perform set_config('bp.oauth_finish', 'on', true);   -- lets guard_expert keep this one referral value
    update public.experts set referred_by = left(trim(ref), 32) where id = uid;  -- referral link kept through the Google/Microsoft redirect
    return 'expert';
  end if;
  return 'unchanged';
end $$;
revoke all on function public.oauth_finish(text, text, text, text) from public, anon;
grant execute on function public.oauth_finish(text, text, text, text) to authenticated;
