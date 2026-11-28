-- =====================================================================
-- Brightpeer – more Mercor features (28.11.2026, owner: "Alles ausser KI-Agenten für Firmen")
-- Chosen by the owner: no "sell company data"; full-time hiring = monthly subscription + 30 % of the
-- first-year salary; AI video interview with camera; new fields Finance & Banking, Business & Operations,
-- Creative, Science (Physics & Biology). Additive only – nothing existing is removed.
-- =====================================================================

-- ---------- 1. AI video interview ------------------------------------------------------------
update storage.buckets set allowed_mime_types = array['audio/*', 'video/*'], file_size_limit = 62914560 where id = 'interviews';
alter table public.interviews add column if not exists mode text not null default 'classic';
do $$ begin
  alter table public.interviews add constraint interviews_mode_chk check (mode in ('classic', 'ai_video'));
exception when duplicate_object then null; end $$;
alter table public.interviews add column if not exists video_consent_at timestamptz;

-- AI follow-up questions: every call of the Edge Function ai-interviewer is logged (limit per expert and day).
create table if not exists public.interview_ai_log (
  id bigint generated always as identity primary key,
  expert_id uuid not null references public.experts(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists interview_ai_log_expert on public.interview_ai_log (expert_id, created_at);
alter table public.interview_ai_log enable row level security;
drop policy if exists p_ial_admin on public.interview_ai_log;
create policy p_ial_admin on public.interview_ai_log for select using (public.is_admin());

-- ---------- 2. Field tests for the new fields ------------------------------------------------
insert into public.skill_tests (id, field, title, intro, minutes, pass_pct) values
 ('finance', 'Finance & Banking', 'Finance & Banking', '8 multiple-choice questions and 2 short written tasks about finance, banking and reviewing AI answers.', 25, 70),
 ('business', 'Business & Operations', 'Business & Operations', '8 multiple-choice questions and 2 short written tasks about strategy, operations, HR and sales.', 25, 70),
 ('creative', 'Creative', 'Creative (writing & design)', '8 multiple-choice questions and 2 short written tasks about writing, editing and design.', 25, 70),
 ('science', 'Science (Physics & Biology)', 'Science (Physics & Biology)', '8 multiple-choice questions and 2 short written tasks about physics, biology and reviewing AI answers.', 25, 70)
on conflict (id) do nothing;

insert into public.test_questions (test_id, pos, kind, prompt, options, correct) values
-- Finance & Banking
('finance', 1, 'mc', 'If interest rates rise, what usually happens to the price of an existing fixed-rate bond?', '["It rises", "It falls", "It stays the same", "It doubles"]', 1),
('finance', 2, 'mc', 'What does a company''s current ratio measure?', '["Profitability", "Short-term liquidity (current assets ÷ current liabilities)", "Debt compared with equity", "Share price compared with earnings"]', 1),
('finance', 3, 'mc', 'An investment of $1,000 grows by 10 % per year with annual compounding. What is it worth after 2 years?', '["$1,200", "$1,210", "$1,100", "$1,221"]', 1),
('finance', 4, 'mc', 'Which statement about diversification is correct?', '["It removes all investment risk", "It mainly reduces company-specific (unsystematic) risk", "It only works with bonds", "It guarantees higher returns"]', 1),
('finance', 5, 'mc', 'What is the main purpose of the Basel III rules for banks?', '["Setting interest rates for consumers", "Minimum capital and liquidity requirements", "Rules for stock exchange listings", "Tax rules for bank employees"]', 1),
('finance', 6, 'mc', 'In a discounted cash flow (DCF) valuation, a higher discount rate leads to …', '["a higher present value", "a lower present value", "no change", "a higher growth rate"]', 1),
('finance', 7, 'mc', 'An AI answer says: "EBITDA is the same as the cash a company generates." How do you rate it?', '["Correct", "Incorrect – EBITDA ignores, among other things, changes in working capital, capital expenditure and taxes", "Correct for banks only", "Incorrect – EBITDA includes depreciation"]', 1),
('finance', 8, 'mc', 'What does KYC stand for in banking?', '["Keep Your Capital", "Know Your Customer", "Key Yield Calculation", "Know Your Credit"]', 1),
('finance', 9, 'open', E'A user asked an AI: "Should I put all my savings into one tech stock because it went up 80 % last year?" The AI answered: "Yes, strong past performance means it will keep rising."\n\nExplain what is wrong and write a better answer.', null, null),
('finance', 10, 'open', 'Write one realistic finance or banking question from your area that would be hard for an AI model, with the correct answer and a short explanation of the reasoning.', null, null),
-- Business & Operations
('business', 1, 'mc', 'What does a company''s gross margin show?', '["Revenue minus all costs, divided by revenue", "Revenue minus cost of goods sold, divided by revenue", "Profit after tax", "Cash in the bank"]', 1),
('business', 2, 'mc', 'In project management, what is the "critical path"?', '["The most expensive tasks", "The longest chain of dependent tasks that sets the earliest finish date", "Tasks done by managers", "Tasks with the highest risk"]', 1),
('business', 3, 'mc', 'Customer acquisition cost (CAC) is best compared with …', '["the number of employees", "customer lifetime value (LTV)", "office rent", "the share price"]', 1),
('business', 4, 'mc', 'Which is a typical sign of a bottleneck in an operations process?', '["Work piles up before one step while later steps wait", "All steps finish at the same time", "Inventory is zero everywhere", "Customers pay in advance"]', 0),
('business', 5, 'mc', 'What is the main goal of a structured job interview?', '["Making interviews shorter", "Asking every candidate the same job-related questions so they can be compared fairly", "Avoiding written notes", "Letting the candidate choose the questions"]', 1),
('business', 6, 'mc', 'What does "churn rate" measure?', '["New customers per month", "The share of customers who stop buying or cancel in a period", "Price increases", "Employee overtime"]', 1),
('business', 7, 'mc', 'An AI answer says: "Revenue growth always means a company is becoming more profitable." How do you rate it?', '["Correct", "Incorrect – costs can grow faster than revenue", "Correct for start-ups", "Correct if growth is above 10 %"]', 1),
('business', 8, 'mc', 'In a sales funnel, what is the conversion rate from lead to customer?', '["Customers ÷ leads", "Leads ÷ customers", "Revenue ÷ leads", "Leads − customers"]', 0),
('business', 9, 'open', E'A manager asked an AI: "Our best employee wants a raise and we cannot afford it. What should I do?" The AI answered: "Tell them no and that they should be grateful to have a job."\n\nExplain what is wrong and write a better answer.', null, null),
('business', 10, 'open', 'Write one realistic business, operations, HR or sales task from your work that would be hard for an AI model, with an ideal answer and a short explanation.', null, null),
-- Creative
('creative', 1, 'mc', 'Which sentence uses the active voice?', '["The report was written by Anna.", "Anna wrote the report.", "The report has been written.", "Mistakes were made."]', 1),
('creative', 2, 'mc', 'In design, what does "contrast" mainly help with?', '["Making files smaller", "Readability and guiding attention", "Printing faster", "Using fewer colours"]', 1),
('creative', 3, 'mc', 'What is "show, don''t tell" in writing?', '["Using many pictures", "Letting readers experience feelings through actions and details instead of naming them", "Writing only dialogue", "Avoiding descriptions"]', 1),
('creative', 4, 'mc', 'Which colour model is used for screens?', '["CMYK", "RGB", "Pantone only", "Grayscale"]', 1),
('creative', 5, 'mc', 'A headline for a busy reader should usually be …', '["long and detailed", "short, clear and specific", "a question without an answer", "in capital letters"]', 1),
('creative', 6, 'mc', 'What is kerning in typography?', '["Line spacing", "The space between individual letters", "Font size", "Text colour"]', 1),
('creative', 7, 'mc', 'An AI wrote a product text with the same adjective ("amazing") five times. What is the main problem?', '["Nothing – repetition builds a brand", "Repetitive, vague wording that says little about the product", "It is too short", "Adjectives are never allowed"]', 1),
('creative', 8, 'mc', 'Which is the strongest opening line for a short story?', '["It was a normal day.", "Once upon a time there was a person.", "The letter arrived three years after my sister disappeared.", "This is a story."]', 2),
('creative', 9, 'open', E'A user asked an AI: "Write a short, friendly text for a bakery''s Instagram post about our new croissant." The AI answered: "Our company is pleased to announce the availability of a new croissant product. Purchase it."\n\nExplain what is wrong and write a better version.', null, null),
('creative', 10, 'open', 'Describe how you would judge whether an AI-written text or AI-made design is good. Name at least 4 criteria and give one short example of a weak and a better version.', null, null),
-- Science (Physics & Biology)
('science', 1, 'mc', 'A ball is dropped from rest (no air resistance). What is its speed after 2 seconds? (g ≈ 9.8 m/s²)', '["9.8 m/s", "19.6 m/s", "4.9 m/s", "39.2 m/s"]', 1),
('science', 2, 'mc', 'Which organelle produces most of a cell''s ATP?', '["Ribosome", "Mitochondrion", "Golgi apparatus", "Nucleus"]', 1),
('science', 3, 'mc', 'What is the SI unit of electrical resistance?', '["Volt", "Ampere", "Ohm", "Watt"]', 2),
('science', 4, 'mc', 'In DNA, adenine pairs with …', '["Cytosine", "Guanine", "Thymine", "Uracil"]', 2),
('science', 5, 'mc', 'Which law says that for every action there is an equal and opposite reaction?', '["Newton''s first law", "Newton''s second law", "Newton''s third law", "Ohm''s law"]', 2),
('science', 6, 'mc', 'What happens during meiosis?', '["Two identical diploid cells form", "Four genetically different haploid cells form", "Cells merge", "DNA is not copied"]', 1),
('science', 7, 'mc', 'An AI answer says: "Heavier objects always fall faster than light ones, even in a vacuum." How do you rate it?', '["Correct", "Incorrect – in a vacuum all objects fall with the same acceleration", "Correct for metals", "Incorrect – light objects fall faster"]', 1),
('science', 8, 'mc', 'What is the main role of the enzyme RNA polymerase?', '["Copying DNA before cell division", "Making RNA from a DNA template (transcription)", "Breaking down proteins", "Building lipids"]', 1),
('science', 9, 'open', E'A student asked an AI: "Why do we have seasons?" The AI answered: "Because the Earth is much closer to the Sun in summer."\n\nExplain what is wrong and write a better answer.', null, null),
('science', 10, 'open', 'Write one realistic physics or biology problem from your area that would be hard for an AI model, with the correct solution and a short explanation of the steps.', null, null)
on conflict (test_id, pos) do nothing;

-- ---------- 3. Full-time hiring: monthly subscription + 30 % fee -----------------------------
create table if not exists public.company_subscriptions (
  company_id uuid primary key references public.companies(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'active', 'cancelled')),
  monthly_fee numeric not null default 299 check (monthly_fee >= 0),
  started_at timestamptz,
  paid_until date,
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.company_subscriptions enable row level security;
drop policy if exists p_cs_select on public.company_subscriptions;
create policy p_cs_select on public.company_subscriptions for select using (company_id = auth.uid() or public.is_admin());
drop policy if exists p_cs_admin on public.company_subscriptions;
create policy p_cs_admin on public.company_subscriptions for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.hires (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid references public.request_candidates(id) on delete set null,
  expert_id uuid not null references public.experts(id) on delete cascade,
  job_title text not null check (length(job_title) between 2 and 160),
  annual_salary numeric not null check (annual_salary > 0 and annual_salary < 10000000),
  start_date date,
  company_note text check (length(company_note) <= 2000),
  status text not null default 'requested' check (status in ('requested', 'offered', 'accepted', 'declined', 'hired', 'cancelled')),
  expert_note text check (length(expert_note) <= 1000),
  fee_pct numeric not null default 30,
  fee_amount numeric,
  fee_status text not null default 'none' check (fee_status in ('none', 'open', 'paid')),
  admin_note text check (length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hires enable row level security;
drop policy if exists p_hires_company on public.hires;
create policy p_hires_company on public.hires for select using (company_id = auth.uid() or public.is_admin());
drop policy if exists p_hires_admin on public.hires;
create policy p_hires_admin on public.hires for all using (public.is_admin()) with check (public.is_admin());

-- company asks for the subscription (activated by the admin once paid)
create or replace function public.request_hiring_plan() returns text
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from companies where id = auth.uid() and terms_accepted_at is not null) then raise exception 'not allowed'; end if;
  insert into company_subscriptions (company_id) values (auth.uid())
  on conflict (company_id) do update set status = 'requested', created_at = now() where company_subscriptions.status = 'cancelled';
  return (select status from company_subscriptions where company_id = auth.uid());
end $$;

-- company wants to hire a proposed expert full-time (needs an active subscription)
create or replace function public.request_hire(p_candidate uuid, p_title text, p_salary numeric, p_start date default null, p_note text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_expert uuid; v_id uuid;
begin
  if not exists (select 1 from company_subscriptions where company_id = auth.uid() and status = 'active') then raise exception 'hiring plan not active'; end if;
  select rc.expert_id into v_expert from request_candidates rc join requests r on r.id = rc.request_id where rc.id = p_candidate and r.company_id = auth.uid();
  if v_expert is null then raise exception 'not found'; end if;
  if exists (select 1 from hires where candidate_id = p_candidate and status in ('requested', 'offered', 'accepted', 'hired')) then raise exception 'already requested'; end if;
  insert into hires (company_id, candidate_id, expert_id, job_title, annual_salary, start_date, company_note)
  values (auth.uid(), p_candidate, v_expert, left(trim(p_title), 160), p_salary, p_start, nullif(left(trim(coalesce(p_note, '')), 2000), ''))
  returning id into v_id;
  return v_id;
end $$;

-- company-side list (anonymous expert code like in company_candidates)
create or replace function public.company_hires()
returns table(id uuid, code text, field text, job_title text, annual_salary numeric, start_date date, status text, fee_pct numeric, fee_amount numeric, fee_status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select h.id, 'Expert ' || upper(left(coalesce(h.candidate_id, h.expert_id)::text, 4)), e.field, h.job_title, h.annual_salary, h.start_date,
         h.status, h.fee_pct, h.fee_amount, h.fee_status, h.created_at
    from hires h join experts e on e.id = h.expert_id
   where h.company_id = auth.uid() order by h.created_at desc;
$$;

-- expert sees offers the admin forwarded (company name stays private until hired)
create or replace function public.my_hire_offers()
returns table(id uuid, job_title text, annual_salary numeric, start_date date, status text, company_note text, company_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select h.id, h.job_title, h.annual_salary, h.start_date, h.status, h.company_note,
         case when h.status = 'hired' then c.company_name else null end, h.created_at
    from hires h join companies c on c.id = h.company_id
   where h.expert_id = auth.uid() and h.status in ('offered', 'accepted', 'declined', 'hired') order by h.created_at desc;
$$;

create or replace function public.respond_hire(p_id uuid, p_accept boolean, p_note text default null) returns text
language plpgsql security definer set search_path = public as $$
begin
  update hires set status = case when p_accept then 'accepted' else 'declined' end,
         expert_note = nullif(left(trim(coalesce(p_note, '')), 1000), ''), updated_at = now()
   where id = p_id and expert_id = auth.uid() and status = 'offered';
  if not found then raise exception 'not found'; end if;
  return case when p_accept then 'accepted' else 'declined' end;
end $$;

revoke all on function public.request_hiring_plan(), public.request_hire(uuid, text, numeric, date, text), public.company_hires(), public.my_hire_offers(), public.respond_hire(uuid, boolean, text) from public, anon;
grant execute on function public.request_hiring_plan(), public.request_hire(uuid, text, numeric, date, text), public.company_hires(), public.my_hire_offers(), public.respond_hire(uuid, boolean, text) to authenticated;

-- ---------- 4. API keys for companies (Edge Function "api") ----------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
alter table public.api_keys enable row level security;
drop policy if exists p_ak_select on public.api_keys;
create policy p_ak_select on public.api_keys for select using (company_id = auth.uid() or public.is_admin());
-- no insert/update policy: keys are only created and revoked through the functions below (the hash never leaves the database)
revoke all on public.api_keys from anon, authenticated;
grant select (id, company_id, name, prefix, created_at, last_used_at, revoked_at) on public.api_keys to authenticated;

create table if not exists public.api_log (
  id bigint generated always as identity primary key,
  key_id uuid not null references public.api_keys(id) on delete cascade,
  at timestamptz not null default now(),
  method text, path text, status int
);
create index if not exists api_log_key_at on public.api_log (key_id, at);
alter table public.api_log enable row level security;
drop policy if exists p_al_select on public.api_log;
create policy p_al_select on public.api_log for select using (public.is_admin() or exists (select 1 from api_keys k where k.id = key_id and k.company_id = auth.uid()));

create or replace function public.create_api_key(p_name text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_key text;
begin
  if not exists (select 1 from companies where id = auth.uid() and terms_accepted_at is not null) then raise exception 'not allowed'; end if;
  if (select count(*) from api_keys where company_id = auth.uid() and revoked_at is null) >= 5 then raise exception 'at most 5 active keys'; end if;
  v_key := 'bp_live_' || encode(gen_random_bytes(24), 'hex');
  insert into api_keys (company_id, name, prefix, key_hash)
  values (auth.uid(), left(trim(coalesce(nullif(trim(p_name), ''), 'API key')), 80), left(v_key, 14), encode(digest(v_key, 'sha256'), 'hex'));
  return v_key; -- shown once, only the hash is stored
end $$;

create or replace function public.revoke_api_key(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update api_keys set revoked_at = now() where id = p_id and (company_id = auth.uid() or public.is_admin()) and revoked_at is null;
end $$;
revoke all on function public.create_api_key(text), public.revoke_api_key(uuid) from public, anon;
grant execute on function public.create_api_key(text), public.revoke_api_key(uuid) to authenticated;

-- ---------- 5. Brightpeer Bench per profession -----------------------------------------------
create or replace function public.bench_leaderboard_field(p_field text)
returns table(model text, comparisons int, wins int, ties int, losses int, win_rate numeric, avg_score numeric, languages text)
language sql stable security definer set search_path = public as $$
  with r as (
    select ep.model_a as model, ep.language, (er.winner = 'a') as win, (er.winner = 'tie') as tie, er.score_a as score
      from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id
     where ep.is_benchmark and ep.status in ('open', 'done') and ep.field = p_field
    union all
    select ep.model_b, ep.language, (er.winner = 'b'), (er.winner = 'tie'), er.score_b
      from eval_ratings er join eval_items i on i.id = er.item_id join eval_projects ep on ep.id = i.project_id
     where ep.is_benchmark and ep.status in ('open', 'done') and ep.field = p_field
  )
  select model, count(*)::int, count(*) filter (where win)::int, count(*) filter (where tie)::int,
         count(*) filter (where not win and not tie)::int,
         round(100.0 * (count(*) filter (where win) + 0.5 * count(*) filter (where tie)) / count(*), 1),
         round(avg(score), 2), string_agg(distinct language, ', ' order by language)
    from r group by model having count(*) >= 10
   order by 6 desc, 7 desc;
$$;
-- professions that have at least one benchmark rating
create or replace function public.bench_fields() returns table(field text, ratings int)
language sql stable security definer set search_path = public as $$
  select ep.field, count(er.*)::int from eval_projects ep join eval_items i on i.project_id = ep.id join eval_ratings er on er.item_id = i.id
   where ep.is_benchmark and ep.status in ('open', 'done') and ep.field is not null group by ep.field order by 2 desc;
$$;
revoke all on function public.bench_leaderboard_field(text), public.bench_fields() from public;
grant execute on function public.bench_leaderboard_field(text), public.bench_fields() to anon, authenticated;
