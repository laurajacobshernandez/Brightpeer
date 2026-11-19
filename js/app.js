// Brightpeer – single-page app (no build step). Works on GitHub Pages.
import { CONFIG } from './config.js';
import { t, lang, setLang, LANGS } from './i18n.js';

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
  pending: 'warn', submitted: 'warn', new: 'warn', open: 'warn', in_progress: 'info', shortlisted: 'info',
  approved: 'ok', accepted: 'ok', active: 'ok', paid: 'ok', done: 'ok',
  rejected: 'bad', declined: 'bad', ended: 'grey', closed: 'grey',
};
const STATUS_LABEL = {
  pending: 'pending', submitted: 'submitted', new: 'stNew', open: 'open', in_progress: 'stInProgress', approved: 'approved',
  accepted: 'approved', active: 'active', paid: 'paid', done: 'stDone', rejected: 'rejected', declined: 'stDeclined', ended: 'ended',
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
  const langSel = `<label><span class="sr">${t('language')}</span><select class="lang" id="langSel">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
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
      ${a('/roles', t('navRoles'))}${a('/companies', t('navCompanies'))}${a('/research', t('navResearch'))}${a('/about', t('navAbout'))}${a('/help', t('navHelp'))}
      ${langSel}${right}
    </div>
  </nav>`;
  document.getElementById('langSel').onchange = (e) => { setLang(e.target.value); render(); };
  const mb = document.getElementById('menuBtn');
  mb.onclick = () => { const nl = document.getElementById('navLinks'); nl.classList.toggle('open'); mb.setAttribute('aria-expanded', nl.classList.contains('open')); };
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = async () => { await sb.auth.signOut(); go('#/'); };
}

function renderFooter() {
  $footer.innerHTML = `<div class="footer-inner">
    <div class="stack" style="gap:8px"><a class="brand" href="#/" style="color:var(--ink)"><span class="logo"></span>Brightpeer</a><p class="muted">${t('footerTag')}</p></div>
    <div class="footer-links">
      <a href="#/roles">${t('navRoles')}</a><a href="#/companies">${t('navCompanies')}</a><a href="#/research">${t('navResearch')}</a>
      <a href="#/about">${t('navAbout')}</a><a href="#/help">${t('navHelp')}</a>
      <a href="#/legal/terms">${t('terms')}</a><a href="#/legal/privacy">${t('privacy')}</a><a href="#/legal/imprint">${t('imprint')}</a>
    </div>
    <p class="muted small" style="width:100%">© ${new Date().getFullYear()} Brightpeer. ${t('rights')}</p>
  </div>`;
}

// ---------------------------------------------------------------- public pages
function roleCard(r) {
  return `<a class="card card-link" href="#/roles/${esc(r.id)}">
    <span class="chip">${esc(fieldName(r.field))}</span>
    <span style="font-size:1.15rem;font-weight:600;line-height:1.3">${esc(r.title)}</span>
    <span class="muted small">${money(r.rate_min)}–${money(r.rate_max)} ${t('perHour')} · ${t('remote')} · ${esc(r.hours_per_week || '')}</span>
    <span class="rate">${t('apply')} →</span>
  </a>`;
}

