// Brightpeer – public REST API for companies (28.11.2026, owner: data pipelines + API like Mercor).
// Auth: "Authorization: Bearer bp_live_…" (keys are created in #/api; only the SHA-256 hash is stored in api_keys).
// Deployed with verify_jwt = false because it checks the API key itself. Limit: 1,000 requests per key and day.
// Everything is scoped to the key's company; expert names and contact details are never returned.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const DAILY_LIMIT = 1000;
const FIELDS = ['Medicine', 'Law', 'Software', 'Chemistry & Math', 'Pharmacy', 'Accounting', 'Translation (DE)', 'Finance & Banking', 'Business & Operations', 'Creative', 'Science (Physics & Biology)', 'Other'];

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!/^bp_live_[0-9a-f]{48}$/.test(token)) return json({ error: 'missing or invalid API key' }, 401);
  const { data: key } = await db.from('api_keys').select('id, company_id, revoked_at').eq('key_hash', await sha256(token)).maybeSingle();
  if (!key || key.revoked_at) return json({ error: 'missing or invalid API key' }, 401);
  const cid = key.company_id as string;

  const path = new URL(req.url).pathname.replace(/^.*?\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.from('api_log').select('id', { count: 'exact', head: true }).eq('key_id', key.id).gte('at', since);
  const log = (status: number) => db.from('api_log').insert({ key_id: key.id, method: req.method, path: path.slice(0, 200), status }).then(() => {}, () => {});
  if ((count || 0) >= DAILY_LIMIT) { await log(429); return json({ error: 'daily limit reached (1,000 requests per key)' }, 429); }
  db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then(() => {}, () => {});

  let body: Record<string, unknown> = {};
  if (req.method === 'POST') { try { body = await req.json(); } catch { await log(400); return json({ error: 'body must be JSON' }, 400); } }
  const done = async (b: unknown, s = 200) => { await log(s); return json(b, s); };
  const seg = path.split('/').filter(Boolean); // ['v1', 'evals', id, 'items']
  if (seg[0] !== 'v1') return done({ error: 'not found – use /v1/…' }, 404);
  const r = seg[1]; const id = seg[2] || ''; const sub = seg[3] || '';
  const G = req.method === 'GET'; const P = req.method === 'POST';

  try {
    // company + balance
    if (r === 'me' && G) {
      const { data: co } = await db.from('companies').select('company_name, website, terms_accepted_at').eq('id', cid).maybeSingle();
      const { data: pre } = await db.from('prepayments').select('amount').eq('company_id', cid).eq('status', 'paid');
      const paid = (pre || []).reduce((x, p) => x + Number(p.amount), 0);
      const { data: ts } = await db.from('timesheets').select('hours, contracts!inner(company_id, client_rate)').eq('status', 'approved').eq('contracts.company_id', cid);
      const used = Math.round((ts || []).reduce((x, t: Record<string, any>) => x + Number(t.hours) * Number(t.contracts?.client_rate || 0), 0) * 100) / 100;
      return done({ company: co?.company_name || null, website: co?.website || null, terms_accepted: !!co?.terms_accepted_at, paid_in_usd: paid, used_usd: used, balance_usd: Math.round((paid - used) * 100) / 100 });
    }
    // requests
    if (r === 'requests' && G && !id) {
      const { data } = await db.from('requests').select('id, field, experts_needed, hours_per_week, budget, description, status, created_at').eq('company_id', cid).order('created_at', { ascending: false });
      return done({ data: data || [] });
    }
    if (r === 'requests' && P && !id) {
      const field = str(body.field, 80); const description = str(body.description, 5000);
      if (!FIELDS.includes(field)) return done({ error: 'field must be one of: ' + FIELDS.join(', ') }, 400);
      if (description.length < 10) return done({ error: 'description is required (min. 10 characters)' }, 400);
      const n = Math.max(1, Math.min(500, Math.round(Number(body.experts_needed) || 1)));
      const h = body.hours_per_week ? Math.max(1, Math.min(60, Math.round(Number(body.hours_per_week)))) : null;
      const { data, error } = await db.from('requests').insert({ company_id: cid, field, experts_needed: n, hours_per_week: h, budget: str(body.budget, 200) || null, description }).select('id, status, created_at').single();
      if (error) return done({ error: error.message }, 400);
      return done({ data }, 201);
    }
    // proposed experts (anonymous)
    if (r === 'candidates' && G) {
      const { data } = await db.from('request_candidates').select('id, request_id, status, created_at, requests!inner(company_id), experts(field, years_experience, headline, skills, languages)').eq('requests.company_id', cid).order('created_at', { ascending: false });
      return done({ data: (data || []).map((x: Record<string, any>) => ({ id: x.id, code: 'Expert ' + String(x.id).slice(0, 4).toUpperCase(), request_id: x.request_id, status: x.status, field: x.experts?.field, years_experience: x.experts?.years_experience, headline: x.experts?.headline, skills: x.experts?.skills, languages: x.experts?.languages, created_at: x.created_at })) });
    }
    // hours
    if (r === 'hours' && G) {
      const { data } = await db.from('timesheets').select('id, week_start, hours, note, status, quality, review_note, created_at, contracts!inner(company_id, title)').eq('contracts.company_id', cid).order('week_start', { ascending: false }).limit(1000);
      return done({ data: (data || []).map((x: Record<string, any>) => ({ id: x.id, contract: x.contracts?.title || null, week_start: x.week_start, hours: Number(x.hours), status: x.status, quality: x.quality, note: x.note, review_note: x.review_note, created_at: x.created_at })) });
    }
    // evaluations
    if (r === 'evals') {
      if (!id && G) {
        const { data } = await db.from('eval_projects').select('id, title, field, language, model_a, model_b, status, created_at').eq('company_id', cid).eq('is_benchmark', false).order('created_at', { ascending: false });
        return done({ data: data || [] });
      }
      if (!id && P) {
        const title = str(body.title, 160); const a = str(body.model_a, 80); const b = str(body.model_b, 80);
        if (title.length < 2 || !a || !b) return done({ error: 'title, model_a and model_b are required' }, 400);
        const field = str(body.field, 80);
        const { data, error } = await db.from('eval_projects').insert({ company_id: cid, is_benchmark: false, title, model_a: a, model_b: b, language: str(body.language, 60) || 'English', field: field || null, instructions: str(body.instructions, 4000) || null }).select('id, status, created_at').single();
        if (error) return done({ error: error.message }, 400);
        return done({ data }, 201);
      }
      if (!uuid(id)) return done({ error: 'not found' }, 404);
      const { data: p } = await db.from('eval_projects').select('id, title, field, language, model_a, model_b, instructions, status, created_at, company_id, is_benchmark').eq('id', id).maybeSingle();
      if (!p || p.company_id !== cid || p.is_benchmark) return done({ error: 'not found' }, 404);
      const { company_id: _c, is_benchmark: _b, ...proj } = p;
      if (!sub && G) {
        const { data: items } = await db.from('eval_items').select('id, position, prompt, answer_a, answer_b').eq('project_id', id).order('position');
        return done({ data: { ...proj, items: items || [] } });
      }
      if (sub === 'items' && P) {
        if (p.status !== 'draft') return done({ error: 'tasks can only be added while the evaluation is a draft' }, 409);
        const list = Array.isArray(body.items) ? body.items : [];
        if (!list.length || list.length > 500) return done({ error: 'items must be an array with 1–500 tasks' }, 400);
        const { count: have } = await db.from('eval_items').select('id', { count: 'exact', head: true }).eq('project_id', id);
        const rows = [];
        for (let i = 0; i < list.length; i++) {
          const it = list[i] as Record<string, unknown>;
          const prompt = str(it?.prompt, 20000); const aa = str(it?.answer_a, 40000); const bb = str(it?.answer_b, 40000);
          if (!prompt || !aa || !bb) return done({ error: `item ${i}: prompt, answer_a and answer_b are required` }, 400);
          rows.push({ project_id: id, position: (have || 0) + i + 1, prompt, answer_a: aa, answer_b: bb });
        }
        const { error } = await db.from('eval_items').insert(rows);
        if (error) return done({ error: error.message }, 400);
        return done({ added: rows.length, total: (have || 0) + rows.length }, 201);
      }
      if (sub === 'submit' && P) {
        if (p.status !== 'draft') return done({ error: 'already submitted' }, 409);
        const { count: n } = await db.from('eval_items').select('id', { count: 'exact', head: true }).eq('project_id', id);
        if (!n) return done({ error: 'add at least one task first' }, 400);
        await db.from('eval_projects').update({ status: 'submitted' }).eq('id', id);
        return done({ data: { id, status: 'submitted' } });
      }
      if (sub === 'ratings' && G) {
        const { data: items } = await db.from('eval_items').select('id, position').eq('project_id', id);
        const pos = Object.fromEntries((items || []).map((x) => [x.id, x.position]));
        const ids = Object.keys(pos);
        const { data: rt } = ids.length ? await db.from('eval_ratings').select('item_id, expert_id, winner, score_a, score_b, errors_a, errors_b, comment, updated_at').in('item_id', ids) : { data: [] };
        const anon: Record<string, string> = {};
        const out = (rt || []).map((x) => { anon[x.expert_id] = anon[x.expert_id] || 'R' + (Object.keys(anon).length + 1); return { item_id: x.item_id, position: pos[x.item_id], rater: anon[x.expert_id], winner: x.winner === 'a' ? proj.model_a : x.winner === 'b' ? proj.model_b : 'tie', score_a: x.score_a, score_b: x.score_b, errors_a: x.errors_a, errors_b: x.errors_b, comment: x.comment, rated_at: x.updated_at }; });
        return done({ model_a: proj.model_a, model_b: proj.model_b, data: out.sort((a, b) => a.position - b.position) });
      }
    }
    return done({ error: 'not found' }, 404);
  } catch (e) {
    return done({ error: 'server error' }, 500);
  }
});
