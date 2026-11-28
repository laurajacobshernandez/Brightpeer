// Brightpeer – settings.
// 1) Paste your Supabase "Project URL" and "anon public" key below
//    (Supabase → Project Settings → API). The anon key is safe to be public.
//    NEVER put the "service_role" key here.
// 2) Fill in your company details for invoices and the imprint.

export const CONFIG = {
  SUPABASE_URL: 'https://wlslnfgfbcanfwlbxaap.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_3HcZY0wfDpm6Vdj7zOIUoA_NiltZvGL',

  // Shown to companies on invoices ("Pay by bank transfer")
  BANK: {
    holder: 'Laura Hernandez',
    iban: 'CH62 0026 2262 1221 8540 V',
    bic: 'UBSWCHZH80A',
    bank: 'UBS Switzerland AG',
  },

  // Shown in the imprint and legal pages
  COMPANY: {
    name: 'Brightpeer, owner Laura Hernandez',
    address: 'Elfenaustrasse 7, 2503 Biel, Switzerland',
    email: 'hello@brightpeer.com',
    uid: '', // optional: CHE-XXX.XXX.XXX (leave empty if you have none),
  },

  // "Continue with Google" / "Continue with Microsoft": the buttons appear by themselves as soon as the
  // provider is switched on in Supabase → Authentication → Providers (Google / Azure). Set false to hide one.
  GOOGLE_LOGIN: true,
  MICROSOFT_LOGIN: true, // owner 26.11.2026: visible like on MindIQ; a tap says "coming soon" until Azure is switched on in Supabase

  // Billing: for the start companies only pay in advance (prepaid balance). Set false to use weekly invoices again.
  PREPAYMENT_ONLY: true,
  LOW_BALANCE: 500, // USD – below this the balance is shown as low

  // Full-time hiring (owner, 28.11.2026: "30 % + Monatsabo" like Mercor). Change the numbers here if needed;
  // the monthly fee of a company is stored on its subscription in the database (default 299).
  HIRING: { monthly: 299, feePct: 30 },

  // Social media (footer icons). Hidden until the accounts exist (25.11.2026) – paste the profile link to show an icon,
  // e.g. instagram: 'https://www.instagram.com/brightpeer'.
  // Leave a value empty ('') to hide that icon.
  SOCIAL: {
    instagram: 'https://www.instagram.com/brightpeerr',
    linkedin: '',
    x: 'https://x.com/brightpeerr',
    youtube: '',
  },
};
