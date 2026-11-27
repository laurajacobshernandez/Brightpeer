# Brightpeer

Expert marketplace – experts apply, companies send requests, Brightpeer matches, invoices companies and pays experts weekly.

Static website (no build step) on **GitHub Pages** + **Supabase** (login, database, CV storage).

---

## Einrichtung (einmalig, ca. 15 Minuten)

### 1. Supabase-Datenbank anlegen
1. Supabase → dein Projekt → **SQL Editor** → **New query**.
2. Den ganzen Inhalt von [`supabase/schema.sql`](supabase/schema.sql) hineinkopieren → **Run**.
   Danach gibt es alle Tabellen, Sicherheitsregeln, den Speicher für Lebensläufe und 7 Beispiel-Stellen.
3. Danach dasselbe mit [`supabase/tests.sql`](supabase/tests.sql) (Fachtests für Software, Medizin, Recht und Übersetzung DE).
4. Danach dasselbe mit [`supabase/privacy.sql`](supabase/privacy.sql) (verschlüsselte Bankdaten, automatische Löschung nach 24 Monaten).

### 2. Supabase mit der Website verbinden
1. Supabase → **Project Settings → API**: *Project URL* und *anon public key* kopieren.
2. In [`js/config.js`](js/config.js) bei `SUPABASE_URL` und `SUPABASE_ANON_KEY` eintragen.
   (Der anon key darf öffentlich sein. Den **service_role**-Key nie eintragen!)
3. Dort auch Firmenangaben und Bankverbindung ausfüllen (für Impressum und Rechnungen).

### 3. Login-Links richtig einstellen
Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://laurajacobshernandez.github.io/Brightpeer/`
- **Redirect URLs:** dieselbe Adresse hinzufügen (später auch deine eigene Domain).

### 4. Dich selbst zur Admin machen
1. Auf der Website mit deiner E-Mail ein Konto erstellen (als Expert:in) und die E-Mail bestätigen.
2. Supabase → SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'DEINE@EMAIL.CH';
   ```
3. Neu anmelden → oben erscheint **Admin**.

### 5. GitHub Pages
Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch **main**, Ordner **/ (root)** → Save.
Die Seite ist dann unter `https://laurajacobshernandez.github.io/Brightpeer/` erreichbar.
Eigene Domain: im selben Menü unter *Custom domain*.

---

## So läuft das Geschäft auf der Seite

| Wer | Was |
|---|---|
| **Expert:in** | bewirbt sich, lädt Lebenslauf hoch, bewirbt sich auf Stellen, trägt Stunden pro Woche ein, hinterlegt IBAN/PayPal, teilt Empfehlungslink |
| **Firma** | erstellt Firmenkonto, sendet Anfrage, sieht zugeteilte Fachleute (nur Vorname), bestätigt Stunden, sieht Rechnungen |
| **Admin (du)** | prüft Bewerbungen + Lebensläufe, erstellt Stellen, erstellt Verträge (Firmenpreis = Lohn + 30 % automatisch), bestätigt Stunden, erstellt Rechnungen und Auszahlungen aus bestätigten Stunden, markiert bezahlt |

Firmen sehen nie den Lohn der Fachleute, Fachleute nie den Firmenpreis.

**Zahlungen:** Für eine Rechnung in Stripe einen *Payment Link* erstellen und im Admin bei der Rechnung einfügen → die Firma sieht „Jetzt bezahlen“. Ohne Link sieht sie deine Bankverbindung.
**Auszahlungen:** im Admin unter *Auszahlungen* – per Wise oder PayPal überweisen, dann „Mark paid“.

## Neu (25.11.2026)
- **Rechnungen/Quittungen:** jede Vorauszahlung hat eine Nummer (BP-1001 …) und eine Seite `#/invoice/<id>`, die Firma und Admin als PDF speichern (Knopf „Download PDF / Print“).
- **Besucher:** Admin → *Visitors* – anonym gezählt, ohne Cookies, ohne IP; eigene Admin-Besuche zählen nicht.
- **Profil-Vorschläge:** Admin → *Requests* → Fachperson vorschlagen; die Firma sieht ein anonymes Profil und antwortet „Interested“ / „Not a fit“.
- **Client Terms:** Firmen müssen die Client Terms akzeptieren (bei der Anmeldung oder im Dashboard), bevor sie Anfragen senden oder Guthaben aufladen.
- **Empfehlungen:** Admin → *Referrals* – wer sich über welchen Link angemeldet hat, bezahlte Stunden, Bonus fällig/bezahlt.
- Datenbank: `supabase/features-2026-11-25.sql` (schon eingespielt). Die Website wird aus dem Zweig **gh-pages** veröffentlicht – Änderungen immer auch dorthin pushen.

## Automatik (25.11.2026)
Admin → *Automation*: Vorschläge für neue Anfragen (an), automatische Freigabe von Fachleuten (aus, Schwelle Test % / Interview-Sterne), Stunden nach 7 Tagen automatisch bestätigt (an), Auszahlungen jeden Morgen vorbereitet (an). Läuft täglich ca. 06:00 (pg_cron `brightpeer-automation`). Admin → *Accounting*: Buchhaltung aus bezahlten Vorauszahlungen, Auszahlungen, Boni und eigenen Ausgaben, CSV-Export. Datenbank: `supabase/automation-2026-11-25.sql`.

