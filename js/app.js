// Brightpeer – single-page app (no build step). Works on GitHub Pages.
import { CONFIG } from './config.js';
import { t, lang } from './i18n.js';

// ---------------------------------------------------------------- setup
const configured = !!CONFIG.SUPABASE_URL && !CONFIG.SUPABASE_URL.startsWith('YOUR') && !!CONFIG.SUPABASE_ANON_KEY && !CONFIG.SUPABASE_ANON_KEY.startsWith('YOUR');
let sb = null;
let session = null;
let profile = null;

const $app = document.getElementById('app');
const $header = document.getElementById('header');
const $footer = document.getElementById('footer');

const FIELDS = ['Medicine', 'Law', 'Software', 'Chemistry & Math', 'Pharmacy', 'Accounting', 'Translation (DE)', 'Other'];
const FIELD_KEY = { 'Medicine': 'fMedicine', 'Law': 'fLaw', 'Software': 'fSoftware', 'Chemistry & Math': 'fSTEM', 'Pharmacy': 'fPharmacy', 'Accounting': 'fAccounting', 'Translation (DE)': 'fTranslation', 'Other': 'fOther' };
const fieldName = (f) => (FIELD_KEY[f] ? t(FIELD_KEY[f]) : (f || ''));

const PAY = [
  ['Medicine', 120, 150], ['Law', 100, 150], ['Software', 70, 150], ['Chemistry & Math', 80, 120],
  ['Pharmacy', 80, 110], ['Accounting', 70, 100], ['Translation (DE)', 40, 60],
];

const ICON_MUTE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
const ICON_LOUD = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
// Homepage "Why experts choose Brightpeer" (owner, 20.11.2026) – only things Brightpeer really offers
const BENEFITS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [`b${i}h`, `b${i}p`]);
// Benefit cards like Mercor's careers page (owner, 25.11.2026) – only what Brightpeer really offers to independent experts.
const BENEFIT_ICON = [
  '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>',
  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  '<path d="M4 18l5-5 3.5 3.5L20 9"/><path d="M15 9h5v5"/>',
  '<path d="M20 12.5l-7.5 7.5L4 11.5V4h7.5z"/><circle cx="8" cy="8" r="1.4"/>',
  '<circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="9" r="3"/><path d="M3 19c.6-3 2.8-4.6 5.5-4.6S13.4 16 14 19M13 15c.9-.4 2-.6 3.5-.6 2.7 0 4.9 1.6 5.5 4.6"/>',
  '<path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.3L12 15.4 7.1 18.1l1.1-5.3-4-3.7 5.4-.6z"/>',
  '<path d="M4 18v-1.5c0-2.5 2-4.5 4.5-4.5h7c2.5 0 4.5 2 4.5 4.5V18"/><circle cx="12" cy="7" r="3.5"/>',
  '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
];
function benefitCards() {
  return `<div class="ben-grid">${BENEFITS.map(([h, p], i) => `<div class="ben"><span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${BENEFIT_ICON[i] || ''}</svg></span><h3>${t(h)}</h3><p class="muted">${t(p)}</p></div>`).join('')}</div>`;
}

// Example roles shown when the database is not connected yet
const DEMO_ROLES = [
  { id: 'demo-1', title: 'Physician – Medical AI Reviewer', field: 'Medicine', rate_min: 120, rate_max: 150, hours_per_week: '10–20 h / week', description: 'Review and improve answers of AI models to clinical questions. Write realistic patient cases and rate model reasoning.', requirements: 'Licensed physician (MD), 3+ years clinical experience, fluent English.' },
  { id: 'demo-2', title: 'Lawyer – Legal Reasoning Expert', field: 'Law', rate_min: 100, rate_max: 150, hours_per_week: '10–20 h / week', description: 'Create and grade legal questions, check AI answers for accuracy.', requirements: 'Admitted lawyer or law degree with 3+ years practice.' },
  { id: 'demo-3', title: 'Senior Software Engineer – Code Evaluation', field: 'Software', rate_min: 70, rate_max: 150, hours_per_week: '15–30 h / week', description: 'Write coding tasks, review AI-generated code and explain better solutions.', requirements: '5+ years professional software engineering.' },
  { id: 'demo-4', title: 'Chemistry / Mathematics PhD – STEM Tutor for AI', field: 'Chemistry & Math', rate_min: 80, rate_max: 120, hours_per_week: '10–20 h / week', description: 'Design hard STEM problems with step-by-step solutions.', requirements: 'PhD or Master\'s in chemistry, mathematics or physics.' },
  { id: 'demo-5', title: 'Pharmacist – Medication Safety Reviewer', field: 'Pharmacy', rate_min: 80, rate_max: 110, hours_per_week: '5–15 h / week', description: 'Check AI answers about drug interactions and dosing.', requirements: 'Licensed pharmacist, 2+ years experience.' },
  { id: 'demo-6', title: 'Accountant – Finance & Tax Expert', field: 'Accounting', rate_min: 70, rate_max: 100, hours_per_week: '10–20 h / week', description: 'Create accounting and tax scenarios and review AI answers.', requirements: 'Certified accountant, 3+ years experience.' },
  { id: 'demo-7', title: 'German Translator – Language Quality', field: 'Translation (DE)', rate_min: 40, rate_max: 60, hours_per_week: '10–25 h / week', description: 'Translate and review English–German texts.', requirements: 'Native German speaker, professional translation experience.' },
];

// ---------------------------------------------------------------- helpers
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const dateStr = (d) => (d ? new Date(d).toLocaleDateString(lang) : '');
function mondayOf(d = new Date()) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}
function lastMonday() { const d = new Date(); d.setDate(d.getDate() - 7); return mondayOf(d); }

let toastTimer;
function toast(msg, isErr = false) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}
function fail(e) { console.error(e); toast((e && e.message) || t('error'), true); }

const PILL = {
  pending: 'warn', submitted: 'warn', new: 'warn', open: 'warn', in_progress: 'info', shortlisted: 'info', offered: 'info', reviewed: 'ok',
  approved: 'ok', accepted: 'ok', active: 'ok', paid: 'ok', done: 'ok',
  rejected: 'bad', declined: 'bad', ended: 'grey', closed: 'grey', passed: 'ok', failed: 'bad',
};
const STATUS_LABEL = {
  pending: 'pending', submitted: 'submitted', new: 'stNew', open: 'open', in_progress: 'stInProgress', approved: 'approved',
  accepted: 'approved', active: 'active', offered: 'stOffered', reviewed: 'stReviewed', shortlisted: 'stShortlisted', paid: 'paid', done: 'stDone', rejected: 'rejected', declined: 'stDeclined', ended: 'ended', passed: 'stPassed', failed: 'stFailed',
};
const pill = (s) => `<span class="pill pill-${PILL[s] || 'grey'}">${esc(STATUS_LABEL[s] ? t(STATUS_LABEL[s]) : s)}</span>`;

function table(cols, rows) {
  if (!rows.length) return `<p class="muted">${t('none')}</p>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const fieldOptions = (sel = '') => FIELDS.map((f) => `<option value="${esc(f)}" ${f === sel ? 'selected' : ''}>${esc(fieldName(f))}</option>`).join('');

function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
function busy(form, on) { form.querySelectorAll('button[type=submit]').forEach((b) => { b.disabled = on; }); }

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

// ---------------------------------------------------------------- data
async function loadProfile() {
  profile = null;
  if (!sb || !session) return;
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  profile = data;
}

// ---------------------------------------------------------------- Google / Microsoft sign-in (20.11.2026)
// Buttons appear only for providers that are switched on in Supabase (Authentication → Providers),
// so nothing broken is ever shown. Microsoft is Supabase's "azure" provider.
let oauthOn = { google: false, azure: false };
const OAUTH_KEY = 'bp-oauth';

async function loadOAuthProviders() {
  try {
    const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY } });
    const ext = (await r.json()).external || {};
    oauthOn = { google: !!ext.google && CONFIG.GOOGLE_LOGIN !== false, azure: !!ext.azure && CONFIG.MICROSOFT_LOGIN !== false };
  } catch { /* settings not reachable: keep e-mail login only */ }
}

const G_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6C6.6 42.6 14.6 48 24 48z"/></svg>';
const MS_ICON = '<svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true"><path fill="#F35325" d="M1 1h10v10H1z"/><path fill="#81BC06" d="M12 1h10v10H12z"/><path fill="#05A6F0" d="M1 12h10v10H1z"/><path fill="#FFBA08" d="M12 12h10v10H12z"/></svg>';

function oauthHtml() {
  const b = [];
  // Owner, 20.11.2026: buttons are always visible; until the provider is switched on in Supabase a tap says "coming soon".
  if (CONFIG.GOOGLE_LOGIN !== false) b.push(`<button type="button" class="btn btn-ghost oauth-btn" data-provider="google">${G_ICON}<span>${t('orGoogle')}</span></button>`);
  if (CONFIG.MICROSOFT_LOGIN !== false) b.push(`<button type="button" class="btn btn-ghost oauth-btn" data-provider="azure">${MS_ICON}<span>${t('orMicrosoft')}</span></button>`);
  return b.length ? `<div class="stack" style="gap:10px">${b.join('')}</div><div class="divider">${t('or')}</div>` : '';
}

// kind: 'login' | 'expert' | 'company'. Company sign-up needs the company name first (kept through the redirect).
function mountOAuth(root, kind) {
  root.querySelectorAll('.oauth-btn').forEach((btn) => {
    btn.onclick = async () => {
      if (!sb) return toast(t('notConfigured'), true);
      if (!oauthOn[btn.dataset.provider]) return toast(t('oauthSoon'));
      const pending = { kind, at: Date.now() };
      if (kind === 'company') {
        const name = (root.querySelector('[name=company_name]') || {}).value || '';
        if (!name.trim()) { toast(t('oauthCompanyName'), true); const i = root.querySelector('[name=company_name]'); if (i) i.focus(); return; }
        pending.company_name = name.trim();
        pending.website = ((root.querySelector('[name=website]') || {}).value || '').trim();
      }
      if (kind === 'expert') pending.ref = parseHash().query.get('ref') || '';
      try { localStorage.setItem(OAUTH_KEY, JSON.stringify(pending)); } catch { /* private mode */ }
      const provider = btn.dataset.provider;
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: location.origin + location.pathname, ...(provider === 'azure' && { scopes: 'openid email profile' }) },
      });
      if (error) toast(error.message, true);
    };
  });
}

// After returning from Google/Microsoft: a company sign-up turns the new account into a company account,
// an expert sign-up keeps the referral link. Runs once (the note is removed), harmless for normal logins.
async function finishOAuth() {
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem(OAUTH_KEY) || 'null'); } catch { pending = null; }
  if (!pending || !sb || !session) return;
  try { localStorage.removeItem(OAUTH_KEY); } catch { /* ignore */ }
  if (Date.now() - (pending.at || 0) > 3600e3 || pending.kind === 'login') return;
  const { data, error } = await sb.rpc('oauth_finish', { kind: pending.kind, company_name: pending.company_name || null, website: pending.website || null, ref: pending.ref || null });
  if (error) { console.error('oauth_finish', error); return; }
  if (data === 'company') await loadProfile();
}

async function getRoles() {
  if (!sb) return DEMO_ROLES;
  const { data, error } = await sb.from('roles').select('*').eq('status', 'open').order('created_at', { ascending: false });
  if (error) { console.error(error); return DEMO_ROLES; }
  return data;
}

// ---------------------------------------------------------------- layout
function renderHeader() {
  const { parts } = parseHash();
  const cur = '/' + (parts[0] || '');
  const a = (href, label) => `<a href="#${href}" class="${cur === href ? 'active' : ''}">${esc(label)}</a>`;
  // Drop-down menus like Mercor (owner, 20.11.2026): open on hover/focus, tap to open on touch screens.
  const dd = (id, label, text, links) => {
    const on = links.some(([h]) => h === cur);
    return `<div class="dd" data-dd="${id}"><button type="button" class="dd-btn ${on ? 'active' : ''}" aria-expanded="false">${esc(label)}<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
      <div class="dd-panel"><div class="dd-inner"><div class="dd-links">${links.map(([h, l]) => `<a href="${h.startsWith('mailto:') ? esc(h) : '#' + h}">${esc(l)}</a>`).join('')}</div><p class="dd-text">${esc(text)}</p></div></div></div>`;
  };
  let right;
  if (session) {
    right = `${profile?.role === 'admin' ? a('/admin', t('admin')) : ''}${a('/dashboard', t('dashboard'))}<button class="btn btn-ghost btn-sm" id="logoutBtn">${t('logout')}</button>`;
  } else {
    right = `${a('/login', t('login'))}<a class="btn btn-sm" href="#/apply">${t('applyNow')}</a>`;
  }
  $header.innerHTML = `${configured ? '' : `<div class="banner">${t('notConfigured')}</div>`}
  <nav class="nav" aria-label="Main">
    <a class="brand" href="#/"><span class="logo" aria-hidden="true"></span>Brightpeer</a>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="navLinks">Menu</button>
    <div class="nav-links" id="navLinks">
      ${dd('research', t('navResearch'), t('ddResearchP'), [['/research', t('ddFields')], ['/info', t('infoH')]])}
      ${dd('companies', t('fCompanies'), t('ddCompaniesP'), [['/companies', t('ddOverview')], ['/info', t('ddEvals')], ['/company-signup', t('fCompanyAccount')]])}
      ${dd('experts', t('fExperts'), t('ddExpertsP'), [['/roles', t('navRoles')], ['/apply', t('applyNow')], ['/info', t('payH')]])}
      ${dd('solutions', 'Solutions', 'Everything companies need to build better AI with real experts.', [['/services', 'All solutions'], ...SERVICES.map((x) => ['/services/' + x.id, x.nav])])}
      ${dd('company', t('fCompany'), t('ddCompanyP'), [['/about', t('navAbout')], ['/help', t('navHelp')], [`mailto:${CONFIG.COMPANY.email}`, t('fContact')]])}
      ${right}
    </div>
  </nav>`;
  $header.querySelectorAll('.dd-btn').forEach((b) => b.addEventListener('click', () => {
    const d = b.parentElement; const open = !d.classList.contains('open');
    $header.querySelectorAll('.dd.open').forEach((x) => { x.classList.remove('open'); x.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); });
    if (open) { d.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
  }));
  $header.querySelectorAll('.dd-panel a').forEach((l) => l.addEventListener('click', () => $header.querySelectorAll('.dd.open').forEach((x) => x.classList.remove('open'))));
  const mb = document.getElementById('menuBtn');
  mb.onclick = () => { const nl = document.getElementById('navLinks'); nl.classList.toggle('open'); mb.setAttribute('aria-expanded', nl.classList.contains('open')); };
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = async () => { await sb.auth.signOut(); go('#/'); };
}

function renderFooter() {
  // Footer in columns like Mercor (owner, 20.11.2026): brand on the left, link columns, legal row at the bottom.
  const col = (title, links) => `<div class="fcol"><p class="fcol-h">${title}</p>${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</div>`;
  $footer.innerHTML = `<div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand stack" style="gap:10px">
        <a class="brand" href="#/" style="color:var(--ink)"><span class="logo"></span>Brightpeer</a>
        <p class="muted">${t('footerTag')}</p>
        <a class="btn btn-accent btn-sm" href="#/apply" style="align-self:flex-start">${t('applyNow')}</a>
        ${socialIcons()}
      </div>
      <div class="footer-cols">
        ${col(t('fExperts'), [['#/roles', t('navRoles')], ['#/info', t('navInfo')], ['#/apply', t('applyNow')], ['#/login', t('login')], ['#/help', t('fHelpCenter')]])}
        ${col(t('fCompanies'), [['#/companies', t('hire')], ['#/company-signup', t('fCompanyAccount')], ['#/legal/client', t('clientTerms')]])}
        ${col('Solutions', [...SERVICES.map((x) => [`#/services/${x.id}`, x.nav]), ['#/research', t('navResearch')]])}
        ${col(t('fCompany'), [['#/about', t('navAbout')], [`mailto:${esc(CONFIG.COMPANY.email)}`, t('fContact')], ['#/help', t('navHelp')]])}
      </div>
    </div>
    <div class="footer-bottom">
      <p class="muted small">© ${new Date().getFullYear()} Brightpeer. ${t('rights')}</p>
      <div class="footer-legal small">
        <a href="#/legal/terms">${t('terms')}</a><a href="#/legal/privacy">${t('privacy')}</a><a href="#/legal/cookies">${t('cookies')}</a><a href="#/legal/imprint">${t('imprint')}</a>
      </div>
    </div>
  </div>`;
}

// Social media icons in the footer (owner, 20.11.2026: like Mercor – Instagram, LinkedIn, X, YouTube).
const SOCIAL_ICONS = {
  instagram: ['Instagram', '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/>'],
  linkedin: ['LinkedIn', '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5z"/>'],
  x: ['X', '<path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/>'],
  youtube: ['YouTube', '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z"/>'],
};
function socialIcons() {
  const s = CONFIG.SOCIAL || {};
  const links = Object.entries(SOCIAL_ICONS).filter(([k]) => s[k]).map(([k, [label, path]]) =>
    `<a class="social" href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="Brightpeer on ${label}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">${path}</svg></a>`).join('');
  return links ? `<div class="socials">${links}</div>` : '';
}

// Business areas like Mercor (owner, 20.11.2026: "Brightpeer soll das auch alles haben").
const SERVICES = [
  { id: 'experts', nav: 'Expert network', title: 'Hire vetted experts', short: 'Doctors, lawyers, engineers, scientists and finance professionals – reviewed by us and ready to work on your AI projects.',
    points: ['Professionals from medicine, law, software, engineering, finance, science and consulting', 'Every expert is screened, tested in their field and interviewed', 'Remote, flexible teams – from one specialist to hundreds', 'We handle contracts, quality checks and weekly payouts'] },
  { id: 'training', nav: 'AI training data', title: 'Train AI with expert knowledge', short: 'Experts write realistic tasks, ideal answers and step-by-step reasoning so your models learn to think like professionals.',
    points: ['A doctor writes clinical cases and checks medical answers', 'A lawyer reviews legal answers and contract analysis', 'A developer grades and fixes generated code', 'A finance expert checks reports, models and tax answers'] },
  { id: 'evaluations', nav: 'Model evaluations', title: 'Evaluate and compare AI models', short: 'Side-by-side reviews by real professionals show which model gets it right – and where it still fails.',
    points: ['Compare models on your own tasks and documents', 'Expert grading for accuracy, safety and reasoning', 'Clear reports with examples, scores and error types', 'Repeatable test runs after every model update'] },
  { id: 'benchmarks', nav: 'Brightpeer Bench', title: 'Brightpeer Bench – in preparation', short: 'We are building our own benchmark with our experts: how well AI really answers in many languages – not word lists, but the questions native speakers ask every day.',
    points: ['Tasks and model answers written by native-speaker experts', 'First edition in preparation: AI answers in Spanish, French, Japanese, Arabic and more', 'Results will be published with a clear, open method', 'Custom private benchmarks for your company on request'] },
  { id: 'enterprise', nav: 'Enterprise AI', title: 'Build AI for your company', short: 'We help larger companies put AI to work – with experts who know your field.',
    points: ['Build and test your own AI agents', 'Automate everyday workflows', 'Turn your team’s expert knowledge into AI systems', 'Test and improve AI before it goes live'] },
];

// Line icons for the six business areas (25.11.2026: numbered cards made clearer)
const SVC_ICON = {
  experts: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.6c2.6.2 4.6 2.2 5.1 5.4"/>',
  training: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M6.5 8h2M6.5 11h2M15.5 8h2M15.5 11h2"/>',
  evaluations: '<path d="M12 4v16M6 20h12"/><path d="M5 8h14"/><path d="M5 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/><path d="M19 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  benchmarks: '<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="15.5" y="9" width="3" height="9" rx="1"/>',
  enterprise: '<rect x="4" y="3.5" width="10" height="17" rx="1.5"/><path d="M14 9h4.5c.8 0 1.5.7 1.5 1.5v10H14"/><path d="M7 7.5h1M10 7.5h1M7 11h1M10 11h1M7 14.5h1M10 14.5h1M9 20.5v-3"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/>',
};
const svcIcon = (id) => `<span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SVC_ICON[id] || ''}</svg></span>`;

function servicesGrid() {
  return `<div class="svc-grid">${SERVICES.map((s, i) => `<a class="svc" href="#/services/${s.id}"><div class="row between" style="align-items:center">${svcIcon(s.id)}<span class="step-n">${i + 1}</span></div><h3>${esc(s.title)}</h3><p class="muted">${esc(s.short)}</p><span class="rate">Learn more →</span></a>`).join('')}</div>`;
}

function pageServices(focus) {
  return {
    html: `<section class="wrap section stack" style="padding-bottom:24px">
      <h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">Solutions</h1>
      <p style="font-size:1.15rem;color:var(--ink2);max-width:42rem">Everything companies need to build better AI with real experts – from hiring specialists to training, testing and benchmarking models.</p>
      <div class="row svc-jump">${SERVICES.map((s) => `<a class="chip" href="#/services/${s.id}">${esc(s.nav)}</a>`).join('')}</div>
    </section>
    <section class="wrap" style="padding-bottom:48px">${SERVICES.map((s, i) => `<div class="svc-row" id="svc-${s.id}">
        <div class="stack" style="gap:8px"><div class="row" style="gap:12px;align-items:center">${svcIcon(s.id)}<span class="svc-kicker">${esc(s.nav)}</span></div><h2>${esc(s.title)}</h2><p class="muted" style="font-size:1.05rem">${esc(s.short)}</p></div>
        <ul class="ticks">${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      </div>`).join('')}</section>
    <section class="wrap"><div class="dark row between" style="gap:24px"><div class="stack" style="gap:10px;max-width:640px"><h2>Talk to us about your project</h2><p class="muted">Tell us what you need. We reply within 1–2 business days with a plan and a quote.</p></div><div class="row"><a class="btn btn-accent" href="${session ? '#/dashboard' : '#/company-signup'}">${t('hire')}</a><a class="btn btn-ghost" href="mailto:${esc(CONFIG.COMPANY.email)}">${t('fContact')}</a></div></div></section>`,
    mount() {
      const el = focus && document.getElementById('svc-' + focus);
      if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0);
    },
  };
}

// ---------------------------------------------------------------- public pages
const skillList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
const lines = (v) => String(v || '').split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

// Job card like Mercor: pay first, then title, field, commitment and a few skills.
function roleCard(r) {
  return `<a class="card card-link role-card" href="#/roles/${esc(r.id)}">
    <div class="row between" style="gap:8px"><span class="chip">${esc(fieldName(r.field))}</span><span class="muted small">${t('remote')}</span></div>
    <span style="font-size:1.15rem;font-weight:600;line-height:1.3">${esc(r.title)}</span>
    <span class="role-pay">${money(r.rate_min)}–${money(r.rate_max)} <span class="muted small">${t('perHour')}</span></span>
    <span class="muted small">${esc(r.hours_per_week || '')}</span>
    ${skillList(r.skills).length ? `<div class="row" style="gap:6px">${skillList(r.skills).slice(0, 3).map((k) => `<span class="chip chip-sm">${esc(k)}</span>`).join('')}</div>` : ''}
    <span class="rate">${t('apply')} →</span>
  </a>`;
}

async function pageHome() {
  const roles = (await getRoles()).slice(0, 3);
  // Owner, 25.11.2026: the roles ("Gesuchte Fachrichtungen") come first, right at the top of the page.
  return `
  <section class="wrap section stack-lg">
    <div class="row between"><div class="stack" style="gap:6px"><h2>${t('featuredH')}</h2><p class="muted">${t('featuredSub')}</p></div><a href="#/roles" style="font-weight:600">${t('allRoles')} →</a></div>
    <div class="grid">${roles.map(roleCard).join('')}</div>
  </section>
  <section class="wrap section stack-lg" style="padding-top:0">
    <h1 style="max-width:15ch">${t('h1')}</h1>
    <p style="font-size:1.25rem;color:var(--ink2);max-width:40rem">${t('sub')}</p>
    <div class="row"><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a><a class="btn btn-ghost" href="#/companies">${t('hire')}</a></div>
  </section>
  <section class="wrap section stack-lg" style="padding-top:0">
    <div class="row between"><h2>${t('whyH')}</h2><a href="#/info" style="font-weight:600">${t('navInfo')} →</a></div>
    ${benefitCards()}
  </section>
  <section class="wrap section stack-lg">
    <div class="row between"><div class="stack" style="gap:6px"><h2>What Brightpeer does</h2><p class="muted">Five ways experts and companies work together on AI.</p></div><a href="#/services" style="font-weight:600">All solutions →</a></div>
    ${servicesGrid()}
  </section>
  <section class="wrap section"><div class="cta-end"><div class="stack" style="gap:8px"><h2>${t('ctaH')}</h2><p class="muted">${t('ctaP')}</p></div><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></div></section>`;
}

function pageInfo() {
  const steps = (k) => [1, 2, 3].map((i) => `<div class="step"><span class="step-n">${i}</span><h3>${t(k + i + 'h')}</h3><p class="muted">${t(k + i + 'p')}</p></div>`).join('');
  return `
  <section class="wrap section stack-lg" style="padding-bottom:40px">
    <div class="stack" style="gap:8px"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('infoH')}</h1><p class="muted" style="font-size:1.1rem">${t('infoSub')}</p></div>
    <div class="options">${[['o2', '#/companies'], ['o3', '#/companies'], ['o4', '#/roles']].map(([k, href]) => `<a class="option" href="${href}"><h3>${t(k + 'h')}</h3><p class="muted">${t(k + 'p')}</p><span class="option-l">${t(k + 'l')} →</span></a>`).join('')}</div>
    <div class="grid" style="border-top:1px solid var(--line);padding-top:24px;margin-top:8px">
      <div><p class="stat-v">$40–250 / h</p><p class="muted">${t('s1')}</p></div>
      <div><p class="stat-v">$0</p><p class="muted">${t('s2')}</p></div>
      <div><p class="stat-v">${t('s3v')}</p><p class="muted">${t('s3')}</p></div>
    </div>
  </section>
  <section class="wrap section" style="padding-top:8px">
    <div class="services">${[['sv1', '<svg viewBox="0 0 160 120" width="160" height="120" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"><path d="M20 80l60-30 60 30-60 30z" fill="var(--accent-soft)"/><path d="M45 72V40l12-6v32M65 62V22l12-6v40M85 58V30l12 6v28" fill="#fff"/><path d="M95 84l22-11 18 9-22 11z" fill="#fff"/><circle cx="114" cy="70" r="6" fill="#fff"/></svg>'], ['sv3', '<svg viewBox="0 0 160 120" width="160" height="120" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"><path d="M30 78l50-25 50 25-50 25z" fill="var(--accent-soft)"/><path d="M50 72V48l30-15 30 15v24l-30 15z" fill="#fff"/><path d="M50 48l30 15 30-15M80 63v24"/><path d="M66 40l14-7 14 7-14 7z" fill="var(--accent-soft)"/><path d="M60 64v10M68 68v10M92 68v10M100 64v10"/></svg>']].map(([k, art]) => `<div class="service"><div class="service-art" aria-hidden="true">${art}</div><h2>${t(k + 'h')}</h2><ul>${['a', 'b', 'c'].map((x) => `<li>${t(k + x)}</li>`).join('')}</ul><a class="btn btn-ghost" href="mailto:${esc(CONFIG.COMPANY.email)}">${t(k + 'l')}</a></div>`).join('')}</div>
  </section>
  <section class="wrap"><div class="dark stack-lg"><h2>${t('howExpertsH')}</h2><div class="steps">${steps('he')}</div></div></section>
  <section class="wrap section" style="padding-bottom:0"></section>
  <section class="wrap"><div class="soft stack-lg">
    <h2>${t('payH')}</h2>
    <div class="grid-sm">${PAY.map(([f, a, b]) => `<div class="card"><p class="muted small">${esc(fieldName(f))}</p><p class="stat-v" style="font-size:1.5rem">$${a}–${b}</p><p class="muted small">${t('perHour')}</p></div>`).join('')}</div>
    <p class="muted small">${t('payNote')}</p>
  </div></section>
  <section class="wrap section"><div class="stack-lg"><h2>${t('howCompaniesH')}</h2><div class="steps">${steps('hc')}</div><a class="btn" style="align-self:flex-start" href="#/companies">${t('hire')}</a></div></section>
  <section class="wrap section stack-lg">
    <h2>${t('whyH')}</h2>
    ${benefitCards()}
  </section>
  <section class="wrap"><div class="dark row between" style="gap:24px"><div class="stack" style="gap:10px;max-width:640px"><h2>${t('referralH')}</h2><p class="muted">${t('referralP')}</p></div><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></div></section>
  <section class="wrap section"></section>`;
}

async function pageRoles() {
  const roles = await getRoles();
  const q0 = parseHash().query;
  return {
    html: `<section class="wrap section stack-lg">
      <div class="stack" style="gap:8px"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('rolesH')}</h1><p class="muted">${t('rolesSub')}</p></div>
      <div class="card stack" style="gap:6px"><h3>${t('poolH')}</h3><p class="muted">${t('poolP')}</p></div>
      <div class="filters">
        <input id="q" type="search" placeholder="${esc(t('search'))}" value="${esc(q0.get('q') || '')}">
        <select id="ff"><option value="">${t('allFields')}</option>${fieldOptions(q0.get('field') || '')}</select>
        <select id="fp"><option value="0">${t('anyPay')}</option>${[50, 80, 100, 120].map((v) => `<option value="${v}">${money(v)}+ ${t('perHour')}</option>`).join('')}</select>
        <select id="fs"><option value="new">${t('sortNew')}</option><option value="pay">${t('sortPay')}</option></select>
      </div>
      <p class="muted small" id="roleCount"></p>
      <div class="grid" id="roleList"></div>
    </section>`,
    mount() {
      const q = document.getElementById('q'); const ff = document.getElementById('ff'); const fp = document.getElementById('fp'); const fs = document.getElementById('fs');
      const list = document.getElementById('roleList'); const count = document.getElementById('roleCount');
      const draw = () => {
        const s = q.value.trim().toLowerCase(); const f = ff.value; const minPay = Number(fp.value);
        let res = roles.filter((r) => (!f || r.field === f) && Number(r.rate_max) >= minPay
          && (!s || [r.title, r.field, fieldName(r.field), r.description, r.skills].join(' ').toLowerCase().includes(s)));
        if (fs.value === 'pay') res = [...res].sort((a, b) => Number(b.rate_max) - Number(a.rate_max));
        count.textContent = t('rolesCount').replace('{n}', res.length);
        list.innerHTML = res.length ? res.map(roleCard).join('') : `<p class="muted">${t('noRoles')}</p>`;
      };
      [q, ff, fp, fs].forEach((el) => { el.oninput = draw; el.onchange = draw; }); draw();
    },
  };
}

async function pageRole(id) {
  let role = null;
  if (sb && !id.startsWith('demo-')) {
    const { data } = await sb.from('roles').select('*').eq('id', id).maybeSingle();
    role = data;
  } else role = DEMO_ROLES.find((r) => r.id === id);
  if (!role) return pageNotFound();
  const others = (await getRoles()).filter((r) => r.id !== role.id).sort((a, b) => (b.field === role.field) - (a.field === role.field)).slice(0, 3);

  // Apply in one step (like Mercor): signed-out visitors create their account and the application is sent right after.
  let action = '';
  if (!session) {
    action = `<a class="btn btn-accent" href="#/apply?role=${esc(role.id)}" id="applyStart">${t('applyNow')}</a>
      <p class="muted small">${t('applyOneStep')}</p><a class="small" href="#/login">${t('haveAccount')} ${t('login')}</a>`;
  } else if (!actsAsExpert()) {
    action = `<p class="muted">${t('mustBeExpert')}</p>`;
  } else {
    const { data: existing } = await sb.from('applications').select('id,status').eq('role_id', role.id).eq('expert_id', session.user.id).maybeSingle();
    action = existing
      ? `<div class="form-msg ok">${t('applied')} ${pill(existing.status)}</div><a class="btn btn-ghost btn-sm" href="#/dashboard">${t('nextSteps')} →</a>`
      : `<form id="applyRole" class="stack"><button class="btn btn-accent" type="submit">${t('applyOneClick')}</button>
          <details><summary class="link small">${t('addNote')}</summary><textarea name="note" maxlength="2000" style="margin-top:8px"></textarea></details></form>`;
  }
  const resp = lines(role.responsibilities); const skills = skillList(role.skills);

  return {
    html: `<section class="wrap section stack-lg">
      <a href="#/roles">${t('back')}</a>
      <div class="role-layout">
        <div class="stack-lg" style="min-width:0">
          <div class="stack" style="gap:12px"><div class="row" style="gap:8px"><span class="chip">${esc(fieldName(role.field))}</span><span class="chip">${t('poolChip')}</span></div>
            <h1 style="font-size:clamp(2rem,5vw,3.2rem)">${esc(role.title)}</h1>
            <p class="muted">${money(role.rate_min)}–${money(role.rate_max)} ${t('perHour')} · ${t('remote')} · ${esc(role.hours_per_week || '')}</p></div>
          <div class="stack"><h3>${t('aboutRole')}</h3><p style="white-space:pre-line">${esc(role.description)}</p></div>
          ${resp.length ? `<div class="stack"><h3>${t('responsibilities')}</h3><ul class="ticks">${resp.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
          <div class="stack"><h3>${t('requirements')}</h3><p style="white-space:pre-line">${esc(role.requirements)}</p></div>
          ${skills.length ? `<div class="stack"><h3>${t('skillsH')}</h3><div class="row" style="gap:8px">${skills.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div></div>` : ''}
          <div class="card stack"><h3>${t('howApplyH')}</h3><ol class="steps-list"><li>${t('howApply1')}</li><li>${t('howApply2')}</li><li>${t('howApply3')}</li><li>${t('howApply4')}</li></ol></div>
        </div>
        <aside class="card stack role-side">
          <p class="muted small">${t('pay')}</p><p class="role-pay">${money(role.rate_min)}–${money(role.rate_max)} <span class="muted small">${t('perHour')}</span></p>
          <div class="row between small"><span class="muted">${t('hours')}</span><b>${esc(role.hours_per_week || '')}</b></div>
          <div class="row between small"><span class="muted">${t('location')}</span><b>${t('remote')}</b></div>
          <div class="row between small"><span class="muted">${t('paidH')}</span><b>${t('weekly')}</b></div>
          <p class="muted small">${t('poolShort')}</p>
          ${action}
        </aside>
      </div>
      ${others.length ? `<div class="stack"><h2 style="font-size:1.6rem">${t('similarRoles')}</h2><div class="grid">${others.map(roleCard).join('')}</div></div>` : ''}
    </section>`,
    mount() {
      const st = document.getElementById('applyStart');
      if (st) st.onclick = () => { try { localStorage.setItem(APPLY_KEY, JSON.stringify({ role: role.id, at: Date.now() })); } catch { /* ignore */ } };
      const f = document.getElementById('applyRole');
      if (f) f.onsubmit = async (e) => {
        e.preventDefault(); busy(f, true);
        const { error } = await sb.from('applications').insert({ role_id: role.id, expert_id: session.user.id, note: formData(f).note || null });
        busy(f, false);
        if (error) return fail(error);
        toast(t('applied')); render();
      };
    },
  };
}

