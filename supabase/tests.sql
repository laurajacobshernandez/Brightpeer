-- =====================================================================
-- Brightpeer – skill tests (run after schema.sql)
-- Experts take one short test per field. Multiple-choice answers are graded
-- in the database, so the correct answers never reach the browser.
-- Written answers are reviewed by the admin.
-- =====================================================================

create table if not exists public.skill_tests (
  id text primary key,
  field text not null unique,
  title text not null,
  intro text,
  minutes int not null default 25,
  pass_pct int not null default 70,
  active boolean not null default true
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.skill_tests(id) on delete cascade,
  pos int not null,
  kind text not null check (kind in ('mc','open')),
  prompt text not null,
  options jsonb,
  correct int,
  unique (test_id, pos)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  test_id text not null references public.skill_tests(id) on delete cascade,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  mc_score int,
  mc_max int,
  late boolean not null default false,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','passed','failed')),
  review_note text,
  unique (expert_id, test_id)
);

alter table public.skill_tests    enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts  enable row level security;

drop policy if exists p_tests_select on public.skill_tests;
create policy p_tests_select on public.skill_tests for select to authenticated using (active or public.is_admin());
drop policy if exists p_tests_admin on public.skill_tests;
create policy p_tests_admin on public.skill_tests for all using (public.is_admin()) with check (public.is_admin());

-- questions (with correct answers): admin only; experts get them via start_test()
drop policy if exists p_tq_admin on public.test_questions;
create policy p_tq_admin on public.test_questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_ta_select on public.test_attempts;
create policy p_ta_select on public.test_attempts for select using (expert_id = auth.uid() or public.is_admin());
drop policy if exists p_ta_admin on public.test_attempts;
create policy p_ta_admin on public.test_attempts for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_ta_delete on public.test_attempts;
create policy p_ta_delete on public.test_attempts for delete using (public.is_admin());

-- Start (or resume) a test. Returns the questions without the answers.
create or replace function public.start_test(p_test text) returns json
language plpgsql security definer set search_path = public as $$
declare
  a test_attempts; tst skill_tests;
begin
  if not exists (select 1 from experts where id = auth.uid()) then raise exception 'Only experts can take tests'; end if;
  select * into tst from skill_tests where id = p_test and active;
  if not found then raise exception 'Test not found'; end if;
  select * into a from test_attempts where expert_id = auth.uid() and test_id = p_test;
  if found and a.status <> 'in_progress' then raise exception 'You have already taken this test'; end if;
  if not found then
    insert into test_attempts (expert_id, test_id, deadline)
    values (auth.uid(), p_test, now() + make_interval(mins => tst.minutes))
    returning * into a;
  end if;
  return json_build_object(
    'attempt_id', a.id, 'deadline', a.deadline, 'now', now(), 'title', tst.title, 'minutes', tst.minutes,
    'questions', (select coalesce(json_agg(json_build_object('id', q.id, 'pos', q.pos, 'kind', q.kind, 'prompt', q.prompt, 'options', q.options) order by q.pos), '[]'::json)
                  from test_questions q where q.test_id = p_test)
  );
end $$;