async function pageHome() {
  const roles = (await getRoles()).slice(0, 3);
  const steps = (k) => [1, 2, 3].map((i) => `<div class="stack" style="gap:8px"><span class="icon-circle">${i}</span><h3>${t(k + i + 'h')}</h3><p class="muted">${t(k + i + 'p')}</p></div>`).join('');
  return `
  <section class="wrap section stack-lg">
    <p class="badge"><span class="d"></span>${t('badge')}</p>
    <h1 style="max-width:15ch">${t('h1')}</h1>
    <p style="font-size:1.25rem;color:var(--ink2);max-width:40rem">${t('sub')}</p>
    <div class="row"><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a><a class="btn btn-ghost" href="#/companies">${t('hire')}</a></div>
    <div class="grid" style="border-top:1px solid var(--line);padding-top:24px;margin-top:8px">
      <div><p class="stat-v">$40–250 / h</p><p class="muted">${t('s1')}</p></div>
      <div><p class="stat-v">$0</p><p class="muted">${t('s2')}</p></div>
      <div><p class="stat-v">${t('s3v')}</p><p class="muted">${t('s3')}</p></div>
    </div>
  </section>
  <section class="wrap"><div class="dark stack-lg"><h2>${t('howExpertsH')}</h2><div class="grid">${steps('he')}</div></div></section>
  <section class="wrap section stack-lg">
    <div class="row between"><div class="stack" style="gap:6px"><h2>${t('featuredH')}</h2><p class="muted">${t('featuredSub')}</p></div><a href="#/roles" style="font-weight:600">${t('allRoles')} →</a></div>
    <div class="grid">${roles.map(roleCard).join('')}</div>
  </section>
  <section class="wrap"><div class="soft stack-lg">
    <h2>${t('payH')}</h2>
    <div class="grid-sm">${PAY.map(([f, a, b]) => `<div class="card"><p class="muted small">${esc(fieldName(f))}</p><p class="stat-v" style="font-size:1.5rem">$${a}–${b}</p><p class="muted small">${t('perHour')}</p></div>`).join('')}</div>
    <p class="muted small">${t('payNote')}</p>
  </div></section>
  <section class="wrap section"><div class="card stack-lg" style="padding:40px"><h2>${t('howCompaniesH')}</h2><div class="grid">${steps('hc')}</div><a class="btn" style="align-self:flex-start" href="#/companies">${t('hire')}</a></div></section>
  <section class="wrap"><div class="dark row between" style="gap:24px"><div class="stack" style="gap:10px;max-width:640px"><h2>${t('referralH')}</h2><p class="muted">${t('referralP')}</p></div><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></div></section>
  <section class="wrap section stack" style="align-items:center;text-align:center"><h2>${t('ctaH')}</h2><p class="muted">${t('ctaP')}</p><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></section>`;
}