// A role chosen before signing up is applied for automatically once the expert account exists (one-step apply).
const APPLY_KEY = 'bp-apply-role';
async function finishPendingApply() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(APPLY_KEY) || 'null'); } catch { p = null; }
  if (!p || !sb || !session || !actsAsExpert()) return;
  try { localStorage.removeItem(APPLY_KEY); } catch { /* ignore */ }
  if (Date.now() - (p.at || 0) > 7 * 864e5 || String(p.role).startsWith('demo-')) return;
  const { error } = await sb.from('applications').insert({ role_id: p.role, expert_id: session.user.id });
  if (!error) toast(t('applied'));
}

// ---------------------------------------------------------------- CV → profile (like Mercor, 20.11.2026)
// The PDF is read in the browser (pdf.js); nothing is sent anywhere. The result only fills form fields –
// the person checks and saves them.
let pdfjsLib = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/';
  pdfjsLib = await import(base + 'pdf.min.mjs');
  try {
    const blob = new Blob([`import "${base}pdf.worker.min.mjs";`], { type: 'text/javascript' });
    pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(blob), { type: 'module' });
  } catch { pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs'; }
  return pdfjsLib;
}

async function pdfText(file) {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = '';
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    out += c.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n';
  }
  return out;
}

const FIELD_WORDS = {
  'Medicine': ['physician', 'doctor', 'medical', 'medicine', 'clinic', 'hospital', 'resident', 'surgeon', 'md', 'arzt', 'ärztin', 'medizin', 'spital', 'médecin', 'medico'],
  'Law': ['lawyer', 'attorney', 'legal', 'law', 'counsel', 'jurist', 'rechtsanwalt', 'anwalt', 'recht', 'avocat', 'avvocato', 'abogado'],
  'Software': ['software', 'developer', 'engineer', 'python', 'javascript', 'typescript', 'java', 'react', 'backend', 'frontend', 'devops', 'programmer', 'entwickler'],
  'Chemistry & Math': ['chemistry', 'chemist', 'mathematics', 'mathematician', 'physics', 'statistics', 'chemie', 'mathematik', 'physik', 'phd'],
  'Pharmacy': ['pharmacist', 'pharmacy', 'pharmaceutical', 'apotheke', 'apotheker', 'pharmacien', 'farmacista'],
  'Accounting': ['accountant', 'accounting', 'cpa', 'tax', 'audit', 'auditor', 'bookkeeping', 'buchhaltung', 'treuhand', 'steuer', 'comptable'],
  'Translation (DE)': ['translator', 'translation', 'localization', 'interpreter', 'bilingual', 'zweisprachig', 'native speaker', 'übersetzer', 'übersetzung', 'dolmetscher', 'traducteur'],
};
const SKILL_WORDS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Golang', 'Rust', 'SQL', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
  'Machine Learning', 'Data analysis', 'Excel', 'SAP', 'IFRS', 'US GAAP', 'Tax', 'Audit', 'Contract law', 'Corporate law', 'Litigation', 'Compliance',
  'GDPR', 'Clinical research', 'Diagnosis', 'Surgery', 'Pharmacology', 'Patient care', 'Statistics', 'LaTeX', 'MATLAB', 'Organic chemistry',
  'Translation', 'Proofreading', 'Localization', 'SDL Trados', 'German', 'English', 'French', 'Italian', 'Spanish', 'Project management', 'Research', 'Teaching'];

function parseCvText(text) {
  const low = text.toLowerCase();
  const words = low.match(/[a-zäöüéèàç+#.]+/g) || [];
  const count = (list) => list.reduce((n, w) => n + words.filter((x) => x === w || (w.length > 5 && x.startsWith(w))).length, 0);
  const scores = Object.entries(FIELD_WORDS).map(([f, list]) => [f, count(list)]).sort((a, b) => b[1] - a[1]);
  const field = scores[0][1] >= 2 ? scores[0][0] : '';
  const li = text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w\-%.]+\/?/i);
  // Experience: earliest start year of "2015 – 2023" / "03/2016 - present" ranges, preferably inside the experience section.
  const sec = (() => {
    const m = low.search(/(work )?experience|employment|berufserfahrung|erfahrung|expérience|esperienza|experiencia/);
    if (m < 0) return low;
    const rest = low.slice(m);
    const e = rest.slice(20).search(/education|ausbildung|studium|formation|istruzione|educación|skills|kenntnisse/);
    return e < 0 ? rest : rest.slice(0, e + 20);
  })();
  const now = new Date().getFullYear();
  const starts = [...sec.matchAll(/((?:19|20)\d{2})\s*(?:[-–—]|to|bis|à|a)\s*(?:\d{1,2}[./])?((?:19|20)\d{2}|present|current|today|now|heute|jetzt|aujourd|oggi|attuale|actual)/g)]
    .map((m) => Number(m[1])).filter((y) => y > 1960 && y <= now);
  const years = starts.length ? Math.min(60, now - Math.min(...starts)) : null;
  const skills = SKILL_WORDS.filter((k) => new RegExp(`(^|[^a-z])${k.toLowerCase().replace(/[.+#]/g, (c) => '\\' + c)}([^a-z]|$)`).test(low)).slice(0, 12);
  const firstLines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3 && l.length < 90).slice(0, 15);
  const fw = field ? FIELD_WORDS[field] : [];
  const headline = firstLines.find((l) => fw.some((w) => l.toLowerCase().includes(w))) || '';
  const sm = text.match(/(?:summary|profile|about me|profil|über mich|zusammenfassung|à propos|sommario|perfil)\s*[:\n]\s*([\s\S]{40,700}?)(?:\n\s*\n|experience|berufserfahrung|education|ausbildung)/i);
  const bio = sm ? sm[1].replace(/\s+/g, ' ').trim().slice(0, 600) : '';
  return { field, years, linkedin: li ? (li[0].startsWith('http') ? li[0] : 'https://' + li[0]) : '', skills: skills.join(', '), headline, bio };
}

async function readCv(file) {
  try { return parseCvText(await pdfText(file)); } catch (e) { console.warn('CV could not be read', e); return null; }
}

// Fills empty fields of a form (or all when overwrite) from the parsed CV; returns how many were filled.
function fillFromCv(form, cv, map, overwrite = false) {
  let n = 0;
  Object.entries(map).forEach(([key, name]) => {
    const el = form.querySelector(`[name=${name}]`); const v = cv[key];
    if (!el || v === null || v === undefined || v === '') return;
    if (!overwrite && el.value && !(el.tagName === 'SELECT' && el.selectedIndex === 0)) return;
    el.value = v; el.classList.add('filled'); n++;
  });
  return n;
}

function authForm(kind) {
  // kind: 'expert' | 'company'
  const q = parseHash().query;
  const ref = q.get('ref') || '';
  const google = oauthHtml();
  const expertFields = `
    <h3>${t('stepProfile')}</h3>
    <label class="f cv-drop">${t('cvAutoL')}<input name="cv_file" type="file" accept="application/pdf"><span class="muted small" id="cvAutoMsg">${t('cvAutoP')}</span></label>
    <div class="form-grid">
      <label class="f">${t('field')} *<select name="field" required>${fieldOptions()}</select></label>
      <label class="f">${t('years')} *<input name="years" type="number" min="0" max="60" required></label>
      <label class="f">${t('rate')}<input name="rate" type="number" min="1" max="1000"></label>
      <label class="f">${t('linkedin')}<input name="linkedin" type="url" placeholder="https://"></label>
    </div>
    <label class="f">${t('languagesL')}<input name="languages" maxlength="300" placeholder="${esc(t('languagesPh'))}"></label>
    <label class="f">${t('bio')} *<textarea name="bio" required maxlength="3000"></textarea></label>
    <input type="hidden" name="ref" value="${esc(ref)}">`;
  const companyFields = `
    <div class="form-grid">
      <label class="f">${t('companyName')} *<input name="company_name" required></label>
      <label class="f">${t('website')}<input name="website" type="url" placeholder="https://"></label>
    </div>`;
  // Company sign-up with Google/Microsoft: company name first, then the buttons (owner, 20.11.2026).
  const companyFirst = kind === 'company' && google ? `${companyFields}` : '';
  return `<form id="signup" class="card stack" style="padding:32px">
    ${companyFirst}
    ${google}
    <h3>${t('stepAccount')}</h3>
    <div class="form-grid">
      <label class="f">${kind === 'company' ? t('contactName') : t('fullName')} *<input name="full_name" required autocomplete="name"></label>
      <label class="f">${t('country')} *<input name="country" required autocomplete="country-name"></label>
      <label class="f">${t('email')} *<input name="email" type="email" required autocomplete="email"></label>
      <label class="f">${t('password')} *<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
    </div>
    ${kind === 'company' ? (companyFirst ? '' : companyFields) : expertFields}
    <label class="check"><input type="checkbox" required> <span>${t('agree')} <a href="#/legal/${kind === 'company' ? 'client' : 'terms'}">${t('terms')}</a> · <a href="#/legal/privacy">${t('privacy')}</a></span></label>
    <div id="signupMsg"></div>
    <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('createAccount')}</button>
    <p class="small muted">${t('haveAccount')} <a href="#/login">${t('login')}</a></p>
  </form>`;
}

function mountSignup(kind) {
  const f = document.getElementById('signup');
  mountOAuth(f, kind);
  let cvFile = null;
  const cvIn = f.querySelector('[name=cv_file]');
  if (cvIn) cvIn.onchange = async () => {
    const file = cvIn.files[0]; const msg = document.getElementById('cvAutoMsg');
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) { cvFile = null; msg.textContent = 'PDF, max. 10 MB'; return; }
    cvFile = file; msg.textContent = t('cvReading');
    const cv = await readCv(file);
    const n = cv ? fillFromCv(f, cv, { field: 'field', years: 'years', linkedin: 'linkedin', bio: 'bio' }) : 0;
    msg.textContent = n ? t('cvFilled') : t('cvNotRead');
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (!sb) return toast(t('notConfigured'), true);
    const d = formData(f);
    delete d.cv_file;
    const meta = { role: kind, full_name: d.full_name, country: d.country };
    if (kind === 'expert') Object.assign(meta, { field: d.field, years: d.years, rate: d.rate, linkedin: d.linkedin, bio: d.bio, ref: d.ref, languages: d.languages });
    else Object.assign(meta, { company_name: d.company_name, website: d.website, terms: 'accepted' });
    busy(f, true);
    const { data, error } = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: meta, emailRedirectTo: location.origin + location.pathname } });
    busy(f, false);
    const msg = document.getElementById('signupMsg');
    if (error) { msg.innerHTML = `<div class="form-msg err">${esc(error.message)}</div>`; return; }
    if (data.session) {
      // Keep the CV chosen in the form (when the account is usable right away).
      if (cvFile) {
        const path = `${data.session.user.id}/cv-${Date.now()}.pdf`;
        const up = await sb.storage.from('cvs').upload(path, cvFile, { contentType: 'application/pdf' });
        if (!up.error) await sb.from('experts').update({ cv_path: path }).eq('id', data.session.user.id);
      }
      go('#/dashboard'); return;
    }
    f.innerHTML = `<div class="form-msg ok">${t('checkEmail')}</div>`;
  };
}

// Owner, 20.11.2026: someone already signed in who opens "Apply as expert" / "Create company account" used to be
// sent to the dashboard without a word (looked like a broken button). Now they see who is signed in and can sign out
// right there; after signing out the same page opens with the sign-up form.
function signedInNotice(titleKey) {
  const who = esc(session?.user?.email || profile?.email || '');
  return {
    html: `<section class="wrap section narrow stack-lg"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t(titleKey)}</h1>
      <div class="card stack" style="padding:28px;gap:16px">
        <p style="margin:0">${t('signedInAs')} <strong>${who}</strong>.</p>
        <p class="muted" style="margin:0">${t('signedInApplyHint')}</p>
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <button class="btn btn-accent" type="button" id="switchAccountBtn">${t('signOutToApply')}</button>
          <a class="btn btn-ghost" href="#/dashboard">${t('dashboard')}</a>
        </div>
      </div></section>`,
    mount() {
      const b = document.getElementById('switchAccountBtn');
      if (b) b.onclick = async () => { b.disabled = true; await sb.auth.signOut(); location.reload(); };
    },
  };
}

