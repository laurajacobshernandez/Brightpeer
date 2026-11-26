-- Brightpeer – expert documents (26.11.2026)
-- Besides the CV, experts can upload: diplomas, certificates, ID document,
-- profile photo, work samples and tax forms. Files are private: only the
-- expert and the admin can see them (companies never see them).

create table if not exists public.expert_documents (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  kind text not null check (kind in ('diploma', 'certificate', 'id', 'photo', 'portfolio', 'tax_form')),
  path text not null unique,
  file_name text,
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index if not exists expert_documents_expert on public.expert_documents (expert_id, kind);

alter table public.expert_documents enable row level security;
drop policy if exists p_docs_select on public.expert_documents;
create policy p_docs_select on public.expert_documents for select to authenticated
  using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_docs_insert on public.expert_documents;
create policy p_docs_insert on public.expert_documents for insert to authenticated
  with check (expert_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text);
drop policy if exists p_docs_delete on public.expert_documents;
create policy p_docs_delete on public.expert_documents for delete to authenticated
  using (expert_id = auth.uid() or public.is_admin());

-- Private storage bucket, max. 10 MB per file, PDF and images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expert-docs', 'expert-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists docs_insert on storage.objects;
create policy docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'expert-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists docs_select on storage.objects;
create policy docs_select on storage.objects for select to authenticated
  using (bucket_id = 'expert-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists docs_delete on storage.objects;
create policy docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'expert-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Automatic deletion after 24 months now also covers these documents
create or replace function public.cleanup_old_data() returns json
language plpgsql security definer set search_path = public as $$
declare n_apps int; n_exp int;
begin
  delete from applications where status = 'rejected' and created_at < now() - interval '24 months';
  get diagnostics n_apps = row_count;

  insert into file_deletions (path, bucket)
    select o.name, o.bucket_id from storage.objects o
    join experts e on (storage.foldername(o.name))[1] = e.id::text
    where o.bucket_id in ('cvs', 'expert-docs') and e.status = 'rejected' and e.status_changed_at < now() - interval '24 months'
      and not exists (select 1 from contracts c where c.expert_id = e.id)
  on conflict do nothing;

  delete from auth.users u using experts e
   where e.id = u.id and e.status = 'rejected' and e.status_changed_at < now() - interval '24 months'
     and not exists (select 1 from contracts c where c.expert_id = e.id);
  get diagnostics n_exp = row_count;

  return json_build_object('applications', n_apps, 'experts', n_exp);
end $$;
revoke execute on function public.cleanup_old_data() from public, anon, authenticated;