## Neu (26.11.2026) – So wird gearbeitet
Die Fachleute arbeiten in den Tools der Firma, auf Brightpeer werden nur die Stunden erfasst und bestätigt.
- **Anleitung + Zugang:** Firma → *Meine Fachleute* → pro Auftrag Anleitung und Link (https). Fachperson sieht nach Annahme die Karte „So arbeitest du an diesem Projekt“. Admin → *Contracts* → „Work info“.
- **Streitfälle:** Ablehnen von Stunden nur mit Grund. Die Fachperson sieht den Grund, korrigiert und sendet neu (die 7-Tage-Frist beginnt neu). Admin → *Hours* → „Approve anyway“.
- **Abrechnungen:** pro Auszahlung eine Seite `#/statement/<id>` (PDF) für Fachperson und Admin.
- **Steuerangaben:** Fachleute tragen Steuerland, Status, Firmenname, MWST-/Steuernummer und Adresse ein und bestätigen, dass sie selbst versteuern. Sichtbar im Admin (*Experts*, *Payouts*), Buchhaltung nutzt das Steuerland.
- Datenbank: `supabase/work-access-2026-11-26.sql` und `supabase/disputes-tax-2026-11-26.sql` (schon eingespielt).

## Neu (26.11.2026) – Dokumente der Fachleute
Neben dem Lebenslauf können Fachleute im Dashboard unter *Dokumente* hochladen: Diplome, Zertifikate, Ausweis, Profilfoto, Arbeitsproben/Portfolio und Steuerformulare (PDF/JPG/PNG/WebP, je max. 10 MB). Ausweis und Foto ersetzen jeweils das alte. Nur die Fachperson und der Admin sehen die Dateien (Admin → *Experts* → Spalte *Documents*), Firmen nie. Gelöscht wird nach 24 Monaten wie beim Lebenslauf. Datenbank: `supabase/documents-2026-11-26.sql` (schon eingespielt).

## Neu (27.11.2026) – wie bei Mercor
- **Qualität:** Firmen bewerten jede Arbeitswoche mit 1–5 Sternen (+ kurzes Feedback). Fachleute sehen die Bewertung, Admin sieht den Durchschnitt pro Fachperson.
- **Hilfe-Assistent:** runder „?“-Knopf unten rechts für angemeldete Fachleute und Firmen; antwortet mit KI nur aus den Brightpeer-Fakten (Edge Function `help-assistant`, max. 30 Fragen pro Person und Tag, nutzt den Secret `ANTHROPIC_API_KEY`).
- **Ausweisprüfung:** Fachleute laden Ausweis + Selfie mit Ausweis hoch → Status „In Prüfung“; Admin → Experts → Profil → „Verify ID“ oder „Ask to redo“ (mit Grund). Neuer Punkt in der To-do-Liste.
- **Hintergrundprüfung:** Fachleute geben im Dashboard ihre Zustimmung; die Prüfung macht ein externer Anbieter (z. B. Certn), das Ergebnis trägt die Admin im Profil ein.
- **Zeiterfassung:** Start/Stopp im Dashboard; beim Stoppen wird die Zeit (auf 15 Min. gerundet) zu den Stunden der Woche addiert.
- **Slack:** das Link-Feld bei „Work info“ ist der Slack-Kanal des Projekts.
- Datenbank: `supabase/mercor-gaps-2026-11-27.sql` (schon eingespielt).

## Optional
- **Anmelden mit Google und Microsoft:** Die Knöpfe erscheinen von selbst, sobald der Anbieter in Supabase eingeschaltet ist (vorher sieht man nur E-Mail + Passwort). Rückleitungs-Adresse für beide: `https://wlslnfgfbcanfwlbxaap.supabase.co/auth/v1/callback`.
  - **Google:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials → OAuth client ID* → Typ *Web application* → bei *Authorized redirect URIs* die Rückleitungs-Adresse eintragen → Client-ID und Client-Secret kopieren → Supabase → Authentication → Providers → **Google** → einschalten, beide Werte einfügen → Save. (Vorher in der Console den *OAuth consent screen* mit App-Name „Brightpeer“ ausfüllen und auf *In production* stellen.)
  - **Microsoft:** [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) → *New registration* → Name „Brightpeer“, Kontotyp *Accounts in any organizational directory and personal Microsoft accounts* → Redirect URI (Web) = Rückleitungs-Adresse → Register. Dann *Certificates & secrets → New client secret* → den **Value** kopieren. Supabase → Authentication → Providers → **Azure** → einschalten, *Application (client) ID* und Secret-Value einfügen, *Azure Tenant URL* leer lassen → Save.
  - Firmen, die sich mit Google/Microsoft registrieren, geben zuerst den Firmennamen ein; das Konto wird danach automatisch ein Firmenkonto (`supabase/oauth.sql`, schon eingespielt).
- **Eigene E-Mails (Absender Brightpeer):** Supabase → Authentication → SMTP (z. B. mit Resend).
- **Rechtstexte** unter `#/legal/...` sind Vorlagen – bitte von einer Fachperson prüfen lassen.

## Dateien
```
index.html          Grundgerüst
css/style.css       Design
js/config.js        Einstellungen (Supabase, Firma, Bank)
js/i18n.js          Texte in EN / DE / FR / IT / ES (Sprache automatisch)
js/app.js           alle Seiten, Dashboards und Admin
supabase/schema.sql Datenbank
```