function pageApply() {
  if (session) return signedInNotice('applyH');
  return {
    html: `<section class="wrap section narrow stack-lg"><div class="stack" style="gap:8px"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('applyH')}</h1><p class="muted">${t('applySub')}</p></div>${authForm('expert')}</section>`,
    mount() {
      const role = parseHash().query.get('role');
      if (role) { try { localStorage.setItem(APPLY_KEY, JSON.stringify({ role, at: Date.now() })); } catch { /* ignore */ } }
      mountSignup('expert');
    },
  };
}

function pageCompanySignup() {
  if (session) return signedInNotice('companySignupH');
  return {
    html: `<section class="wrap section narrow stack-lg"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('companySignupH')}</h1>${authForm('company')}</section>`,
    mount() { mountSignup('company'); },
  };
}

function pageLogin() {
  if (session) return { html: '', mount() { go('#/dashboard'); } };
  const google = oauthHtml();
  return {
    html: `<section class="wrap section stack-lg" style="max-width:480px">
      <h1 style="font-size:2.5rem">${t('loginH')}</h1>
      <form id="loginF" class="card stack" style="padding:28px">
        ${google}
        <label class="f">${t('email')}<input name="email" type="email" required autocomplete="email"></label>
        <label class="f">${esc(t('password').replace(/\s*\(.*\)/, ''))}<input name="password" type="password" required autocomplete="current-password"></label>
        <div id="loginMsg"></div>
        <button class="btn btn-accent" type="submit">${t('login')}</button>
        <div class="row between small"><a href="#/reset">${t('forgot')}</a><span>${t('noAccount')} <a href="#/apply">${t('applyNow')}</a></span></div>
      </form>
    </section>`,
    mount() {
      const f = document.getElementById('loginF');
      mountOAuth(f, 'login');
      f.onsubmit = async (e) => {
        e.preventDefault();
        if (!sb) return toast(t('notConfigured'), true);
        const d = formData(f); busy(f, true);
        const { error } = await sb.auth.signInWithPassword({ email: d.email, password: d.password });
        busy(f, false);
        if (error) { document.getElementById('loginMsg').innerHTML = `<div class="form-msg err">${esc(error.message)}</div>`; return; }
        // onAuthStateChange takes care of loading the profile and re-rendering
        location.hash = '#/dashboard';
      };
    },
  };
}

function pageReset() {
  const recovering = window.__bpRecovery && session;
  return {
    html: `<section class="wrap section stack-lg" style="max-width:480px">
      <h1 style="font-size:2.5rem">${t('resetH')}</h1>
      ${recovering
        ? `<form id="newPw" class="card stack" style="padding:28px"><label class="f">${t('newPassword')}<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><button class="btn btn-accent" type="submit">${t('savePassword')}</button></form>`
        : `<form id="resetF" class="card stack" style="padding:28px"><label class="f">${t('email')}<input name="email" type="email" required></label><div id="resetMsg"></div><button class="btn btn-accent" type="submit">${t('sendReset')}</button></form>`}
    </section>`,
    mount() {
      const f = document.getElementById('resetF');
      if (f) f.onsubmit = async (e) => {
        e.preventDefault(); if (!sb) return toast(t('notConfigured'), true);
        busy(f, true);
        await sb.auth.resetPasswordForEmail(formData(f).email, { redirectTo: location.origin + location.pathname + '?reset=1' });
        busy(f, false);
        document.getElementById('resetMsg').innerHTML = `<div class="form-msg ok">${t('resetSent')}</div>`;
      };
      const n = document.getElementById('newPw');
      if (n) n.onsubmit = async (e) => {
        e.preventDefault(); busy(n, true);
        const { error } = await sb.auth.updateUser({ password: formData(n).password });
        busy(n, false);
        if (error) return fail(error);
        window.__bpRecovery = false; toast(t('passwordSaved')); go('#/dashboard');
      };
    },
  };
}

function pageCompanies() {
  return `<section class="wrap section stack-lg">
    <h1 style="max-width:16ch">${t('companiesH')}</h1>
    <p style="font-size:1.2rem;color:var(--ink2);max-width:42rem">${t('companiesSub')}</p>
    <div class="row"><a class="btn btn-accent" href="${session ? '#/dashboard' : '#/company-signup'}">${t('hire')}</a></div>
    <div class="steps">${[1, 2, 3].map((i) => `<div class="step"><span class="step-n">${i}</span><h3>${t('cp' + i + 'h')}</h3><p class="muted">${t('cp' + i + 'p')}</p></div>`).join('')}</div>
  </section>
  <section class="wrap"><div class="dark stack-lg"><h2>${t('howCompaniesH')}</h2><div class="steps">${[1, 2, 3].map((i) => `<div class="step"><span class="step-n">${i}</span><h3>${t('hc' + i + 'h')}</h3><p class="muted">${t('hc' + i + 'p')}</p></div>`).join('')}</div></div></section>
  <section class="wrap section"><div class="stack" style="border-top:1px solid var(--ink);padding-top:32px"><h2>${t('cpPriceH')}</h2><p class="muted" style="max-width:42rem">${t('cpPriceP')}</p><div class="grid-sm" style="margin-top:12px">${FIELDS.slice(0, 7).map((f) => `<span class="chip">${esc(fieldName(f))}</span>`).join('')}</div><a class="btn" style="align-self:flex-start;margin-top:8px" href="${session ? '#/dashboard' : '#/company-signup'}">${t('hire')}</a></div></section>`;
}

// Research page: one colored card per field, scrolling right to left (owner, 20.11.2026).
// No partner logos or model scores – Brightpeer has none.
const FIELD_CARDS = [
  ['Medicine', '#0B6B4A', '#fff', 'fc1h', 'fc1p'],
  ['Law', '#3B342E', '#fff', 'fc2h', 'fc2p'],
  ['Software', '#111318', '#fff', 'fc3h', 'fc3p'],
  ['Chemistry & Math', '#2F6FED', '#fff', 'fc4h', 'fc4p'],
  ['Pharmacy', '#D7F25B', '#0E0F12', 'fc5h', 'fc5p'],
  ['Accounting', '#E8F0EA', '#0E0F12', 'fc6h', 'fc6p'],
  ['Translation (DE)', '#0F9D6B', '#fff', 'fc7h', 'fc7p'],
];
function fieldCarousel() {
  const card = ([f, bg, fg, title, text]) => {
    const p = PAY.find((x) => x[0] === f);
    return `<div class="fcard" style="background:${bg};color:${fg}">
      <p class="fcard-tag">${esc(fieldName(f))}</p>
      <h3>${esc(t(title))}</h3>
      <p class="fcard-text">${esc(t(text))}</p>
      <div class="fcard-foot"><b>${p ? `$${p[1]}–${p[2]} / h` : ''}</b><a href="#/roles?field=${encodeURIComponent(f)}" style="color:${fg}">${t('viewRoles')} →</a></div>
    </div>`;
  };
  const cards = FIELD_CARDS.map(card).join('');
  // cards are rendered twice so the loop runs seamlessly; the copy is hidden from screen readers
  return `<div class="marquee-wrap">
    <div class="marquee" id="marquee" aria-label="Fields"><div class="marquee-track">${cards}<div class="marquee-copy" aria-hidden="true">${cards}</div></div></div>
    <div class="wrap marquee-nav"><button type="button" class="mq-btn" data-dir="-1" aria-label="Previous">←</button><button type="button" class="mq-btn" data-dir="1" aria-label="Next">→</button></div>
  </div>`;
}
// Cards move slowly by themselves; visitors can also swipe, scroll or use the arrows (owner, 20.11.2026).
function mountCarousel() {
  const el = document.getElementById('marquee');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = false; let resumeT; let last = 0;
  const half = () => el.scrollWidth / 2;
  const wrapPos = () => { if (el.scrollLeft >= half()) el.scrollLeft -= half(); else if (el.scrollLeft <= 0) el.scrollLeft += half(); };
  const pause = (ms = 4000) => { paused = true; clearTimeout(resumeT); resumeT = setTimeout(() => { paused = false; }, ms); };
  el.scrollLeft = 1;
  const step = (ts) => {
    if (!document.body.contains(el)) return;
    const dt = last ? Math.min(ts - last, 50) : 16; last = ts;
    if (!paused && !reduce) { el.scrollLeft += dt * 0.04; wrapPos(); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  el.addEventListener('pointerenter', () => { paused = true; clearTimeout(resumeT); });
  el.addEventListener('pointerleave', () => pause(1500));
  ['wheel', 'touchstart', 'pointerdown'].forEach((ev) => el.addEventListener(ev, () => pause(), { passive: true }));
  el.addEventListener('scroll', wrapPos, { passive: true });
  // drag with the mouse
  let down = null;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { down = { x: e.clientX, l: el.scrollLeft, moved: false }; } });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) down.moved = true; el.scrollLeft = down.l - dx; });
  window.addEventListener('pointerup', () => { if (down?.moved) { const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); }; el.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => el.removeEventListener('click', stop, true), 50); } down = null; });
  document.querySelectorAll('.mq-btn').forEach((b) => b.addEventListener('click', () => {
    pause(5000);
    const card = el.querySelector('.fcard'); const w = card ? card.offsetWidth + 20 : 380;
    el.scrollBy({ left: Number(b.dataset.dir) * w, behavior: 'smooth' });
  }));
}

function pageResearch() {
  return { mount: mountCarousel, html: `<section class="wrap section stack" style="padding-bottom:24px">
    <h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">Research</h1>
    <p style="font-size:1.15rem;color:var(--ink2);max-width:40rem">${t('researchIntro')}</p>
  </section>
  ${fieldCarousel()}
  <section class="wrap section narrow prose">
    <p style="font-size:1.15rem;color:var(--ink2)">AI models are only as good as the knowledge they learn from. Brightpeer experts create the high-quality data, evaluations and feedback that help AI systems reason like real professionals.</p>
    <h2>What experts do</h2>
    <ul><li><b>Write expert questions</b> – realistic cases from medicine, law, finance, science and engineering.</li><li><b>Grade AI answers</b> – check accuracy, safety and reasoning step by step.</li><li><b>Improve answers</b> – rewrite weak answers the way a senior professional would.</li><li><b>Build benchmarks</b> – hard test sets that show where models still fail.</li></ul>
    <h2>Why expert data matters</h2>
    <p>General crowd work cannot judge whether a drug interaction is dangerous or a contract clause is enforceable. Only trained professionals can. That is why Brightpeer works exclusively with vetted experts and pays professional rates.</p>
    <h2>Quality first</h2>
    <p>Every expert is reviewed before their first project. Work is double-checked, and feedback flows back to the expert so quality keeps improving.</p>
    <p><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></p>
  </section>` };
}

function pageAbout() {
  return `<section class="wrap section narrow prose">
    <h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('navAbout')}</h1>
    <p style="font-size:1.15rem;color:var(--ink2)">Brightpeer is a global network of professionals who get paid for their expertise. We connect experts with companies that need real knowledge – and take care of everything in between.</p>
    <h2>Our mission</h2><p>Make expert knowledge accessible to every company and give professionals a flexible, well-paid way to use their skills – from anywhere in the world.</p>
    <h2>How we work</h2>
    <ul><li>Fair, transparent hourly pay – shown on every role.</li><li>Weekly payouts with no fees.</li><li>Every expert and every project is reviewed by our team.</li><li>Remote-first, worldwide.</li></ul>
    <h2>Contact</h2><p><a href="mailto:${esc(CONFIG.COMPANY.email)}">${esc(CONFIG.COMPANY.email)}</a></p>
  </section>`;
}

function pageHelp() {
  const faq = [
    ['Is it free to join?', 'Yes. Signing up is always free. Experts never pay anything.'],
    ['How much can I earn?', 'Between $40 and $250 per hour, depending on your field and experience. The exact rate is shown on each role.'],
    ['When and how do I get paid?', 'Every week, for the hours approved in the previous week – by bank transfer or PayPal, with no fees from us.'],
    ['How does the review work?', 'After you apply and upload your CV, our team reviews your profile. This usually takes a few days. You will see your status in your dashboard.'],
    ['How many hours do I need to work?', 'It depends on the project – most roles are 5 to 30 hours per week, and you can choose what fits you.'],
    ['How does the referral bonus work?', 'Share your link from your dashboard. When your colleague completes their first 10 paid hours, you both get $100.'],
    ['I am a company – how do I start?', 'Create a company account and send a request. We will contact you within 1–2 business days with a quote.'],
    ['How do companies pay?', 'By prepayment. You top up your Brightpeer balance by card or bank transfer, and approved expert hours are paid from it every week. You can see your balance in your dashboard at any time, and unused balance is refunded on request.'],
    ['How do I delete my account or data?', `Write to ${CONFIG.COMPANY.email} and we will delete your data.`],
  ];
  return `<section class="wrap section narrow stack-lg">
    <h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('navHelp')}</h1>
    <div>${faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <div class="card stack"><h3>Still need help?</h3><p class="muted">Email us at <a href="mailto:${esc(CONFIG.COMPANY.email)}">${esc(CONFIG.COMPANY.email)}</a></p></div>
  </section>`;
}

