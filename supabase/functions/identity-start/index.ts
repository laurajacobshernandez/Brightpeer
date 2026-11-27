// Brightpeer – automatic ID check with Stripe Identity (27.11.2026, owner: "Ausweisprüfung soll automatisch sein").
// Creates a Stripe Identity VerificationSession (ID document + matching selfie) for the signed-in expert and returns
// Stripe's hosted URL. The result comes back through identity-webhook. Needs the secret STRIPE_SECRET_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ALLOWED = ['https://laurajacobshernandez.github.io/Brightpeer/', 'https://brightpeer.com/', 'https://www.brightpeer.com/'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) return json({ error: 'not_configured' }, 503);
  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'login' }, 401);
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ex } = await db.from('experts').select('id, id_status').eq('id', user.id).maybeSingle();
  if (!ex) return json({ error: 'not_expert' }, 403);
  if (ex.id_status === 'verified') return json({ error: 'already_verified' }, 400);

  let ret = '';
  try { ret = String((await req.json()).return_url || ''); } catch { /* empty */ }
  if (!ALLOWED.some((a) => ret.startsWith(a))) ret = ALLOWED[0] + '#/dashboard';

  const form = new URLSearchParams();
  form.set('type', 'document');
  form.set('options[document][require_matching_selfie]', 'true');
  form.set('options[document][require_live_capture]', 'true');
  ['passport', 'id_card', 'driving_license'].forEach((t, i) => form.set(`options[document][allowed_types][${i}]`, t));
  form.set('metadata[expert_id]', user.id);
  form.set('client_reference_id', user.id);
  form.set('return_url', ret);
  const r = await fetch('https://api.stripe.com/v1/identity/verification_sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
  });
  const s = await r.json();
  if (!r.ok || !s.url) return json({ error: 'stripe_failed', detail: s.error?.message?.slice(0, 200) }, 502);
  await db.from('experts').update({ id_status: 'submitted', id_session: s.id, id_note: null }).eq('id', user.id);
  return json({ url: s.url });
});
