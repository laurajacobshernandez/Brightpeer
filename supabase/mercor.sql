-- =====================================================================
-- Brightpeer – Mercor-like flow (20.11.2026). Run once after schema.sql (already applied to the live project).
-- Additive: new columns, a new interviews table + private storage bucket, offers on contracts.
--   • Roles: responsibilities + skills for the job pages
--   • Experts: headline + skills (filled from the CV), onboarding
--   • Interviews: one short interview per expert (text or voice answers), reviewed by the admin
--   • Contracts: admin sends an OFFER, the expert accepts or declines online (name as signature)
-- =====================================================================

alter table public.roles   add column if not exists responsibilities text;
alter table public.roles   add column if not exists skills text;          -- comma separated
alter table public.experts add column if not exists headline text;
alter table public.experts add column if not exists skills text;          -- comma separated

-- Offers: 'offered' → expert accepts ('active') or declines ('declined'); 'ended' as before.
alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts add constraint contracts_status_check check (status in ('offered','active','declined','ended'));
alter table public.contracts add column if not exists start_date date;
alter table public.contracts add column if not exists offer_note text;
alter table public.contracts add column if not exists accepted_at timestamptz;
alter table public.contracts add column if not exists accepted_name text;

drop function if exists public.expert_contracts();
create function public.expert_contracts()
returns table (id uuid, title text, company_name text, expert_rate numeric, status text, created_at timestamptz,
               start_date date, offer_note text, accepted_at timestamptz, hours_per_week text)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), co.company_name, c.expert_rate, c.status, c.created_at,
         c.start_date, c.offer_note, c.accepted_at, r.hours_per_week
  from contracts c
  left join roles r on r.id = c.role_id
  left join companies co on co.id = c.company_id
  where c.expert_id = auth.uid()
  order by c.created_at desc;
$$;
revoke execute on function public.expert_contracts() from public, anon;
grant execute on function public.expert_contracts() to authenticated;

-- Companies never see declined offers.
create or replace function public.company_contracts()
returns table (id uuid, title text, expert_first_name text, expert_field text, client_rate numeric, status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, r.title), split_part(coalesce(p.full_name, 'Expert'), ' ', 1), e.field, c.client_rate, c.status, c.created_at
  from contracts c
  left join roles r on r.id = c.role_id
  join experts e on e.id = c.expert_id
  join profiles p on p.id = c.expert_id
  where c.company_id = auth.uid() and c.status <> 'declined'
  order by c.created_at desc;
$$;

-- The expert answers an offer. Accepting needs the full name typed as signature.
create or replace function public.respond_offer(p_id uuid, p_accept boolean, p_name text default null)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from contracts where id = p_id and expert_id = auth.uid() and status = 'offered') then
    raise exception 'offer not found';
  end if;
  if p_accept then
    if coalesce(length(trim(p_name)), 0) < 3 then raise exception 'name required'; end if;
    update contracts set status = 'active', accepted_at = now(), accepted_name = left(trim(p_name), 120) where id = p_id;
    return 'active';
  end if;
  update contracts set status = 'declined' where id = p_id;
  return 'declined';
end $$;
revoke execute on function public.respond_offer(uuid, boolean, text) from public, anon;
grant execute on function public.respond_offer(uuid, boolean, text) to authenticated;

-- Interviews ------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null unique references public.experts(id) on delete cascade,
  field text,
  answers jsonb not null default '[]'::jsonb,   -- [{ q, text, audio }]
  status text not null default 'in_progress' check (status in ('in_progress','submitted','reviewed')),
  score int check (score between 1 and 5),
  admin_note text,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
alter table public.interviews enable row level security;

drop policy if exists p_int_select on public.interviews;
create policy p_int_select on public.interviews for select using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_int_insert on public.interviews;
create policy p_int_insert on public.interviews for insert with check (expert_id = auth.uid() and status = 'in_progress');
drop policy if exists p_int_update on public.interviews;
create policy p_int_update on public.interviews for update using ((expert_id = auth.uid() and status = 'in_progress') or public.is_admin());

-- Experts may only save answers and submit; score, note and "reviewed" stay with the admin.
create or replace function public.guard_interview() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.status <> 'in_progress' or new.status not in ('in_progress','submitted') then raise exception 'interview locked'; end if;
    new.score := old.score; new.admin_note := old.admin_note; new.expert_id := old.expert_id; new.started_at := old.started_at;
    new.submitted_at := case when new.status = 'submitted' then now() else null end;
  end if;
  return new;
end $$;
drop trigger if exists guard_interview on public.interviews;
create trigger guard_interview before update on public.interviews
  for each row execute function public.guard_interview();

-- Voice answers (private): <uid>/<file>.webm
insert into storage.buckets (id, name, public) values ('interviews', 'interviews', false)
on conflict (id) do nothing;
drop policy if exists int_insert on storage.objects;
create policy int_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'interviews' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists int_select on storage.objects;
create policy int_select on storage.objects for select to authenticated
  using (bucket_id = 'interviews' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