function pageLegal(which) {
  const C = CONFIG.COMPANY;
  const who = `Brightpeer is a sole proprietorship based at ${esc(C.address)}`;
  const mail = `<a href="mailto:${esc(C.email)}">${esc(C.email)}</a>`;
  const updated = '<p class="muted small">Last updated: 25 November 2026</p>';
  const PAGES = ['terms', 'client', 'privacy', 'imprint', 'cookies'];
  if (!PAGES.includes(which)) which = 'terms';
  const label = { terms: t('terms'), client: t('clientTerms'), privacy: t('privacy'), imprint: t('imprint'), cookies: t('cookies') };
  const tabs = `<div class="row">${PAGES.map((k) => `<a class="btn btn-sm ${which === k ? '' : 'btn-ghost'}" href="#/legal/${k}">${label[k]}</a>`).join('')}</div>`;
  const ol = (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
  const tbl = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const law = 'These Terms are governed by Swiss law, excluding conflict-of-law rules and the UN Convention on the International Sale of Goods. The courts of Biel/Bienne, Switzerland, have exclusive jurisdiction';
  let body = '';

  if (which === 'terms') {
    body = `<h1 style="font-size:2.5rem">Expert Terms of Service</h1>${updated}
      <p>These Expert Terms ("Terms") govern your use of Brightpeer as an expert. ${who}, Switzerland ("Brightpeer", "we", "us"). By creating an account or applying for a project, you accept these Terms.</p>
      <h2>1. What Brightpeer does</h2><p>Brightpeer connects qualified professionals ("Experts") with companies that need expert work, such as AI training, evaluation, research or advisory tasks ("Clients"). Clients contract with Brightpeer. Brightpeer engages Experts for specific projects and pays them directly.</p>
      <h2>2. Eligibility</h2>${ol([
        'You must be at least 18 years old and legally able to enter into contracts.',
        'You may only hold one account. All information you provide (identity, education, licences, experience) must be true and current.',
        'We may verify your identity, qualifications and references, and may decline or remove any application at our discretion.',
        'You are responsible for complying with the laws of your country, including any rules on working for foreign businesses.'])}
      <h2>3. Independent contractor status</h2><p>You work as an independent contractor, not as an employee, agent or partner of Brightpeer or any Client. You decide when and how much you work, use your own equipment, and may work for others. You are not entitled to employee benefits, holidays or insurance from Brightpeer. You are solely responsible for your own taxes, social security contributions and any business registration required where you live.</p>
      <h2>4. Projects</h2>${ol([
        'Each project shows its tasks, hourly rate, expected hours and any special rules. Accepting a project creates a separate project agreement on these Terms.',
        'You must complete work yourself, personally, and not use other people or subcontractors.',
        'You may only use AI tools for a task where the project rules expressly allow it.',
        'We or the Client may end your participation in a project at any time. You are paid for approved work completed up to that point.'])}
      <h2>5. Hours, pay and payouts</h2>${ol([
        'You log your hours accurately in the Brightpeer dashboard. Logging time you did not work is fraud and leads to removal and non-payment.',
        'Hours are reviewed and approved weekly. Approved hours are paid weekly by bank transfer or PayPal, in USD unless stated otherwise.',
        'Brightpeer charges Experts no sign-up, platform or payout fees. Your bank or PayPal may charge their own fees or currency conversion costs.',
        'We may withhold payment for work that does not meet the project\'s quality rules, breaches these Terms or is under investigation for fraud. We will tell you why.',
        'You must keep your payout details correct. We are not responsible for payments sent to details you provided.'])}
      <h2>6. Referral bonus</h2><p>If a person you refer is accepted and completes their first 10 paid hours, both of you receive a referral bonus of USD 100. Self-referrals, fake accounts or spam lead to cancellation of all bonuses.</p>
      <h2>7. Confidentiality</h2><p>All project materials, Client names, data, prompts, guidelines and outputs are confidential. You may not share, copy, publish or use them outside the project, during or after it, unless the Client or Brightpeer agrees in writing. You must delete confidential material when a project ends, if asked.</p>
      <h2>8. Intellectual property</h2><p>Everything you create for a project ("Work Product") is transferred to Brightpeer or the Client, as specified, in full and worldwide, as soon as it is created. To the extent a transfer is not possible by law, you grant an exclusive, perpetual, irrevocable, royalty-free licence. You confirm the Work Product is your own and does not infringe anyone's rights.</p>
      <h2>9. Conduct</h2><p>You agree not to: use another person's identity; share your account; contact Clients to work with them outside Brightpeer for 12 months after a project you met them through; harass anyone; or attempt to manipulate tests, reviews or the platform.</p>
      <h2>10. Suspension and termination</h2><p>You may close your account at any time. We may suspend or close your account for breach of these Terms, fraud, poor quality or legal reasons. Approved, unpaid hours are paid out unless withheld under section 5.4. Sections 3, 7, 8 and 11–13 survive termination.</p>
      <h2>11. Liability</h2><p>Brightpeer is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential damages, lost earnings from projects not offered, or the availability of work. Our total liability is limited to the amount paid to you in the 3 months before the claim. Nothing limits liability for intent or gross negligence.</p>
      <h2>12. Changes</h2><p>We may update these Terms. We will notify you by email or in the dashboard at least 14 days before material changes take effect. Continuing to use Brightpeer after that means you accept them.</p>
      <h2>13. Governing law and jurisdiction</h2><p>${law}, unless mandatory law where you live provides otherwise.</p>
      <p>Contact: ${mail}</p>`;
  } else if (which === 'client') {
    body = `<h1 style="font-size:2.5rem">Client Terms of Service</h1>${updated}
      <p>These Client Terms govern the services Brightpeer provides to businesses ("Client"). ${who}, Switzerland. They apply to every order, statement of work or request the Client submits.</p>
      <h2>1. Services</h2><p>Brightpeer recruits, vets and manages independent experts ("Experts") to perform the work the Client describes in a request ("Project"). Brightpeer is the Client's sole contracting party. Experts are engaged by Brightpeer, not by the Client.</p>
      <h2>2. Requests and Statements of Work</h2>${ol([
        'The Client describes each Project: scope, required skills, expected hours, deadlines, quality criteria and confidentiality rules.',
        'Brightpeer confirms the Project with a quote or statement of work ("SOW") stating rates and estimated volume. A Project starts once both sides accept the SOW.',
        'Brightpeer selects the Experts. It may first show the Client anonymous Expert profiles (field, experience, skills, test and interview results) in the dashboard; names and contact details are shared only as far as needed once an Expert is assigned.',
        'The Client may ask for an Expert to be replaced; Brightpeer will do so within a reasonable time.'])}
      <h2>3. Fees and payment</h2>${ol([
        'Fees are charged per approved Expert hour at the rates in the SOW, unless a fixed price is agreed.',
        'Brightpeer works with prepayment. Before a Project starts, the Client tops up a prepaid balance in USD (unless agreed otherwise) by card, bank transfer or another method Brightpeer offers.',
        'Approved Expert hours are deducted from the balance every week. The Client can see the balance in the Brightpeer dashboard.',
        'If the balance does not cover the expected hours, Brightpeer may pause the Project until the Client tops up again.',
        'Unused balance is refunded on request within 30 days, minus fees for hours already approved.',
        'Brightpeer issues an invoice for every prepayment and a receipt once it is paid. Both can be downloaded as PDF in the dashboard.',
        'Prices exclude VAT and other taxes, which are added where applicable.'])}
      <h2>4. Timesheets and disputes</h2><p>The Client can see logged hours in the Brightpeer dashboard and approves them there. Objections to hours or quality must be raised in writing within 7 days of the hours being logged, with reasons. Otherwise the hours count as accepted.</p>
      <h2>5. Non-solicitation</h2><p>During a Project and for 12 months after it, the Client may not hire or contract directly any Expert introduced by Brightpeer, except through Brightpeer. If it does, the Client pays a placement fee of 25% of that Expert's first-year compensation, or USD 10,000, whichever is higher.</p>
      <h2>6. Confidentiality and data</h2><p>Both parties keep the other's confidential information secret and use it only for the Project. Experts are bound by equivalent confidentiality obligations. If Experts process personal data on the Client's behalf, the parties will sign a data processing agreement.</p>
      <h2>7. Intellectual property</h2><p>Upon full payment, all rights in the work Experts create for the Client's Project pass to the Client. Brightpeer keeps its own tools, methods and know-how.</p>
      <h2>8. Quality</h2><p>Brightpeer performs the services with due care using qualified Experts. If work does not meet the agreed criteria, Brightpeer will correct or replace it within a reasonable time at no extra cost. This is the Client's primary remedy.</p>
      <h2>9. Liability</h2><p>To the extent permitted by law, Brightpeer is not liable for indirect or consequential loss, lost profit or lost data. Brightpeer's total liability per Project is limited to the fees paid for that Project in the 3 months before the claim. Nothing limits liability for intent or gross negligence.</p>
      <h2>10. Term and termination</h2><p>Either party may end a Project with 7 days' written notice. The Client pays for all approved hours worked until the end. Either party may terminate immediately for material breach that is not fixed within 7 days of notice.</p>
      <h2>11. Governing law and jurisdiction</h2><p>${law}.</p>
      <p>Contact: ${mail}</p>`;
  } else if (which === 'privacy') {
    body = `<h1 style="font-size:2.5rem">Privacy Policy</h1>${updated}
      <p>This policy explains how Brightpeer collects and uses personal data. It complies with the Swiss Federal Act on Data Protection (nFADP) and, where applicable, the EU/UK General Data Protection Regulation (GDPR).</p>
      <h2>1. Controller</h2><p>Brightpeer, ${esc(C.address)}. Privacy questions: ${mail}.</p>
      <h2>2. Data we collect</h2>${tbl(['Category', 'Examples', 'Why', 'Legal basis (GDPR)'], [
        ['Account', 'Name, email, password (encrypted), country, language', 'Create and secure your account', 'Contract'],
        ['Profile and application', 'CV, education, licences, work history, skills, test results, LinkedIn link', 'Assess and match Experts to projects', 'Contract, legitimate interest'],
        ['Identity checks', 'ID document, selfie for verification (if requested)', 'Prevent fraud, confirm identity', 'Legal obligation, legitimate interest'],
        ['Work data', 'Logged hours, task outputs, quality reviews', 'Run projects, pay Experts, collect Client prepayments', 'Contract'],
        ['Payment', 'Bank or PayPal details, prepayments, receipts, tax information', 'Pay Experts, collect Client prepayments', 'Contract, legal obligation'],
        ['Client contacts', 'Name, company, role, email', 'Manage Client relationships', 'Contract, legitimate interest'],
        ['Usage', 'IP address, device, browser (server logs of our hosting providers)', 'Security, running the site', 'Legitimate interest'],
        ['Visit statistics', 'Page opened, referring website, browser language, device type (mobile, tablet, desktop) – no cookies, no IP address, no identifier', 'See how many people visit and which pages help', 'Legitimate interest'],
        ['Communication', 'Emails, support messages', 'Answer requests', 'Contract, legitimate interest']])}
      <h2>3. Sharing</h2><p>We do not sell personal data. We share it only:</p><ul>
        <li>with Clients, limited to what they need for their project (first name, field, logged hours and work outputs);</li>
        <li>with service providers who process data for us: database, login and file storage (Supabase, EU region), website hosting (GitHub Pages), AI rating of written interview answers (Anthropic), payments (banks, PayPal and other payment providers) and email delivery;</li>
        <li>with authorities where required by law.</li></ul>
      <h2>4. International transfers</h2><p>Brightpeer works worldwide, so data may be processed outside Switzerland and the EU, including in the USA. Where a country does not offer adequate protection, we use safeguards such as the EU Standard Contractual Clauses or the Swiss-US Data Privacy Framework.</p>
      <h2>5. Retention</h2><p>We keep account data while your account is open. Rejected applications are deleted after 24 months. Payment and accounting records are kept for 10 years as required by Swiss law. Other data is deleted when no longer needed.</p>
      <h2>6. Your rights</h2><p>You can request access to, correction or deletion of your data, restriction of or objection to processing, and a copy of your data in a portable format. You can withdraw consent at any time. Write to ${mail}. You may also complain to the Swiss Federal Data Protection and Information Commissioner (FDPIC) or your local data protection authority.</p>
      <h2>7. Security</h2><p>We use encryption in transit, access controls and row-level database security. No system is completely secure; we will inform you of any breach as required by law.</p>
      <h2>8. Automated decisions</h2><p>Multiple-choice test answers are scored automatically. Written interview answers are also rated by an AI service (Anthropic, USA) to help us review them; the AI receives your answers and your field, not your name or contact details. Decisions about accepting Experts are made or checked by a person. You can ask for a human review of any decision.</p>
      <h2>9. Children</h2><p>Brightpeer is not for anyone under 18. We do not knowingly collect their data.</p>
      <h2>10. Changes</h2><p>We may update this policy and will post the new date at the top. Material changes are announced by email.</p>`;
  } else if (which === 'imprint') {
    body = `<h1 style="font-size:2.5rem">Legal Notice (Imprint)</h1>
      <p>Brightpeer is operated by:</p>
      <p><b>Brightpeer</b>, sole proprietorship of Laura Hernandez<br>${esc(C.address)}<br>Email: ${mail}${C.uid ? `<br>VAT/UID: ${esc(C.uid)}` : ''}</p>
      <p>Despite careful checks, we accept no liability for the content of external links. Their operators are responsible for them.</p>`;
  } else {
    body = `<h1 style="font-size:2.5rem">Cookie Notice</h1>
      <p>We only use technically necessary storage in your browser: to keep you logged in, keep the site secure and remember your language. These need no consent. We count visits anonymously without any cookie or identifier, and we do not use advertising cookies.</p>
      ${tbl(['Type', 'Purpose', 'Duration'], [['Necessary', 'Login session, security, language choice', 'Session to 12 months']])}`;
  }
  return `<section class="wrap section prose">${tabs}${body}</section>`;
}

function pageNotFound() {
  return `<section class="wrap section stack"><h1 style="font-size:3rem">404</h1><p class="muted">${t('notFound')}</p><a class="btn" style="align-self:flex-start" href="#/">${t('home')}</a></section>`;
}

function needLogin() {
  return { html: '', mount() { go('#/login'); } };
}

// ---------------------------------------------------------------- expert dashboard
async function expertDashboard() {
  const uid = session.user.id;
  const [ex, apps, cons, ts, pays, ivq] = await Promise.all([
    sb.from('experts').select('*').eq('id', uid).maybeSingle(),
    sb.from('applications').select('id,status,created_at,roles(title)').eq('expert_id', uid).order('created_at', { ascending: false }),
    sb.rpc('expert_contracts'),
    sb.from('timesheets').select('*').eq('expert_id', uid).order('week_start', { ascending: false }),
    sb.from('payouts').select('*').eq('expert_id', uid).order('week_start', { ascending: false }),
    sb.from('interviews').select('status').eq('expert_id', uid).maybeSingle(),
  ]);
  const testsCard = await skillTestsCard(uid, (ex.data || {}).field);
  const [{ data: myPayout }, { data: myRefs }] = await Promise.all([sb.rpc('my_payout_details'), sb.rpc('my_referrals')]);
  const rs = myRefs || {};
  const e = ex.data || {};
  const contracts = cons.data || [];
  const sheets = ts.data || [];
  const payouts = pays.data || [];
  const st = e.status || 'pending';
  const stKey = { pending: 'stPending', approved: 'stApproved', rejected: 'stRejected' }[st];
  const paidSum = payouts.filter((p) => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0);
  const pendSum = payouts.filter((p) => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0);
  const paidHours = payouts.filter((p) => p.status === 'paid').reduce((a, p) => a + Number(p.hours || 0), 0);
  const refLink = `${location.origin}${location.pathname}#/apply?ref=${e.referral_code || ''}`;
  const conTitle = Object.fromEntries(contracts.map((c) => [c.id, c.title]));
  const active = contracts.filter((c) => c.status === 'active');
  const offers = contracts.filter((c) => c.status === 'offered');
  const ivStatus = ivq.data?.status || '';
  // Next steps like Mercor's onboarding: profile → CV → interview → payout details → apply.
  const steps = [
    [!!(e.field && e.bio), t('ns1'), '#profileF'],
    [!!e.cv_path, t('ns2'), '#cvCard'],
    [ivStatus === 'submitted' || ivStatus === 'reviewed', ivStatus === 'in_progress' ? t('ns3c') : t('ns3'), '#/interview'],
    [!!(e.payout_method && myPayout), t('ns4'), '#payoutF'],
    [(apps.data || []).length > 0, t('ns5'), '#/roles'],
  ];
  const doneN = steps.filter((x) => x[0]).length;
  const nextCard = doneN === steps.length ? '' : `<div class="card stack" id="nextSteps">
    <div class="row between"><h3>${t('nextSteps')}</h3><span class="muted small">${doneN} / ${steps.length}</span></div>
    <div class="progress"><span style="width:${Math.round((doneN / steps.length) * 100)}%"></span></div>
    <ul class="checklist">${steps.map(([ok, label, href]) => `<li class="${ok ? 'ok' : ''}"><span class="cbox">${ok ? '✓' : ''}</span>${ok ? `<span>${label}</span>` : `<a href="${href}" ${href.startsWith('#/') ? '' : 'data-scroll'}>${label} →</a>`}</li>`).join('')}</ul>
  </div>`;
  const offerCards = offers.map((c) => `<form class="card stack offer" data-offer="${c.id}">
    <p class="label-new">${t('offerNew')}</p>
    <h3>${esc(c.title || '')}</h3>
    <div class="grid-sm">
      <div><p class="muted small">${t('pay')}</p><p class="role-pay">${money(c.expert_rate)} <span class="muted small">${t('perHour')}</span></p></div>
      ${c.hours_per_week ? `<div><p class="muted small">${t('hours')}</p><p style="font-weight:600">${esc(c.hours_per_week)}</p></div>` : ''}
      ${c.start_date ? `<div><p class="muted small">${t('startDate')}</p><p style="font-weight:600">${dateStr(c.start_date)}</p></div>` : ''}
    </div>
    ${c.offer_note ? `<p style="white-space:pre-line">${esc(c.offer_note)}</p>` : ''}
    <label class="check"><input type="checkbox" name="agree" required> <span>${t('offerAgree')} <a href="#/legal/terms">${t('terms')}</a></span></label>
    <label class="f">${t('offerSign')}<input name="sign" required minlength="3" autocomplete="name" placeholder="${esc(profile.full_name || '')}"></label>
    <div class="row"><button class="btn btn-accent" type="submit">${t('offerAccept')}</button><button class="btn btn-ghost" type="button" data-decline="${c.id}">${t('offerDecline')}</button></div>
  </form>`).join('');

  return {
    html: `<section class="wrap section stack-lg">
      <div class="row between"><h1 style="font-size:clamp(2rem,4vw,3rem)">${t('welcome')}, ${esc((profile.full_name || '').split(' ')[0])}</h1><span>${t('status')}: ${pill(st)}</span></div>
      <div class="card stack" style="gap:6px"><h3>${t(stKey)}</h3><p class="muted">${t(stKey + 'P')}</p></div>
      ${offerCards}
      ${nextCard}

      <div class="grid">
        <div class="card stack" id="cvCard">
          <h3>${t('cvH')}</h3>
          ${e.cv_path ? `<p class="form-msg ok">✓ ${t('cvUploaded')}</p>` : `<p class="form-msg err">${t('cvMissing')}</p>`}
          <label class="f">${t('cvUpload')}<input type="file" id="cvFile" accept="application/pdf"></label>
        </div>
        <div class="card stack">
          <h3>${t('earnings')}</h3>
          <div class="row" style="gap:32px"><div><p class="muted small">${t('totalPaid')}</p><p class="stat-v">${money(paidSum)}</p></div><div><p class="muted small">${t('totalPending')}</p><p class="stat-v">${money(pendSum)}</p></div></div>
          ${paidHours >= 20 ? `<a class="small" href="#/confirmation">${t('wcLink')} →</a>` : `<p class="muted small">${t('wcProgress').replace('{n}', Math.round(paidHours * 100) / 100)}</p>`}
        </div>
        <div class="card stack">
          <h3>${t('referralLink')}</h3>
          <p class="muted small">${t('referralH')}</p>
          <div class="row" style="flex-wrap:nowrap"><input id="refLink" readonly value="${esc(refLink)}"><button class="btn btn-sm" id="copyRef">${t('copy')}</button></div>
          <p class="small">${t('refStats').replace('{a}', Number(rs.signed_up) || 0).replace('{b}', Number(rs.qualified) || 0).replace('{c}', Number(rs.paid) || 0)}</p>
        </div>
      </div>

      ${testsCard}

      <div class="stack"><div class="row between"><h2 style="font-size:1.6rem">${t('myContracts')}</h2></div>
        ${table([t('roles'), t('pay'), t('status')], contracts.map((c) => [esc(c.title), `${money(c.expert_rate)} ${t('perHour')}`, pill(c.status)]))}
      </div>

      ${active.length ? `<form id="hoursF" class="card stack"><h3>${t('logHours')}</h3>
        <div class="form-grid">
          <label class="f">${t('myContracts')}<select name="contract_id" required>${active.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
          <label class="f">${t('weekStart')}<input type="date" name="week_start" value="${mondayOf()}" required></label>
          <label class="f">${t('hoursWorked')}<input type="number" name="hours" step="0.25" min="0.25" max="80" required></label>
        </div>
        <label class="f">${t('note')}<input name="note" maxlength="500"></label>
        <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('submit')}</button>
      </form>` : ''}

      <div class="stack"><h2 style="font-size:1.6rem">${t('myHours')}</h2>
        ${table([t('weekStart'), t('myContracts'), t('hoursWorked'), t('status'), ''], sheets.map((s) => [dateStr(s.week_start), esc(conTitle[s.contract_id] || ''), esc(s.hours), pill(s.status), s.status === 'submitted' ? `<button class="btn btn-danger btn-sm" data-del-ts="${s.id}">${t('delete')}</button>` : '']))}
      </div>

      <div class="stack"><h2 style="font-size:1.6rem">${t('myApps')}</h2>
        ${table([t('roles'), t('status'), ''], (apps.data || []).map((a) => [esc(a.roles?.title || ''), pill(a.status), dateStr(a.created_at)]))}
        <a href="#/roles" style="font-weight:600">${t('navRoles')} →</a>
      </div>

      <div class="stack"><h2 style="font-size:1.6rem">${t('payoutsH')}</h2>
        ${table([t('weekStart'), t('hoursWorked'), t('amount'), t('status')], payouts.map((p) => [dateStr(p.week_start), esc(p.hours), money(p.amount), pill(p.status)]))}
      </div>

      <div class="grid">
        <form id="payoutF" class="card stack"><h3>${t('payoutSettings')}</h3>
          <label class="f">${t('payoutMethod')}<select name="payout_method"><option value="bank" ${e.payout_method === 'bank' ? 'selected' : ''}>${t('bank')}</option><option value="paypal" ${e.payout_method === 'paypal' ? 'selected' : ''}>${t('paypal')}</option></select></label>
          <label class="f">${t('payoutDetails')}<textarea name="payout_details" style="min-height:80px">${esc(myPayout || '')}</textarea></label>
          <p class="muted small"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> ${t('payoutEncrypted')}</p>
          <button class="btn" type="submit" style="align-self:flex-start">${t('save')}</button>
        </form>
        <form id="profileF" class="card stack"><h3>${t('profileH')}</h3>
          <div class="form-grid">
            <label class="f">${t('fullName')}<input name="full_name" value="${esc(profile.full_name || '')}" required></label>
            <label class="f">${t('country')}<input name="country" value="${esc(profile.country || '')}"></label>
            <label class="f">${t('field')}<select name="field">${fieldOptions(e.field)}</select></label>
            <label class="f">${t('years')}<input name="years_experience" type="number" min="0" max="60" value="${esc(e.years_experience ?? '')}"></label>
            <label class="f">${t('rate')}<input name="rate_expectation" type="number" min="1" value="${esc(e.rate_expectation ?? '')}"></label>
            <label class="f">${t('linkedin')}<input name="linkedin" value="${esc(e.linkedin || '')}"></label>
            <label class="f">${t('headlineL')}<input name="headline" maxlength="120" value="${esc(e.headline || '')}"></label>
            <label class="f">${t('skillsL')}<input name="skills" maxlength="500" value="${esc(e.skills || '')}"></label>
            <label class="f">${t('languagesL')}<input name="languages" maxlength="300" value="${esc(e.languages || '')}" placeholder="${esc(t('languagesPh'))}"></label>
          </div>
          <label class="f">${t('bio')}<textarea name="bio">${esc(e.bio || '')}</textarea></label>
          <button class="btn" type="submit" style="align-self:flex-start">${t('save')}</button>
        </form>
      </div>
    </section>`,
    mount() {
      $app.querySelectorAll('[data-scroll]').forEach((a) => { a.onclick = (ev) => { ev.preventDefault(); const el = document.querySelector(a.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
      $app.querySelectorAll('[data-offer]').forEach((f) => { f.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(f); busy(f, true);
        const { error } = await sb.rpc('respond_offer', { p_id: f.dataset.offer, p_accept: true, p_name: d.sign });
        busy(f, false); if (error) return fail(error); toast(t('offerAccepted')); render();
      }; });
      $app.querySelectorAll('[data-decline]').forEach((b) => { b.onclick = async () => {
        if (!window.confirm(t('offerDeclineQ'))) return;
        const { error } = await sb.rpc('respond_offer', { p_id: b.dataset.decline, p_accept: false });
        if (error) return fail(error); render();
      }; });
      document.getElementById('copyRef').onclick = async () => {
        try { await navigator.clipboard.writeText(refLink); toast(t('copied')); } catch (err) { document.getElementById('refLink').select(); }
      };
      document.getElementById('cvFile').onchange = async (ev) => {
        const file = ev.target.files[0]; if (!file) return;
        if (file.type !== 'application/pdf') return toast('PDF only', true);
        if (file.size > 10 * 1024 * 1024) return toast('Max. 10 MB', true);
        const path = `${uid}/cv-${Date.now()}.pdf`;
        const up = await sb.storage.from('cvs').upload(path, file, { contentType: 'application/pdf' });
        if (up.error) return fail(up.error);
        const { error } = await sb.from('experts').update({ cv_path: path }).eq('id', uid);
        if (error) return fail(error);
        // Like Mercor: the CV fills in the profile; the expert checks and saves.
        const cv = await readCv(file);
        const prf = document.getElementById('profileF');
        const n = cv && prf ? fillFromCv(prf, cv, { field: 'field', years: 'years_experience', linkedin: 'linkedin', bio: 'bio', skills: 'skills', headline: 'headline' }) : 0;
        if (n) { toast(t('cvFilledSave')); prf.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else { toast(t('cvUploaded')); render(); }
      };
      const hf = document.getElementById('hoursF');
      if (hf) hf.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(hf); busy(hf, true);
        const { error } = await sb.from('timesheets').insert({ contract_id: d.contract_id, expert_id: uid, week_start: mondayOf(new Date(d.week_start + 'T12:00:00')), hours: Number(d.hours), note: d.note || null });
        busy(hf, false); if (error) return fail(error);
        toast(t('saved')); render();
      };
      $app.querySelectorAll('[data-del-ts]').forEach((b) => { b.onclick = async () => {
        const { error } = await sb.from('timesheets').delete().eq('id', b.dataset.delTs); if (error) return fail(error); render();
      }; });
      const pf = document.getElementById('payoutF');
      pf.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(pf); busy(pf, true);
        const { error } = await sb.from('experts').update({ payout_method: d.payout_method, payout_details: d.payout_details }).eq('id', uid);
        busy(pf, false); if (error) return fail(error); toast(t('saved'));
      };
      const prf = document.getElementById('profileF');
      prf.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(prf); busy(prf, true);
        const r1 = await sb.from('profiles').update({ full_name: d.full_name, country: d.country }).eq('id', uid);
        const r2 = await sb.from('experts').update({ field: d.field, years_experience: d.years_experience ? Number(d.years_experience) : null, rate_expectation: d.rate_expectation ? Number(d.rate_expectation) : null, linkedin: d.linkedin, bio: d.bio, headline: d.headline || null, skills: d.skills || null, languages: d.languages || null }).eq('id', uid);
        busy(prf, false); if (r1.error || r2.error) return fail(r1.error || r2.error);
        await loadProfile(); toast(t('saved'));
      };
    },
  };
}

// ---------------------------------------------------------------- Interview (like Mercor's interview, 20.11.2026)
// Five short questions (two general, three for the expert's field), answered by text or voice (max. 3 min each).
// Answers are saved after every question, so the interview can be resumed; the admin reviews and scores it.
const INTERVIEW_GENERAL = [
  'Tell us about your professional background and what you are best at.',
  'Describe a complex problem from your work and how you solved it, step by step.',
];
const INTERVIEW_FIELD = {
  'Medicine': ['A 58-year-old presents with chest pain radiating to the left arm. Walk us through your first steps and your differential diagnosis.', 'An AI answer says ibuprofen is safe for every patient with a headache. What is wrong with this answer and how would you correct it?', 'How do you keep up with new clinical guidelines?'],
  'Law': ['Explain the difference between a warranty and an indemnity in a commercial contract.', 'An AI answer says a verbal contract is never binding. How would you correct it?', 'How do you research a legal question you have never seen before?'],
  'Software': ['How would you design a rate limiter for a public API?', 'An AI wrote a function that works but is very slow on large inputs. How do you review and improve it?', 'Describe a bug that was hard to find and how you found it.'],
  'Chemistry & Math': ['Explain to a high-school student why the angles of a triangle add up to 180°.', 'An AI answer claims that adding a catalyst shifts a chemical equilibrium. What is wrong?', 'How would you write a hard problem that tests real understanding instead of memorisation?'],
  'Pharmacy': ['What should a patient taking warfarin know about common painkillers?', 'An AI answer recommends doubling a missed dose. How do you respond?', 'How do you check a drug interaction you are unsure about?'],
  'Accounting': ['Explain the difference between cash and accrual accounting with an example.', 'An AI answer says depreciation reduces cash. What is wrong?', 'How do you make sure the numbers in a financial report are correct?'],
  'Translation (DE)': ['Which languages do you speak at native or near-native level? Translate this sentence into your strongest language other than English and explain your choices: "Please don\'t hesitate to reach out if you have any questions."', 'An AI translated the English idiom "It\'s raining cats and dogs" word for word into another language. What is the problem, and how would a native speaker of your language say it?', 'How do you handle terms or cultural references that have no direct translation?'],
  'Other': ['What kind of expert tasks would you like to do at Brightpeer?', 'How would you check whether an AI answer in your field is correct?', 'Give an example of how you explain something complex in simple words.'],
};
const interviewQuestions = (field) => [...INTERVIEW_GENERAL, ...(INTERVIEW_FIELD[field] || INTERVIEW_FIELD.Other)];
const MAX_REC_S = 180;

async function pageInterview() {
  if (!session) return needLogin();
  if (!actsAsExpert()) return { html: `<section class="wrap section narrow"><p class="muted">${t('mustBeExpert')}</p></section>` };
  const uid = session.user.id;
  const [{ data: ex }, { data: iv }] = await Promise.all([
    sb.from('experts').select('field').eq('id', uid).maybeSingle(),
    sb.from('interviews').select('*').eq('expert_id', uid).maybeSingle(),
  ]);
  const field = iv?.field || ex?.field || 'Other';
  const qs = interviewQuestions(field);
  if (iv && iv.status !== 'in_progress') {
    return { html: `<section class="wrap section narrow stack-lg"><h1 style="font-size:2.5rem">${t('ivDoneH')}</h1><p class="muted">${t('ivDoneP')}</p><a class="btn" href="#/dashboard" style="align-self:flex-start">${t('dashboard')}</a></section>` };
  }
  const answers = Array.isArray(iv?.answers) ? iv.answers : [];
  const idx = Math.min(answers.length, qs.length - 1);
  if (!iv) {
    return {
      html: `<section class="wrap section narrow stack-lg">
        <h1 style="font-size:clamp(2rem,5vw,3rem)">${t('ivH')}</h1>
        <p class="muted">${t('ivP')}</p>
        <div class="card stack"><ul class="ticks"><li>${t('ivRule1').replace('{n}', qs.length)}</li><li>${t('ivRule2')}</li><li>${t('ivRule3')}</li><li>${t('ivRule4')}</li></ul></div>
        <p class="small muted">${t('field')}: <b>${esc(fieldName(field))}</b> · <a href="#/dashboard">${t('ivChangeField')}</a></p>
        <button class="btn btn-accent" id="ivStart" style="align-self:flex-start">${t('ivStart')}</button>
      </section>`,
      mount() {
        document.getElementById('ivStart').onclick = async () => {
          const { error } = await sb.from('interviews').insert({ expert_id: uid, field, answers: [] });
          if (error) return fail(error); render();
        };
      },
    };
  }
  const last = idx === qs.length - 1;
  return {
    html: `<section class="wrap section narrow stack-lg">
      <div class="row between"><p class="muted small">${t('ivQuestion')} ${idx + 1} / ${qs.length}</p><div class="progress" style="flex:0 0 160px"><span style="width:${Math.round((idx / qs.length) * 100)}%"></span></div></div>
      <h2 style="font-size:clamp(1.4rem,3.5vw,2rem)">${esc(qs[idx])}</h2>
      <form id="ivF" class="stack">
        <label class="f">${t('ivType')}<textarea name="text" maxlength="5000" style="min-height:180px"></textarea></label>
        <div class="card stack" style="gap:10px">
          <p class="small"><b>${t('ivOrVoice')}</b> <span class="muted">(${t('ivMax3')})</span></p>
          <div class="row"><button type="button" class="btn btn-ghost btn-sm" id="recBtn">● ${t('ivRecord')}</button><span class="muted small" id="recTime"></span></div>
          <audio id="recPlay" controls style="display:none;width:100%"></audio>
        </div>
        <div id="ivMsg"></div>
        <button class="btn btn-accent" type="submit" style="align-self:flex-start">${last ? t('ivSubmit') : t('ivNext')}</button>
      </form>
    </section>`,
    mount() {
      const f = document.getElementById('ivF'); const recBtn = document.getElementById('recBtn'); const recTime = document.getElementById('recTime'); const play = document.getElementById('recPlay');
      let blob = null; let rec = null; let timer = null; let sec = 0;
      if (!window.MediaRecorder || !navigator.mediaDevices) recBtn.disabled = true;
      const stop = () => { if (rec && rec.state === 'recording') rec.stop(); clearInterval(timer); recBtn.textContent = '● ' + t('ivRecordAgain'); };
      recBtn.onclick = async () => {
        if (rec && rec.state === 'recording') return stop();
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const chunks = []; rec = new MediaRecorder(stream);
          rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
          rec.onstop = () => { stream.getTracks().forEach((tr) => tr.stop()); blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); play.src = URL.createObjectURL(blob); play.style.display = 'block'; };
          rec.start(); sec = 0; recBtn.textContent = '■ ' + t('ivStop');
          timer = setInterval(() => { sec++; recTime.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; if (sec >= MAX_REC_S) stop(); }, 1000);
        } catch (err) { toast(t('ivNoMic'), true); }
      };
      f.onsubmit = async (ev) => {
        ev.preventDefault(); stop();
        const text = (formData(f).text || '').trim();
        if (!text && !blob) { document.getElementById('ivMsg').innerHTML = `<div class="form-msg err">${t('ivEmpty')}</div>`; return; }
        busy(f, true);
        let audio = null;
        if (blob) {
          const ext = (blob.type.includes('mp4') ? 'm4a' : 'webm');
          const path = `${uid}/q${idx + 1}-${Date.now()}.${ext}`;
          const up = await sb.storage.from('interviews').upload(path, blob, { contentType: blob.type || 'audio/webm' });
          if (up.error) { busy(f, false); return fail(up.error); }
          audio = path;
        }
        const next = [...answers.slice(0, idx), { q: qs[idx], text, audio }];
        const { error } = await sb.from('interviews').update({ answers: next, status: last ? 'submitted' : 'in_progress' }).eq('expert_id', uid);
        busy(f, false); if (error) return fail(error);
        if (last) {
          toast(t('ivDoneH'));
          // AI rating for the reviewer (25.11.2026); never blocks the expert if it is not set up or fails.
          try { sb.functions.invoke('score-interview', { body: { interview_id: iv.id } }).then(() => {}, () => {}); } catch { /* ignore */ }
        }
        render(); window.scrollTo(0, 0);
      };
    },
  };
}

