// Brightpeer – receives Didit verification results (27.11.2026) and sets the expert's ID check automatically.
// Didit Business Console → Webhooks: URL https://<project>.supabase.co/functions/v1/didit-webhook.
// Secret: DIDIT_WEBHOOK_SECRET (the webhook's "secret shared key"). Signature: X-Signature = HMAC-SHA256(raw body), hex.
import { createClient } from 'npm:@supabase/supabase-js@2';

const enc = new TextEncoder();
async function hmacHex(secret: string, data: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const same = (a: string, b: string) => a.length === b.length && [...a].reduce((x, c, i) => x | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

Deno.serve(async (req) => {
  const secret = Deno.env.get('DIDIT_WEBHOOK_SECRET');
  if (!secret) return new Response('not configured', { status: 503 });
  const raw = await req.text();
  const ts = Number(req.headers.get('x-timestamp') || 0);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return new Response('stale', { status: 401 });
  const expected = await hmacHex(secret, raw);
  const sigs = [req.headers.get('x-signature'), req.headers.get('x-signature-previous')].filter(Boolean) as string[];
  if (!sigs.some((s) => same(s.toLowerCase(), expected))) return new Response('bad signature', { status: 401 });

  const ev = JSON.parse(raw);
  const expertId = ev.vendor_data || ev.metadata?.expert_id;
  if (!expertId || ev.webhook_type !== 'status.updated') return new Response('ignored');
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date().toISOString();
  const status = String(ev.status || '');
  if (status === 'Approved') {
    await db.from('experts').update({ id_status: 'verified', id_checked_at: now, id_note: 'Verified automatically (Didit)', id_session: ev.session_id }).eq('id', expertId);
  } else if (status === 'Declined') {
    await db.from('experts').update({ id_status: 'rejected', id_checked_at: now, id_note: 'The automatic check did not pass – please try again with a clear photo of a valid ID and good light for the selfie.' }).eq('id', expertId);
  } else if (status === 'In Review') {
    await db.from('experts').update({ id_status: 'submitted', id_session: ev.session_id }).eq('id', expertId);
  } else if (status === 'Abandoned' || status === 'Expired') {
    await db.from('experts').update({ id_status: 'none', id_note: null }).eq('id', expertId).eq('id_status', 'submitted');
  }
  return new Response('ok');
});
