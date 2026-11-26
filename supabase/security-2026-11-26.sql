-- Security (26.11.2026): the automation trigger functions must not be callable through the API.
-- Triggers keep working – Postgres checks EXECUTE only when the trigger is created.
revoke execute on function public.trg_auto_approve() from public, anon, authenticated;
revoke execute on function public.trg_auto_offer() from public, anon, authenticated;
revoke execute on function public.trg_auto_propose() from public, anon, authenticated;
