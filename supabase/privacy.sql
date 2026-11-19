-- =====================================================================
-- Brightpeer – privacy: encrypted payout details + automatic deletion
-- Run after schema.sql and tests.sql.
-- =====================================================================

-- ---------- 1. Encrypted payout details (IBAN / PayPal) --------------
-- The key lives in Supabase Vault. The plain text is never stored:
-- a trigger encrypts it and empties the plain column.

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'payout_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'payout_key', 'Key for encrypting expert payout details');
  end if;
end $$;

alter table public.experts add column if not exists payout_details_enc bytea;

create or replace function public.payout_key() returns text
language sql stable security definer set search_path = public as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'payout_key' limit 1;
$$;
revoke execute on function public.payout_key() from public, anon, authenticated;

create or replace function public.encrypt_payout() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.payout_details is not null then
    if btrim(new.payout_details) = '' then
      new.payout_details_enc := null;
    else
      new.payout_details_enc := extensions.pgp_sym_encrypt(new.payout_details, public.payout_key());
    end if;
    new.payout_details := null;
  end if;
  return new;
end $$;
revoke execute on function public.encrypt_payout() from public, anon, authenticated;
drop trigger if exists encrypt_payout on public.experts;
create trigger encrypt_payout before insert or update on public.experts
  for each row execute function public.encrypt_payout();

-- encrypt anything that is still stored in plain text
update public.experts set payout_details = payout_details where payout_details is not null;

-- expert: read own details
create or replace function public.my_payout_details() returns text
language sql stable security definer set search_path = public as $$
  select case when payout_details_enc is null then null
              else extensions.pgp_sym_decrypt(payout_details_enc, public.payout_key()) end
  from experts where id = auth.uid();
$$;

-- admin: read all details
create or replace function public.admin_payout_details() returns table (id uuid, details text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query select e.id, extensions.pgp_sym_decrypt(e.payout_details_enc, public.payout_key())
    from experts e where e.payout_details_enc is not null;
end $$;

revoke execute on function public.my_payout_details() from public, anon;
revoke execute on function public.admin_payout_details() from public, anon;
grant execute on function public.my_payout_details(), public.admin_payout_details() to authenticated;

-- ---------- 2. Automatic deletion after 24 months --------------------
-- Daily job: deletes rejected applications and rejected expert accounts
-- older than 24 months. CV files cannot be deleted from SQL; their paths
-- are queued and the website deletes them when the admin opens the Admin page.

create table if not exists public.file_deletions (
  path text primary key,
  bucket text not null default 'cvs',
  queued_at timestamptz not null default now()
);
alter table public.file_deletions enable row level security;
drop policy if exists p_fd_admin on public.file_deletions;
create policy p_fd_admin on public.file_deletions for all using (public.is_admin()) with check (public.is_admin());

alter table public.experts add column if not exists status_changed_at timestamptz not null default now();
create or replace function public.touch_expert_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then new.status_changed_at := now(); end if;
  return new;
end $$;
drop trigger if exists touch_expert_status on public.experts;
create trigger touch_expert_status before update on public.experts
  for each row execute function public.touch_expert_status();

create or replace function public.cleanup_old_data() returns json
language plpgsql security definer set search_path = public as $$
declare n_apps int; n_exp int;
begin
  delete from applications where status = 'rejected' and created_at < now() - interval '24 months';
  get diagnostics n_apps = row_count;

  insert into file_deletions (path)
    select o.name from storage.objects o
    join experts e on (storage.foldername(o.name))[1] = e.id::text
    where o.bucket_id = 'cvs' and e.status = 'rejected' and e.status_changed_at < now() - interval '24 months'
      and not exists (select 1 from contracts c where c.expert_id = e.id)
  on conflict do nothing;

  -- deleting the login removes profile, expert row, applications and test attempts (cascade)
  delete from auth.users u using experts e
   where e.id = u.id and e.status = 'rejected' and e.status_changed_at < now() - interval '24 months'
     and not exists (select 1 from contracts c where c.expert_id = e.id);
  get diagnostics n_exp = row_count;

  return json_build_object('applications', n_apps, 'experts', n_exp);
end $$;
revoke execute on function public.cleanup_old_data() from public, anon, authenticated;

-- admin may delete queued CV files
drop policy if exists cv_delete on storage.objects;
create policy cv_delete on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create extension if not exists pg_cron;
select cron.unschedule('brightpeer-cleanup') where exists (select 1 from cron.job where jobname = 'brightpeer-cleanup');
select cron.schedule('brightpeer-cleanup', '17 3 * * *', 'select public.cleanup_old_data()');
