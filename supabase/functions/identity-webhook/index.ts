// Brightpeer – receives Stripe Identity results (27.11.2026) and sets the expert's ID check automatically.
// Stripe → Developers → Webhooks → endpoint https://<project>.supabase.co/functions/v1/identity-webhook with the events
// identity.verification_session.verified / .requires_input / .canceled. Secret: STRIPE_IDENTITY_WEBHOOK_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2';

const enc = new TextEncoder();
async function validSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = parts.t; const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`${t}.${payload}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((s) => s.length === hex.length && [...s].every((c, i) => c === hex[i]));
}
const REASONS: Record<string, string> = {
  document_expired: 'The ID document is expired.', document_unverified_other: 'The ID document could not be verified.',
  document_type_not_supported: 'This type of document is not accepted – please use a passport, ID card or driving licence.',
  selfie_face_mismatch: 'The selfie does not match the photo on the ID.', selfie_document_missing_photo: 'The ID has no readable photo.',
  selfie_unverified_other: 'The selfie could not be verified.', consent_declined: 'The check was cancelled.', under_supported_age: 'The age requirement is not met.',
};

Deno.serve(async (req) => {
  const secret = Deno.env.get('STRIPE_IDENTITY_WEBHOOK_SECRET');
  if (!secret) return new Response('not configured', { status: 503 });
  const payload = await req.text();
  if (!(await validSignature(payload, req.headers.get('stripe-signature') || '', secret))) return new Response('bad signature', { status: 400 });
  const ev = JSON.parse(payload);
  const s = ev.data?.object || {};
  const expertId = s.metadata?.expert_id;
  if (!expertId || s.object !== 'identity.verification_session') return new Response('ignored');
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date().toISOString();
  if (ev.type === 'identity.verification_session.verified') {
    await db.from('experts').update({ id_status: 'verified', id_checked_at: now, id_note: 'Verified automatically (Stripe Identity)', id_session: s.id }).eq('id', expertId);
  } else if (ev.type === 'identity.verification_session.requires_input') {
    const code = s.last_error?.code || '';
    await db.from('experts').update({ id_status: 'rejected', id_checked_at: now, id_note: REASONS[code] || 'The check could not be completed – please try again.' }).eq('id', expertId);
  } else if (ev.type === 'identity.verification_session.canceled') {
    await db.from('experts').update({ id_status: 'none', id_note: null }).eq('id', expertId).eq('id_status', 'submitted');
  }
  return new Response('ok');
});
