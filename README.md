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

## Optional
- **Google-Login:** Supabase → Authentication → Providers → Google einrichten, dann in `js/config.js` `GOOGLE_LOGIN: true`.
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