async function pageRoles() {
  const roles = await getRoles();
  return {
    html: `<section class="wrap section stack-lg">
      <div class="stack" style="gap:8px"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('rolesH')}</h1><p class="muted">${t('rolesSub')}</p></div>
      <div class="row"><input id="q" type="search" placeholder="${esc(t('search'))}" style="flex:2 1 260px"><select id="ff" style="flex:1 1 200px"><option value="">${t('allFields')}</option>${fieldOptions()}</select></div>
      <div class="grid" id="roleList"></div>
    </section>`,
    mount() {
      const q = document.getElementById('q'); const ff = document.getElementById('ff'); const list = document.getElementById('roleList');
      const draw = () => {
        const s = q.value.trim().toLowerCase(); const f = ff.value;
        const res = roles.filter((r) => (!f || r.field === f) && (!s || (r.title + ' ' + r.field + ' ' + (r.description || '')).toLowerCase().includes(s)));
        list.innerHTML = res.length ? res.map(roleCard).join('') : `<p class="muted">${t('noRoles')}</p>`;
      };
      q.oninput = draw; ff.onchange = draw; draw();
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

  let action = '';
  let existing = null;
  if (!session) {
    action = `<p class="muted">${t('loginToApply')}</p><div class="row"><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a><a class="btn btn-ghost" href="#/login">${t('login')}</a></div>`;
  } else if (profile?.role !== 'expert') {
    action = `<p class="muted">${t('mustBeExpert')}</p>`;
  } else {
    const { data } = await sb.from('applications').select('id,status').eq('role_id', role.id).eq('expert_id', session.user.id).maybeSingle();
    existing = data;
    action = existing
      ? `<div class="form-msg ok">${t('applied')} ${pill(existing.status)}</div>`
      : `<form id="applyRole" class="stack"><label class="f">${t('applyNote')}<textarea name="note" maxlength="2000"></textarea></label><button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('sendApplication')}</button></form>`;
  }

  return {
    html: `<section class="wrap section narrow stack-lg">
      <a href="#/roles">${t('back')}</a>
      <span class="chip">${esc(fieldName(role.field))}</span>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem)">${esc(role.title)}</h1>
      <div class="grid-sm">
        <div class="card"><p class="muted small">${t('pay')}</p><p class="rate" style="font-size:1.25rem">${money(role.rate_min)}–${money(role.rate_max)} ${t('perHour')}</p></div>
        <div class="card"><p class="muted small">${t('hours')}</p><p style="font-weight:600">${esc(role.hours_per_week || '')}</p></div>
        <div class="card"><p class="muted small">${t('remote')}</p><p style="font-weight:600">🌍</p></div>
      </div>
      <div class="stack"><h3>${t('aboutRole')}</h3><p style="white-space:pre-line">${esc(role.description)}</p></div>
      <div class="stack"><h3>${t('requirements')}</h3><p style="white-space:pre-line">${esc(role.requirements)}</p></div>
      <div class="card stack">${action}</div>
    </section>`,
    mount() {
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

function authForm(kind) {
  // kind: 'expert' | 'company'
  const q = parseHash().query;
  const ref = q.get('ref') || '';
  const google = CONFIG.GOOGLE_LOGIN ? `<button type="button" class="btn btn-ghost" id="googleBtn">${t('orGoogle')}</button><div class="divider">or</div>` : '';
  const expertFields = `
    <h3>${t('stepProfile')}</h3>
    <div class="form-grid">
      <label class="f">${t('field')} *<select name="field" required>${fieldOptions()}</select></label>
      <label class="f">${t('years')} *<input name="years" type="number" min="0" max="60" required></label>
      <label class="f">${t('rate')}<input name="rate" type="number" min="1" max="1000"></label>
      <label class="f">${t('linkedin')}<input name="linkedin" type="url" placeholder="https://"></label>
    </div>
    <label class="f">${t('bio')} *<textarea name="bio" required maxlength="3000"></textarea></label>
    <input type="hidden" name="ref" value="${esc(ref)}">`;
  const companyFields = `
    <div class="form-grid">
      <label class="f">${t('companyName')} *<input name="company_name" required></label>
      <label class="f">${t('website')}<input name="website" type="url" placeholder="https://"></label>
    </div>`;
  return `<form id="signup" class="card stack" style="padding:32px">
    ${google}
    <h3>${t('stepAccount')}</h3>
    <div class="form-grid">
      <label class="f">${kind === 'company' ? t('contactName') : t('fullName')} *<input name="full_name" required autocomplete="name"></label>
      <label class="f">${t('country')} *<input name="country" required autocomplete="country-name"></label>
      <label class="f">${t('email')} *<input name="email" type="email" required autocomplete="email"></label>
      <label class="f">${t('password')} *<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
    </div>
    ${kind === 'company' ? companyFields : expertFields}
    <label class="check"><input type="checkbox" required> <span>${t('agree')} <a href="#/legal/terms">${t('terms')}</a> · <a href="#/legal/privacy">${t('privacy')}</a></span></label>
    <div id="signupMsg"></div>
    <button class="btn btn-accent" type="submit" style="align-self:flex-start">${t('createAccount')}</button>
    <p class="small muted">${t('haveAccount')} <a href="#/login">${t('login')}</a></p>
  </form>`;
}

function mountSignup(kind) {
  const f = document.getElementById('signup');
  const g = document.getElementById('googleBtn');
  if (g) g.onclick = () => sb && sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (!sb) return toast(t('notConfigured'), true);
    const d = formData(f);
    const meta = { role: kind, full_name: d.full_name, country: d.country };
    if (kind === 'expert') Object.assign(meta, { field: d.field, years: d.years, rate: d.rate, linkedin: d.linkedin, bio: d.bio, ref: d.ref });
    else Object.assign(meta, { company_name: d.company_name, website: d.website });
    busy(f, true);
    const { data, error } = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: meta, emailRedirectTo: location.origin + location.pathname } });
    busy(f, false);
    const msg = document.getElementById('signupMsg');
    if (error) { msg.innerHTML = `<div class="form-msg err">${esc(error.message)}</div>`; return; }
    if (data.session) { go('#/dashboard'); return; }
    f.innerHTML = `<div class="form-msg ok">${t('checkEmail')}</div>`;
  };
}

function pageApply() {
  if (session) return { html: '', mount() { go('#/dashboard'); } };
  return {
    html: `<section class="wrap section narrow stack-lg"><div class="stack" style="gap:8px"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('applyH')}</h1><p class="muted">${t('applySub')}</p></div>${authForm('expert')}</section>`,
    mount() { mountSignup('expert'); },
  };
}

function pageCompanySignup() {
  if (session) return { html: '', mount() { go('#/dashboard'); } };
  return {
    html: `<section class="wrap section narrow stack-lg"><h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">${t('companySignupH')}</h1>${authForm('company')}</section>`,
    mount() { mountSignup('company'); },
  };
}

function pageLogin() {
  if (session) return { html: '', mount() { go('#/dashboard'); } };
  const google = CONFIG.GOOGLE_LOGIN ? `<button type="button" class="btn btn-ghost" id="googleBtn">${t('orGoogle')}</button><div class="divider">or</div>` : '';
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
      const g = document.getElementById('googleBtn');
      if (g) g.onclick = () => sb && sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
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
    <div class="grid">${[1, 2, 3].map((i) => `<div class="card stack" style="gap:8px"><span class="icon-circle">${i}</span><h3>${t('cp' + i + 'h')}</h3><p class="muted">${t('cp' + i + 'p')}</p></div>`).join('')}</div>
  </section>
  <section class="wrap"><div class="dark stack-lg"><h2>${t('howCompaniesH')}</h2><div class="grid">${[1, 2, 3].map((i) => `<div class="stack" style="gap:8px"><span class="icon-circle">${i}</span><h3>${t('hc' + i + 'h')}</h3><p class="muted">${t('hc' + i + 'p')}</p></div>`).join('')}</div></div></section>
  <section class="wrap section"><div class="card stack" style="padding:40px"><h2>${t('cpPriceH')}</h2><p class="muted" style="max-width:42rem">${t('cpPriceP')}</p><div class="grid-sm" style="margin-top:12px">${FIELDS.slice(0, 7).map((f) => `<span class="chip">${esc(fieldName(f))}</span>`).join('')}</div><a class="btn" style="align-self:flex-start;margin-top:8px" href="${session ? '#/dashboard' : '#/company-signup'}">${t('hire')}</a></div></section>`;
}

function pageResearch() {
  return `<section class="wrap section narrow prose">
    <h1 style="font-size:clamp(2.2rem,5vw,3.5rem)">Research</h1>
    <p style="font-size:1.15rem;color:var(--ink2)">AI models are only as good as the knowledge they learn from. Brightpeer experts create the high-quality data, evaluations and feedback that help AI systems reason like real professionals.</p>
    <h2>What experts do</h2>
    <ul><li><b>Write expert questions</b> – realistic cases from medicine, law, finance, science and engineering.</li><li><b>Grade AI answers</b> – check accuracy, safety and reasoning step by step.</li><li><b>Improve answers</b> – rewrite weak answers the way a senior professional would.</li><li><b>Build benchmarks</b> – hard test sets that show where models still fail.</li></ul>
    <h2>Why expert data matters</h2>
    <p>General crowd work cannot judge whether a drug interaction is dangerous or a contract clause is enforceable. Only trained professionals can. That is why Brightpeer works exclusively with vetted experts and pays professional rates.</p>
    <h2>Quality first</h2>
    <p>Every expert is reviewed before their first project. Work is double-checked, and feedback flows back to the expert so quality keeps improving.</p>
    <p><a class="btn btn-accent" href="#/apply">${t('applyNow')}</a></p>
  </section>`;
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
  const company = `${esc(C.name)}, ${esc(C.address)}`;
  const tabs = `<div class="row"><a class="btn btn-sm ${which === 'terms' ? '' : 'btn-ghost'}" href="#/legal/terms">${t('terms')}</a><a class="btn btn-sm ${which === 'privacy' ? '' : 'btn-ghost'}" href="#/legal/privacy">${t('privacy')}</a><a class="btn btn-sm ${which === 'imprint' ? '' : 'btn-ghost'}" href="#/legal/imprint">${t('imprint')}</a></div>`;
  const note = `<p class="form-msg err small">Template – please have this text reviewed by a lawyer before launch.</p>`;
  let body = '';
  if (which === 'imprint') {
    body = `<h1 style="font-size:2.5rem">${t('imprint')}</h1>
      <p><b>${esc(C.name)}</b><br>${esc(C.address)}</p>
      <p>Email: <a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p>
      ${C.uid ? `<p>Company ID (UID): ${esc(C.uid)}</p>` : ''}
      <p>Brightpeer is a brand of ${esc(C.name)}.</p>`;
  } else if (which === 'privacy') {
    body = `<h1 style="font-size:2.5rem">${t('privacy')}</h1>${note}
      <p>This privacy policy explains how ${company} ("Brightpeer", "we") processes personal data. We comply with the Swiss Federal Act on Data Protection (FADP/DSG) and, where applicable, the EU General Data Protection Regulation (GDPR).</p>
      <h2>1. Controller</h2><p>${company}, ${esc(C.email)}</p>
      <h2>2. Data we process</h2><ul><li>Account data: name, email, country, password (stored encrypted).</li><li>Profile data: field, experience, CV, LinkedIn, expected rate.</li><li>Work data: applications, contracts, hours, invoices, payouts.</li><li>Payout data: IBAN or PayPal email.</li><li>Technical data needed to run the website (e.g. log data from our hosting providers).</li></ul>
      <h2>3. Purposes</h2><p>To review applications, match experts with projects, record hours, invoice companies and pay experts, and to communicate with you.</p>
      <h2>4. Legal basis</h2><p>Performance of a contract, our legitimate interests and, where required, your consent.</p>
      <h2>5. Service providers</h2><p>We use Supabase (database, login, file storage; EU region) and GitHub Pages (website hosting). Data may be processed in countries outside Switzerland/EU with adequate safeguards (e.g. standard contractual clauses).</p>
      <h2>6. Sharing with companies</h2><p>Companies only see your first name, field and the hours you log on their project.</p>
      <h2>7. Retention</h2><p>We keep your data as long as your account exists and as required by law (e.g. 10 years for accounting records).</p>
      <h2>8. Your rights</h2><p>You can request access, correction, deletion, restriction or a copy of your data, and object to processing. Contact ${esc(C.email)}. You may also complain to the Swiss FDPIC or your local data protection authority.</p>
      <h2>9. Cookies</h2><p>We only use technically necessary storage (to keep you logged in and remember your language). No tracking cookies.</p>`;
  } else {
    body = `<h1 style="font-size:2.5rem">${t('terms')}</h1>${note}
      <p>These terms apply to the use of Brightpeer, operated by ${company}.</p>
      <h2>1. Service</h2><p>Brightpeer connects independent experts with companies. Brightpeer contracts with companies, selects experts for projects, and pays experts for approved hours.</p>
      <h2>2. Experts</h2><ul><li>Experts work as independent contractors, not employees. They are responsible for their own taxes and social security.</li><li>Signing up is free. Information in the profile must be true.</li><li>Hours must be logged honestly. Approved hours are paid weekly, without fees from Brightpeer.</li><li>Confidential information from projects must not be shared.</li></ul>
      <h2>3. Companies</h2><ul><li>Companies pay the agreed rate per approved expert hour. Invoices are due within 14 days.</li><li>Companies may not hire experts introduced by Brightpeer directly within 12 months without written agreement.</li></ul>
      <h2>4. Referral bonus</h2><p>When a referred expert completes their first 10 paid hours, both the referrer and the referred expert receive $100. Abuse leads to exclusion.</p>
      <h2>5. Liability</h2><p>Brightpeer is liable only for intent and gross negligence, as far as permitted by law.</p>
      <h2>6. Termination</h2><p>Either party can close their account at any time. Hours already approved will still be paid.</p>
      <h2>7. Law and jurisdiction</h2><p>Swiss law applies. Place of jurisdiction is the registered office of ${esc(C.name)}.</p>`;
  }
  return `<section class="wrap section prose">${tabs}${body}</section>`;
}

function pageNotFound() {
  return `<section class="wrap section stack" style="align-items:center;text-align:center"><h1 style="font-size:3rem">404</h1><p class="muted">${t('notFound')}</p><a class="btn" href="#/">${t('home')}</a></section>`;
}

function needLogin() {
  return { html: '', mount() { go('#/login'); } };
}

// ---------------------------------------------------------------- expert dashboard
async function expertDashboard() {
  const uid = session.user.id;
  const [ex, apps, cons, ts, pays] = await Promise.all([
    sb.from('experts').select('*').eq('id', uid).maybeSingle(),
    sb.from('applications').select('id,status,created_at,roles(title)').eq('expert_id', uid).order('created_at', { ascending: false }),
    sb.rpc('expert_contracts'),
    sb.from('timesheets').select('*').eq('expert_id', uid).order('week_start', { ascending: false }),
    sb.from('payouts').select('*').eq('expert_id', uid).order('week_start', { ascending: false }),
  ]);
  const e = ex.data || {};
  const contracts = cons.data || [];
  const sheets = ts.data || [];
  const payouts = pays.data || [];
  const st = e.status || 'pending';
  const stKey = { pending: 'stPending', approved: 'stApproved', rejected: 'stRejected' }[st];
  const paidSum = payouts.filter((p) => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0);
  const pendSum = payouts.filter((p) => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0);
  const refLink = `${location.origin}${location.pathname}#/apply?ref=${e.referral_code || ''}`;
  const conTitle = Object.fromEntries(contracts.map((c) => [c.id, c.title]));
  const active = contracts.filter((c) => c.status === 'active');

  return {
    html: `<section class="wrap section stack-lg">
      <div class="row between"><h1 style="font-size:clamp(2rem,4vw,3rem)">${t('welcome')}, ${esc((profile.full_name || '').split(' ')[0])}</h1><span>${t('status')}: ${pill(st)}</span></div>
      <div class="card stack" style="gap:6px"><h3>${t(stKey)}</h3><p class="muted">${t(stKey + 'P')}</p></div>

      <div class="grid">
        <div class="card stack">
          <h3>${t('cvH')}</h3>
          ${e.cv_path ? `<p class="form-msg ok">✓ ${t('cvUploaded')}</p>` : `<p class="form-msg err">${t('cvMissing')}</p>`}
          <label class="f">${t('cvUpload')}<input type="file" id="cvFile" accept="application/pdf"></label>
        </div>
        <div class="card stack">
          <h3>${t('earnings')}</h3>
          <div class="row" style="gap:32px"><div><p class="muted small">${t('totalPaid')}</p><p class="stat-v">${money(paidSum)}</p></div><div><p class="muted small">${t('totalPending')}</p><p class="stat-v">${money(pendSum)}</p></div></div>
        </div>
        <div class="card stack">
          <h3>${t('referralLink')}</h3>
          <p class="muted small">${t('referralH')}</p>
          <div class="row" style="flex-wrap:nowrap"><input id="refLink" readonly value="${esc(refLink)}"><button class="btn btn-sm" id="copyRef">${t('copy')}</button></div>
        </div>
      </div>

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
          <label class="f">${t('payoutDetails')}<textarea name="payout_details" style="min-height:80px">${esc(e.payout_details || '')}</textarea></label>
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
          </div>
          <label class="f">${t('bio')}<textarea name="bio">${esc(e.bio || '')}</textarea></label>
          <button class="btn" type="submit" style="align-self:flex-start">${t('save')}</button>
        </form>
      </div>
    </section>`,
    mount() {
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
        toast(t('cvUploaded')); render();
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
        const r2 = await sb.from('experts').update({ field: d.field, years_experience: d.years_experience ? Number(d.years_experience) : null, rate_expectation: d.rate_expectation ? Number(d.rate_expectation) : null, linkedin: d.linkedin, bio: d.bio }).eq('id', uid);
        busy(prf, false); if (r1.error || r2.error) return fail(r1.error || r2.error);
        await loadProfile(); toast(t('saved'));
      };
    },
  };
}

