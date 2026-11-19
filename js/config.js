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
    holder: '[COMPANY NAME]',
    iban: '[IBAN]',
    bic: '[BIC/SWIFT]',
    bank: '[BANK NAME]',
  },

  // Shown in the imprint and legal pages
  COMPANY: {
    name: '[COMPANY NAME]',
    address: '[STREET, ZIP CITY, SWITZERLAND]',
    email: 'hello@brightpeer.com',
    uid: '[UID / CHE-XXX.XXX.XXX]',
  },

  // Show "Continue with Google" (enable Google in Supabase → Authentication → Providers first)
  GOOGLE_LOGIN: false,
};