// ---------------------------------------------------------------- company dashboard
async function companyDashboard() {
  const uid = session.user.id;
  const [co, reqs, cons, ts, inv, bal, prep, cand] = await Promise.all([
    sb.from('companies').select('*').eq('id', uid).maybeSingle(),
    sb.from('requests').select('*').eq('company_id', uid).order('created_at', { ascending: false }),
    sb.rpc('company_contracts'),
    sb.rpc('company_timesheets'),
    sb.from('invoices').select('*').eq('company_id', uid).order('week_start', { ascending: false }),
    sb.rpc('company_balance'),
    sb.from('prepayments').select('*').eq('company_id', uid).order('created_at', { ascending: false }),
    sb.rpc('company_candidates'),
  ]);
  const candidates = cand.data || [];
  const c = co.data || {};
  const sheets = ts.data || [];
  const B = CONFIG.BANK;
  const toApprove = sheets.filter((s) => s.status === 'submitted');
  const b = (bal.data && bal.data[0]) || { paid: 0, used: 0, balance: 0 };
  const balance = Number(b.balance) || 0;
  const low = balance < (CONFIG.LOW_BALANCE || 500);
  const bankRef = (ref) => `<details><summary class="link">${t('payByBank')}</summary><p class="small" style="margin-top:6px">${esc(B.holder)}<br>IBAN: ${esc(B.iban)}<br>BIC: ${esc(B.bic)}<br>${esc(B.bank)}<br>Ref: ${esc(ref)}</p></details>`;
  const prepAction = (p) => p.status === 'open' ? (p.payment_link ? `<a class="btn btn-accent btn-sm" href="${esc(p.payment_link)}" target="_blank" rel="noopener">${t('payNow')}</a>` : bankRef(invoiceNo(p))) : p.status === 'requested' ? '<span class="muted small">We will send the payment details shortly</span>' : '';
  const showInvoices = !CONFIG.PREPAYMENT_ONLY && (inv.data || []).length;

  // Client Terms (owner, 25.11.2026): a company account works only once the terms are accepted (e.g. after a Google sign-up).
  if (!c.terms_accepted_at) {
    return {
      html: `<section class="wrap section narrow stack-lg">
        <h1 style="font-size:clamp(2rem,4vw,3rem)">${t('welcome')}, ${esc(c.company_name || profile.full_name || '')}</h1>
        <form id="termsF" class="card stack" style="padding:28px">
          <h3>Please accept our Client Terms</h3>
          <p class="muted">Before you send a request or top up your balance, please read and accept the <a href="#/legal/client" target="_blank">Client Terms</a>. They cover prepayment and refunds, confidentiality, ownership of the work and the non-solicitation of experts.</p>
          <label class="check"><input type="checkbox" required> <span>I have read and accept the <a href="#/legal/client" target="_blank">Client Terms</a> on behalf of my company.</span></label>
          <button class="btn btn-accent" type="submit" style="align-self:flex-start">Accept and continue</button>
        </form>
      </section>`,
      mount() {
        const tf = document.getElementById('termsF');
        tf.onsubmit = async (ev) => { ev.preventDefault(); busy(tf, true); const { error } = await sb.rpc('accept_client_terms'); busy(tf, false); if (error) return fail(error); toast(t('saved')); render(); };
      },
    };
  }
  const stars = (n) => (n ? '★'.repeat(n) + '<span class="muted">' + '★'.repeat(5 - n) + '</span>' : '–');
  const candCards = candidates.map((x) => `<div class="card stack" style="gap:10px">
      <div class="row between"><h3>${esc(x.code)}</h3>${x.status === 'proposed' ? '<span class="label-new">New</span>' : pill(x.status === 'interested' ? 'approved' : 'declined')}</div>
      <p class="muted small">${esc(fieldName(x.field))}${x.years != null ? ` · ${esc(x.years)} years experience` : ''}${x.country ? ` · ${esc(x.country)}` : ''}</p>
      ${x.headline ? `<p style="font-weight:600">${esc(x.headline)}</p>` : ''}
      ${x.languages ? `<p class="small">Languages: ${esc(x.languages)}</p>` : ''}
      ${skillList(x.skills).length ? `<div class="row" style="gap:6px">${skillList(x.skills).slice(0, 6).map((k) => `<span class="chip chip-sm">${esc(k)}</span>`).join('')}</div>` : ''}
      <div class="row" style="gap:24px"><div><p class="muted small">Field test</p><p style="font-weight:600">${x.test_pct != null ? esc(x.test_pct) + ' %' : '–'}</p></div><div><p class="muted small">Interview</p><p>${stars(x.interview_score)}</p></div></div>
      ${x.admin_note ? `<p class="small" style="white-space:pre-line"><b>Why we suggest this expert:</b> ${esc(x.admin_note)}</p>` : ''}
      ${x.status === 'proposed' ? `<form class="stack" data-cand="${x.id}" style="gap:8px"><input name="note" maxlength="1000" placeholder="Note for us (optional)"><div class="row"><button class="btn btn-accent btn-sm" type="submit" data-int="1">Interested</button><button class="btn btn-ghost btn-sm" type="submit" data-int="0">Not a fit</button></div></form>`
        : x.company_note ? `<p class="small muted">Your note: ${esc(x.company_note)}</p>` : ''}
    </div>`).join('');
  return {
    html: `<section class="wrap section stack-lg">
      <h1 style="font-size:clamp(2rem,4vw,3rem)">${t('welcome')}, ${esc(c.company_name || profile.full_name || '')}</h1>
      ${candidates.length ? `<div class="stack" id="candidates"><h2 style="font-size:1.6rem">Proposed experts</h2><p class="muted small">Anonymous profiles we selected for your requests. Tell us who you are interested in – we then confirm the expert and start the project. Names and contact details stay private.</p><div class="grid">${candCards}</div></div>` : ''}

      <div class="card stack ${low ? 'offer' : ''}" id="balance">
        <div class="row between" style="align-items:flex-start;gap:20px">
          <div class="stack" style="gap:4px"><p class="muted small">Prepaid balance</p><p class="stat-v" style="color:${balance < 0 ? 'var(--bad)' : 'var(--ink)'}">${money(balance)}</p>
            <p class="muted small">Paid in: ${money(b.paid)} · Used for approved hours: ${money(b.used)}</p></div>
          <form id="topF" class="row" style="align-items:flex-end"><label class="f" style="width:160px">Amount (USD)<input name="amount" type="number" min="100" max="1000000" step="1" value="1000" required></label><button class="btn btn-accent" type="submit">Top up balance</button></form>
        </div>
        <p class="small ${low ? '' : 'muted'}">${low ? '<b>Your balance is low.</b> Experts only start or continue working while your balance covers their hours. ' : ''}Brightpeer works with prepayment: you top up your balance first, and approved expert hours are paid from it each week. Unused balance is refunded on request.</p>
        ${(prep.data || []).length ? table(['Date', 'No.', t('amount'), t('status'), '', ''], prep.data.map((p) => [dateStr(p.created_at), esc(invoiceNo(p)), money(p.amount), pill(p.status), prepAction(p), p.status === 'cancelled' ? '' : `<a class="small" href="#/invoice/${esc(p.id)}">${p.status === 'paid' ? 'Receipt' : 'Invoice'} (PDF)</a>`])) : ''}
      </div>

      <form id="reqF" class="card stack"><h3>${t('newRequest')}</h3>
        <div class="form-grid">
          <label class="f">${t('field')} *<select name="field" required>${fieldOptions()}</select></label>
          <label class="f">${t('expertsNeeded')} *<input name="experts_needed" type="number" min="1" max="500" value="1" required></label>
          <label class="f">${t('hoursPerWeek')}<input name="hours_per_week" type="number" min="1" max="60"></label>
          <label class="f">${t('budget')}<input name="budget" maxlength="200"></label>
        </div>
        <label class="f">${t('description')} *<textarea name="description" required maxlength="5000"></textarea></label>
        <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('sendRequest')}</button>
      </form>

      <div class="stack"><h2 style="font-size:1.6rem">${t('myRequests')}</h2>
        ${table([t('field'), t('expertsNeeded'), t('status'), ''], (reqs.data || []).map((r) => [esc(fieldName(r.field)), esc(r.experts_needed), pill(r.status), dateStr(r.created_at)]))}
      </div>

      <div class="stack"><h2 style="font-size:1.6rem">${t('myExperts')}</h2>
        ${table([t('experts'), t('field'), t('roles'), t('pay'), t('status')], (cons.data || []).map((x) => [esc(x.expert_first_name), esc(fieldName(x.expert_field)), esc(x.title), `${money(x.client_rate)} ${t('perHour')}`, pill(x.status)]))}
      </div>

      <div class="stack"><h2 style="font-size:1.6rem">${t('approveHours')}</h2>
        ${table([t('experts'), t('roles'), t('weekStart'), t('hoursWorked'), t('note'), t('status'), ''], sheets.map((s) => [esc(s.expert_first_name), esc(s.title), dateStr(s.week_start), esc(s.hours), esc(s.note || ''), pill(s.status),
          s.status === 'submitted' ? `<div class="row"><button class="btn btn-sm" data-ts="${s.id}" data-st="approved">${t('approve')}</button><button class="btn btn-danger btn-sm" data-ts="${s.id}" data-st="rejected">${t('reject')}</button></div>` : '']))}
        ${toApprove.length ? '' : ''}
      </div>

      ${showInvoices ? `<div class="stack"><h2 style="font-size:1.6rem">${t('invoicesH')}</h2>
        ${table([t('weekStart'), t('hoursWorked'), t('amount'), t('status'), ''], (inv.data || []).map((i) => [dateStr(i.week_start), esc(i.hours), money(i.amount), pill(i.status),
          i.status === 'open' ? (i.payment_link ? `<a class="btn btn-accent btn-sm" href="${esc(i.payment_link)}" target="_blank" rel="noopener">${t('payNow')}</a>` : `<details><summary class="link">${t('payByBank')}</summary><p class="small" style="margin-top:6px">${esc(B.holder)}<br>IBAN: ${esc(B.iban)}<br>BIC: ${esc(B.bic)}<br>${esc(B.bank)}<br>Ref: INV-${esc(i.id.slice(0, 8).toUpperCase())}</p></details>`) : '']))}
      </div>` : ''}
    </section>`,
    mount() {
      const tf = document.getElementById('topF');
      tf.onsubmit = async (ev) => {
        ev.preventDefault(); const amount = Number(formData(tf).amount); if (!(amount >= 100)) return toast('Minimum top-up is $100', true);
        busy(tf, true);
        const { error } = await sb.from('prepayments').insert({ company_id: uid, amount });
        busy(tf, false); if (error) return fail(error);
        toast('Top-up requested – we will send the payment details shortly'); render();
      };
      const f = document.getElementById('reqF');
      f.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(f); busy(f, true);
        const { error } = await sb.from('requests').insert({ company_id: uid, field: d.field, experts_needed: Number(d.experts_needed) || 1, hours_per_week: d.hours_per_week ? Number(d.hours_per_week) : null, budget: d.budget || null, description: d.description });
        busy(f, false); if (error) return fail(error);
        toast(t('requestSent')); render();
      };
      $app.querySelectorAll('[data-cand]').forEach((cf) => {
        let interested = true;
        cf.querySelectorAll('[data-int]').forEach((b) => { b.onclick = () => { interested = b.dataset.int === '1'; }; });
        cf.onsubmit = async (ev) => {
          ev.preventDefault(); busy(cf, true);
          const { error } = await sb.rpc('respond_candidate', { p_id: cf.dataset.cand, p_interested: interested, p_note: formData(cf).note || null });
          busy(cf, false); if (error) return fail(error); toast(interested ? 'Thanks – we will confirm the expert shortly.' : 'Thanks for the feedback.'); render();
        };
      });
      $app.querySelectorAll('[data-ts]').forEach((b) => { b.onclick = async () => {
        b.disabled = true;
        const { error } = await sb.rpc('review_timesheet', { p_id: b.dataset.ts, p_status: b.dataset.st });
        if (error) return fail(error); render();
      }; });
    },
  };
}

// ---------------------------------------------------------------- invoice / receipt for a prepayment (owner, 25.11.2026)
// A clean page the company (or the admin) prints or saves as PDF with the browser's print dialog.
const invoiceNo = (p) => `BP-${p.invoice_no || String(p.id).slice(0, 8).toUpperCase()}`;

async function pageInvoice(id) {
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  const { data: p } = id ? await sb.from('prepayments').select('*, companies(company_name, website, profiles(full_name, email, country))').eq('id', id).maybeSingle() : { data: null };
  if (!p) return pageNotFound();
  const C = CONFIG.COMPANY; const B = CONFIG.BANK;
  const co = p.companies || {}; const who = co.profiles || {};
  const paid = p.status === 'paid'; const cancelled = p.status === 'cancelled';
  const title = paid ? 'Receipt' : 'Invoice';
  const no = invoiceNo(p);
  const back = profile?.role === 'admin' ? '#/admin?tab=prepayTab' : '#/dashboard';
  return {
    html: `<section class="wrap section narrow stack-lg">
      <div class="row between no-print"><a href="${back}">${t('back')}</a><button class="btn btn-accent" id="printInv">Download PDF / Print</button></div>
      <article class="invoice card stack-lg" style="padding:40px">
        <div class="row between" style="align-items:flex-start;gap:24px">
          <div class="stack" style="gap:4px"><p style="font-weight:700;font-size:1.3rem;display:flex;align-items:center;gap:8px"><span class="logo" aria-hidden="true"></span>Brightpeer</p>
            <p class="small muted">${esc(C.name)}<br>${esc(C.address)}<br>${esc(C.email)}${C.uid ? `<br>UID: ${esc(C.uid)}` : ''}</p></div>
          <div class="stack" style="gap:4px;text-align:right"><h1 style="font-size:2rem">${title}${cancelled ? ' (cancelled)' : ''}</h1>
            <p class="small">No. <b>${esc(no)}</b><br>Date: ${dateStr(p.created_at)}${paid && p.paid_at ? `<br>Paid on: ${dateStr(p.paid_at)}` : ''}</p></div>
        </div>
        <div class="stack" style="gap:4px"><p class="muted small">Bill to</p>
          <p><b>${esc(co.company_name || '')}</b><br>${esc(who.full_name || '')}${who.email ? `<br>${esc(who.email)}` : ''}${who.country ? `<br>${esc(who.country)}` : ''}${co.website ? `<br>${esc(co.website)}` : ''}</p></div>
        <div class="table-wrap"><table><thead><tr><th>Description</th><th style="text-align:right">Amount (USD)</th></tr></thead><tbody>
          <tr><td>Prepaid balance for expert services on Brightpeer<br><span class="muted small">Approved expert hours are deducted from this balance at the agreed hourly rates. Unused balance is refunded on request (Client Terms, section 3).</span></td><td style="text-align:right">${money(p.amount)}</td></tr>
          <tr><td><b>Total</b></td><td style="text-align:right"><b>${money(p.amount)}</b></td></tr>
        </tbody></table></div>
        <p class="small muted">No VAT charged: Brightpeer is not registered for Swiss VAT.</p>
        ${cancelled ? '<p class="form-msg err">This invoice was cancelled and does not need to be paid.</p>'
          : paid ? `<p class="form-msg ok">Paid${p.paid_at ? ` on ${dateStr(p.paid_at)}` : ''} – thank you.</p>`
          : `<div class="stack" style="gap:4px"><p class="muted small">Payment by bank transfer</p><p class="small">${esc(B.holder)}<br>IBAN: ${esc(B.iban)}<br>BIC: ${esc(B.bic)}<br>${esc(B.bank)}<br>Reference: <b>${esc(no)}</b></p>
             ${p.payment_link ? `<p class="small">Or pay online: <a href="${esc(p.payment_link)}" target="_blank" rel="noopener">${esc(p.payment_link)}</a></p>` : ''}</div>`}
      </article>
    </section>`,
    mount() {
      document.getElementById('printInv').onclick = () => {
        const old = document.title; document.title = `Brightpeer ${title} ${no}`;
        window.print(); setTimeout(() => { document.title = old; }, 500);
      };
    },
  };
}

// ---------------------------------------------------------------- work confirmation (owner, 25.11.2026)
// After 20 paid hours an expert can download a written confirmation of their work for the CV – generated from the
// paid payouts and contracts, so the owner does not have to write it. Client names stay confidential.
async function pageConfirmation() {
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  if (!actsAsExpert()) return pageNotFound();
  const uid = session.user.id;
  const [{ data: ex }, { data: pays }, { data: cons }] = await Promise.all([
    sb.from('experts').select('field, headline').eq('id', uid).maybeSingle(),
    sb.from('payouts').select('week_start, hours, status').eq('expert_id', uid).eq('status', 'paid').order('week_start', { ascending: true }),
    sb.rpc('expert_contracts'),
  ]);
  const paid = pays || [];
  const hours = paid.reduce((a, p) => a + Number(p.hours || 0), 0);
  if (hours < 20) {
    return `<section class="wrap section narrow stack-lg"><h1 style="font-size:2.2rem">${t('wcTitle')}</h1><p class="muted">${t('wcProgress').replace('{n}', Math.round(hours * 100) / 100)}</p><a class="btn" href="#/dashboard" style="align-self:flex-start">${t('dashboard')}</a></section>`;
  }
  const C = CONFIG.COMPANY;
  const from = paid[0].week_start; const last = new Date(paid[paid.length - 1].week_start); last.setDate(last.getDate() + 6);
  const titles = [...new Set((cons || []).filter((c) => ['active', 'ended'].includes(c.status)).map((c) => c.title).filter(Boolean))];
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = profile.full_name || session.user.email;
  return {
    html: `<section class="wrap section narrow stack-lg">
      <div class="row between no-print"><a href="#/dashboard">${t('back')}</a><button class="btn btn-accent" id="printWc">Download PDF / Print</button></div>
      <article class="invoice card stack-lg" style="padding:48px">
        <div class="row between" style="align-items:flex-start;gap:24px">
          <p style="font-weight:700;font-size:1.3rem;display:flex;align-items:center;gap:8px"><span class="logo" aria-hidden="true"></span>Brightpeer</p>
          <p class="small muted" style="text-align:right">${esc(C.address)}<br>${esc(C.email)}<br>${fmtDate(new Date())}</p>
        </div>
        <h1 style="font-size:2rem">Confirmation of work</h1>
        <p>We confirm that <b>${esc(name)}</b> has worked with Brightpeer as an independent expert${ex?.field ? ` in the field of <b>${esc(fieldName(ex.field))}</b>` : ''} from <b>${fmtDate(from)}</b> to <b>${fmtDate(last)}</b>, with a total of <b>${esc(Math.round(hours * 100) / 100)} paid hours</b>.</p>
        <p>The work consisted of expert tasks for companies that develop artificial intelligence, such as reviewing and rating AI answers for accuracy and safety, writing realistic tasks and model answers, and explaining errors.${titles.length ? ` Projects: ${titles.map(esc).join(', ')}.` : ''}</p>
        <p>All hours listed were logged by the expert, approved and paid. For confidentiality reasons, the names of the client companies are not stated.</p>
        <div style="margin-top:24px"><p>Brightpeer</p><p class="muted small">This confirmation was created automatically from Brightpeer’s payment records and is valid without a signature. Questions: ${esc(C.email)}</p></div>
      </article>
    </section>`,
    mount() {
      document.getElementById('printWc').onclick = () => { const old = document.title; document.title = `Brightpeer work confirmation – ${name}`; window.print(); setTimeout(() => { document.title = old; }, 500); };
    },
  };
}

// Experts – and the admin, who also has an expert profile – can use the expert pages (dashboard, roles, tests, interview).
function actsAsExpert() { return profile?.role === 'expert' || profile?.role === 'admin'; }

async function pageDashboard() {
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  if (!profile) return `<section class="wrap section"><p class="muted">${t('error')}</p></section>`;
  // Owner, 20.11.2026 ("lass den Dashboard funktionieren"): "Dashboard" no longer jumps to Admin for the admin –
  // the admin also has her own expert profile (created at sign-up), so Dashboard shows the expert view and
  // "Admin" in the header stays the way to the admin area.
  if (profile.role === 'admin') return expertDashboard();
  if (profile.role === 'company') return companyDashboard();
  return expertDashboard();
}

// ---------------------------------------------------------------- admin
let adminTab = 'overview';

