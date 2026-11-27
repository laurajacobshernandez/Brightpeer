-- Model evaluations + Brightpeer Bench (owner, 27.11.2026: "Modell-Bewertung und Brightpeer Bench soll auch funktionieren"
-- – chosen: real, like Mercor). Companies upload tasks with the answers of two AI models; assigned experts compare them
-- blind, side by side; the company gets a report. Benchmark projects (is_benchmark, created by the admin) feed the public
-- Brightpeer Bench leaderboard, which is computed ONLY from real expert ratings.

create table if not exists public.eval_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.profiles(id) on delete cascade,
  is_benchmark boolean not null default false,
  title text not null check (char_length(title) between 2 and 160),
  field text check (char_length(field) <= 80),
  language text not null default 'English' check (char_length(language) between 1 and 60),
  model_a text not null check (char_length(model_a) between 1 and 80),
  model_b text not null check (char_length(model_b) between 1 and 80),
  instructions text check (char_length(instructions) <= 4000),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'open', 'done')),
  created_at timestamptz not null default now(),
  check (is_benchmark or company_id is not null)
);

create table if not exists public.eval_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.eval_projects(id) on delete cascade,
  position int not null default 0,
  prompt text not null check (char_length(prompt) between 1 and 20000),
  answer_a text not null check (char_length(answer_a) between 1 and 40000),
  answer_b text not null check (char_length(answer_b) between 1 and 40000),
  created_at timestamptz not null default now()
);
create index if not exists eval_items_project on public.eval_items (project_id, position);

create table if not exists public.eval_assignments (
  project_id uuid not null references public.eval_projects(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, expert_id)
);

create table if not exists public.eval_ratings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.eval_items(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  winner text not null check (winner in ('a', 'b', 'tie')),
  score_a smallint not null check (score_a between 1 and 5),
  score_b smallint not null check (score_b between 1 and 5),
  errors_a text[] not null default '{}',
  errors_b text[] not null default '{}',
  comment text check (char_length(comment) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, expert_id)
);
create index if not exists eval_ratings_item on public.eval_ratings (item_id);

alter table public.eval_projects enable row level security;
alter table public.eval_items enable row level security;
alter table public.eval_assignments enable row level security;
alter table public.eval_ratings enable row level security;

-- helpers (security definer, so policies do not recurse)
create or replace function public.eval_owner_draft(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from eval_projects where id = p and company_id = auth.uid() and status = 'draft' and not is_benchmark);
$$;
create or replace function public.eval_owner(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from eval_projects where id = p and company_id = auth.uid());
$$;
create or replace function public.eval_assigned(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from eval_assignments a join eval_projects ep on ep.id = a.project_id join experts e on e.id = a.expert_id
                  where a.project_id = p and a.expert_id = auth.uid() and ep.status = 'open' and e.status = 'approved');
$$;

-- projects: companies see/create/edit their own drafts and may submit them; everything else only the admin
drop policy if exists p_ep_select on public.eval_projects;
create policy p_ep_select on public.eval_projects for select using (public.is_admin() or company_id = auth.uid());
drop policy if exists p_ep_insert on public.eval_projects;
create policy p_ep_insert on public.eval_projects for insert with check (
  public.is_admin()
  or (company_id = auth.uid() and not is_benchmark and status = 'draft'
      and exists (select 1 from profiles where id = auth.uid() and role = 'company')));
drop policy if exists p_ep_update on public.eval_projects;
create policy p_ep_update on public.eval_projects for update
  using (public.is_admin() or (company_id = auth.uid() and status = 'draft' and not is_benchmark))
  with check (public.is_admin() or (company_id = auth.uid() and not is_benchmark and status in ('draft', 'submitted')));
drop policy if exists p_ep_delete on public.eval_projects;
create policy p_ep_delete on public.eval_projects for delete using (public.is_admin() or (company_id = auth.uid() and status = 'draft'));