// ---------------------------------------------------------------- company dashboard
async function companyDashboard() {
  const uid = session.user.id;
  const [co, reqs, cons, ts, inv] = await Promise.all([
    sb.from('companies').select('*').eq('id', uid).maybeSingle(),
    sb.from('requests').select('*').eq('company_id', uid).order('created_at', { ascending: false }),
    sb.rpc('company_contracts'),
    sb.rpc('company_timesheets'),
    sb.from('invoices').select('*').eq('company_id', uid).order('week_start', { ascending: false }),
  ]);
  const c = co.data || {};
  const sheets = ts.data || [];
  const B = CONFIG.BANK;
  const toApprove = sheets.filter((s) => s.status === 'submitted');

  return {
    html: `<section class="wrap section stack-lg">
      <h1 style="font-size:clamp(2rem,4vw,3rem)">${t('welcome')}, ${esc(c.company_name || profile.full_name || '')}</h1>

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

      <div class="stack"><h2 style="font-size:1.6rem">${t('invoicesH')}</h2>
        ${table([t('weekStart'), t('hoursWorked'), t('amount'), t('status'), ''], (inv.data || []).map((i) => [dateStr(i.week_start), esc(i.hours), money(i.amount), pill(i.status),
          i.status === 'open' ? (i.payment_link ? `<a class="btn btn-accent btn-sm" href="${esc(i.payment_link)}" target="_blank" rel="noopener">${t('payNow')}</a>` : `<details><summary class="link">${t('payByBank')}</summary><p class="small" style="margin-top:6px">${esc(B.holder)}<br>IBAN: ${esc(B.iban)}<br>BIC: ${esc(B.bic)}<br>${esc(B.bank)}<br>Ref: INV-${esc(i.id.slice(0, 8).toUpperCase())}</p></details>`) : '']))}
      </div>
    </section>`,
    mount() {
      const f = document.getElementById('reqF');
      f.onsubmit = async (ev) => {
        ev.preventDefault(); const d = formData(f); busy(f, true);
        const { error } = await sb.from('requests').insert({ company_id: uid, field: d.field, experts_needed: Number(d.experts_needed) || 1, hours_per_week: d.hours_per_week ? Number(d.hours_per_week) : null, budget: d.budget || null, description: d.description });
        busy(f, false); if (error) return fail(error);
        toast(t('requestSent')); render();
      };
      $app.querySelectorAll('[data-ts]').forEach((b) => { b.onclick = async () => {
        b.disabled = true;
        const { error } = await sb.rpc('review_timesheet', { p_id: b.dataset.ts, p_status: b.dataset.st });
        if (error) return fail(error); render();
      }; });
    },
  };
}