async function pageAdmin() {
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  if (profile?.role !== 'admin') return pageNotFound();

  const q = parseHash().query; if (q.get('tab')) adminTab = q.get('tab');
  await deleteQueuedFiles();
  const TABS = ['overview', 'visitorsTab', 'experts', 'interviewsTab', 'testsTab', 'roles', 'requests', 'contracts', 'hoursTab', 'prepayTab', ...(CONFIG.PREPAYMENT_ONLY ? [] : ['invoices']), 'payouts', 'referralsTab', 'accountingTab', 'automationTab'];
  const TAB_LABEL = { prepayTab: 'Prepayments', visitorsTab: 'Visitors', referralsTab: 'Referrals', accountingTab: 'Accounting', automationTab: 'Automation' };
  if (!TABS.includes(adminTab)) adminTab = 'overview';
  const tabBar = `<div class="tabs" role="tablist">${TABS.map((k) => `<button class="tab ${adminTab === k ? 'active' : ''}" role="tab" data-tab="${k}">${TAB_LABEL[k] || t(k)}</button>`).join('')}</div>`;
  const view = await ADMIN[adminTab]();
  return {
    html: `<section class="wrap section stack-lg"><h1 style="font-size:clamp(2rem,4vw,3rem)">${t('admin')}</h1>${tabBar}<div id="adminView">${view.html}</div></section>`,
    mount() {
      $app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { adminTab = b.dataset.tab; go('#/admin?tab=' + adminTab); }; });
      view.mount && view.mount();
    },
  };
}

// CVs of accounts deleted after 24 months (queued by the daily cleanup job)
async function deleteQueuedFiles() {
  try {
    const { data } = await sb.from('file_deletions').select('path,bucket').limit(100);
    if (!data || !data.length) return;
    const paths = data.filter((f) => f.bucket === 'cvs').map((f) => f.path);
    const { error } = await sb.storage.from('cvs').remove(paths);
    if (!error) await sb.from('file_deletions').delete().in('path', paths);
  } catch (e) { console.error(e); }
}