-- items: owner can read; add/change/delete only while the project is a draft
drop policy if exists p_ei_select on public.eval_items;
create policy p_ei_select on public.eval_items for select using (public.is_admin() or public.eval_owner(project_id));
drop policy if exists p_ei_insert on public.eval_items;
create policy p_ei_insert on public.eval_items for insert with check (public.is_admin() or public.eval_owner_draft(project_id));
drop policy if exists p_ei_update on public.eval_items;
create policy p_ei_update on public.eval_items for update using (public.is_admin() or public.eval_owner_draft(project_id)) with check (public.is_admin() or public.eval_owner_draft(project_id));
drop policy if exists p_ei_delete on public.eval_items;
create policy p_ei_delete on public.eval_items for delete using (public.is_admin() or public.eval_owner_draft(project_id));

-- assignments: admin manages, experts see their own
drop policy if exists p_ea_admin on public.eval_assignments;
create policy p_ea_admin on public.eval_assignments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_ea_own on public.eval_assignments;
create policy p_ea_own on public.eval_assignments for select using (expert_id = auth.uid());

-- ratings: experts read their own; writing only through rate_eval(); admin everything
drop policy if exists p_er_admin on public.eval_ratings;
create policy p_er_admin on public.eval_ratings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_er_own on public.eval_ratings;
create policy p_er_own on public.eval_ratings for select using (expert_id = auth.uid());

-- ---------- Experts: blind tasks (no model names, no company) ---------------------------------
create or replace function public.my_eval_projects()
returns table(id uuid, title text, field text, language text, instructions text, total int, done int)
language sql stable security definer set search_path = public as $$
  select ep.id, ep.title, ep.field, ep.language, ep.instructions,
         (select count(*)::int from eval_items i where i.project_id = ep.id),
         (select count(*)::int from eval_items i join eval_ratings r on r.item_id = i.id and r.expert_id = auth.uid() where i.project_id = ep.id)
  from eval_projects ep
  where public.eval_assigned(ep.id)
  order by ep.created_at;
$$;

