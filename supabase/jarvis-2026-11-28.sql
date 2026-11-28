-- Jarvis (help assistant) also for visitors before sign-in (owner, 28.11.2026).
-- Visitors are counted by a hashed IP address only (no plain IP stored): max. 10 questions per visitor per day,
-- max. 500 visitor questions per day in total (checked in the Edge Function help-assistant).
create table if not exists public.assistant_guest_log (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists assistant_guest_log_ip on public.assistant_guest_log (ip_hash, created_at);
create index if not exists assistant_guest_log_time on public.assistant_guest_log (created_at);
alter table public.assistant_guest_log enable row level security;
drop policy if exists p_agl_admin on public.assistant_guest_log;
create policy p_agl_admin on public.assistant_guest_log for select using (public.is_admin());