const ADMIN = {
  // Prepayments (owner, 20.11.2026: at the start companies only pay in advance)
  async prepayTab() {
    const [{ data, error }, { data: cos }] = await Promise.all([
      sb.from('prepayments').select('*, companies(company_name, profiles(email))').order('created_at', { ascending: false }),
      sb.from('companies').select('id, company_name').order('company_name'),
    ]);
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const ids = [...new Set((cos || []).map((c) => c.id))];
    const bals = await Promise.all(ids.map((id) => sb.rpc('company_balance', { p_company: id }).then((r) => [id, (r.data && r.data[0]) || {}])));
    const name = Object.fromEntries((cos || []).map((c) => [c.id, c.company_name || '–']));
    return {
      html: `<div class="stack-lg">
        <div class="stack"><h3>Balances</h3>
          ${table(['Company', 'Paid in', 'Used', 'Balance'], bals.map(([id, b]) => [esc(name[id]), money(b.paid || 0), money(b.used || 0), `<b style="color:${Number(b.balance) < (CONFIG.LOW_BALANCE || 500) ? 'var(--bad)' : 'var(--ok)'}">${money(b.balance || 0)}</b>`]))}
          <p class="muted small">Only let experts work (and approve hours) while the company's balance covers them. Red = low or negative.</p>
        </div>
        <form id="addPrep" class="card row" style="align-items:flex-end">
          <label class="f" style="flex:1 1 200px">Company<select name="company_id" required>${(cos || []).map((c) => `<option value="${c.id}">${esc(c.company_name || c.id)}</option>`).join('')}</select></label>
          <label class="f" style="width:150px">Amount (USD)<input name="amount" type="number" min="1" required></label>
          <button class="btn btn-accent" type="submit">Create prepayment request</button>
        </form>
        <p class="muted small">Flow: company requests a top-up (or you create one) → paste a Stripe Payment Link for the amount (stripe.com → Payment Links) → status becomes “open” and the company sees “Pay now” → when the money has arrived, click “Mark paid”. Without a link the company sees your bank details.</p>
        ${table(['Company', 'Date', 'No.', t('amount'), 'Payment link', t('status'), ''], (data || []).map((p) => [
          `${esc(p.companies?.company_name || '')}<br><span class="small muted">${esc(p.companies?.profiles?.email || '')}</span>`, dateStr(p.created_at), `<a href="#/invoice/${esc(p.id)}">${esc(invoiceNo(p))}</a>`, money(p.amount),
          p.status === 'paid' || p.status === 'cancelled' ? esc(p.payment_link || '') : `<input data-plink="${p.id}" value="${esc(p.payment_link || '')}" placeholder="https://buy.stripe.com/…" style="min-width:200px;min-height:36px;padding:4px 8px">`,
          pill(p.status),
          p.status === 'requested' || p.status === 'open' ? `<div class="row">${p.status === 'requested' ? `<button class="btn btn-ghost btn-sm" data-popen="${p.id}">Send bank details</button>` : ''}<button class="btn btn-sm" data-ppaid="${p.id}">Mark paid</button><button class="btn btn-danger btn-sm" data-pcancel="${p.id}">Cancel</button></div>` : '',
        ]))}
      </div>`,
      mount() {
        const f = document.getElementById('addPrep');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const { error: er } = await sb.from('prepayments').insert({ company_id: d.company_id, amount: Number(d.amount), status: 'open' });
          busy(f, false); if (er) return fail(er); toast(t('saved')); render();
        };
        const upd = async (id, patch) => { const { error: er } = await sb.from('prepayments').update(patch).eq('id', id); if (er) return fail(er); render(); };
        $app.querySelectorAll('[data-plink]').forEach((inp) => { inp.onchange = () => { const v = inp.value.trim() || null; upd(inp.dataset.plink, v ? { payment_link: v, status: 'open' } : { payment_link: null }); }; });
        $app.querySelectorAll('[data-popen]').forEach((b) => { b.onclick = () => upd(b.dataset.popen, { status: 'open' }); });
        $app.querySelectorAll('[data-ppaid]').forEach((b) => { b.onclick = () => upd(b.dataset.ppaid, { status: 'paid', paid_at: new Date().toISOString() }); });
        $app.querySelectorAll('[data-pcancel]').forEach((b) => { b.onclick = () => upd(b.dataset.pcancel, { status: 'cancelled' }); });
      },
    };
  },

  async overview() {
    const { data, error } = await sb.rpc('admin_stats');
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const s = data || {};
    const profit = Number(s.revenue) - Number(s.cost);
    const box = (label, v) => `<div class="card"><p class="muted small">${label}</p><p class="stat-v">${v}</p></div>`;
    return { html: `<div class="grid-sm">
      ${box(t('experts'), s.experts_total)}${box(t('stPending'), s.experts_pending)}${box(t('stApproved'), s.experts_approved)}
      ${box('Companies', s.companies)}${box(t('rolesH'), s.open_roles)}${box(t('requests') + ' (' + t('stNew') + ')', s.new_requests)}
      ${box(t('contracts') + ' (' + t('active') + ')', s.active_contracts)}${box(t('hoursTab') + ' (' + t('approved') + ')', Number(s.hours_approved || 0))}
      ${box('Revenue', money(s.revenue))}${box('Expert cost', money(s.cost))}${box('Profit', money(profit))}
    </div>` };
  },

  async experts() {
    const filter = parseHash().query.get('st') || 'pending';
    let qy = sb.from('experts').select('*, profiles(full_name,email,country)').order('created_at', { ascending: false });
    if (filter !== 'all') qy = qy.eq('status', filter);
    const [{ data: rows0, error }, { data: pd }, { data: sc }] = await Promise.all([qy, sb.rpc('admin_payout_details'), sb.rpc('admin_expert_scores')]);
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const payoutOf = Object.fromEntries((pd || []).map((x) => [x.id, x.details]));
    const scoreOf = Object.fromEntries((sc || []).map((x) => [x.expert_id, x]));
    // Ranked by score (CV 20 + field test 40 + interview 40); experts with everything done are marked "ready".
    const data = [...(rows0 || [])].sort((a, b) => ((scoreOf[b.id] || {}).score || 0) - ((scoreOf[a.id] || {}).score || 0));
    const scoreCell = (id) => { const x = scoreOf[id] || {}; return `<b>${esc(x.score ?? 0)}</b><span class="muted small"> / 100</span>${x.ready ? ' <span class="pill pill-ok">ready</span>' : ''}<div class="small muted">CV ${x.has_cv ? '✓' : '✗'} · Test ${x.test_pct != null ? esc(x.test_pct) + ' %' : '–'} · Interview ${x.interview_score ? '★'.repeat(x.interview_score) : x.ai_score ? `${'★'.repeat(x.ai_score)} (AI)` : x.interview_status ? esc(x.interview_status) : '–'}</div>`; };
    const filt = ['pending', 'approved', 'rejected', 'all'].map((k) => `<a class="btn btn-sm ${filter === k ? '' : 'btn-ghost'}" href="#/admin?tab=experts&st=${k}">${k}</a>`).join('');
    return {
      html: `<div class="stack"><div class="row">${filt}</div><p class="muted small">Sorted by score: CV 20 + field test 40 + interview 40 points. “ready” = CV, test and reviewed interview are all there. Automatic approval can be switched on under Automation.</p>${table(['Name', 'Score', 'Email', t('country'), t('field'), t('years'), 'Rate', 'LinkedIn', 'CV', 'Ref', t('payoutSettings'), t('status'), ''], (data || []).map((e) => [
        `<details><summary class="link">${esc(e.profiles?.full_name || '')}</summary><p class="small" style="max-width:320px;white-space:pre-line;margin-top:6px">${esc(e.bio || '')}</p></details>`, scoreCell(e.id),
        `<a href="mailto:${esc(e.profiles?.email)}">${esc(e.profiles?.email || '')}</a>`, esc(e.profiles?.country || ''), esc(fieldName(e.field)) + (e.languages ? `<div class="small muted">${esc(e.languages)}</div>` : ''), esc(e.years_experience ?? ''),
        e.rate_expectation ? money(e.rate_expectation) : '', e.linkedin ? `<a href="${esc(e.linkedin)}" target="_blank" rel="noopener">Link</a>` : '',
        e.cv_path ? `<button class="link" data-cv="${esc(e.cv_path)}">PDF</button>` : '–', esc(e.referred_by || ''),
        `<span class="small">${esc(e.payout_method || '')} ${esc(payoutOf[e.id] || '')}</span>`, pill(e.status),
        `<div class="row"><button class="btn btn-sm" data-ex="${e.id}" data-st="approved">${t('approve')}</button><button class="btn btn-danger btn-sm" data-ex="${e.id}" data-st="rejected">${t('reject')}</button></div>`,
      ]))}</div>`,
      mount() {
        $app.querySelectorAll('[data-cv]').forEach((b) => { b.onclick = async () => {
          const { data: u, error: er } = await sb.storage.from('cvs').createSignedUrl(b.dataset.cv, 300);
          if (er) return fail(er); window.open(u.signedUrl, '_blank', 'noopener');
        }; });
        $app.querySelectorAll('[data-ex]').forEach((b) => { b.onclick = async () => {
          const { error: er } = await sb.from('experts').update({ status: b.dataset.st }).eq('id', b.dataset.ex);
          if (er) return fail(er); render();
        }; });
      },
    };
  },

  async testsTab() {
    const { data, error } = await sb.rpc('admin_test_attempts');
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const list = data || [];
    if (!list.length) return { html: `<p class="muted">${t('testNone')}</p>` };
    const mins = (a) => (a.submitted_at ? Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 60000) + ' min' : '–');
    return {
      html: `<div class="stack">${list.map((a) => {
        const pct = a.mc_max ? Math.round((a.mc_score / a.mc_max) * 100) : null;
        const ans = a.answers || {};
        const detail = (a.questions || []).map((q) => {
          if (q.kind === 'mc') {
            const given = ans[q.id];
            const ok = given !== undefined && Number(given) === q.correct;
            return `<p class="small">${q.pos}. ${ok ? '✓' : '✗'} ${esc(given !== undefined ? (q.options || [])[given] : '—')}${ok ? '' : ` <span class="muted">(${t('testCorrect')}: ${esc((q.options || [])[q.correct])})</span>`}</p>`;
          }
          return `<div class="stack" style="gap:4px;margin-top:8px"><p class="small" style="white-space:pre-wrap;font-weight:600">${q.pos}. ${esc(q.prompt)}</p><p class="small" style="white-space:pre-wrap;background:var(--chip);padding:10px;border-radius:10px">${esc(ans[q.id] || '—')}</p></div>`;
        }).join('');
        return `<div class="card stack">
          <div class="row between"><div><h3>${esc(a.full_name || '')} · ${esc(a.title)}</h3><p class="muted small">${esc(a.email || '')} · ${esc(fieldName(a.expert_field))} · ${dateStr(a.submitted_at || a.started_at)} · ${mins(a)}${a.late ? ' · ⚠ ' + t('testLate') : ''}</p></div>${pill(a.status)}</div>
          ${pct !== null ? `<p><strong>${a.mc_score} / ${a.mc_max}</strong> (${pct} %) ${pct >= a.pass_pct ? '✓' : `<span class="muted">${t('testBelow')} ${a.pass_pct} %</span>`}</p>` : ''}
          <details><summary class="link">${t('testAnswers')}</summary><div class="stack" style="gap:4px;margin-top:8px">${detail}</div></details>
          ${a.status !== 'in_progress' ? `<div class="row"><button class="btn btn-sm" data-ta="${a.id}" data-st="passed">${t('testPass')}</button><button class="btn btn-danger btn-sm" data-ta="${a.id}" data-st="failed">${t('testFail')}</button><button class="btn btn-ghost btn-sm" data-ta-reset="${a.id}">${t('testReset')}</button></div>` : ''}
        </div>`;
      }).join('')}</div>`,
      mount() {
        $app.querySelectorAll('[data-ta]').forEach((b) => { b.onclick = async () => {
          const { error: er } = await sb.from('test_attempts').update({ status: b.dataset.st }).eq('id', b.dataset.ta);
          if (er) return fail(er); render();
        }; });
        $app.querySelectorAll('[data-ta-reset]').forEach((b) => { b.onclick = async () => {
          const { error: er } = await sb.from('test_attempts').delete().eq('id', b.dataset.taReset);
          if (er) return fail(er); render();
        }; });
      },
    };
  },

  async roles() {
    const [{ data: roles }, { data: apps }] = await Promise.all([
      sb.from('roles').select('*').order('created_at', { ascending: false }),
      sb.from('applications').select('id,role_id,status,note,created_at,expert_id,experts(field,profiles(full_name,email))').order('created_at', { ascending: false }),
    ]);
    const byRole = {};
    (apps || []).forEach((a) => { (byRole[a.role_id] = byRole[a.role_id] || []).push(a); });
    return {
      html: `<div class="stack-lg">
        <form id="roleF" class="card stack"><h3>New role</h3>
          <div class="form-grid">
            <label class="f">Title *<input name="title" required></label>
            <label class="f">${t('field')} *<select name="field">${fieldOptions()}</select></label>
            <label class="f">Rate min ($/h) *<input name="rate_min" type="number" min="1" required></label>
            <label class="f">Rate max ($/h) *<input name="rate_max" type="number" min="1" required></label>
            <label class="f">${t('hours')}<input name="hours_per_week" value="10–20 h / week"></label>
          </div>
          <label class="f">${t('aboutRole')}<textarea name="description"></textarea></label>
          <label class="f">${t('requirements')}<textarea name="requirements"></textarea></label>
          <button class="btn btn-accent" type="submit" style="align-self:flex-start">Create role</button>
        </form>
        ${(roles || []).map((r) => `<div class="card stack">
          <div class="row between"><div class="stack" style="gap:4px"><span class="chip">${esc(fieldName(r.field))}</span><h3>${esc(r.title)}</h3><p class="muted small">${money(r.rate_min)}–${money(r.rate_max)} ${t('perHour')} · ${esc(r.hours_per_week || '')}</p></div>
          <div class="row">${pill(r.status)}<button class="btn btn-ghost btn-sm" data-role="${r.id}" data-st="${r.status === 'open' ? 'closed' : 'open'}">${r.status === 'open' ? 'Close' : 'Reopen'}</button><button class="btn btn-danger btn-sm" data-delrole="${r.id}">${t('delete')}</button></div></div>
          <details><summary class="link">Applications (${(byRole[r.id] || []).length})</summary><div style="margin-top:10px">
            ${table(['Name', 'Email', t('note'), t('status'), ''], (byRole[r.id] || []).map((a) => [esc(a.experts?.profiles?.full_name || ''), esc(a.experts?.profiles?.email || ''), esc(a.note || ''), pill(a.status),
              `<div class="row"><button class="btn btn-sm" data-app="${a.id}" data-st="accepted">Accept</button><button class="btn btn-ghost btn-sm" data-app="${a.id}" data-st="shortlisted">Shortlist</button><button class="btn btn-danger btn-sm" data-app="${a.id}" data-st="rejected">${t('reject')}</button></div>`]))}
          </div></details>
        </div>`).join('')}
      </div>`,
      mount() {
        const f = document.getElementById('roleF');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const { error } = await sb.from('roles').insert({ ...d, rate_min: Number(d.rate_min), rate_max: Number(d.rate_max) });
          busy(f, false); if (error) return fail(error); toast(t('saved')); render();
        };
        $app.querySelectorAll('[data-role]').forEach((b) => { b.onclick = async () => { const { error } = await sb.from('roles').update({ status: b.dataset.st }).eq('id', b.dataset.role); if (error) return fail(error); render(); }; });
        $app.querySelectorAll('[data-delrole]').forEach((b) => { b.onclick = async () => { if (!window.confirm('Delete this role?')) return; const { error } = await sb.from('roles').delete().eq('id', b.dataset.delrole); if (error) return fail(error); render(); }; });
        $app.querySelectorAll('[data-app]').forEach((b) => { b.onclick = async () => { const { error } = await sb.from('applications').update({ status: b.dataset.st }).eq('id', b.dataset.app); if (error) return fail(error); render(); }; });
      },
    };
  },

  async requests() {
    const [{ data, error }, { data: cands }, { data: exps }] = await Promise.all([
      sb.from('requests').select('*, companies(company_name, website, terms_accepted_at, profiles(full_name,email))').order('created_at', { ascending: false }),
      sb.from('request_candidates').select('*, experts(field, years_experience, headline, profiles(full_name, email))').order('created_at', { ascending: true }),
      sb.from('experts').select('id, field, years_experience, profiles(full_name)').eq('status', 'approved'),
    ]);
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const opts = (cur) => ['new', 'in_progress', 'done', 'declined'].map((s) => `<option value="${s}" ${s === cur ? 'selected' : ''}>${s}</option>`).join('');
    const byReq = {};
    (cands || []).forEach((c) => { (byReq[c.request_id] = byReq[c.request_id] || []).push(c); });
    const CST = { proposed: 'pending', interested: 'approved', declined: 'declined' };
    const expOpts = (field, taken) => (exps || []).filter((e) => !taken.includes(e.id))
      .sort((a, b) => (b.field === field) - (a.field === field))
      .map((e) => `<option value="${e.id}">${esc(e.profiles?.full_name || '')} – ${esc(fieldName(e.field))}${e.years_experience != null ? `, ${esc(e.years_experience)} y` : ''}</option>`).join('');
    if (!(data || []).length) return { html: `<p class="muted">${t('none')}</p>` };
    return {
      html: `<div class="stack-lg"><p class="muted small">New requests get the best matching approved experts automatically (see Automation). You can also propose experts yourself: the company sees an anonymous profile (field, experience, headline, skills, country, test result, interview score and your note – no name or contact) and answers “Interested” or “Not a fit”. Then send the offer in Contracts.</p>
        ${(data || []).map((r) => {
          const list = byReq[r.id] || [];
          return `<div class="card stack">
            <div class="row between" style="align-items:flex-start"><div class="stack" style="gap:4px">
              <h3>${esc(r.companies?.company_name || '')} · ${esc(fieldName(r.field))}</h3>
              <p class="muted small">${esc(r.companies?.profiles?.full_name || '')} · <a href="mailto:${esc(r.companies?.profiles?.email)}">${esc(r.companies?.profiles?.email || '')}</a> · ${dateStr(r.created_at)}${r.companies?.terms_accepted_at ? '' : ' · <span style="color:var(--bad)">Client Terms not accepted yet</span>'}</p>
              <p class="small">${t('expertsNeeded')}: <b>${esc(r.experts_needed)}</b>${r.hours_per_week ? ` · ${t('hoursPerWeek')}: <b>${esc(r.hours_per_week)}</b>` : ''}${r.budget ? ` · ${t('budget')}: <b>${esc(r.budget)}</b>` : ''}</p></div>
              <select data-req="${r.id}" style="min-height:36px;padding:4px 8px;width:auto">${opts(r.status)}</select></div>
            <p class="small" style="white-space:pre-line">${esc(r.description || '')}</p>
            ${list.length ? table(['Expert', 'Shown as', 'Your note', 'Company answer', ''], list.map((c) => [
              `${esc(c.experts?.profiles?.full_name || '')}<br><span class="small muted">${esc(fieldName(c.experts?.field))}</span>`,
              `<span class="small">Expert ${esc(String(c.id).slice(0, 4).toUpperCase())}</span>`, `<span class="small">${esc(c.admin_note || '')}</span>`,
              `${pill(CST[c.status])}${c.company_note ? `<div class="small muted">${esc(c.company_note)}</div>` : ''}`,
              `<div class="row">${c.status === 'interested' ? `<a class="btn btn-accent btn-sm" href="#/admin?tab=contracts&expert=${esc(c.expert_id)}&company=${esc(r.company_id)}">Create offer →</a>` : ''}<button class="btn btn-danger btn-sm" data-uncand="${c.id}">Remove</button></div>`])) : ''}
            <form class="row" data-propose="${r.id}" style="align-items:flex-end">
              <label class="f" style="flex:1 1 220px">Propose expert<select name="expert_id" required>${expOpts(r.field, list.map((c) => c.expert_id)) || '<option value="">No more approved experts</option>'}</select></label>
              <label class="f" style="flex:2 1 260px">Why this expert (shown to the company)<input name="admin_note" maxlength="1000"></label>
              <button class="btn btn-sm" type="submit">Propose</button>
              <button class="btn btn-ghost btn-sm" type="button" data-automatch="${r.id}">Auto-match best</button>
            </form>
          </div>`;
        }).join('')}</div>`,
      mount() {
        $app.querySelectorAll('[data-req]').forEach((sel) => { sel.onchange = async () => { const { error: er } = await sb.from('requests').update({ status: sel.value }).eq('id', sel.dataset.req); if (er) return fail(er); toast(t('saved')); }; });
        $app.querySelectorAll('[data-propose]').forEach((f) => { f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); if (!d.expert_id) return; busy(f, true);
          const { error: er } = await sb.from('request_candidates').insert({ request_id: f.dataset.propose, expert_id: d.expert_id, admin_note: d.admin_note || null });
          busy(f, false); if (er) return fail(er); toast(t('saved')); render();
        }; });
        $app.querySelectorAll('[data-automatch]').forEach((b) => { b.onclick = async () => {
          b.disabled = true; const { data: n, error: er } = await sb.rpc('admin_auto_propose', { p_request: b.dataset.automatch });
          if (er) { b.disabled = false; return fail(er); } toast(n ? `${n} expert(s) proposed` : 'No more matching approved experts in this field'); render();
        }; });
        $app.querySelectorAll('[data-uncand]').forEach((b) => { b.onclick = async () => {
          if (!window.confirm('Remove this proposal? The company will no longer see it.')) return;
          const { error: er } = await sb.from('request_candidates').delete().eq('id', b.dataset.uncand); if (er) return fail(er); render();
        }; });
      },
    };
  },

  async visitorsTab() {
    const days = Number(parseHash().query.get('days')) || 30;
    const { data, error } = await sb.rpc('admin_visitor_stats', { p_days: days });
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const s = data || {};
    const box = (label, v) => `<div class="card"><p class="muted small">${label}</p><p class="stat-v">${esc(v ?? 0)}</p></div>`;
    // Every day of the period gets a bar (days without visits stay empty), so one busy day no longer fills the chart.
    const seen = Object.fromEntries((s.by_day || []).map((d) => [String(d.day).slice(0, 10), d]));
    const byDay = Array.from({ length: days }, (_, k) => { const dt = new Date(); dt.setDate(dt.getDate() - (days - 1 - k)); const key = dt.toISOString().slice(0, 10); const d = seen[key] || {}; return { day: key, views: Number(d.views) || 0, visits: Number(d.visits) || 0 }; });
    const max = Math.max(1, ...byDay.map((d) => d.views));
    const bars = `<div class="card stack"><div class="row between"><h3>Visits and page views per day</h3><span class="muted small">highest day: ${esc(max)} views</span></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:2px;height:160px;border-bottom:1px solid var(--line2)">${byDay.map((d) => `<div title="${esc(dateStr(d.day))}: ${esc(d.visits)} visits, ${esc(d.views)} page views" style="flex:1;max-width:28px;height:100%;display:flex;flex-direction:column;justify-content:flex-end"><div style="height:${d.views ? Math.max(3, Math.round((d.views / max) * 100)) : 0}%;background:var(--accent-soft);border-radius:3px 3px 0 0;position:relative"><div style="position:absolute;bottom:0;left:0;right:0;height:${d.views ? Math.round((d.visits / d.views) * 100) : 0}%;background:var(--accent);border-radius:3px 3px 0 0"></div></div></div>`).join('')}</div>
      <div class="row between muted small"><span>${esc(dateStr(byDay[0].day))}</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:2px"></span> visits &nbsp; <span style="display:inline-block;width:10px;height:10px;background:var(--accent-soft);border-radius:2px"></span> page views · hover a bar for the numbers</span><span>${esc(dateStr(byDay[byDay.length - 1].day))}</span></div></div>`;
    const list = (title, rows, a, b, bl) => `<div class="card stack"><h3>${title}</h3>${table([a, bl], (rows || []).map((r) => [esc(r[Object.keys(r)[0]] ?? '–'), esc(r[b])]))}</div>`;
    const filt = [7, 30, 90].map((d) => `<a class="btn btn-sm ${days === d ? '' : 'btn-ghost'}" href="#/admin?tab=visitorsTab&days=${d}">${d} days</a>`).join('');
    return { html: `<div class="stack-lg">
      <div class="row">${filt}</div>
      <div class="grid-sm">${box('Visits', s.visits)}${box('Page views', s.views)}${box('Visits today', s.today)}</div>
      ${bars}
      <div class="grid">${list('Top pages', s.pages, 'path', 'views', 'Views')}${list('Where visitors come from', s.referrers, 'referrer', 'visits', 'Visits')}</div>
      <div class="grid">${list('Devices', s.devices, 'device', 'visits', 'Visits')}${list('Browser languages', s.langs, 'lang', 'visits', 'Visits')}</div>
      <p class="muted small">Counted anonymously, without cookies or IP addresses. A visit = the first page someone opens; your own visits while signed in as admin are not counted.</p>
    </div>` };
  },

  // Automatic bookkeeping (owner, 25.11.2026): built from paid prepayments, paid payouts, paid referral bonuses and
  // the expenses entered here. Amounts stay in their currency; CHF values come from the bank statement.
  async accountingTab() {
    const q = parseHash().query; const year = Number(q.get('year')) || new Date().getFullYear();
    const from = `${year}-01-01`; const to = `${year + 1}-01-01`;
    const [pr, po, rf, ex] = await Promise.all([
      sb.from('prepayments').select('id, invoice_no, amount, paid_at, companies(company_name)').eq('status', 'paid').gte('paid_at', from).lt('paid_at', to),
      sb.from('payouts').select('id, amount, hours, week_start, paid_at, experts(profiles(full_name, country))').eq('status', 'paid').gte('paid_at', from).lt('paid_at', to),
      sb.rpc('admin_referrals'),
      sb.from('expenses').select('*').gte('spent_on', from).lt('spent_on', to).order('spent_on', { ascending: false }),
    ]);
    const err = pr.error || po.error || rf.error || ex.error;
    if (err) return { html: `<p class="form-msg err">${esc(err.message)}</p>` };
    const swiss = (c) => /^(ch|che|schweiz|switzerland|suisse|svizzera|svizra)$/i.test(String(c || '').trim());
    const rows = [];
    (pr.data || []).forEach((p) => rows.push({ date: p.paid_at, type: 'Income', what: `Prepayment ${invoiceNo(p)}`, who: p.companies?.company_name || '', amount: Number(p.amount), cur: 'USD', foreign: false }));
    (po.data || []).forEach((p) => { const c = p.experts?.profiles?.country; rows.push({ date: p.paid_at, type: 'Expert payout', what: `Week of ${dateStr(p.week_start)}, ${p.hours} h`, who: p.experts?.profiles?.full_name || '', amount: -Number(p.amount), cur: 'USD', foreign: !swiss(c), country: c }); });
    (rf.data || []).filter((r) => r.bonus_paid_at && String(r.bonus_paid_at).slice(0, 4) === String(year)).forEach((r) => {
      rows.push({ date: r.bonus_paid_at, type: 'Referral bonus', what: 'Bonus for the new expert', who: r.referred_name || '', amount: -100, cur: 'USD', foreign: true });
      if (r.referrer_email && r.referrer_email !== profile?.email) rows.push({ date: r.bonus_paid_at, type: 'Referral bonus', what: 'Bonus for referring', who: r.referrer_name || '', amount: -100, cur: 'USD', foreign: true });
    });
    (ex.data || []).forEach((e) => rows.push({ date: e.spent_on, type: 'Other expense', what: e.description, who: '', amount: -Number(e.amount), cur: e.currency, foreign: e.foreign_service, id: e.id }));
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const sum = (f) => rows.filter(f).reduce((a, r) => a + r.amount, 0);
    const curs = [...new Set(rows.map((r) => r.cur))].sort();
    const fmt = (n, c) => `${c === 'USD' ? '$' : c + ' '}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const income = sum((r) => r.type === 'Income');
    const payouts = -sum((r) => r.type === 'Expert payout');
    const bonuses = -sum((r) => r.type === 'Referral bonus');
    const otherUsd = -sum((r) => r.type === 'Other expense' && r.cur === 'USD');
    const profit = income - payouts - bonuses - otherUsd;
    const otherNonUsd = curs.filter((c) => c !== 'USD').map((c) => fmt(-sum((r) => r.type === 'Other expense' && r.cur === c), c)).join(' + ');
    const foreignUsd = -sum((r) => r.foreign && r.amount < 0 && r.cur === 'USD');
    const foreignOther = curs.filter((c) => c !== 'USD').map((c) => [c, -sum((r) => r.foreign && r.amount < 0 && r.cur === c)]).filter(([, v]) => v > 0).map(([c, v]) => fmt(v, c)).join(' + ');
    const limitMsg = foreignUsd >= 11000 ? '<span class="pill pill-bad">Probably above CHF 10,000 – check in CHF and report to the ESTV within 60 days after year end (Bezugsteuer)</span>'
      : foreignUsd >= 9000 ? '<span class="pill pill-warn">Close to CHF 10,000 – keep an eye on it</span>' : '<span class="pill pill-ok">Below the CHF 10,000 limit</span>';
    const box = (label, v, sub = '') => `<div class="card"><p class="muted small">${label}</p><p class="stat-v">${v}</p>${sub ? `<p class="muted small">${sub}</p>` : ''}</div>`;
    const years = [year - 1, year, year + 1].filter((y) => y >= 2026 && y <= new Date().getFullYear() + 1);
    return {
      html: `<div class="stack-lg">
        <div class="row">${years.map((y) => `<a class="btn btn-sm ${y === year ? '' : 'btn-ghost'}" href="#/admin?tab=accountingTab&year=${y}">${y}</a>`).join('')}<button class="btn btn-ghost btn-sm" id="csvBtn">Download CSV (Excel)</button></div>
        <div class="grid-sm">
          ${box('Income from companies', fmt(income, 'USD'))}
          ${box('Paid to experts', fmt(payouts, 'USD'))}
          ${box('Referral bonuses', fmt(bonuses, 'USD'))}
          ${box('Other expenses', otherUsd || !otherNonUsd ? fmt(otherUsd, 'USD') : '–', otherNonUsd ? `plus ${otherNonUsd}` : '')}
          ${box('Profit before tax', `${profit < 0 ? '−' : ''}${fmt(profit, 'USD')}`, otherNonUsd ? `minus ${otherNonUsd}` : '')}
        </div>
        <div class="card stack" style="gap:6px"><h3>Services from abroad (CHF 10,000 limit)</h3><p>Payouts to experts outside Switzerland, referral bonuses and foreign expenses this year: <b>${fmt(foreignUsd, 'USD')}</b>${foreignOther ? ` + ${foreignOther}` : ''}</p><p>${limitMsg}</p><p class="muted small">The limit is in CHF; the exact CHF amounts are on your bank statement.</p></div>
        <form id="expF" class="card stack"><h3>Add an expense</h3>
          <div class="form-grid">
            <label class="f">Date<input type="date" name="spent_on" value="${new Date().toISOString().slice(0, 10)}" required></label>
            <label class="f">What<input name="description" maxlength="300" required placeholder="e.g. Domain brightpeer.com"></label>
            <label class="f">Amount<input name="amount" type="number" min="0.01" step="0.01" required></label>
            <label class="f">Currency<select name="currency"><option>CHF</option><option>USD</option><option>EUR</option></select></label>
          </div>
          <label class="check"><input type="checkbox" name="foreign_service"> <span>From a company abroad (counts towards the CHF 10,000 limit)</span></label>
          <button class="btn btn-accent" type="submit" style="align-self:flex-start">Add expense</button>
        </form>
        <div class="stack"><h3>All bookings ${year}</h3>
          ${table(['Date', 'Type', 'What', 'Who', 'Amount', 'Abroad', ''], rows.map((r) => [dateStr(r.date), esc(r.type), esc(r.what), esc(r.who) + (r.country ? `<span class="muted small"> · ${esc(r.country)}</span>` : ''),
            `<span style="color:${r.amount < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.amount < 0 ? '−' : '+'}${fmt(r.amount, r.cur)}</span>`, r.foreign ? 'yes' : '', r.id ? `<button class="btn btn-ghost btn-sm" data-delexp="${r.id}">${t('delete')}</button>` : '']))}
          <p class="muted small">Income and payouts appear here automatically once you click “Mark paid”. Only other expenses (domain, software, fees) are entered by hand.</p>
        </div>
      </div>`,
      mount() {
        const f = document.getElementById('expF');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const { error: er } = await sb.from('expenses').insert({ spent_on: d.spent_on, description: d.description, amount: Number(d.amount), currency: d.currency, foreign_service: !!d.foreign_service });
          busy(f, false); if (er) return fail(er); toast(t('saved')); render();
        };
        $app.querySelectorAll('[data-delexp]').forEach((b) => { b.onclick = async () => { if (!window.confirm('Delete this expense?')) return; const { error: er } = await sb.from('expenses').delete().eq('id', b.dataset.delexp); if (er) return fail(er); render(); }; });
        document.getElementById('csvBtn').onclick = () => {
          const q2 = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const lines = [['Date', 'Type', 'What', 'Who', 'Country', 'Amount', 'Currency', 'Abroad'].map(q2).join(';')]
            .concat(rows.map((r) => [String(r.date).slice(0, 10), r.type, r.what, r.who, r.country || '', r.amount.toFixed(2), r.cur, r.foreign ? 'yes' : 'no'].map(q2).join(';')));
          const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `brightpeer-bookings-${year}.csv`; document.body.appendChild(a); a.click(); a.remove();
        };
      },
    };
  },

  async automationTab() {
    const { data: st, error } = await sb.from('automation_settings').select('*').eq('id', 1).maybeSingle();
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const s = st || {};
    const chk = (name, label, help) => `<label class="check" style="align-items:flex-start"><input type="checkbox" name="${name}" ${s[name] ? 'checked' : ''}> <span><b>${label}</b><br><span class="muted small">${help}</span></span></label>`;
    return {
      html: `<form id="autoF" class="stack-lg">
        <div class="card stack"><h3>Matching</h3>
          ${chk('auto_propose', 'Propose experts automatically for new requests', 'When a company sends a request, the best approved experts in that field (by score) are shown to it right away as anonymous profiles.')}
          <label class="f" style="max-width:220px">Experts per request<input type="number" name="propose_count" min="1" max="10" value="${esc(s.propose_count ?? 3)}"></label>
          ${chk('auto_offer', 'Send the offer automatically when the company is interested', 'Expert pay = the expert’s own rate wish, kept within the pay range of the field shown on the website; company price = pay + 30 %. The expert accepts online and can then log hours. Off = you click “Create offer” yourself.')}
        </div>
        <div class="card stack"><h3>Applications</h3>
          ${chk('auto_approve_experts', 'Approve experts automatically', 'An expert is approved as soon as the CV is uploaded, the field test reaches the minimum and the interview has at least the minimum stars. Every submitted interview is rated by the AI automatically (tab Interviews).')}
          <div class="form-grid"><label class="f">Minimum field test (%)<input type="number" name="approve_min_test" min="0" max="100" value="${esc(s.approve_min_test ?? 80)}"></label>
          <label class="f">Minimum interview stars<input type="number" name="approve_min_stars" min="1" max="5" value="${esc(s.approve_min_stars ?? 4)}"></label></div>
          ${chk('ai_counts_for_approval', 'Let the AI rating count for approval', 'If you have not rated an interview yourself, the AI stars count instead. Off = only your own stars count. The AI reads written answers only.')}
        </div>
        <div class="card stack"><h3>Hours and payouts</h3>
          ${chk('auto_approve_hours', 'Approve hours automatically if the company does not react', 'Matches the Client Terms: objections within 7 days, otherwise the hours count as approved.')}
          <label class="f" style="max-width:220px">After how many days<input type="number" name="hours_days" min="1" max="30" value="${esc(s.hours_days ?? 7)}"></label>
          ${chk('auto_payouts', 'Prepare payouts automatically', 'Every morning the payouts for approved hours of past weeks are created. You only transfer the money and click “Mark paid”.')}
        </div>
        <div class="row"><button class="btn btn-accent" type="submit">Save</button><button class="btn btn-ghost" type="button" id="runNow">Run now</button></div>
        <p class="muted small">Runs automatically every morning at about 6:00 Swiss time. Bookkeeping updates itself (tab Accounting). Last saved: ${s.updated_at ? dateStr(s.updated_at) : '–'}</p>
        <div id="runMsg"></div>
      </form>`,
      mount() {
        const f = document.getElementById('autoF');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const num = (k, def) => Math.round(Number(d[k])) || def;
          const { error: er } = await sb.from('automation_settings').update({
            auto_propose: !!d.auto_propose, auto_offer: !!d.auto_offer, propose_count: num('propose_count', 3), auto_approve_experts: !!d.auto_approve_experts,
            approve_min_test: Math.max(0, Math.min(100, num('approve_min_test', 80))), approve_min_stars: Math.max(1, Math.min(5, num('approve_min_stars', 4))),
            ai_counts_for_approval: !!d.ai_counts_for_approval, auto_approve_hours: !!d.auto_approve_hours, hours_days: Math.max(1, Math.min(30, num('hours_days', 7))), auto_payouts: !!d.auto_payouts, updated_at: new Date().toISOString(),
          }).eq('id', 1);
          busy(f, false); if (er) return fail(er); toast(t('saved')); render();
        };
        document.getElementById('runNow').onclick = async (ev) => {
          ev.target.disabled = true; const { data: r, error: er } = await sb.rpc('admin_run_automation'); ev.target.disabled = false;
          if (er) return fail(er);
          document.getElementById('runMsg').innerHTML = `<div class="form-msg ok">Done: ${esc(r?.hours_approved ?? 0)} hour entries approved, ${esc(r?.payouts ?? 0)} payouts prepared, ${esc(r?.experts_approved ?? 0)} experts approved.</div>`;
        };
      },
    };
  },

  async referralsTab() {
    const { data, error } = await sb.rpc('admin_referrals');
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const rows = data || [];
    const due = rows.filter((r) => r.qualified && !r.bonus_paid_at).length;
    return {
      html: `<div class="stack-lg">
        <p class="muted">Bonus: <b>$100</b> for the new expert and <b>$100</b> for the person who referred them, once the new expert has <b>10 paid hours</b>. Due now: <b>${due}</b> (= ${money(due * 200)}).</p>
        ${table(['New expert', 'Referred by', 'Code', 'Paid hours', 'Approved hours', 'Bonus', ''], rows.map((r) => [
          `${esc(r.referred_name || '')}<br><span class="small muted">${esc(r.referred_email || '')} · ${esc(r.referred_status || '')}</span>`,
          r.referrer_name || r.referrer_email ? `${esc(r.referrer_name || '')}<br><span class="small muted">${esc(r.referrer_email || '')}</span>` : '<span class="small muted">unknown code</span>',
          esc(r.code || ''), `${esc(Number(r.paid_hours))} / 10`, esc(Number(r.approved_hours)),
          r.bonus_paid_at ? `${pill('paid')} <span class="small muted">${dateStr(r.bonus_paid_at)}</span>` : r.qualified ? '<span class="pill pill-warn">Due – pay both</span>' : `<span class="small muted">${esc(Math.max(0, 10 - Number(r.paid_hours)))} h to go</span>`,
          r.bonus_paid_at ? `<button class="btn btn-ghost btn-sm" data-rbundo="${r.referred_id}">Undo</button>` : r.qualified ? `<button class="btn btn-sm" data-rbpaid="${r.referred_id}">Mark paid</button>` : '',
        ]))}
        <p class="muted small">Pay the two bonuses together with the next weekly payout (Wise or PayPal), then click “Mark paid”.</p>
      </div>`,
      mount() {
        $app.querySelectorAll('[data-rbpaid]').forEach((b) => { b.onclick = async () => { const { error: er } = await sb.from('referral_bonuses').insert({ referred_id: b.dataset.rbpaid }); if (er) return fail(er); render(); }; });
        $app.querySelectorAll('[data-rbundo]').forEach((b) => { b.onclick = async () => { if (!window.confirm('Mark this bonus as not paid?')) return; const { error: er } = await sb.from('referral_bonuses').delete().eq('referred_id', b.dataset.rbundo); if (er) return fail(er); render(); }; });
      },
    };
  },

  async interviewsTab() {
    const { data, error } = await sb.from('interviews').select('*, experts(field, profiles(full_name,email))').order('submitted_at', { ascending: false, nullsFirst: false });
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    return {
      html: `<div class="stack-lg">${(data || []).length ? '' : `<p class="muted">${t('ivNone')}</p>`}
        ${(data || []).map((iv) => `<div class="card stack">
          <div class="row between"><div class="stack" style="gap:2px"><h3>${esc(iv.experts?.profiles?.full_name || '')}</h3><p class="muted small">${esc(iv.experts?.profiles?.email || '')} · ${esc(fieldName(iv.field))} · ${iv.submitted_at ? dateStr(iv.submitted_at) : t('stInProgress')}</p></div>${pill(iv.status)}</div>
          <details ${iv.status === 'submitted' ? 'open' : ''}><summary class="link">${t('ivAnswers')} (${(iv.answers || []).length})</summary>
            <div class="stack" style="margin-top:12px">${(iv.answers || []).map((a, i) => `<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:10px">
              <p class="small"><b>${i + 1}. ${esc(a.q)}</b></p>${a.text ? `<p style="white-space:pre-line">${esc(a.text)}</p>` : ''}
              ${a.audio ? `<button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-audio="${esc(a.audio)}">▶ ${t('ivPlay')}</button>` : ''}</div>`).join('')}</div>
          </details>
          <div class="card stack" style="gap:6px;background:var(--chip);border:0">
            <div class="row between"><p class="small"><b>AI rating</b> ${iv.ai_score ? `<span style="color:var(--accent)">${'★'.repeat(iv.ai_score)}</span><span class="muted">${'★'.repeat(5 - iv.ai_score)}</span> (${esc(iv.ai_score)}/5)` : '<span class="muted">not rated yet</span>'}</p>
              ${iv.status !== 'in_progress' ? `<div class="row"><button class="btn btn-ghost btn-sm" type="button" data-aiscore="${iv.id}">${iv.ai_score ? 'Rate again with AI' : 'Rate with AI'}</button>${iv.ai_score ? `<button class="btn btn-ghost btn-sm" type="button" data-useai="${iv.id}" data-v="${iv.ai_score}">Use AI stars</button>` : ''}</div>` : ''}</div>
            ${iv.ai_summary ? `<p class="small" style="white-space:pre-line">${esc(iv.ai_summary)}</p>` : ''}
            <p class="muted small">Suggestion only – you decide. Voice answers are not read by the AI.</p>
          </div>
          <form class="row" data-ivform="${iv.id}">
            <select name="score" style="flex:0 0 140px"><option value="">${t('ivScore')}</option>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${iv.score === n ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}</select>
            <input name="admin_note" placeholder="${esc(t('note'))}" value="${esc(iv.admin_note || '')}" style="flex:1 1 220px">
            <button class="btn btn-sm" type="submit">${t('ivReviewed')}</button>
          </form>
        </div>`).join('')}
      </div>`,
      mount() {
        $app.querySelectorAll('[data-audio]').forEach((b) => { b.onclick = async () => {
          const { data: u, error: er } = await sb.storage.from('interviews').createSignedUrl(b.dataset.audio, 600);
          if (er) return fail(er);
          const au = document.createElement('audio'); au.controls = true; au.src = u.signedUrl; au.style.width = '100%'; b.replaceWith(au); au.play().catch(() => {});
        }; });
        $app.querySelectorAll('[data-aiscore]').forEach((b) => { b.onclick = async () => {
          b.disabled = true; b.textContent = 'Rating…';
          const { data: r, error: er } = await sb.functions.invoke('score-interview', { body: { interview_id: b.dataset.aiscore } });
          if (er || !r?.ok) {
            b.disabled = false; b.textContent = 'Rate with AI';
            let code = r?.error; try { code = code || (await er.context.json()).error; } catch { /* ignore */ }
            return toast(code === 'not_configured' ? 'AI rating is not set up yet: the Anthropic API key is missing in Supabase.' : 'AI rating failed – please try again later.', true);
          }
          toast(`AI rating: ${r.ai_score}/5`); render();
        }; });
        $app.querySelectorAll('[data-useai]').forEach((b) => { b.onclick = () => { const f = $app.querySelector(`[data-ivform="${b.dataset.useai}"]`); if (f) { f.querySelector('[name=score]').value = b.dataset.v; f.querySelector('[name=score]').focus(); toast('AI stars filled in – click “Save as reviewed” to keep them.'); } }; });
        $app.querySelectorAll('[data-ivform]').forEach((f) => { f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f);
          const { error: er } = await sb.from('interviews').update({ score: d.score ? Number(d.score) : null, admin_note: d.admin_note || null, status: 'reviewed' }).eq('id', f.dataset.ivform);
          if (er) return fail(er); toast(t('saved')); render();
        }; });
      },
    };
  },

  async contracts() {
    const [{ data: cons }, { data: exps }, { data: cos }, { data: roles }] = await Promise.all([
      sb.from('contracts').select('*, experts(profiles(full_name)), companies(company_name), roles(title)').order('created_at', { ascending: false }),
      sb.from('experts').select('id, field, rate_expectation, profiles(full_name)').eq('status', 'approved'),
      sb.from('companies').select('id, company_name'),
      sb.from('roles').select('id, title, rate_min, rate_max'),
    ]);
    const margin = (cons || []).reduce((a, c) => a + (c.status === 'active' ? Number(c.client_rate) - Number(c.expert_rate) : 0), 0);
    const pq = parseHash().query; const preExp = pq.get('expert') || ''; const preCo = pq.get('company') || '';
    const preRate = Number(((exps || []).find((e) => e.id === preExp) || {}).rate_expectation) || '';
    return {
      html: `<div class="stack-lg">
        <form id="conF" class="card stack"><h3>${t('offerNewAdmin')}</h3>
          ${(exps || []).length && (cos || []).length ? '' : '<p class="form-msg err small">You need at least one approved expert and one company.</p>'}
          <div class="form-grid">
            <label class="f">Expert *<select name="expert_id" required>${(exps || []).map((e) => `<option value="${e.id}" ${e.id === preExp ? 'selected' : ''}>${esc(e.profiles?.full_name || '')} – ${esc(fieldName(e.field))}</option>`).join('')}</select></label>
            <label class="f">Company *<select name="company_id" required>${(cos || []).map((c) => `<option value="${c.id}" ${c.id === preCo ? 'selected' : ''}>${esc(c.company_name || c.id)}</option>`).join('')}</select></label>
            <label class="f">Role<select name="role_id"><option value="">–</option>${(roles || []).map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}</select></label>
            <label class="f">Title (optional)<input name="title"></label>
            <label class="f">Expert pay ($/h) *<input name="expert_rate" id="erate" type="number" min="1" step="0.01" required value="${esc(preRate)}"></label>
            <label class="f">Company price ($/h) *<input name="client_rate" id="crate" type="number" min="1" step="0.01" required value="${preRate ? esc((preRate * 1.3).toFixed(2)) : ''}"></label>
            <label class="f">${t('startDate')}<input name="start_date" type="date"></label>
          </div>
          <label class="f">${t('offerNoteL')}<textarea name="offer_note" maxlength="2000" style="min-height:70px"></textarea></label>
          <p class="muted small">${t('offerAdminP')}</p>
          <p class="muted small">Tip: company price = expert pay + 30 % is filled in automatically.</p>
          <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('offerSend')}</button>
        </form>
        <p class="muted">Margin per hour across active contracts: <b>${money(margin)}</b></p>
        ${table(['Expert', 'Company', 'Role', 'Expert pay', 'Company price', 'Margin', t('status'), ''], (cons || []).map((c) => [
          esc(c.experts?.profiles?.full_name || ''), esc(c.companies?.company_name || ''), esc(c.title || c.roles?.title || ''), money(c.expert_rate), money(c.client_rate),
          money(Number(c.client_rate) - Number(c.expert_rate)), pill(c.status) + (c.accepted_at ? `<div class="muted small">✍ ${esc(c.accepted_name || '')} · ${dateStr(c.accepted_at)}</div>` : ''),
          c.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-endcon="${c.id}">End</button>` : '',
        ]))}
      </div>`,
      mount() {
        const er = document.getElementById('erate'); const cr = document.getElementById('crate');
        er.oninput = () => { if (er.value) cr.value = (Number(er.value) * 1.3).toFixed(2); };
        const f = document.getElementById('conF');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const { error } = await sb.from('contracts').insert({ expert_id: d.expert_id, company_id: d.company_id, role_id: d.role_id || null, title: d.title || null, expert_rate: Number(d.expert_rate), client_rate: Number(d.client_rate), status: 'offered', start_date: d.start_date || null, offer_note: d.offer_note || null });
          busy(f, false); if (error) return fail(error); toast(t('saved')); render();
        };
        $app.querySelectorAll('[data-endcon]').forEach((b) => { b.onclick = async () => { const { error } = await sb.from('contracts').update({ status: 'ended' }).eq('id', b.dataset.endcon); if (error) return fail(error); render(); }; });
      },
    };
  },

  async hoursTab() {
    const { data, error } = await sb.from('timesheets').select('*, experts(profiles(full_name)), contracts(title, expert_rate, client_rate, companies(company_name), roles(title))').order('week_start', { ascending: false }).limit(500);
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    return {
      html: table(['Expert', 'Company', 'Role', t('weekStart'), t('hoursWorked'), 'Pay', 'Price', t('note'), t('status'), ''], (data || []).map((s) => [
        esc(s.experts?.profiles?.full_name || ''), esc(s.contracts?.companies?.company_name || ''), esc(s.contracts?.title || s.contracts?.roles?.title || ''), dateStr(s.week_start), esc(s.hours),
        money(s.hours * (s.contracts?.expert_rate || 0)), money(s.hours * (s.contracts?.client_rate || 0)), esc(s.note || ''), pill(s.status),
        s.status === 'submitted' ? `<div class="row"><button class="btn btn-sm" data-ts="${s.id}" data-st="approved">${t('approve')}</button><button class="btn btn-danger btn-sm" data-ts="${s.id}" data-st="rejected">${t('reject')}</button></div>` : '',
      ])),
      mount() {
        $app.querySelectorAll('[data-ts]').forEach((b) => { b.onclick = async () => { const { error: er } = await sb.rpc('review_timesheet', { p_id: b.dataset.ts, p_status: b.dataset.st }); if (er) return fail(er); render(); }; });
      },
    };
  },

  async invoices() {
    const { data, error } = await sb.from('invoices').select('*, companies(company_name, profiles(email))').order('week_start', { ascending: false });
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    return {
      html: `<div class="stack-lg">
        <form id="genInv" class="card row"><label class="f" style="flex:1 1 200px">${t('weekStart')}<input type="date" name="week" value="${lastMonday()}" required></label><button class="btn btn-accent" type="submit" style="align-self:flex-end">Create invoices from approved hours</button></form>
        <p class="muted small">Payment link: create a Stripe Payment Link (stripe.com → Payment Links) for the amount and paste it here – the company then sees a “Pay now” button.</p>
        ${table(['Company', t('weekStart'), t('hoursWorked'), t('amount'), 'Payment link', t('status'), ''], (data || []).map((i) => [
          `${esc(i.companies?.company_name || '')}<br><span class="small muted">${esc(i.companies?.profiles?.email || '')}</span>`, dateStr(i.week_start), esc(i.hours), money(i.amount),
          `<div class="row"><input data-link="${i.id}" value="${esc(i.payment_link || '')}" placeholder="https://buy.stripe.com/…" style="min-width:200px;min-height:36px;padding:4px 8px"></div>`,
          pill(i.status), i.status === 'open' ? `<button class="btn btn-sm" data-paidinv="${i.id}">Mark paid</button>` : '',
        ]))}
      </div>`,
      mount() {
        const f = document.getElementById('genInv');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); busy(f, true);
          const { data: n, error: er } = await sb.rpc('generate_invoices', { p_week: mondayOf(new Date(formData(f).week + 'T12:00:00')) });
          busy(f, false); if (er) return fail(er); toast(`${n || 0} invoice(s)`); render();
        };
        $app.querySelectorAll('[data-link]').forEach((inp) => { inp.onchange = async () => { const { error: er } = await sb.from('invoices').update({ payment_link: inp.value.trim() || null }).eq('id', inp.dataset.link); if (er) return fail(er); toast(t('saved')); }; });
        $app.querySelectorAll('[data-paidinv]').forEach((b) => { b.onclick = async () => { const { error: er } = await sb.from('invoices').update({ status: 'paid' }).eq('id', b.dataset.paidinv); if (er) return fail(er); render(); }; });
      },
    };
  },

  async payouts() {
    const [{ data, error }, { data: pd }] = await Promise.all([
      sb.from('payouts').select('*, experts(payout_method, profiles(full_name,email))').order('week_start', { ascending: false }),
      sb.rpc('admin_payout_details'),
    ]);
    const payoutOf = Object.fromEntries((pd || []).map((x) => [x.id, x.details]));
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const open = (data || []).filter((p) => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0);
    return {
      html: `<div class="stack-lg">
        <form id="genPay" class="card row"><label class="f" style="flex:1 1 200px">${t('weekStart')}<input type="date" name="week" value="${lastMonday()}" required></label><button class="btn btn-accent" type="submit" style="align-self:flex-end">Create payouts from approved hours</button></form>
        <p class="muted">Open payouts: <b>${money(open)}</b> – pay them via Wise or PayPal, then click “Mark paid”.</p>
        ${table(['Expert', t('weekStart'), t('hoursWorked'), t('amount'), t('payoutMethod'), t('payoutDetails'), t('status'), ''], (data || []).map((p) => [
          `${esc(p.experts?.profiles?.full_name || '')}<br><span class="small muted">${esc(p.experts?.profiles?.email || '')}</span>`, dateStr(p.week_start), esc(p.hours), money(p.amount),
          esc(p.experts?.payout_method || '–'), `<span class="small">${esc(payoutOf[p.expert_id] || '–')}</span>`, pill(p.status),
          p.status === 'pending' ? `<button class="btn btn-sm" data-paidpay="${p.id}">Mark paid</button>` : dateStr(p.paid_at),
        ]))}
      </div>`,
      mount() {
        const f = document.getElementById('genPay');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); busy(f, true);
          const { data: n, error: er } = await sb.rpc('generate_payouts', { p_week: mondayOf(new Date(formData(f).week + 'T12:00:00')) });
          busy(f, false); if (er) return fail(er); toast(`${n || 0} payout(s)`); render();
        };
        $app.querySelectorAll('[data-paidpay]').forEach((b) => { b.onclick = async () => { const { error: er } = await sb.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', b.dataset.paidpay); if (er) return fail(er); render(); }; });
      },
    };
  },
};

