// Brightpeer – a company views the interview of a proposed (anonymous) expert (27.11.2026, owner: like Mercor).
// Only if the expert agreed (experts.share_interview) and the candidate belongs to one of the company's requests.
// Returns the questions, written answers and short-lived links to the voice answers – never name or contact details.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'login' }, 401);
  let cid = '';
  try { cid = String((await req.json()).candidate_id || ''); } catch { /* empty */ }
  if (!/^[0-9a-f-]{36}$/i.test(cid)) return json({ error: 'bad_request' }, 400);
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rc } = await db.from('request_candidates').select('expert_id, requests!inner(company_id)').eq('id', cid).maybeSingle();
  // deno-lint-ignore no-explicit-any
  if (!rc || (rc as any).requests?.company_id !== user.id) return json({ error: 'not_allowed' }, 403);
  const { data: ex } = await db.from('experts').select('share_interview').eq('id', rc.expert_id).maybeSingle();
  if (!ex?.share_interview) return json({ error: 'not_shared' }, 403);
  const { data: iv } = await db.from('interviews').select('answers, status, submitted_at').eq('expert_id', rc.expert_id).maybeSingle();
  if (!iv || !['submitted', 'reviewed'].includes(iv.status)) return json({ error: 'no_interview' }, 404);
  const answers = Array.isArray(iv.answers) ? iv.answers : [];
  const out = [];
  for (const a of answers) {
    let audio = null;
    if (a && typeof a.audio === 'string' && a.audio) {
      const { data: s } = await db.storage.from('interviews').createSignedUrl(a.audio, 900);
      audio = s?.signedUrl || null;
    }
    out.push({ q: String(a?.q || ''), text: String(a?.text || ''), audio });
  }
  return json({ submitted_at: iv.submitted_at, answers: out });
});
