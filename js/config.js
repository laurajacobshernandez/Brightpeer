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
    iban: '[IBAN]',
    bic: '[BIC/SWIFT]',
    bank: '[BANK NAME]',
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
  MICROSOFT_LOGIN: true,
};