async function pageDashboard() {
  if (!sb) return `<section class="wrap section"><p class="banner">${t('notConfigured')}</p></section>`;
  if (!session) return needLogin();
  if (!profile) await loadProfile();
  if (!profile) return `<section class="wrap section"><p class="muted">${t('error')}</p></section>`;
  if (profile.role === 'admin') return { html: '', mount() { go('#/admin'); } };
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
  const TABS = ['overview', 'experts', 'roles', 'requests', 'contracts', 'hoursTab', 'invoices', 'payouts'];
  const tabBar = `<div class="tabs" role="tablist">${TABS.map((k) => `<button class="tab ${adminTab === k ? 'active' : ''}" role="tab" data-tab="${k}">${t(k)}</button>`).join('')}</div>`;
  const view = await ADMIN[adminTab]();
  return {
    html: `<section class="wrap section stack-lg"><h1 style="font-size:clamp(2rem,4vw,3rem)">${t('admin')}</h1>${tabBar}<div id="adminView">${view.html}</div></section>`,
    mount() {
      $app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { adminTab = b.dataset.tab; go('#/admin?tab=' + adminTab); }; });
      view.mount && view.mount();
    },
  };
}

const ADMIN = {
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
    const { data, error } = await qy;
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const filt = ['pending', 'approved', 'rejected', 'all'].map((k) => `<a class="btn btn-sm ${filter === k ? '' : 'btn-ghost'}" href="#/admin?tab=experts&st=${k}">${k}</a>`).join('');
    return {
      html: `<div class="stack"><div class="row">${filt}</div>${table(['Name', 'Email', t('country'), t('field'), t('years'), 'Rate', 'LinkedIn', 'CV', 'Ref', t('payoutSettings'), t('status'), ''], (data || []).map((e) => [
        `<details><summary class="link">${esc(e.profiles?.full_name || '')}</summary><p class="small" style="max-width:320px;white-space:pre-line;margin-top:6px">${esc(e.bio || '')}</p></details>`,
        `<a href="mailto:${esc(e.profiles?.email)}">${esc(e.profiles?.email || '')}</a>`, esc(e.profiles?.country || ''), esc(fieldName(e.field)), esc(e.years_experience ?? ''),
        e.rate_expectation ? money(e.rate_expectation) : '', e.linkedin ? `<a href="${esc(e.linkedin)}" target="_blank" rel="noopener">Link</a>` : '',
        e.cv_path ? `<button class="link" data-cv="${esc(e.cv_path)}">PDF</button>` : '–', esc(e.referred_by || ''),
        `<span class="small">${esc(e.payout_method || '')} ${esc(e.payout_details || '')}</span>`, pill(e.status),
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
    const { data, error } = await sb.from('requests').select('*, companies(company_name, website, profiles(full_name,email))').order('created_at', { ascending: false });
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const opts = (cur) => ['new', 'in_progress', 'done', 'declined'].map((s) => `<option value="${s}" ${s === cur ? 'selected' : ''}>${s}</option>`).join('');
    return {
      html: table(['Company', 'Contact', t('field'), t('expertsNeeded'), t('hoursPerWeek'), t('budget'), t('description'), t('status')], (data || []).map((r) => [
        esc(r.companies?.company_name || ''), `${esc(r.companies?.profiles?.full_name || '')}<br><a href="mailto:${esc(r.companies?.profiles?.email)}">${esc(r.companies?.profiles?.email || '')}</a>`,
        esc(fieldName(r.field)), esc(r.experts_needed), esc(r.hours_per_week ?? ''), esc(r.budget || ''), `<span class="small" style="white-space:pre-line">${esc(r.description || '')}</span>`,
        `<select data-req="${r.id}" style="min-height:36px;padding:4px 8px">${opts(r.status)}</select>`,
      ])),
      mount() {
        $app.querySelectorAll('[data-req]').forEach((s) => { s.onchange = async () => { const { error: er } = await sb.from('requests').update({ status: s.value }).eq('id', s.dataset.req); if (er) return fail(er); toast(t('saved')); }; });
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
    return {
      html: `<div class="stack-lg">
        <form id="conF" class="card stack"><h3>New contract</h3>
          ${(exps || []).length && (cos || []).length ? '' : '<p class="form-msg err small">You need at least one approved expert and one company.</p>'}
          <div class="form-grid">
            <label class="f">Expert *<select name="expert_id" required>${(exps || []).map((e) => `<option value="${e.id}">${esc(e.profiles?.full_name || '')} – ${esc(fieldName(e.field))}</option>`).join('')}</select></label>
            <label class="f">Company *<select name="company_id" required>${(cos || []).map((c) => `<option value="${c.id}">${esc(c.company_name || c.id)}</option>`).join('')}</select></label>
            <label class="f">Role<select name="role_id"><option value="">–</option>${(roles || []).map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}</select></label>
            <label class="f">Title (optional)<input name="title"></label>
            <label class="f">Expert pay ($/h) *<input name="expert_rate" id="erate" type="number" min="1" step="0.01" required></label>
            <label class="f">Company price ($/h) *<input name="client_rate" id="crate" type="number" min="1" step="0.01" required></label>
          </div>
          <p class="muted small">Tip: company price = expert pay + 30 % is filled in automatically.</p>
          <button class="btn btn-accent" type="submit" style="align-self:flex-start">Create contract</button>
        </form>
        <p class="muted">Margin per hour across active contracts: <b>${money(margin)}</b></p>
        ${table(['Expert', 'Company', 'Role', 'Expert pay', 'Company price', 'Margin', t('status'), ''], (cons || []).map((c) => [
          esc(c.experts?.profiles?.full_name || ''), esc(c.companies?.company_name || ''), esc(c.title || c.roles?.title || ''), money(c.expert_rate), money(c.client_rate),
          money(Number(c.client_rate) - Number(c.expert_rate)), pill(c.status),
          c.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-endcon="${c.id}">End</button>` : '',
        ]))}
      </div>`,
      mount() {
        const er = document.getElementById('erate'); const cr = document.getElementById('crate');
        er.oninput = () => { if (er.value) cr.value = (Number(er.value) * 1.3).toFixed(2); };
        const f = document.getElementById('conF');
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const d = formData(f); busy(f, true);
          const { error } = await sb.from('contracts').insert({ expert_id: d.expert_id, company_id: d.company_id, role_id: d.role_id || null, title: d.title || null, expert_rate: Number(d.expert_rate), client_rate: Number(d.client_rate) });
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
    const { data, error } = await sb.from('payouts').select('*, experts(payout_method, payout_details, profiles(full_name,email))').order('week_start', { ascending: false });
    if (error) return { html: `<p class="form-msg err">${esc(error.message)}</p>` };
    const open = (data || []).filter((p) => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0);
    return {
      html: `<div class="stack-lg">
        <form id="genPay" class="card row"><label class="f" style="flex:1 1 200px">${t('weekStart')}<input type="date" name="week" value="${lastMonday()}" required></label><button class="btn btn-accent" type="submit" style="align-self:flex-end">Create payouts from approved hours</button></form>
        <p class="muted">Open payouts: <b>${money(open)}</b> – pay them via Wise or PayPal, then click “Mark paid”.</p>
        ${table(['Expert', t('weekStart'), t('hoursWorked'), t('amount'), t('payoutMethod'), t('payoutDetails'), t('status'), ''], (data || []).map((p) => [
          `${esc(p.experts?.profiles?.full_name || '')}<br><span class="small muted">${esc(p.experts?.profiles?.email || '')}</span>`, dateStr(p.week_start), esc(p.hours), money(p.amount),
          esc(p.experts?.payout_method || '–'), `<span class="small">${esc(p.experts?.payout_details || '–')}</span>`, pill(p.status),
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

// ---------------------------------------------------------------- router
let renderSeq = 0;
async function render() {
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
      case 'research': page = pageResearch(); break;
      case 'about': page = pageAbout(); break;
      case 'help': page = pageHelp(); break;
      case 'legal': page = pageLegal(parts[1] || 'terms'); break;
      case 'dashboard': page = await pageDashboard(); break;
      case 'admin': page = await pageAdmin(); break;
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
  if (page.mount) page.mount();
  window.scrollTo(0, 0);
  document.getElementById('loader').classList.add('hide');
}

window.addEventListener('hashchange', render);

async function init() {
  if (configured) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const qs = new URLSearchParams(location.search);
      const hadCode = qs.has('code');
      const isReset = qs.get('reset') === '1';
      sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
      const { data } = await sb.auth.getSession();
      session = data.session;
      await loadProfile();
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