// ---------------------------------------------------------------- skill tests
async function skillTestsCard(uid, myField) {
  const [{ data: tests }, { data: attempts }] = await Promise.all([
    sb.from('skill_tests').select('id,field,title,intro,minutes').eq('active', true),
    sb.from('test_attempts').select('test_id,status,submitted_at').eq('expert_id', uid),
  ]);
  if (!tests || !tests.length) return '';
  const byTest = Object.fromEntries((attempts || []).map((a) => [a.test_id, a]));
  const list = [...tests].sort((a, b) => (b.field === myField) - (a.field === myField) || a.title.localeCompare(b.title));
  const rows = list.map((x) => {
    const a = byTest[x.id];
    let action;
    if (!a) action = `<a class="btn btn-sm ${x.field === myField ? 'btn-accent' : 'btn-ghost'}" href="#/test/${esc(x.id)}">${t('testStart')}</a>`;
    else if (a.status === 'in_progress') action = `<a class="btn btn-sm btn-accent" href="#/test/${esc(x.id)}">${t('testContinue')}</a>`;
    else action = pill(a.status);
    return `<div class="row between" style="padding:12px 0;border-top:1px solid var(--line)">
      <div><p style="font-weight:600">${esc(x.title)}${x.field === myField ? ` <span class="pill pill-info">${t('testYourField')}</span>` : ''}</p><p class="muted small">${esc(x.minutes)} min · ${esc(x.intro || '')}</p></div>${action}</div>`;
  }).join('');
  return `<div class="card stack" style="gap:4px"><h3>${t('testsH')}</h3><p class="muted small" style="margin-bottom:8px">${t('testsP')}</p>${rows}</div>`;
}

let testTimer = null;
async function pageTest(id) {
  if (testTimer) { clearInterval(testTimer); testTimer = null; }
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  if (!actsAsExpert()) return pageNotFound();

  const [{ data: tst }, { data: att }] = await Promise.all([
    sb.from('skill_tests').select('*').eq('id', id).maybeSingle(),
    sb.from('test_attempts').select('status').eq('expert_id', session.user.id).eq('test_id', id).maybeSingle(),
  ]);
  if (!tst) return pageNotFound();
  const back = `<a href="#/dashboard" style="font-weight:600">← ${t('dashboard')}</a>`;
  if (att && att.status !== 'in_progress') {
    return `<section class="wrap section narrow stack-lg">${back}<h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(tst.title)}</h1>
      <div class="card stack"><h3>${t('testDoneH')}</h3><p class="muted">${t('testDoneP')}</p><div>${pill(att.status)}</div></div></section>`;
  }

  // intro screen (or straight in when resuming)
  const intro = `<section class="wrap section narrow stack-lg">${back}
    <h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(tst.title)}</h1>
    <div class="card stack"><p>${esc(tst.intro || '')}</p>
      <ul class="stack" style="gap:6px;margin:0;padding-left:20px">
        <li>${t('testRule1').replace('{m}', esc(tst.minutes))}</li><li>${t('testRule2')}</li><li>${t('testRule3')}</li><li>${t('testRule4')}</li>
      </ul>
      <button class="btn btn-accent" id="startTest" style="align-self:flex-start">${att ? t('testContinue') : t('testStart')}</button>
    </div></section>`;

  return {
    html: intro,
    mount() {
      document.getElementById('startTest').onclick = async (ev) => {
        ev.target.disabled = true;
        const { data, error } = await sb.rpc('start_test', { p_test: id });
        if (error) { ev.target.disabled = false; return fail(error); }
        runTest(data);
      };
    },
  };
}

function runTest(d) {
  const key = 'bp_test_' + d.attempt_id;
  let answers = {};
  try { answers = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { answers = {}; }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(answers)); } catch (e) { /* ignore */ } };
  // align with server clock
  const skew = Date.now() - new Date(d.now).getTime();
  const deadline = new Date(d.deadline).getTime() + skew;
  let sent = false;

  const qHtml = (d.questions || []).map((q, i) => {
    const head = `<p class="muted small">${t('testQuestion')} ${i + 1} / ${d.questions.length}</p><p style="white-space:pre-wrap;font-weight:500">${esc(q.prompt)}</p>`;
    if (q.kind === 'mc') {
      return `<fieldset class="card stack" style="border:1px solid var(--line);margin:0">${head}
        ${(q.options || []).map((o, k) => `<label class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start;cursor:pointer">
          <input type="radio" name="q_${q.id}" value="${k}" ${String(answers[q.id]) === String(k) ? 'checked' : ''} style="width:auto;min-height:0;margin-top:4px">
          <span style="white-space:pre-wrap">${esc(o)}</span></label>`).join('')}</fieldset>`;
    }
    return `<div class="card stack">${head}<textarea data-open="${q.id}" maxlength="6000" style="min-height:180px">${esc(answers[q.id] || '')}</textarea></div>`;
  }).join('');

  $app.innerHTML = `<section class="wrap section narrow stack-lg">
    <div class="row between" style="position:sticky;top:64px;z-index:5;background:var(--bg);padding:10px 0">
      <h1 style="font-size:1.6rem">${esc(d.title)}</h1><span class="pill pill-info" id="timer" style="font-size:1rem">--:--</span></div>
    <form id="testF" class="stack-lg">${qHtml}
      <p class="muted small">${t('testRule3')}</p>
      <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('testSubmit')}</button>
    </form></section>`;
  window.scrollTo(0, 0);

  const f = document.getElementById('testF');
  f.addEventListener('change', (ev) => {
    const m = ev.target.name && ev.target.name.match(/^q_(.+)$/);
    if (m) { answers[m[1]] = Number(ev.target.value); save(); }
  });
  f.addEventListener('input', (ev) => {
    if (ev.target.dataset.open) { answers[ev.target.dataset.open] = ev.target.value; save(); }
  });

  const submit = async (auto) => {
    if (sent) return; sent = true; busy(f, true);
    if (testTimer) { clearInterval(testTimer); testTimer = null; }
    const { error } = await sb.rpc('submit_test', { p_attempt: d.attempt_id, p_answers: answers });
    if (error) { sent = false; busy(f, false); return fail(error); }
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    toast(auto ? t('testTimeUp') : t('testSent'));
    go('#/dashboard');
  };
  f.onsubmit = (ev) => { ev.preventDefault(); submit(false); };

  const $t = document.getElementById('timer');
  const tick = () => {
    if (!document.body.contains($t)) { clearInterval(testTimer); testTimer = null; return; }
    const left = Math.max(0, deadline - Date.now());
    const m = Math.floor(left / 60000); const sec = Math.floor((left % 60000) / 1000);
    $t.textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    if (left < 120000) $t.className = 'pill pill-bad';
    if (left <= 0) submit(true);
  };
  tick(); testTimer = setInterval(tick, 1000);
}

// ---------------------------------------------------------------- floating "how it works" video
// 90-second explainer, small and draggable on the home page; tap to watch it big; × hides it for the visit.
function floatingVideo(show) {
  let el = document.getElementById('fv');
  let closed = false;
  try { closed = sessionStorage.getItem('bp_fv_closed') === '1'; } catch (e) { /* storage blocked */ }
  if (!show || closed) { if (el) el.hidden = true; return; }
  if (el) { el.hidden = false; return; }
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el = document.createElement('div');
  el.id = 'fv'; el.className = 'fv';
  el.innerHTML = `<video src="media/how-it-works.mp4" poster="media/how-it-works.jpg" muted playsinline loop preload="metadata" ${still ? '' : 'autoplay'} aria-label="${esc(t('fvLabel'))}"></video>
    <button type="button" class="fv-x" aria-label="${esc(t('fvClose'))}">×</button>
    <button type="button" class="fv-snd" aria-label="${esc(t('fvSound'))}" aria-pressed="false">${ICON_MUTE}</button>`;
  document.body.appendChild(el);
  const x = el.querySelector('.fv-x');
  const snd = el.querySelector('.fv-snd');
  const vid = el.querySelector('video');
  snd.onclick = (ev) => {
    ev.stopPropagation();
    vid.muted = !vid.muted;
    if (!vid.muted) { vid.currentTime = 0; vid.play().catch(() => {}); }
    snd.innerHTML = vid.muted ? ICON_MUTE : ICON_LOUD; snd.setAttribute('aria-pressed', String(!vid.muted));
  };
  x.onclick = (ev) => { ev.stopPropagation(); el.hidden = true; try { sessionStorage.setItem('bp_fv_closed', '1'); } catch (e) { /* ignore */ } };
  let start = null, moved = false;
  el.addEventListener('pointerdown', (ev) => {
    if (ev.target === x || ev.target === snd) return;
    const r = el.getBoundingClientRect();
    start = { x: ev.clientX, y: ev.clientY, l: r.left, t: r.top }; moved = false;
    el.setPointerCapture(ev.pointerId);
  });
  el.addEventListener('pointermove', (ev) => {
    if (!start) return;
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (!moved) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, start.l + dx)) + 'px';
    el.style.top = Math.min(window.innerHeight - h - 8, Math.max(8, start.t + dy)) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  });
  el.addEventListener('pointerup', () => { if (start && !moved) { vid.muted = true; snd.innerHTML = ICON_MUTE; snd.setAttribute('aria-pressed', 'false'); openBigVideo(); } start = null; });
}

function openBigVideo() {
  const m = document.createElement('div');
  m.className = 'fv-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', t('fvLabel'));
  m.innerHTML = `<div class="fv-big"><video src="media/how-it-works.mp4" poster="media/how-it-works.jpg" controls playsinline autoplay></video>
    <button type="button" class="fv-x" aria-label="${esc(t('fvClose'))}">×</button></div>`;
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector('.fv-x').onclick = close;
  document.addEventListener('keydown', onKey);
  document.body.appendChild(m);
}

// ---------------------------------------------------------------- router
let renderSeq = 0;
async function render() {
  // A failed Google/Microsoft login comes back as #error=...: show a message instead of a 404.
  if (/^#error=/.test(location.hash)) {
    const q = new URLSearchParams(location.hash.slice(1));
    console.warn('Login error:', q.get('error_description'));
    history.replaceState(null, '', location.pathname + '#/login');
    setTimeout(() => toast(t('oauthError')), 300);
  }
  const seq = ++renderSeq;
  document.documentElement.lang = lang;
  const { parts } = parseHash();
  let page;
  try {
    switch (parts[0]) {
      case undefined: page = await pageHome(); break;
      case 'roles': page = parts[1] ? await pageRole(parts[1]) : await pageRoles(); break;
      case 'apply': page = pageApply(); break;
      case 'company-signup': page = pageCompanySignup(); break;
      case 'login': page = pageLogin(); break;
      case 'reset': page = pageReset(); break;
      case 'companies': page = pageCompanies(); break;
      case 'services': page = pageServices(parts[1]); break;
      case 'research': page = pageResearch(); break;
      case 'info': page = pageInfo(); break;
      case 'about': page = pageAbout(); break;
      case 'help': page = pageHelp(); break;
      case 'legal': page = pageLegal(parts[1] || 'terms'); break;
      case 'dashboard': page = await pageDashboard(); break;
      case 'admin': page = await pageAdmin(); break;
      case 'test': page = await pageTest(parts[1]); break;
      case 'interview': page = await pageInterview(); break;
      case 'invoice': page = await pageInvoice(parts[1]); break;
      case 'confirmation': page = await pageConfirmation(); break;
      default: page = pageNotFound();
    }
  } catch (e) {
    console.error(e);
    page = `<section class="wrap section"><p class="form-msg err">${t('error')}: ${esc(e.message)}</p></section>`;
  }
  if (seq !== renderSeq) return; // a newer navigation started
  if (typeof page === 'string') page = { html: page };
  renderHeader();
  renderFooter();
  $app.innerHTML = page.html;
  window.scrollTo(0, 0);
  if (page.mount) page.mount();
  floatingVideo(parts[0] === undefined);
  document.getElementById('loader').classList.add('hide');
  trackView(parts);
}

// ---------------------------------------------------------------- visitor statistics (owner, 25.11.2026)
// Counts page views anonymously: no cookie, no stored id, no IP. The first page of a visit is marked as its entry,
// with the referring website's name. The admin's own visits and the admin area are not counted.
let viewEntry = true;
let lastViewed = '';
function trackView(parts) {
  try {
    if (!sb || profile?.role === 'admin' || parts[0] === 'admin' || parts[0] === 'invoice') return;
    const path = '/' + parts.slice(0, 2).map((x) => (/^[0-9a-f-]{8,}$/i.test(x) ? ':id' : x)).join('/');
    if (path === lastViewed) return;
    lastViewed = path;
    const w = window.innerWidth;
    let referrer = null;
    if (viewEntry && document.referrer) {
      try { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h && h !== location.hostname) referrer = h.slice(0, 120); } catch { /* ignore */ }
    }
    const row = { path: path.slice(0, 120), referrer, lang: (navigator.language || '').slice(0, 10), device: w < 768 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop', entry: viewEntry };
    viewEntry = false;
    sb.from('page_views').insert(row).then(() => {}, () => {});
  } catch { /* statistics must never break the page */ }
}

window.addEventListener('hashchange', render);

async function init() {
  if (configured) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const qs = new URLSearchParams(location.search);
      const hadCode = qs.has('code');
      const oauthError = qs.get('error_description');
      const isReset = qs.get('reset') === '1';
      sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
      const { data } = await sb.auth.getSession();
      session = data.session;
      await loadProfile();
      await Promise.all([loadOAuthProviders(), finishOAuth()]);
      await finishPendingApply();
      if (oauthError) { history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => toast(oauthError, true), 300); }
      if (hadCode || isReset) {
        history.replaceState(null, '', location.pathname + location.hash);
        if (session && isReset) { window.__bpRecovery = true; location.hash = '#/reset'; }
        else if (session) location.hash = '#/dashboard';
        else if (hadCode) location.hash = '#/login';
      }
      sb.auth.onAuthStateChange((event, s) => { setTimeout(() => onAuth(event, s), 0); });
      const onAuth = async (event, s) => {
        if (event === 'PASSWORD_RECOVERY') { window.__bpRecovery = true; session = s; location.hash = '#/reset'; return; }
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') { session = s; return; }
        session = s; await loadProfile();
        if (event === 'SIGNED_IN') { await finishOAuth(); await finishPendingApply(); }
        if (event === 'SIGNED_IN' && !parseHash().parts.length) { location.hash = '#/dashboard'; return; }
        render();
      };
    } catch (e) {
      console.error('Supabase failed to load', e);
      sb = null;
    }
  }
  render();
}
init();