-- Submit answers ({question_id: option_index | text}). Grades multiple choice.
create or replace function public.submit_test(p_attempt uuid, p_answers jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare
  a test_attempts; score int; total int; clean jsonb;
begin
  select * into a from test_attempts where id = p_attempt and expert_id = auth.uid() for update;
  if not found then raise exception 'Test not found'; end if;
  if a.status <> 'in_progress' then raise exception 'This test was already submitted'; end if;

  -- keep only answers to this test's questions; limit text length
  select coalesce(jsonb_object_agg(q.id::text,
           case when q.kind = 'mc' then p_answers->(q.id::text) else to_jsonb(left(p_answers->>(q.id::text), 6000)) end), '{}'::jsonb)
    into clean
    from test_questions q where q.test_id = a.test_id and p_answers ? q.id::text;

  select count(*) filter (where q.kind = 'mc'),
         count(*) filter (where q.kind = 'mc' and (clean->>(q.id::text)) ~ '^\d+$' and (clean->>(q.id::text))::int = q.correct)
    into total, score
    from test_questions q where q.test_id = a.test_id;

  update test_attempts
     set answers = clean, mc_score = score, mc_max = total, submitted_at = now(),
         late = now() > a.deadline + interval '2 minutes', status = 'submitted'
   where id = a.id;
  return json_build_object('submitted', true);
end $$;

-- Admin: attempts with questions and correct answers, for review
create or replace function public.admin_test_attempts() returns json
language plpgsql stable security definer set search_path = public as $$
declare res json;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select coalesce(json_agg(row_to_json(x) order by x.submitted_at desc nulls last), '[]'::json) into res from (
    select a.*, p.full_name, p.email, e.field as expert_field, tst.title, tst.pass_pct,
      (select json_agg(json_build_object('id', q.id, 'pos', q.pos, 'kind', q.kind, 'prompt', q.prompt, 'options', q.options, 'correct', q.correct) order by q.pos)
         from test_questions q where q.test_id = a.test_id) as questions
    from test_attempts a
    join profiles p on p.id = a.expert_id
    join experts e on e.id = a.expert_id
    join skill_tests tst on tst.id = a.test_id
  ) x;
  return res;
end $$;

revoke execute on function public.start_test(text) from public, anon;
revoke execute on function public.submit_test(uuid, jsonb) from public, anon;
revoke execute on function public.admin_test_attempts() from public, anon;
grant execute on function public.start_test(text), public.submit_test(uuid, jsonb), public.admin_test_attempts() to authenticated;

-- ---------- Tests and questions --------------------------------------

insert into public.skill_tests (id, field, title, intro, minutes, pass_pct) values
 ('software', 'Software', 'Software Engineering', '8 multiple-choice questions and 2 short written tasks about code and reviewing AI-generated code.', 25, 70),
 ('medicine', 'Medicine', 'Medicine', '8 multiple-choice questions and 2 short written tasks about clinical knowledge and reviewing AI answers.', 25, 70),
 ('law', 'Law', 'Law', '8 multiple-choice questions and 2 short written tasks about general legal principles and reviewing AI answers. Name your jurisdiction in the written tasks.', 25, 70),
 ('translation-de', 'Translation (DE)', 'Translation English → German', '8 multiple-choice questions and 2 short written tasks: translating and correcting a machine translation.', 25, 70)
on conflict (id) do nothing;

insert into public.test_questions (test_id, pos, kind, prompt, options, correct) values
-- Software
('software', 1, 'mc', E'What does this Python code print?\n\ndef add(x, acc=[]):\n    acc.append(x)\n    return acc\n\nadd(1)\nprint(add(2))', '["[2]", "[1, 2]", "An error", "[[1], [2]]"]', 1),
('software', 2, 'mc', 'What is the time complexity of binary search on a sorted array of n elements?', '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', 1),
('software', 3, 'mc', 'Which SQL query returns customers who have no orders?', '["SELECT c.* FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL", "SELECT c.* FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL", "SELECT c.* FROM customers c WHERE c.id IN (SELECT customer_id FROM orders)", "SELECT c.* FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NOT NULL"]', 1),
('software', 4, 'mc', 'In JavaScript, for which values of x is (x == null) true?', '["Only null", "null and undefined", "null, undefined, 0 and empty string", "Never – you must use ==="]', 1),
('software', 5, 'mc', 'An AI model wrote code that builds an SQL query by adding user input directly into the query string. What is the main problem?', '["It is slower than a stored procedure", "It allows SQL injection", "It does not work with Unicode", "Nothing, if the input comes from a web form"]', 1),
('software', 6, 'mc', 'What does [10, 9, 1].sort() return in JavaScript?', '["[1, 9, 10]", "[10, 9, 1]", "[1, 10, 9]", "[9, 10, 1]"]', 2),
('software', 7, 'mc', 'Which HTTP status code fits best when a POST request successfully created a new resource?', '["200 OK", "201 Created", "204 No Content", "302 Found"]', 1),
('software', 8, 'mc', 'A bad commit was already pushed to a shared main branch. What is the safest way to undo it?', '["git reset --hard HEAD~1 and force push", "git revert <commit>", "Delete the branch and create it again", "git commit --amend"]', 1),
('software', 9, 'open', E'A user asked an AI: "How do I reverse a string in Python?" The AI answered:\n\n    s = "hello"\n    s.reverse()\n    print(s)\n\nExplain what is wrong and write a better answer, as you would want the AI to answer.', null, null),
('software', 10, 'open', 'In a language of your choice, write a function that returns the second largest distinct number in a list. Then list at least 3 edge cases a correct solution must handle.', null, null),
-- Medicine
('medicine', 1, 'mc', 'What is the first-line drug treatment for anaphylaxis?', '["Oral antihistamine", "Intramuscular adrenaline (epinephrine)", "IV corticosteroids", "Inhaled salbutamol"]', 1),
('medicine', 2, 'mc', 'What is the most common bacterial cause of community-acquired pneumonia in adults?', '["Staphylococcus aureus", "Streptococcus pneumoniae", "Pseudomonas aeruginosa", "Klebsiella pneumoniae"]', 1),
('medicine', 3, 'mc', 'Which acid-base disorder is typical for diabetic ketoacidosis?', '["Respiratory alkalosis", "Metabolic alkalosis", "High anion gap metabolic acidosis", "Normal anion gap metabolic acidosis"]', 2),
('medicine', 4, 'mc', 'The INR is mainly used to monitor which drug?', '["Heparin (unfractionated)", "Warfarin", "Aspirin", "Apixaban"]', 1),
('medicine', 5, 'mc', 'An AI model writes: "Ibuprofen is safe for all patients with chronic kidney disease." How do you rate this?', '["Correct", "Correct for short courses in all patients", "Incorrect – NSAIDs can worsen kidney function and are generally avoided in CKD", "Incorrect – ibuprofen is only unsafe in children"]', 2),
('medicine', 6, 'mc', 'Which of these is NOT one of the qSOFA criteria?', '["Respiratory rate ≥ 22/min", "Altered mentation", "Systolic blood pressure ≤ 100 mmHg", "Heart rate > 90/min"]', 3),
('medicine', 7, 'mc', 'ST elevation in leads II, III and aVF most likely indicates which infarction?', '["Anterior", "Lateral", "Inferior", "Posterior only"]', 2),
('medicine', 8, 'mc', 'What is usually the earliest ECG sign of hyperkalaemia?', '["Peaked T waves", "U waves", "Prolonged QT interval", "Delta waves"]', 0),
('medicine', 9, 'open', E'A patient wrote to an AI: "I have had chest pain spreading to my left arm for 30 minutes while resting." The AI answered: "This is probably muscle strain. Rest and see your doctor next week if it continues."\n\nExplain what is wrong and write a better answer.', null, null),
('medicine', 10, 'open', 'Write one realistic clinical case question from your specialty that would be hard for an AI model, with the correct answer and a short explanation of the reasoning.', null, null),
-- Law
('law', 1, 'mc', 'Which of these is generally NOT required for a contract to be valid?', '["Offer and acceptance", "Intention to create legal relations", "Capacity of the parties", "Signing in front of a notary"]', 3),
('law', 2, 'mc', 'What does "res judicata" mean?', '["A matter that has been finally decided cannot be brought again", "The burden of proof lies with the claimant", "Ignorance of the law is no excuse", "The court must hear both sides"]', 0),
('law', 3, 'mc', 'What is the usual standard of proof in criminal cases in common-law systems?', '["Balance of probabilities", "Beyond reasonable doubt", "Prima facie evidence", "Clear and convincing evidence"]', 1),
('law', 4, 'mc', 'Under the GDPR, what is the maximum fine for the most serious breaches?', '["€1 million", "€20 million or 4 % of worldwide annual turnover, whichever is higher", "2 % of turnover in the EU only", "There are no fines, only warnings"]', 1),
('law', 5, 'mc', 'An AI answer cites a court decision you cannot find. What should you do first as a reviewer?', '["Accept it if the reasoning sounds right", "Check the citation in an official or trusted legal database", "Replace it with a similar case", "Ask the AI if the case is real"]', 1),
('law', 6, 'mc', 'What does a force majeure clause usually do?', '["Sets the penalty for late payment", "Excuses performance when extraordinary events beyond the parties'' control occur", "Chooses the court that hears disputes", "Allows one party to end the contract at any time"]', 1),
('law', 7, 'mc', 'What does "stare decisis" mean?', '["Courts should follow earlier decisions (precedent)", "Statutes always override contracts", "A case must be decided within a fixed time", "Judges may not interpret the law"]', 0),
('law', 8, 'mc', 'What is a limitation period?', '["The maximum length of a contract", "The time limit for bringing a legal claim", "The time a judge has to write a decision", "The notice period for ending employment"]', 1),
('law', 9, 'open', E'An AI wrote: "A verbal agreement is never legally binding. Only written contracts count."\n\nName your jurisdiction, explain what is wrong and write a better answer (about 100–150 words).', null, null),
('law', 10, 'open', 'Write one legal question from your jurisdiction and field that would be hard for an AI model, with a model answer of about 150 words and the sources (statute or case) it relies on.', null, null),
-- Translation (DE)
('translation-de', 1, 'mc', 'Best translation: "We will eventually move to Berlin."', '["Wir werden eventuell nach Berlin ziehen.", "Wir werden irgendwann nach Berlin ziehen.", "Wir werden ewig nach Berlin ziehen.", "Wir ziehen gegebenenfalls nach Berlin."]', 1),
('translation-de', 2, 'mc', 'Best translation: "She wants to become a doctor."', '["Sie will eine Ärztin bekommen.", "Sie will Ärztin werden.", "Sie will zum Arzt gehen.", "Sie will Ärztin bleiben."]', 1),
('translation-de', 3, 'mc', 'Which is correct in standard written German?', '["Wegen dem schlechten Wetter fällt das Spiel aus.", "Wegen des schlechten Wetters fällt das Spiel aus.", "Wegen das schlechte Wetter fällt das Spiel aus.", "Wegen der schlechten Wetter fällt das Spiel aus."]', 1),
('translation-de', 4, 'mc', 'Best translation: "That is a sensible decision."', '["Das ist eine sensible Entscheidung.", "Das ist eine vernünftige Entscheidung.", "Das ist eine empfindliche Entscheidung.", "Das ist eine spürbare Entscheidung."]', 1),
('translation-de', 5, 'mc', 'Best translation: "Actually, I agree with you."', '["Aktuell stimme ich dir zu.", "Eigentlich stimme ich dir zu.", "Tatsächlich stimme ich dich zu.", "Aktuell gebe ich dir recht."]', 1),
('translation-de', 6, 'mc', 'Which sentence is spelled correctly?', '["Ich glaube, das er morgen kommt.", "Ich glaube, dass er morgen kommt.", "Ich glaube das, er morgen kommt.", "Ich glaube dass er morgen kommt."]', 1),
('translation-de', 7, 'mc', 'Best translation for a business email: "Please find the invoice attached."', '["Bitte finden Sie die Rechnung angehängt.", "Anbei erhalten Sie die Rechnung.", "Bitte finde die Rechnung im Anhang.", "Die Rechnung ist beigefügt worden von uns."]', 1),
('translation-de', 8, 'mc', 'Best translation: "The meeting was postponed to Friday."', '["Das Meeting wurde auf Freitag verschoben.", "Das Meeting wurde zu Freitag bewegt.", "Das Meeting wurde bis Freitag gestoppt.", "Das Meeting wurde nach Freitag gelegt."]', 0),
('translation-de', 9, 'open', E'Translate into German (formal "Sie"):\n\n"Thank you for your application. Our team has reviewed your profile and would like to invite you to a short video call next week. Please choose a time that suits you using the link below. If none of the times work for you, simply reply to this email and we will find another option. We look forward to speaking with you."', null, null),
('translation-de', 10, 'open', E'Source: "The training has been moved to Thursday. Please bring your laptop and let us know if you cannot attend."\n\nMachine translation: "Das Training wurde zu Donnerstag bewegt. Bitte bringen Sie Ihren Laptop und lassen Sie uns wissen, wenn Sie nicht beiwohnen können."\n\nList every error you find, explain briefly and write the corrected translation.', null, null)
on conflict (test_id, pos) do nothing;