create or replace function public.my_eval_next(p uuid)
returns table(id uuid, prompt text, answer_a text, answer_b text, pos int, total int, done int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eval_assigned(p) then raise exception 'not allowed'; end if;
  return query
  select i.id, i.prompt, i.answer_a, i.answer_b,
         (select count(*)::int from eval_items x where x.project_id = p and (x.position, x.created_at) <= (i.position, i.created_at)),
         (select count(*)::int from eval_items x where x.project_id = p),
         (select count(*)::int from eval_items x join eval_ratings r on r.item_id = x.id and r.expert_id = auth.uid() where x.project_id = p)
  from eval_items i
  where i.project_id = p and not exists (select 1 from eval_ratings r where r.item_id = i.id and r.expert_id = auth.uid())
  order by i.position, i.created_at
  limit 1;
end $$;

create or replace function public.rate_eval(p_item uuid, p_winner text, p_score_a int, p_score_b int,
  p_errors_a text[] default '{}', p_errors_b text[] default '{}', p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare proj uuid;
begin
  select project_id into proj from eval_items where id = p_item;
  if proj is null or not public.eval_assigned(proj) then raise exception 'not allowed'; end if;
  insert into eval_ratings (item_id, expert_id, winner, score_a, score_b, errors_a, errors_b, comment)
  values (p_item, auth.uid(), p_winner, p_score_a, p_score_b,
          coalesce(p_errors_a, '{}'), coalesce(p_errors_b, '{}'), nullif(left(trim(coalesce(p_comment, '')), 4000), ''))
  on conflict (item_id, expert_id) do update set winner = excluded.winner, score_a = excluded.score_a, score_b = excluded.score_b,
    errors_a = excluded.errors_a, errors_b = excluded.errors_b, comment = excluded.comment, updated_at = now();
end $$;

-- ---------- Report for the company (or the admin): no expert identities ----------------------
create or replace function public.eval_report(p uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr eval_projects; out json;
begin
  select * into pr from eval_projects where id = p;
  if pr.id is null or not (public.is_admin() or pr.company_id = auth.uid()) then raise exception 'not allowed'; end if;
  select json_build_object(
    'items', coalesce((select count(*) from eval_items where project_id = p), 0),
    'ratings', coalesce((select count(*) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p), 0),
    'raters', coalesce((select count(distinct r.expert_id) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p), 0),
    'wins_a', coalesce((select count(*) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p and r.winner = 'a'), 0),
    'wins_b', coalesce((select count(*) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p and r.winner = 'b'), 0),
    'ties', coalesce((select count(*) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p and r.winner = 'tie'), 0),
    'avg_a', (select round(avg(r.score_a), 2) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p),
    'avg_b', (select round(avg(r.score_b), 2) from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p),
    'errors_a', coalesce((select json_object_agg(e, n) from (select unnest(r.errors_a) e, count(*) n from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p group by 1) x), '{}'::json),
    'errors_b', coalesce((select json_object_agg(e, n) from (select unnest(r.errors_b) e, count(*) n from eval_ratings r join eval_items i on i.id = r.item_id where i.project_id = p group by 1) x), '{}'::json),
    'rows', coalesce((select json_agg(json_build_object('id', i.id, 'prompt', i.prompt, 'answer_a', i.answer_a, 'answer_b', i.answer_b,
        'ratings', coalesce((select json_agg(json_build_object('winner', r.winner, 'score_a', r.score_a, 'score_b', r.score_b,
             'errors_a', r.errors_a, 'errors_b', r.errors_b, 'comment', r.comment) order by r.created_at)
           from eval_ratings r where r.item_id = i.id), '[]'::json)) order by i.position, i.created_at)
      from eval_items i where i.project_id = p), '[]'::json)
  ) into out;
  return out;
end $$;

-- ---------- Public Brightpeer Bench: only real ratings of benchmark projects ------------------
-- A model appears only with at least 10 ratings, so a few votes never produce a misleading ranking.
create or replace function public.bench_leaderboard()
returns table(model text, comparisons int, wins int, ties int, losses int, win_rate numeric, avg_score numeric, languages text)
language sql stable security definer set search_path = public as $$
  with r as (
    select ep.model_a as model, ep.language, (er.winner = 'a') as win, (er.winner = 'tie') as tie, er.score_a as score
      from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id
     where ep.is_benchmark and ep.status in ('open', 'done')
    union all
    select ep.model_b, ep.language, (er.winner = 'b'), (er.winner = 'tie'), er.score_b
      from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id
     where ep.is_benchmark and ep.status in ('open', 'done')
  )
  select model, count(*)::int, count(*) filter (where win)::int, count(*) filter (where tie)::int,
         count(*) filter (where not win and not tie)::int,
         round(100.0 * (count(*) filter (where win) + 0.5 * count(*) filter (where tie)) / count(*), 1),
         round(avg(score), 2), string_agg(distinct language, ', ' order by language)
    from r group by model having count(*) >= 10
   order by 6 desc, 7 desc;
$$;

create or replace function public.bench_summary() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'projects', (select count(*) from eval_projects where is_benchmark and status in ('open', 'done')),
    'tasks', (select count(*) from eval_items i join eval_projects ep on ep.id = i.project_id where ep.is_benchmark and ep.status in ('open', 'done')),
    'ratings', (select count(*) from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id where ep.is_benchmark and ep.status in ('open', 'done')),
    'languages', (select coalesce(string_agg(distinct language, ', ' order by language), '') from eval_projects where is_benchmark and status in ('open', 'done')),
    'updated', (select max(er.updated_at) from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id where ep.is_benchmark));
$$;

revoke all on function public.eval_owner_draft(uuid), public.eval_owner(uuid), public.eval_assigned(uuid) from public, anon;
grant execute on function public.eval_owner_draft(uuid), public.eval_owner(uuid), public.eval_assigned(uuid) to authenticated;
revoke all on function public.my_eval_projects(), public.my_eval_next(uuid), public.rate_eval(uuid, text, int, int, text[], text[], text), public.eval_report(uuid) from public, anon;
grant execute on function public.my_eval_projects(), public.my_eval_next(uuid), public.rate_eval(uuid, text, int, int, text[], text[], text), public.eval_report(uuid) to authenticated;
revoke all on function public.bench_leaderboard(), public.bench_summary() from public;
grant execute on function public.bench_leaderboard(), public.bench_summary() to anon, authenticated;
