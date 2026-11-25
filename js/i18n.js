// Brightpeer – translations. Language is picked automatically from the browser,
// can be changed in the header, and falls back to English for any missing text.

export const LANGS = { en: 'English', de: 'Deutsch', fr: 'Français', it: 'Italiano', es: 'Español' };

const en = {
  anyPay: 'Any pay', sortNew: 'Newest first', sortPay: 'Highest pay', rolesCount: '{n} open roles', applyOneStep: 'Create your expert account – your application for this role is sent automatically.', nextSteps: 'Next steps', applyOneClick: 'Apply now', addNote: 'Add a note (optional)', responsibilities: 'What you will do', skillsH: 'Skills', howApplyH: 'How it works', howApply1: 'Apply and upload your CV – it fills in your profile.', howApply2: 'Do the short interview (text or voice, about 15 minutes).', howApply3: 'We review your profile and send you an offer.', howApply4: 'Accept the offer online, log your hours and get paid every week.', location: 'Location', paidH: 'Payment', weekly: 'Weekly', similarRoles: 'Similar roles', cvAutoL: 'Upload your CV (PDF) – we fill in your profile', cvAutoP: 'Optional. Your CV is read in your browser; please check the filled fields.', cvReading: 'Reading your CV…', cvFilled: 'Profile filled from your CV – please check.', cvNotRead: 'We could not read details from this CV – please fill in the fields.', cvFilledSave: 'Profile filled from your CV – please check and save.', headlineL: 'Headline (e.g. Senior Software Engineer)', skillsL: 'Skills (comma separated)', ivH: 'Your interview', ivP: 'A short interview helps us match you with the right roles – like a first conversation, but on your own time.', ivRule1: '{n} questions, about 15 minutes.', ivRule2: 'Answer each question in writing or by voice (max. 3 minutes).', ivRule3: 'Your answers are saved after every question – you can continue later.', ivRule4: 'Please answer on your own, without AI tools.', ivChangeField: 'Change field in your profile', ivStart: 'Start interview', ivQuestion: 'Question', ivType: 'Your answer', ivOrVoice: 'Or answer by voice', ivMax3: 'max. 3 minutes', ivRecord: 'Record', ivRecordAgain: 'Record again', ivStop: 'Stop', ivNoMic: 'Microphone not available – please answer in writing.', ivEmpty: 'Please write or record an answer.', ivNext: 'Save and next', ivSubmit: 'Submit interview', ivDoneH: 'Interview submitted', ivDoneP: 'Thank you! We review your answers and get back to you.', interviewsTab: 'Interviews', ivNone: 'No interviews yet.', ivAnswers: 'Answers', ivPlay: 'Play voice answer', ivScore: 'Score', ivReviewed: 'Save as reviewed', stOffered: 'Offer', stReviewed: 'Reviewed', stShortlisted: 'Shortlisted', ns1: 'Complete your profile', ns2: 'Upload your CV', ns3: 'Do your interview', ns3c: 'Finish your interview', ns4: 'Add your payout details', ns5: 'Apply for a role', offerNew: 'New offer', startDate: 'Start date', offerAgree: 'I accept the offer and the', offerSign: 'Type your full name to sign', offerAccept: 'Accept offer', offerDecline: 'Decline', offerAccepted: 'Offer accepted – welcome on board!', offerDeclineQ: 'Decline this offer?', offerNoteL: 'Message to the expert (optional)', offerAdminP: 'The expert sees the offer in their dashboard and accepts it online. Hours can be logged once it is accepted.', offerSend: 'Send offer', offerNewAdmin: 'New offer',
  fExperts: 'Experts', fCompanies: 'Companies', fCompany: 'Company', fHelpCenter: 'Help center', fCompanyAccount: 'Create company account', fContact: 'Contact', 
  fvLabel: 'How Brightpeer works (video)', fvClose: 'Close video', fvSound: 'Sound on/off',
  payoutEncrypted: 'Your payout details are stored encrypted.', testsTab: 'Tests', testsH: 'Skill tests', testsP: 'Take the short test for your field. It helps us match you faster. You can take each test once.',
  testStart: 'Start test', testContinue: 'Continue test', testYourField: 'Your field', testQuestion: 'Question',
  testRule1: 'You have {m} minutes. The timer keeps running if you leave the page.', testRule2: 'You can take this test only once.',
  testRule3: 'When the time is up, your answers are sent automatically.', testRule4: 'Please answer on your own, without AI tools or help from others.',
  testSubmit: 'Submit answers', testSent: 'Thank you! Your answers have been sent.', testTimeUp: 'Time is up – your answers have been sent.',
  testDoneH: 'Test submitted', testDoneP: 'Thank you. We review your answers and let you know by email.',
  stPassed: 'Passed', stFailed: 'Not passed', testNone: 'No tests taken yet.', testCorrect: 'correct', testLate: 'late',
  testBelow: 'below', testAnswers: 'Show answers', testPass: 'Passed', testFail: 'Not passed', testReset: 'Allow new attempt',
  // nav
  navRoles: 'Find work', navCompanies: 'For companies', navResearch: 'Research', navAbout: 'Company', navHelp: 'Help',
  login: 'Log in', logout: 'Log out', dashboard: 'Dashboard', admin: 'Admin', applyNow: 'Apply as expert', hire: 'Hire experts',
  language: 'Language',
  // home
  badge: 'Remote work for experts, worldwide',
  h1: 'Get paid for your expertise.',
  sub: 'Brightpeer connects doctors, lawyers, engineers, scientists and other professionals with companies that need expert knowledge – flexible, remote and paid weekly.',
  s1: 'Hourly pay, depending on field', s2: 'To sign up – always free', s3v: 'Weekly', s3: 'Payouts with no fees (bank or PayPal)',
  howExpertsH: 'How it works for experts',
  he1h: 'Apply in 10 minutes', he1p: 'Create your profile, upload your CV and tell us about your expertise.',
  he2h: 'Get matched', he2p: 'We review your profile and match you with paid projects that fit your field.',
  he3h: 'Work remotely, get paid weekly', he3p: 'Log your hours. We pay you every week – no fees, by bank or PayPal.',
  howCompaniesH: 'How it works for companies',
  hc1h: 'Tell us what you need', hc1p: 'Describe the expertise, the hours and your budget.',
  hc2h: 'We pick the experts', hc2p: 'We select vetted professionals and handle contracts and payments.',
  hc3h: 'Prepay, then approve hours', hc3p: 'You top up your balance in advance. Approved hours are paid from it every week.',
  featuredH: 'Open roles', featuredSub: 'Remote, flexible, paid by the hour.', allRoles: 'See all roles',
  payH: 'What experts earn', payNote: 'Typical hourly pay. The exact rate is shown on each role.',
  referralH: 'Invite a colleague – you both get $100',
  referralP: 'Share your personal link. When your colleague completes their first 10 paid hours, you both receive a $100 bonus.',
  ctaH: 'Apply in 10 minutes. It’s free.', ctaP: 'No fees and no minimum hours. You decide how much you work.',
  // fields
  fMedicine: 'Medicine', fLaw: 'Law', fSoftware: 'Software', fSTEM: 'Chemistry & Math', fPharmacy: 'Pharmacy', fAccounting: 'Accounting', fTranslation: 'Translation (DE)', fOther: 'Other',
  // roles
  rolesH: 'Open roles', rolesSub: 'Find paid, remote projects in your field.', search: 'Search roles…', allFields: 'All fields',
  perHour: '/ h', remote: 'Remote', apply: 'Apply', viewRole: 'View role', noRoles: 'No open roles match your search right now.',
  aboutRole: 'About the role', requirements: 'Requirements', pay: 'Pay', hours: 'Hours', back: '← Back',
  applied: 'You applied for this role.', applyNote: 'Short note (optional)', sendApplication: 'Send application',
  loginToApply: 'Create a free account to apply.', mustBeExpert: 'Only expert accounts can apply for roles.',
  // apply
  applyH: 'Apply as an expert', applySub: 'Free, takes about 10 minutes. We review every profile personally.',
  stepAccount: 'Your account', stepProfile: 'Your expertise',
  email: 'Email', password: 'Password (min. 8 characters)', fullName: 'Full name', country: 'Country',
  field: 'Field', years: 'Years of experience', linkedin: 'LinkedIn or website (optional)', rate: 'Expected hourly rate in USD (optional)',
  bio: 'Tell us briefly about your experience', agree: 'I agree to the Terms and the Privacy Policy.',
  createAccount: 'Create account', haveAccount: 'Already have an account?', orGoogle: 'Continue with Google', orMicrosoft: 'Continue with Microsoft', or: 'or', oauthCompanyName: 'Please enter your company name first.', oauthSoon: 'Coming soon – please use e-mail and password for now.',
  checkEmail: 'Almost done! Please check your email and click the confirmation link. Then log in to upload your CV.',
  // auth
  loginH: 'Log in', forgot: 'Forgot password?', noAccount: 'No account yet?', resetH: 'Reset password',
  sendReset: 'Send reset link', resetSent: 'If an account exists, we sent you a link to reset your password.',
  newPassword: 'New password', savePassword: 'Save password', passwordSaved: 'Password saved.',
  // company
  companiesH: 'Expert knowledge, on demand.', companiesSub: 'Tell us what you need. We find vetted professionals, handle contracts and pay them – you simply prepay your balance and approve the hours.',
  cp1h: 'Vetted experts', cp1p: 'Every expert is reviewed: CV, experience and an interview.',
  cp2h: 'Fast start', cp2p: 'Most projects start within a few days.',
  cp3h: 'No admin work', cp3p: 'We handle contracts, time tracking and payouts worldwide.',
  cpPriceH: 'Pricing', cpPriceP: 'You pay per approved expert hour, by prepayment: top up your balance, and approved hours are deducted every week. We send you a clear quote for every project – no setup fees, no long-term commitment, unused balance refunded on request.',
  companySignupH: 'Create a company account', companyName: 'Company name', website: 'Website (optional)', contactName: 'Your name',
  // dashboard (expert)
  welcome: 'Welcome', status: 'Status', stPending: 'In review', stApproved: 'Approved', stRejected: 'Not approved',
  stPendingP: 'We are reviewing your profile. This usually takes a few days.',
  stApprovedP: 'You are approved. Apply for roles and we will match you with projects.',
  stRejectedP: 'Unfortunately we cannot offer you projects right now. You can update your profile and we will look again.',
  cvH: 'Your CV', cvUpload: 'Upload CV (PDF, max. 10 MB)', cvUploaded: 'CV uploaded', cvMissing: 'Please upload your CV so we can review your profile.',
  myApps: 'My applications', myContracts: 'My projects', logHours: 'Log hours', weekStart: 'Week (Monday)', hoursWorked: 'Hours', note: 'Note (optional)', submit: 'Submit',
  myHours: 'My hours', earnings: 'Earnings', payoutsH: 'Payouts', payoutSettings: 'Payout settings', payoutMethod: 'Method', bank: 'Bank transfer (IBAN)', paypal: 'PayPal',
  payoutDetails: 'IBAN + account holder, or PayPal email', save: 'Save', saved: 'Saved.',
  referralLink: 'Your referral link', copy: 'Copy', copied: 'Copied!',
  profileH: 'Profile', none: 'Nothing here yet.', delete: 'Delete', paid: 'Paid', pending: 'Pending', open: 'Open',
  submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected', active: 'Active', ended: 'Ended',
  totalPaid: 'Paid out', totalPending: 'Upcoming',
  // dashboard (company)
  newRequest: 'New request', expertsNeeded: 'Number of experts', hoursPerWeek: 'Hours per week (each)', budget: 'Budget (optional)', description: 'What do you need?',
  sendRequest: 'Send request', requestSent: 'Thank you! We will get back to you within 1–2 business days.',
  myRequests: 'My requests', myExperts: 'My experts', approveHours: 'Hours to approve', approve: 'Approve', reject: 'Reject',
  invoicesH: 'Invoices', amount: 'Amount', payNow: 'Pay now', payByBank: 'Pay by bank transfer',
  stNew: 'New', stInProgress: 'In progress', stDone: 'Done', stDeclined: 'Declined',
  // admin
  overview: 'Overview', experts: 'Experts', roles: 'Roles', requests: 'Requests', contracts: 'Contracts', hoursTab: 'Hours', invoices: 'Invoices', payouts: 'Payouts',
  // misc
  loading: 'Loading…', error: 'Something went wrong', notConfigured: 'Setup needed: connect Supabase in js/config.js to enable accounts. Until then, the site shows example content.',
  footerTag: 'Expert work, made simple.', terms: 'Terms', clientTerms: 'Client terms', cookies: 'Cookies', privacy: 'Privacy', imprint: 'Imprint', rights: 'All rights reserved.',
  notFound: 'Page not found.', home: 'Home', required: 'Please fill in all required fields.',
};

const de = {
  anyPay: 'Jeder Lohn', sortNew: 'Neueste zuerst', sortPay: 'Höchster Lohn', rolesCount: '{n} offene Stellen', applyOneStep: 'Erstelle dein Konto als Fachperson – deine Bewerbung für diese Stelle wird automatisch gesendet.', nextSteps: 'Nächste Schritte', applyOneClick: 'Jetzt bewerben', addNote: 'Notiz hinzufügen (optional)', responsibilities: 'Deine Aufgaben', skillsH: 'Fähigkeiten', howApplyH: 'So läuft es ab', howApply1: 'Bewirb dich und lade deinen Lebenslauf hoch – er füllt dein Profil aus.', howApply2: 'Mach das kurze Interview (schriftlich oder per Sprache, ca. 15 Minuten).', howApply3: 'Wir prüfen dein Profil und schicken dir ein Angebot.', howApply4: 'Nimm das Angebot online an, trage deine Stunden ein und werde jede Woche bezahlt.', location: 'Ort', paidH: 'Auszahlung', weekly: 'Wöchentlich', similarRoles: 'Ähnliche Stellen', cvAutoL: 'Lebenslauf hochladen (PDF) – wir füllen dein Profil aus', cvAutoP: 'Optional. Der Lebenslauf wird in deinem Browser gelesen; bitte prüfe die ausgefüllten Felder.', cvReading: 'Lebenslauf wird gelesen…', cvFilled: 'Profil aus dem Lebenslauf ausgefüllt – bitte prüfen.', cvNotRead: 'Aus diesem Lebenslauf konnten wir nichts auslesen – bitte die Felder ausfüllen.', cvFilledSave: 'Profil aus dem Lebenslauf ausgefüllt – bitte prüfen und speichern.', headlineL: 'Titel (z. B. Senior Software Engineer)', skillsL: 'Fähigkeiten (mit Komma getrennt)', ivH: 'Dein Interview', ivP: 'Ein kurzes Interview hilft uns, dir die passenden Stellen zu geben – wie ein erstes Gespräch, aber wann es dir passt.', ivRule1: '{n} Fragen, ca. 15 Minuten.', ivRule2: 'Beantworte jede Frage schriftlich oder per Sprache (max. 3 Minuten).', ivRule3: 'Deine Antworten werden nach jeder Frage gespeichert – du kannst später weitermachen.', ivRule4: 'Bitte antworte selbst, ohne KI-Hilfe.', ivChangeField: 'Fachgebiet im Profil ändern', ivStart: 'Interview starten', ivQuestion: 'Frage', ivType: 'Deine Antwort', ivOrVoice: 'Oder per Sprache antworten', ivMax3: 'max. 3 Minuten', ivRecord: 'Aufnehmen', ivRecordAgain: 'Neu aufnehmen', ivStop: 'Stopp', ivNoMic: 'Kein Mikrofon verfügbar – bitte schriftlich antworten.', ivEmpty: 'Bitte schreibe oder sprich eine Antwort.', ivNext: 'Speichern und weiter', ivSubmit: 'Interview abschicken', ivDoneH: 'Interview abgeschickt', ivDoneP: 'Danke! Wir prüfen deine Antworten und melden uns.', interviewsTab: 'Interviews', ivNone: 'Noch keine Interviews.', ivAnswers: 'Antworten', ivPlay: 'Sprachantwort abspielen', ivScore: 'Bewertung', ivReviewed: 'Als geprüft speichern', stOffered: 'Angebot', stReviewed: 'Geprüft', stShortlisted: 'Vorauswahl', ns1: 'Profil vervollständigen', ns2: 'Lebenslauf hochladen', ns3: 'Interview machen', ns3c: 'Interview fertig machen', ns4: 'Auszahlungsdaten eintragen', ns5: 'Auf eine Stelle bewerben', offerNew: 'Neues Angebot', startDate: 'Startdatum', offerAgree: 'Ich nehme das Angebot an und akzeptiere die', offerSign: 'Zum Unterschreiben deinen vollen Namen eingeben', offerAccept: 'Angebot annehmen', offerDecline: 'Ablehnen', offerAccepted: 'Angebot angenommen – willkommen an Bord!', offerDeclineQ: 'Dieses Angebot ablehnen?', offerNoteL: 'Nachricht an die Fachperson (optional)', offerAdminP: 'Die Fachperson sieht das Angebot im Dashboard und nimmt es online an. Stunden kann sie eintragen, sobald es angenommen ist.', offerSend: 'Angebot senden', offerNewAdmin: 'Neues Angebot',
  fExperts: 'Fachleute', fCompanies: 'Firmen', fCompany: 'Unternehmen', fHelpCenter: 'Hilfe-Center', fCompanyAccount: 'Firmenkonto erstellen', fContact: 'Kontakt', 
  fvLabel: 'So funktioniert Brightpeer (Video)', fvClose: 'Video schliessen', fvSound: 'Ton an/aus',
  payoutEncrypted: 'Deine Auszahlungsdaten werden verschlüsselt gespeichert.', testsTab: 'Tests', testsH: 'Fachtests', testsP: 'Mach den kurzen Test für dein Fachgebiet. So können wir dich schneller vermitteln. Jeder Test geht nur einmal.',
  testStart: 'Test starten', testContinue: 'Test fortsetzen', testYourField: 'Dein Fachgebiet', testQuestion: 'Frage',
  testRule1: 'Du hast {m} Minuten. Die Zeit läuft weiter, auch wenn du die Seite verlässt.', testRule2: 'Du kannst diesen Test nur einmal machen.',
  testRule3: 'Wenn die Zeit abgelaufen ist, werden deine Antworten automatisch gesendet.', testRule4: 'Bitte antworte selbst, ohne KI-Tools und ohne Hilfe von anderen.',
  testSubmit: 'Antworten senden', testSent: 'Danke! Deine Antworten wurden gesendet.', testTimeUp: 'Die Zeit ist abgelaufen – deine Antworten wurden gesendet.',
  testDoneH: 'Test abgegeben', testDoneP: 'Danke. Wir prüfen deine Antworten und melden uns per E-Mail.',
  stPassed: 'Bestanden', stFailed: 'Nicht bestanden', testNone: 'Noch keine Tests gemacht.', testCorrect: 'richtig', testLate: 'zu spät',
  testBelow: 'unter', testAnswers: 'Antworten anzeigen', testPass: 'Bestanden', testFail: 'Nicht bestanden', testReset: 'Neuen Versuch erlauben',
  navRoles: 'Jobs finden', navCompanies: 'Für Firmen', navResearch: 'Research', navAbout: 'Über uns', navHelp: 'Hilfe',
  login: 'Anmelden', logout: 'Abmelden', dashboard: 'Dashboard', admin: 'Admin', applyNow: 'Als Expert:in bewerben', hire: 'Fachleute finden',
  language: 'Sprache',
  badge: 'Remote-Arbeit für Fachleute, weltweit',
  h1: 'Werde für dein Fachwissen bezahlt.',
  sub: 'Brightpeer verbindet Ärzt:innen, Jurist:innen, Ingenieur:innen, Wissenschaftler:innen und weitere Fachleute mit Firmen, die Expertenwissen brauchen – flexibel, remote und wöchentlich bezahlt.',
  s1: 'Stundenlohn, je nach Fachgebiet', s2: 'Anmeldung – immer gratis', s3v: 'Wöchentlich', s3: 'Auszahlung ohne Gebühren (Bank oder PayPal)',
  howExpertsH: 'So funktioniert es für Fachleute',
  he1h: 'In 10 Minuten bewerben', he1p: 'Profil erstellen, Lebenslauf hochladen und dein Fachwissen beschreiben.',
  he2h: 'Passende Projekte', he2p: 'Wir prüfen dein Profil und vermitteln dir bezahlte Projekte in deinem Fachgebiet.',
  he3h: 'Remote arbeiten, wöchentlich Geld', he3p: 'Stunden eintragen – wir zahlen jede Woche aus, ohne Gebühren, per Bank oder PayPal.',
  howCompaniesH: 'So funktioniert es für Firmen',
  hc1h: 'Bedarf melden', hc1p: 'Beschreibe Fachwissen, Stunden und Budget.',
  hc2h: 'Wir wählen die Fachleute', hc2p: 'Wir wählen geprüfte Fachleute aus und kümmern uns um Verträge und Zahlungen.',
  hc3h: 'Vorauszahlen, Stunden bestätigen', hc3p: 'Du lädst dein Guthaben im Voraus auf. Bestätigte Stunden werden jede Woche davon bezahlt.',
  featuredH: 'Offene Stellen', featuredSub: 'Remote, flexibel, pro Stunde bezahlt.', allRoles: 'Alle Stellen',
  payH: 'Was Fachleute verdienen', payNote: 'Typische Stundenlöhne. Der genaue Lohn steht bei jeder Stelle.',
  referralH: 'Lade Kolleg:innen ein – ihr bekommt beide $100',
  referralP: 'Teile deinen persönlichen Link. Sobald deine Kollegin oder dein Kollege die ersten 10 bezahlten Stunden geleistet hat, bekommt ihr beide $100 Bonus.',
  ctaH: 'In 10 Minuten beworben. Kostenlos.', ctaP: 'Keine Gebühren, keine Mindeststunden. Du entscheidest, wie viel du arbeitest.',
  fMedicine: 'Medizin', fLaw: 'Recht', fSoftware: 'Software', fSTEM: 'Chemie & Mathe', fPharmacy: 'Apotheke', fAccounting: 'Buchhaltung', fTranslation: 'Übersetzung (DE)', fOther: 'Anderes',
  rolesH: 'Offene Stellen', rolesSub: 'Bezahlte Remote-Projekte in deinem Fachgebiet.', search: 'Stellen suchen…', allFields: 'Alle Fachgebiete',
  perHour: '/ Std.', remote: 'Remote', apply: 'Bewerben', viewRole: 'Stelle ansehen', noRoles: 'Gerade keine passenden offenen Stellen.',
  aboutRole: 'Über die Stelle', requirements: 'Anforderungen', pay: 'Lohn', hours: 'Stunden', back: '← Zurück',
  applied: 'Du hast dich für diese Stelle beworben.', applyNote: 'Kurze Nachricht (optional)', sendApplication: 'Bewerbung senden',
  loginToApply: 'Erstelle ein Gratis-Konto, um dich zu bewerben.', mustBeExpert: 'Nur Expert:innen-Konten können sich bewerben.',
  applyH: 'Als Expert:in bewerben', applySub: 'Gratis, dauert etwa 10 Minuten. Wir prüfen jedes Profil persönlich.',
  stepAccount: 'Dein Konto', stepProfile: 'Dein Fachwissen',
  email: 'E-Mail', password: 'Passwort (mind. 8 Zeichen)', fullName: 'Vor- und Nachname', country: 'Land',
  field: 'Fachgebiet', years: 'Jahre Berufserfahrung', linkedin: 'LinkedIn oder Website (optional)', rate: 'Gewünschter Stundenlohn in USD (optional)',
  bio: 'Beschreibe kurz deine Erfahrung', agree: 'Ich akzeptiere die AGB und die Datenschutzerklärung.',
  createAccount: 'Konto erstellen', haveAccount: 'Schon ein Konto?', orGoogle: 'Weiter mit Google', orMicrosoft: 'Weiter mit Microsoft', or: 'oder', oauthCompanyName: 'Bitte zuerst den Firmennamen eingeben.', oauthSoon: 'Bald verfügbar – bitte vorerst mit E-Mail und Passwort anmelden.',
  checkEmail: 'Fast geschafft! Bitte öffne deine E-Mails und klicke auf den Bestätigungslink. Danach anmelden und Lebenslauf hochladen.',
  loginH: 'Anmelden', forgot: 'Passwort vergessen?', noAccount: 'Noch kein Konto?', resetH: 'Passwort zurücksetzen',
  sendReset: 'Link senden', resetSent: 'Falls ein Konto existiert, haben wir dir einen Link zum Zurücksetzen geschickt.',
  newPassword: 'Neues Passwort', savePassword: 'Passwort speichern', passwordSaved: 'Passwort gespeichert.',
  companiesH: 'Expertenwissen auf Abruf.', companiesSub: 'Sag uns, was du brauchst. Wir finden geprüfte Fachleute, kümmern uns um Verträge und Auszahlungen – du zahlst einfach im Voraus auf dein Guthaben und bestätigst die Stunden.',
  cp1h: 'Geprüfte Fachleute', cp1p: 'Jede:r wird geprüft: Lebenslauf, Erfahrung und Gespräch.',
  cp2h: 'Schneller Start', cp2p: 'Die meisten Projekte starten innerhalb weniger Tage.',
  cp3h: 'Kein Aufwand', cp3p: 'Wir übernehmen Verträge, Zeiterfassung und Auszahlungen weltweit.',
  cpPriceH: 'Preise', cpPriceP: 'Du zahlst pro bestätigter Expertenstunde, per Vorauszahlung: Guthaben aufladen, bestätigte Stunden werden jede Woche abgezogen. Für jedes Projekt bekommst du ein klares Angebot – ohne Einrichtungsgebühr, ohne lange Bindung, Restguthaben auf Wunsch zurück.',
  companySignupH: 'Firmenkonto erstellen', companyName: 'Firmenname', website: 'Website (optional)', contactName: 'Dein Name',
  welcome: 'Willkommen', status: 'Status', stPending: 'In Prüfung', stApproved: 'Freigeschaltet', stRejected: 'Nicht freigeschaltet',
  stPendingP: 'Wir prüfen dein Profil. Das dauert meistens ein paar Tage.',
  stApprovedP: 'Du bist freigeschaltet. Bewirb dich auf Stellen – wir vermitteln dir Projekte.',
  stRejectedP: 'Leider können wir dir gerade keine Projekte anbieten. Du kannst dein Profil ergänzen, dann schauen wir es erneut an.',
  cvH: 'Dein Lebenslauf', cvUpload: 'Lebenslauf hochladen (PDF, max. 10 MB)', cvUploaded: 'Lebenslauf hochgeladen', cvMissing: 'Bitte lade deinen Lebenslauf hoch, damit wir dein Profil prüfen können.',
  myApps: 'Meine Bewerbungen', myContracts: 'Meine Projekte', logHours: 'Stunden eintragen', weekStart: 'Woche (Montag)', hoursWorked: 'Stunden', note: 'Notiz (optional)', submit: 'Senden',
  myHours: 'Meine Stunden', earnings: 'Verdienst', payoutsH: 'Auszahlungen', payoutSettings: 'Auszahlung', payoutMethod: 'Methode', bank: 'Banküberweisung (IBAN)', paypal: 'PayPal',
  payoutDetails: 'IBAN + Kontoinhaber:in, oder PayPal-E-Mail', save: 'Speichern', saved: 'Gespeichert.',
  referralLink: 'Dein Empfehlungslink', copy: 'Kopieren', copied: 'Kopiert!',
  profileH: 'Profil', none: 'Noch nichts da.', delete: 'Löschen', paid: 'Bezahlt', pending: 'Offen', open: 'Offen',
  submitted: 'Eingereicht', approved: 'Bestätigt', rejected: 'Abgelehnt', active: 'Aktiv', ended: 'Beendet',
  totalPaid: 'Ausbezahlt', totalPending: 'Kommt noch',
  newRequest: 'Neue Anfrage', expertsNeeded: 'Anzahl Fachleute', hoursPerWeek: 'Stunden pro Woche (je Person)', budget: 'Budget (optional)', description: 'Was brauchst du?',
  sendRequest: 'Anfrage senden', requestSent: 'Danke! Wir melden uns innerhalb von 1–2 Arbeitstagen.',
  myRequests: 'Meine Anfragen', myExperts: 'Meine Fachleute', approveHours: 'Stunden bestätigen', approve: 'Bestätigen', reject: 'Ablehnen',
  invoicesH: 'Rechnungen', amount: 'Betrag', payNow: 'Jetzt bezahlen', payByBank: 'Per Banküberweisung bezahlen',
  stNew: 'Neu', stInProgress: 'In Arbeit', stDone: 'Erledigt', stDeclined: 'Abgelehnt',
  overview: 'Übersicht', experts: 'Fachleute', roles: 'Stellen', requests: 'Anfragen', contracts: 'Verträge', hoursTab: 'Stunden', invoices: 'Rechnungen', payouts: 'Auszahlungen',
  loading: 'Lädt…', error: 'Etwas ist schiefgelaufen', notConfigured: 'Einrichtung nötig: Supabase in js/config.js eintragen, damit Konten funktionieren. Bis dahin zeigt die Seite Beispielinhalte.',
  footerTag: 'Expertenarbeit, ganz einfach.', terms: 'AGB', clientTerms: 'AGB für Firmen', cookies: 'Cookies', privacy: 'Datenschutz', imprint: 'Impressum', rights: 'Alle Rechte vorbehalten.',
  notFound: 'Seite nicht gefunden.', home: 'Startseite', required: 'Bitte alle Pflichtfelder ausfüllen.',
};

const fr = {
  fExperts: 'Experts', fCompanies: 'Entreprises', fCompany: 'Société', fHelpCenter: 'Centre d’aide', fCompanyAccount: 'Créer un compte entreprise', fContact: 'Contact', 
  orGoogle: 'Continuer avec Google', orMicrosoft: 'Continuer avec Microsoft', or: 'ou', oauthCompanyName: "Veuillez d'abord saisir le nom de l'entreprise.", oauthSoon: 'Bientôt disponible – utilisez pour l’instant e-mail et mot de passe.',
  navRoles: 'Trouver une mission', navCompanies: 'Entreprises', navResearch: 'Recherche', navAbout: 'À propos', navHelp: 'Aide',
  login: 'Connexion', logout: 'Déconnexion', dashboard: 'Tableau de bord', applyNow: 'Postuler comme expert', hire: 'Trouver des experts', language: 'Langue',
  badge: 'Travail à distance pour experts, partout dans le monde',
  h1: 'Soyez payé pour votre expertise.',
  sub: 'Brightpeer met en relation médecins, juristes, ingénieurs, scientifiques et autres professionnels avec des entreprises qui ont besoin de leur savoir – flexible, à distance et payé chaque semaine.',
  s1: 'Tarif horaire selon le domaine', s2: 'Inscription – toujours gratuite', s3v: 'Chaque semaine', s3: 'Paiements sans frais (banque ou PayPal)',
  howExpertsH: 'Comment ça marche pour les experts',
  he1h: 'Postulez en 10 minutes', he1p: 'Créez votre profil, téléversez votre CV et décrivez votre expertise.',
  he2h: 'Recevez des missions', he2p: 'Nous examinons votre profil et vous proposons des missions payées dans votre domaine.',
  he3h: 'Travaillez à distance, payé chaque semaine', he3p: 'Saisissez vos heures. Nous vous payons chaque semaine, sans frais.',
  howCompaniesH: 'Comment ça marche pour les entreprises',
  hc1h: 'Décrivez votre besoin', hc1p: 'Expertise, heures et budget.', hc2h: 'Nous choisissons les experts', hc2p: 'Professionnels vérifiés, contrats et paiements inclus.', hc3h: 'Prépayez, validez les heures', hc3p: 'Vous rechargez votre solde à l’avance. Les heures validées sont payées chaque semaine à partir de ce solde.',
  featuredH: 'Missions ouvertes', featuredSub: 'À distance, flexible, payé à l’heure.', allRoles: 'Toutes les missions',
  payH: 'Ce que gagnent les experts', payNote: 'Tarifs horaires typiques. Le tarif exact figure sur chaque mission.',
  referralH: 'Invitez un collègue – 100 $ pour chacun', referralP: 'Partagez votre lien. Après les 10 premières heures payées de votre collègue, vous recevez tous les deux 100 $.',
  ctaH: 'Postulez en 10 minutes. C’est gratuit.', ctaP: 'Aucuns frais, aucun minimum d’heures. Vous décidez combien vous travaillez.',
  fMedicine: 'Médecine', fLaw: 'Droit', fSoftware: 'Logiciel', fSTEM: 'Chimie & Maths', fPharmacy: 'Pharmacie', fAccounting: 'Comptabilité', fTranslation: 'Traduction (DE)', fOther: 'Autre',
  rolesH: 'Missions ouvertes', rolesSub: 'Missions payées à distance dans votre domaine.', search: 'Rechercher…', allFields: 'Tous les domaines', perHour: '/ h', remote: 'À distance', apply: 'Postuler', viewRole: 'Voir', noRoles: 'Aucune mission ne correspond pour le moment.',
  aboutRole: 'La mission', requirements: 'Exigences', pay: 'Rémunération', hours: 'Heures', back: '← Retour',
  applyH: 'Postuler comme expert', applySub: 'Gratuit, environ 10 minutes. Chaque profil est examiné personnellement.',
  email: 'E-mail', password: 'Mot de passe (min. 8 caractères)', fullName: 'Nom complet', country: 'Pays', field: 'Domaine', years: 'Années d’expérience', createAccount: 'Créer un compte',
  loginH: 'Connexion', forgot: 'Mot de passe oublié ?', noAccount: 'Pas encore de compte ?',
  companiesH: 'L’expertise, à la demande.', companiesSub: 'Dites-nous ce dont vous avez besoin. Nous trouvons des professionnels vérifiés et gérons contrats et paiements.',
  footerTag: 'Le travail d’expert, simplement.', terms: 'Conditions', privacy: 'Confidentialité', imprint: 'Mentions légales', rights: 'Tous droits réservés.',
};

const it = {
  fExperts: 'Esperti', fCompanies: 'Aziende', fCompany: 'Azienda', fHelpCenter: 'Centro assistenza', fCompanyAccount: 'Crea account aziendale', fContact: 'Contatti', 
  orGoogle: 'Continua con Google', orMicrosoft: 'Continua con Microsoft', or: 'oppure', oauthCompanyName: "Inserisci prima il nome dell'azienda.", oauthSoon: 'Presto disponibile – per ora accedi con e-mail e password.',
  navRoles: 'Trova lavoro', navCompanies: 'Per aziende', navResearch: 'Ricerca', navAbout: 'Chi siamo', navHelp: 'Aiuto',
  login: 'Accedi', logout: 'Esci', dashboard: 'Dashboard', applyNow: 'Candidati come esperto', hire: 'Trova esperti', language: 'Lingua',
  badge: 'Lavoro da remoto per esperti, in tutto il mondo',
  h1: 'Fatti pagare per la tua competenza.',
  sub: 'Brightpeer mette in contatto medici, avvocati, ingegneri, scienziati e altri professionisti con aziende che cercano competenze – flessibile, da remoto e pagato ogni settimana.',
  s1: 'Paga oraria, secondo il settore', s2: 'Iscrizione – sempre gratuita', s3v: 'Settimanale', s3: 'Pagamenti senza commissioni (banca o PayPal)',
  howExpertsH: 'Come funziona per gli esperti',
  he1h: 'Candidati in 10 minuti', he1p: 'Crea il profilo, carica il CV e descrivi la tua competenza.',
  he2h: 'Ricevi progetti', he2p: 'Esaminiamo il profilo e ti proponiamo progetti pagati nel tuo settore.',
  he3h: 'Lavora da remoto, pagato ogni settimana', he3p: 'Registra le ore. Paghiamo ogni settimana, senza commissioni.',
  howCompaniesH: 'Come funziona per le aziende',
  hc1h: 'Descrivi il bisogno', hc1p: 'Competenze, ore e budget.', hc2h: 'Scegliamo gli esperti', hc2p: 'Professionisti verificati, contratti e pagamenti inclusi.', hc3h: 'Prepaga, approva le ore', hc3p: 'Ricarichi il saldo in anticipo. Le ore approvate vengono pagate ogni settimana dal saldo.',
  featuredH: 'Posizioni aperte', featuredSub: 'Da remoto, flessibile, pagato a ore.', allRoles: 'Tutte le posizioni',
  payH: 'Quanto guadagnano gli esperti', payNote: 'Paghe orarie tipiche. La paga esatta è indicata in ogni posizione.',
  referralH: 'Invita un collega – 100 $ a testa', referralP: 'Condividi il tuo link. Dopo le prime 10 ore pagate del collega, ricevete entrambi 100 $.',
  ctaH: 'Candidati in 10 minuti. È gratis.', ctaP: 'Nessuna commissione, nessun minimo di ore. Decidi tu quanto lavorare.',
  fMedicine: 'Medicina', fLaw: 'Diritto', fSoftware: 'Software', fSTEM: 'Chimica & Matematica', fPharmacy: 'Farmacia', fAccounting: 'Contabilità', fTranslation: 'Traduzione (DE)', fOther: 'Altro',
  rolesH: 'Posizioni aperte', rolesSub: 'Progetti pagati da remoto nel tuo settore.', search: 'Cerca…', allFields: 'Tutti i settori', perHour: '/ h', remote: 'Remoto', apply: 'Candidati', viewRole: 'Vedi', noRoles: 'Nessuna posizione corrisponde al momento.',
  aboutRole: 'La posizione', requirements: 'Requisiti', pay: 'Paga', hours: 'Ore', back: '← Indietro',
  applyH: 'Candidati come esperto', applySub: 'Gratis, circa 10 minuti. Ogni profilo viene esaminato personalmente.',
  email: 'E-mail', password: 'Password (min. 8 caratteri)', fullName: 'Nome e cognome', country: 'Paese', field: 'Settore', years: 'Anni di esperienza', createAccount: 'Crea account',
  loginH: 'Accedi', forgot: 'Password dimenticata?', noAccount: 'Non hai un account?',
  companiesH: 'Competenze, su richiesta.', companiesSub: 'Dicci di cosa hai bisogno. Troviamo professionisti verificati e gestiamo contratti e pagamenti.',
  footerTag: 'Lavoro da esperti, semplice.', terms: 'Termini', privacy: 'Privacy', imprint: 'Note legali', rights: 'Tutti i diritti riservati.',
};

const es = {
  fExperts: 'Expertos', fCompanies: 'Empresas', fCompany: 'Compañía', fHelpCenter: 'Centro de ayuda', fCompanyAccount: 'Crear cuenta de empresa', fContact: 'Contacto', 
  orGoogle: 'Continuar con Google', orMicrosoft: 'Continuar con Microsoft', or: 'o', oauthCompanyName: 'Introduce primero el nombre de la empresa.', oauthSoon: 'Próximamente: por ahora entra con e-mail y contraseña.',
  navRoles: 'Buscar trabajo', navCompanies: 'Para empresas', navResearch: 'Investigación', navAbout: 'Empresa', navHelp: 'Ayuda',
  login: 'Iniciar sesión', logout: 'Cerrar sesión', dashboard: 'Panel', applyNow: 'Postular como experto', hire: 'Contratar expertos', language: 'Idioma',
  badge: 'Trabajo remoto para expertos, en todo el mundo',
  h1: 'Cobra por tu experiencia.',
  sub: 'Brightpeer conecta a médicos, abogados, ingenieros, científicos y otros profesionales con empresas que necesitan su conocimiento – flexible, remoto y pagado cada semana.',
  s1: 'Pago por hora, según el área', s2: 'Registro – siempre gratis', s3v: 'Semanal', s3: 'Pagos sin comisiones (banco o PayPal)',
  howExpertsH: 'Cómo funciona para expertos',
  he1h: 'Postula en 10 minutos', he1p: 'Crea tu perfil, sube tu CV y cuéntanos tu experiencia.',
  he2h: 'Recibe proyectos', he2p: 'Revisamos tu perfil y te asignamos proyectos pagados en tu área.',
  he3h: 'Trabaja remoto, cobra cada semana', he3p: 'Registra tus horas. Pagamos cada semana, sin comisiones.',
  howCompaniesH: 'Cómo funciona para empresas',
  hc1h: 'Cuéntanos qué necesitas', hc1p: 'Experiencia, horas y presupuesto.', hc2h: 'Elegimos a los expertos', hc2p: 'Profesionales verificados, contratos y pagos incluidos.', hc3h: 'Prepaga, aprueba horas', hc3p: 'Recargas tu saldo por adelantado. Las horas aprobadas se pagan cada semana desde ese saldo.',
  featuredH: 'Puestos abiertos', featuredSub: 'Remoto, flexible, pagado por hora.', allRoles: 'Ver todos',
  payH: 'Lo que ganan los expertos', payNote: 'Pagos por hora típicos. El pago exacto aparece en cada puesto.',
  referralH: 'Invita a un colega – 100 $ para cada uno', referralP: 'Comparte tu enlace. Tras las primeras 10 horas pagadas de tu colega, ambos reciben 100 $.',
  ctaH: 'Postúlate en 10 minutos. Es gratis.', ctaP: 'Sin comisiones ni horas mínimas. Tú decides cuánto trabajas.',
  fMedicine: 'Medicina', fLaw: 'Derecho', fSoftware: 'Software', fSTEM: 'Química y Matemáticas', fPharmacy: 'Farmacia', fAccounting: 'Contabilidad', fTranslation: 'Traducción (DE)', fOther: 'Otro',
  rolesH: 'Puestos abiertos', rolesSub: 'Proyectos remotos pagados en tu área.', search: 'Buscar…', allFields: 'Todas las áreas', perHour: '/ h', remote: 'Remoto', apply: 'Postular', viewRole: 'Ver', noRoles: 'No hay puestos que coincidan ahora.',
  aboutRole: 'Sobre el puesto', requirements: 'Requisitos', pay: 'Pago', hours: 'Horas', back: '← Volver',
  applyH: 'Postular como experto', applySub: 'Gratis, unos 10 minutos. Revisamos cada perfil personalmente.',
  email: 'Correo', password: 'Contraseña (mín. 8 caracteres)', fullName: 'Nombre completo', country: 'País', field: 'Área', years: 'Años de experiencia', createAccount: 'Crear cuenta',
  loginH: 'Iniciar sesión', forgot: '¿Olvidaste tu contraseña?', noAccount: '¿Aún no tienes cuenta?',
  companiesH: 'Experiencia, a demanda.', companiesSub: 'Dinos qué necesitas. Encontramos profesionales verificados y gestionamos contratos y pagos.',
  footerTag: 'Trabajo experto, fácil.', terms: 'Términos', privacy: 'Privacidad', imprint: 'Aviso legal', rights: 'Todos los derechos reservados.',
};


// Info page, benefits and research cards (20.11.2026)
Object.assign(en, {"navInfo": "Info", "infoH": "How Brightpeer works", "infoSub": "Everything about pay, the process and why experts work with us.", "whyH": "Why experts choose Brightpeer", "viewRoles": "View roles", "researchIntro": "Expert work across every field – here is where Brightpeer experts help AI get it right.", "b1h": "Weekly payouts", "b1p": "Paid every week by bank transfer or PayPal – no fees.", "b2h": "Work from anywhere", "b2p": "Fully remote, from any country.", "b3h": "Your own hours", "b3p": "Choose when and how much you work – no minimum.", "b4h": "Professional rates", "b4p": "$40–250 per hour, shown on every role.", "b5h": "Free to join", "b5p": "No sign-up fees, ever.", "b6h": "Referral bonus", "b6p": "$100 for you and $100 for your colleague.", "b7h": "Meaningful AI work", "b7p": "Help AI give safer, more accurate answers in your field.", "b8h": "Real people", "b8p": "A real person reviews your application and supports you.", "fc1h": "Clinical reasoning", "fc1p": "Write real clinical cases and grade AI answers on diagnosis, treatment and drug safety.", "fc2h": "Legal analysis", "fc2p": "Review AI answers on contracts, case law and compliance the way a practising lawyer would.", "fc3h": "Software engineering", "fc3p": "Test AI agents on real coding tasks – from bug fixes to full features and code review.", "fc4h": "Science & math", "fc4p": "Create hard problems and check step-by-step reasoning in chemistry, physics and mathematics.", "fc5h": "Pharmacology", "fc5p": "Check dosing, interactions and patient advice for accuracy and safety.", "fc6h": "Accounting & finance", "fc6p": "Evaluate AI on bookkeeping, reporting and tax tasks across spreadsheets and documents.", "fc7h": "Translation", "fc7p": "Rate and improve German translations for meaning, tone and terminology."});
Object.assign(de, {"navInfo": "Info", "infoH": "So funktioniert Brightpeer", "infoSub": "Alles zu Lohn, Ablauf und warum Fachleute mit uns arbeiten.", "whyH": "Warum Fachleute Brightpeer wählen", "viewRoles": "Stellen ansehen", "researchIntro": "Fachwissen aus allen Bereichen – hier helfen Brightpeer-Fachleute der KI, richtig zu antworten.", "b1h": "Wöchentliche Auszahlung", "b1p": "Jede Woche per Bank oder PayPal – ohne Gebühren.", "b2h": "Arbeiten von überall", "b2p": "Komplett remote, aus jedem Land.", "b3h": "Eigene Arbeitszeiten", "b3p": "Du entscheidest, wann und wie viel du arbeitest – ohne Minimum.", "b4h": "Professionelle Löhne", "b4p": "$40–250 pro Stunde, bei jeder Stelle angegeben.", "b5h": "Kostenlos", "b5p": "Keine Anmeldegebühren, nie.", "b6h": "Empfehlungsbonus", "b6p": "$100 für dich und $100 für deine Kollegin oder deinen Kollegen.", "b7h": "Sinnvolle KI-Arbeit", "b7p": "Hilf der KI, in deinem Fach sicherer und genauer zu antworten.", "b8h": "Echte Menschen", "b8p": "Eine echte Person prüft deine Bewerbung und begleitet dich.", "fc1h": "Klinisches Denken", "fc1p": "Schreibe echte Fälle aus der Klinik und bewerte KI-Antworten zu Diagnose, Behandlung und Medikamenten.", "fc2h": "Rechtliche Prüfung", "fc2p": "Prüfe KI-Antworten zu Verträgen, Urteilen und Compliance wie eine praktizierende Juristin.", "fc3h": "Softwareentwicklung", "fc3p": "Teste KI-Agenten an echten Programmieraufgaben – vom Bugfix bis zum Code-Review.", "fc4h": "Naturwissenschaft & Mathe", "fc4p": "Erstelle schwierige Aufgaben und prüfe Lösungswege in Chemie, Physik und Mathematik.", "fc5h": "Pharmakologie", "fc5p": "Prüfe Dosierungen, Wechselwirkungen und Patientenhinweise auf Richtigkeit und Sicherheit.", "fc6h": "Buchhaltung & Finanzen", "fc6p": "Bewerte KI bei Buchhaltung, Abschlüssen und Steuern in Tabellen und Dokumenten.", "fc7h": "Übersetzung", "fc7p": "Bewerte und verbessere deutsche Übersetzungen nach Bedeutung, Ton und Fachbegriffen."});
Object.assign(fr, {"navInfo": "Infos", "infoH": "Comment fonctionne Brightpeer", "infoSub": "Tout sur la rémunération, le processus et pourquoi les experts travaillent avec nous.", "whyH": "Pourquoi les experts choisissent Brightpeer", "viewRoles": "Voir les missions", "researchIntro": "Une expertise dans tous les domaines – voici où les experts Brightpeer aident l’IA à bien répondre.", "b1h": "Paiement hebdomadaire", "b1p": "Chaque semaine par virement ou PayPal – sans frais.", "b2h": "Travaillez de partout", "b2p": "100 % à distance, depuis n’importe quel pays.", "b3h": "Vos propres horaires", "b3p": "Vous choisissez quand et combien vous travaillez – sans minimum.", "b4h": "Tarifs professionnels", "b4p": "40–250 $ de l’heure, indiqués sur chaque mission.", "b5h": "Inscription gratuite", "b5p": "Aucuns frais d’inscription, jamais.", "b6h": "Prime de parrainage", "b6p": "100 $ pour vous et 100 $ pour votre collègue.", "b7h": "Un travail utile", "b7p": "Aidez l’IA à répondre de façon plus sûre et plus précise dans votre domaine.", "b8h": "De vraies personnes", "b8p": "Une vraie personne examine votre candidature et vous accompagne.", "fc1h": "Raisonnement clinique", "fc1p": "Rédigez de vrais cas cliniques et évaluez les réponses de l’IA sur le diagnostic, le traitement et les médicaments.", "fc2h": "Analyse juridique", "fc2p": "Examinez les réponses de l’IA sur les contrats, la jurisprudence et la conformité comme un juriste.", "fc3h": "Génie logiciel", "fc3p": "Testez des agents IA sur de vraies tâches de code – du correctif à la revue de code.", "fc4h": "Sciences & maths", "fc4p": "Créez des problèmes difficiles et vérifiez le raisonnement en chimie, physique et mathématiques.", "fc5h": "Pharmacologie", "fc5p": "Vérifiez dosages, interactions et conseils aux patients pour leur exactitude et leur sécurité.", "fc6h": "Comptabilité & finance", "fc6p": "Évaluez l’IA sur la comptabilité, le reporting et la fiscalité dans des tableurs et documents.", "fc7h": "Traduction", "fc7p": "Évaluez et améliorez des traductions allemandes : sens, ton et terminologie."});
Object.assign(it, {"navInfo": "Info", "infoH": "Come funziona Brightpeer", "infoSub": "Tutto su compensi, processo e perché gli esperti lavorano con noi.", "whyH": "Perché gli esperti scelgono Brightpeer", "viewRoles": "Vedi le posizioni", "researchIntro": "Competenze in ogni campo – ecco dove gli esperti Brightpeer aiutano l’IA a rispondere bene.", "b1h": "Pagamenti settimanali", "b1p": "Ogni settimana tramite bonifico o PayPal – senza commissioni.", "b2h": "Lavora da ovunque", "b2p": "Completamente da remoto, da qualsiasi paese.", "b3h": "Orari tuoi", "b3p": "Decidi tu quando e quanto lavorare – nessun minimo.", "b4h": "Compensi professionali", "b4p": "40–250 $ l’ora, indicati in ogni posizione.", "b5h": "Iscrizione gratuita", "b5p": "Nessuna commissione di iscrizione, mai.", "b6h": "Bonus presentazione", "b6p": "100 $ per te e 100 $ per il tuo collega.", "b7h": "Lavoro con senso", "b7p": "Aiuta l’IA a rispondere in modo più sicuro e preciso nel tuo campo.", "b8h": "Persone vere", "b8p": "Una persona vera esamina la tua candidatura e ti segue.", "fc1h": "Ragionamento clinico", "fc1p": "Scrivi casi clinici reali e valuta le risposte dell’IA su diagnosi, terapia e farmaci.", "fc2h": "Analisi legale", "fc2p": "Valuta le risposte dell’IA su contratti, giurisprudenza e compliance come un avvocato.", "fc3h": "Ingegneria del software", "fc3p": "Testa agenti IA su veri compiti di programmazione – dai bug fix alla code review.", "fc4h": "Scienze & matematica", "fc4p": "Crea problemi difficili e verifica il ragionamento in chimica, fisica e matematica.", "fc5h": "Farmacologia", "fc5p": "Verifica dosaggi, interazioni e consigli ai pazienti per correttezza e sicurezza.", "fc6h": "Contabilità & finanza", "fc6p": "Valuta l’IA su contabilità, reporting e tasse in fogli di calcolo e documenti.", "fc7h": "Traduzione", "fc7p": "Valuta e migliora traduzioni tedesche per significato, tono e terminologia."});
Object.assign(es, {"navInfo": "Info", "infoH": "Cómo funciona Brightpeer", "infoSub": "Todo sobre el pago, el proceso y por qué los expertos trabajan con nosotros.", "whyH": "Por qué los expertos eligen Brightpeer", "viewRoles": "Ver puestos", "researchIntro": "Experiencia en todos los campos – aquí es donde los expertos de Brightpeer ayudan a la IA a acertar.", "b1h": "Pagos semanales", "b1p": "Cada semana por transferencia o PayPal – sin comisiones.", "b2h": "Trabaja desde cualquier lugar", "b2p": "100 % remoto, desde cualquier país.", "b3h": "Tu propio horario", "b3p": "Tú decides cuándo y cuánto trabajas – sin mínimo.", "b4h": "Tarifas profesionales", "b4p": "40–250 $ por hora, indicados en cada puesto.", "b5h": "Registro gratis", "b5p": "Sin cuotas de registro, nunca.", "b6h": "Bono por referido", "b6p": "100 $ para ti y 100 $ para tu colega.", "b7h": "Trabajo con sentido", "b7p": "Ayuda a la IA a responder de forma más segura y precisa en tu campo.", "b8h": "Personas reales", "b8p": "Una persona real revisa tu solicitud y te acompaña.", "fc1h": "Razonamiento clínico", "fc1p": "Escribe casos clínicos reales y evalúa respuestas de IA sobre diagnóstico, tratamiento y fármacos.", "fc2h": "Análisis legal", "fc2p": "Revisa respuestas de IA sobre contratos, jurisprudencia y cumplimiento como lo haría un abogado.", "fc3h": "Ingeniería de software", "fc3p": "Prueba agentes de IA en tareas reales de código – desde corregir errores hasta revisar código.", "fc4h": "Ciencias y matemáticas", "fc4p": "Crea problemas difíciles y comprueba el razonamiento en química, física y matemáticas.", "fc5h": "Farmacología", "fc5p": "Comprueba dosis, interacciones y consejos al paciente para que sean correctos y seguros.", "fc6h": "Contabilidad y finanzas", "fc6p": "Evalúa la IA en contabilidad, informes e impuestos con hojas de cálculo y documentos.", "fc7h": "Traducción", "fc7p": "Evalúa y mejora traducciones al alemán en significado, tono y terminología."});
Object.assign(en, { oauthError: "Sign-in did not work. Please try again or use email and password." });
Object.assign(de, { oauthError: "Die Anmeldung hat nicht geklappt. Bitte versuche es nochmal oder melde dich mit E-Mail und Passwort an." });
Object.assign(fr, { oauthError: "La connexion n'a pas fonctionné. Réessayez ou utilisez e-mail et mot de passe." });
Object.assign(it, { oauthError: "Accesso non riuscito. Riprova o usa e-mail e password." });
Object.assign(es, { oauthError: "No se pudo iniciar sesión. Inténtalo de nuevo o usa correo y contraseña." });
Object.assign(en, {"o1h": "Sell data", "o1p": "Have high-quality, licensed data? We connect you with AI teams that need it.", "o1l": "Contact us", "o2h": "Build evals", "o2p": "Our experts write realistic test sets that show where your AI still fails.", "o2l": "Hire experts", "o3h": "Evaluate AI", "o3p": "Experts grade your model’s answers for accuracy, safety and reasoning.", "o3l": "Hire experts", "o4h": "Find work", "o4p": "Get paid $40–250 per hour for your expertise – remote and flexible.", "o4l": "See open roles"});
Object.assign(de, {"o1h": "Daten verkaufen", "o1p": "Du hast hochwertige, lizenzierte Daten? Wir verbinden dich mit KI-Teams, die sie brauchen.", "o1l": "Kontakt aufnehmen", "o2h": "Evals erstellen", "o2p": "Unsere Fachleute schreiben realistische Testsets, die zeigen, wo deine KI noch Fehler macht.", "o2l": "Fachleute finden", "o3h": "KI bewerten", "o3p": "Fachleute bewerten die Antworten deines Modells auf Richtigkeit, Sicherheit und Logik.", "o3l": "Fachleute finden", "o4h": "Arbeit finden", "o4p": "Verdiene $40–250 pro Stunde mit deinem Fachwissen – remote und flexibel.", "o4l": "Offene Stellen ansehen"});
Object.assign(fr, {"o1h": "Vendre des données", "o1p": "Vous avez des données de qualité et sous licence ? Nous vous mettons en relation avec des équipes IA.", "o1l": "Nous contacter", "o2h": "Créer des évaluations", "o2p": "Nos experts rédigent des jeux de tests réalistes qui montrent où votre IA se trompe encore.", "o2l": "Trouver des experts", "o3h": "Évaluer l’IA", "o3p": "Des experts notent les réponses de votre modèle : exactitude, sécurité et raisonnement.", "o3l": "Trouver des experts", "o4h": "Trouver une mission", "o4p": "Gagnez 40–250 $ de l’heure grâce à votre expertise – à distance et en toute flexibilité.", "o4l": "Voir les missions"});
Object.assign(it, {"o1h": "Vendere dati", "o1p": "Hai dati di qualità e con licenza? Ti mettiamo in contatto con team di IA che ne hanno bisogno.", "o1l": "Contattaci", "o2h": "Creare valutazioni", "o2p": "I nostri esperti scrivono set di test realistici che mostrano dove la tua IA sbaglia ancora.", "o2l": "Trova esperti", "o3h": "Valutare l’IA", "o3p": "Gli esperti valutano le risposte del tuo modello per correttezza, sicurezza e ragionamento.", "o3l": "Trova esperti", "o4h": "Trova lavoro", "o4p": "Guadagna 40–250 $ l’ora con le tue competenze – da remoto e in modo flessibile.", "o4l": "Vedi le posizioni"});
Object.assign(es, {"o1h": "Vender datos", "o1p": "¿Tienes datos de calidad y con licencia? Te conectamos con equipos de IA que los necesitan.", "o1l": "Contáctanos", "o2h": "Crear evaluaciones", "o2p": "Nuestros expertos crean conjuntos de prueba realistas que muestran dónde falla aún tu IA.", "o2l": "Contratar expertos", "o3h": "Evaluar IA", "o3p": "Expertos califican las respuestas de tu modelo en precisión, seguridad y razonamiento.", "o3l": "Contratar expertos", "o4h": "Buscar trabajo", "o4p": "Gana 40–250 $ por hora con tu experiencia – en remoto y con flexibilidad.", "o4l": "Ver puestos"});
Object.assign(en, {"sv1h": "Human data & evals", "sv1a": "Vetted experts: physicians, lawyers, engineers, translators.", "sv1b": "Test sets and benchmarks built on real professional work.", "sv1c": "Every answer reviewed by a qualified professional.", "sv1l": "Talk to us", "sv2h": "Data monetization", "sv2a": "Earn from data your business already creates.", "sv2b": "Personal and sensitive information is removed before anything is shared.", "sv2c": "You decide exactly what is shared.", "sv2l": "Ask about payout", "sv3h": "Enterprise AI", "sv3a": "Find where AI can save time in your workflows.", "sv3b": "Experts test your AI before and after launch.", "sv3c": "Clear reports with concrete improvements.", "sv3l": "Book a call"});
Object.assign(de, {"sv1h": "Human Data & Evals", "sv1a": "Geprüfte Fachleute: Ärzt:innen, Jurist:innen, Ingenieur:innen, Übersetzer:innen.", "sv1b": "Testsets und Benchmarks aus echter Facharbeit.", "sv1c": "Jede Antwort wird von einer qualifizierten Fachperson geprüft.", "sv1l": "Kontakt aufnehmen", "sv2h": "Daten-Monetarisierung", "sv2a": "Verdiene mit Daten, die dein Unternehmen ohnehin erzeugt.", "sv2b": "Persönliche und sensible Angaben werden vor dem Teilen entfernt.", "sv2c": "Du entscheidest genau, was geteilt wird.", "sv2l": "Auszahlung anfragen", "sv3h": "KI für Unternehmen", "sv3a": "Finde heraus, wo KI in deinen Abläufen Zeit spart.", "sv3b": "Fachleute testen deine KI vor und nach dem Start.", "sv3c": "Klare Berichte mit konkreten Verbesserungen.", "sv3l": "Gespräch vereinbaren"});
Object.assign(fr, {"sv1h": "Données humaines & évaluations", "sv1a": "Des experts vérifiés : médecins, juristes, ingénieurs, traducteurs.", "sv1b": "Jeux de tests et benchmarks issus de vrais travaux professionnels.", "sv1c": "Chaque réponse est vérifiée par un professionnel qualifié.", "sv1l": "Nous contacter", "sv2h": "Monétisation des données", "sv2a": "Gagnez de l’argent avec les données que votre entreprise produit déjà.", "sv2b": "Les informations personnelles et sensibles sont retirées avant tout partage.", "sv2c": "Vous décidez exactement de ce qui est partagé.", "sv2l": "Demander une estimation", "sv3h": "IA pour entreprises", "sv3a": "Identifiez où l’IA peut faire gagner du temps dans vos processus.", "sv3b": "Des experts testent votre IA avant et après le lancement.", "sv3c": "Des rapports clairs avec des améliorations concrètes.", "sv3l": "Planifier un appel"});
Object.assign(it, {"sv1h": "Dati umani & valutazioni", "sv1a": "Esperti verificati: medici, avvocati, ingegneri, traduttori.", "sv1b": "Set di test e benchmark basati su lavoro professionale reale.", "sv1c": "Ogni risposta è controllata da un professionista qualificato.", "sv1l": "Contattaci", "sv2h": "Monetizzazione dei dati", "sv2a": "Guadagna con i dati che la tua azienda già produce.", "sv2b": "Le informazioni personali e sensibili vengono rimosse prima di ogni condivisione.", "sv2c": "Decidi tu esattamente cosa condividere.", "sv2l": "Chiedi una stima", "sv3h": "IA per aziende", "sv3a": "Scopri dove l’IA può far risparmiare tempo nei tuoi processi.", "sv3b": "Gli esperti testano la tua IA prima e dopo il lancio.", "sv3c": "Report chiari con miglioramenti concreti.", "sv3l": "Prenota una chiamata"});
Object.assign(es, {"sv1h": "Datos humanos y evaluaciones", "sv1a": "Expertos verificados: médicos, abogados, ingenieros, traductores.", "sv1b": "Conjuntos de prueba y benchmarks basados en trabajo profesional real.", "sv1c": "Cada respuesta la revisa un profesional cualificado.", "sv1l": "Contáctanos", "sv2h": "Monetización de datos", "sv2a": "Gana dinero con los datos que tu empresa ya genera.", "sv2b": "La información personal y sensible se elimina antes de compartir nada.", "sv2c": "Tú decides exactamente qué se comparte.", "sv2l": "Pedir una estimación", "sv3h": "IA para empresas", "sv3a": "Descubre dónde la IA puede ahorrar tiempo en tus procesos.", "sv3b": "Expertos prueban tu IA antes y después del lanzamiento.", "sv3c": "Informes claros con mejoras concretas.", "sv3l": "Reservar una llamada"});
Object.assign(en, {"ddFields": "Fields", "ddOverview": "Overview", "ddEvals": "Build evals & evaluate AI", "ddResearchP": "How expert knowledge makes AI more accurate and safer.", "ddCompaniesP": "Vetted experts for your AI projects – simple prepaid billing.", "ddExpertsP": "Paid, remote work for professionals – paid weekly.", "ddCompanyP": "Who we are and how to reach us."});
Object.assign(de, {"ddFields": "Fachbereiche", "ddOverview": "Überblick", "ddEvals": "Evals erstellen & KI bewerten", "ddResearchP": "Wie Fachwissen KI genauer und sicherer macht.", "ddCompaniesP": "Geprüfte Fachleute für deine KI-Projekte – einfach per Vorauszahlung.", "ddExpertsP": "Bezahlte Remote-Arbeit für Fachleute – wöchentlich ausgezahlt.", "ddCompanyP": "Wer wir sind und wie du uns erreichst."});
Object.assign(fr, {"ddFields": "Domaines", "ddOverview": "Aperçu", "ddEvals": "Créer des évaluations & évaluer l’IA", "ddResearchP": "Comment l’expertise rend l’IA plus précise et plus sûre.", "ddCompaniesP": "Des experts vérifiés pour vos projets IA – avec un simple prépaiement.", "ddExpertsP": "Missions rémunérées à distance pour professionnels – payées chaque semaine.", "ddCompanyP": "Qui nous sommes et comment nous joindre."});
Object.assign(it, {"ddFields": "Settori", "ddOverview": "Panoramica", "ddEvals": "Creare valutazioni & valutare l’IA", "ddResearchP": "Come le competenze rendono l’IA più precisa e sicura.", "ddCompaniesP": "Esperti verificati per i tuoi progetti di IA – con un semplice prepagamento.", "ddExpertsP": "Lavoro retribuito da remoto per professionisti – pagato ogni settimana.", "ddCompanyP": "Chi siamo e come contattarci."});
Object.assign(es, {"ddFields": "Áreas", "ddOverview": "Resumen", "ddEvals": "Crear evaluaciones y evaluar IA", "ddResearchP": "Cómo el conocimiento experto hace la IA más precisa y segura.", "ddCompaniesP": "Expertos verificados para tus proyectos de IA – con un simple prepago.", "ddExpertsP": "Trabajo remoto pagado para profesionales – pago semanal.", "ddCompanyP": "Quiénes somos y cómo contactarnos."});

const DICTS = { en, de, fr, it, es };

function detect() {
  const list = navigator.languages || [navigator.language || 'en'];
  for (const l of list) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (DICTS[code]) return code;
  }
  return 'en';
}

export let lang = detect();

export function setLang(code) {
  if (!DICTS[code]) return;
  lang = code;
  try { localStorage.setItem('bp_lang', code); } catch (e) { /* ignore */ }
  document.documentElement.lang = code;
}

export function t(key) {
  return (DICTS[lang] && DICTS[lang][key]) || en[key] || key;
}

// Signed-in notice on the apply / company sign-up pages (owner, 20.11.2026)
Object.assign(en, { signedInAs: 'You are signed in as', signedInApplyHint: 'To create a new account, sign out first. Your current account stays as it is.', signOutToApply: 'Sign out and create new account' });
Object.assign(de, { signedInAs: 'Du bist angemeldet als', signedInApplyHint: 'Um ein neues Konto zu erstellen, melde dich zuerst ab. Dein jetziges Konto bleibt bestehen.', signOutToApply: 'Abmelden und neues Konto erstellen' });
Object.assign(fr, { signedInAs: 'Vous êtes connecté·e en tant que', signedInApplyHint: 'Pour créer un nouveau compte, déconnectez-vous d’abord. Votre compte actuel reste inchangé.', signOutToApply: 'Se déconnecter et créer un compte' });
Object.assign(it, { signedInAs: 'Hai effettuato l’accesso come', signedInApplyHint: 'Per creare un nuovo account, esci prima. Il tuo account attuale resta invariato.', signOutToApply: 'Esci e crea un nuovo account' });
Object.assign(es, { signedInAs: 'Has iniciado sesión como', signedInApplyHint: 'Para crear una cuenta nueva, cierra sesión primero. Tu cuenta actual se mantiene.', signOutToApply: 'Cerrar sesión y crear cuenta nueva' });

// Talent pool (owner, 25.11.2026): the roles show the kinds of work Brightpeer hires for. They are not yet
// confirmed client projects, so experts join a talent pool and get an offer as soon as a matching project starts.
Object.assign(en, { featuredH: 'Roles we hire for', featuredSub: 'Join our talent pool – remote, flexible, paid by the hour.', rolesH: 'Talent pool', rolesSub: 'These are the roles we hire experts for. Apply once, and we contact you as soon as a client project matches your profile.', rolesCount: '{n} roles in our talent pool', poolH: 'How the talent pool works', poolP: 'Brightpeer is just starting. These roles show the kind of work our clients need – not every role has a live project yet. When you apply, you join our talent pool: we review your profile, and as soon as a project fits you, you get a concrete offer with pay and hours before you start. Nothing is binding until you accept.', poolChip: 'Talent pool', howApply3: 'As soon as a client project fits your profile, we send you an offer.', o4l: 'See the talent pool' });
Object.assign(de, { featuredH: 'Gesuchte Fachrichtungen', featuredSub: 'Werde Teil unseres Talent-Pools – remote, flexibel, pro Stunde bezahlt.', rolesH: 'Talent-Pool', rolesSub: 'Für diese Aufgaben suchen wir Fachleute. Bewirb dich einmal – wir melden uns, sobald ein Kundenprojekt zu deinem Profil passt.', rolesCount: '{n} Aufgaben im Talent-Pool', poolH: 'So funktioniert der Talent-Pool', poolP: 'Brightpeer steht noch am Anfang. Diese Stellen zeigen, welche Arbeit unsere Kunden brauchen – nicht für jede gibt es schon ein laufendes Projekt. Mit deiner Bewerbung kommst du in unseren Talent-Pool: Wir prüfen dein Profil, und sobald ein Projekt zu dir passt, bekommst du ein konkretes Angebot mit Lohn und Stunden, bevor du startest. Verbindlich wird erst etwas, wenn du annimmst.', poolChip: 'Talent-Pool', howApply3: 'Sobald ein Kundenprojekt zu deinem Profil passt, schicken wir dir ein Angebot.', o4l: 'Zum Talent-Pool' });
Object.assign(fr, { featuredH: 'Profils recherchés', featuredSub: 'Rejoignez notre vivier de talents – à distance, flexible, payé à l’heure.', rolesH: 'Vivier de talents', rolesSub: 'Voici les missions pour lesquelles nous recherchons des experts. Postulez une fois : nous vous contactons dès qu’un projet client correspond à votre profil.', rolesCount: '{n} missions dans notre vivier', poolH: 'Comment fonctionne le vivier', poolP: 'Brightpeer démarre. Ces missions montrent le type de travail dont nos clients ont besoin – toutes n’ont pas encore de projet en cours. En postulant, vous rejoignez notre vivier : nous examinons votre profil et, dès qu’un projet vous correspond, vous recevez une offre concrète avec tarif et horaires avant de commencer. Rien n’est engageant tant que vous n’acceptez pas.', poolChip: 'Vivier', howApply3: 'Dès qu’un projet client correspond à votre profil, nous vous envoyons une offre.', o4l: 'Voir le vivier' });
Object.assign(it, { featuredH: 'Profili che cerchiamo', featuredSub: 'Entra nel nostro talent pool – da remoto, flessibile, pagato a ore.', rolesH: 'Talent pool', rolesSub: 'Queste sono le posizioni per cui cerchiamo esperti. Candidati una volta: ti contattiamo appena un progetto cliente è adatto al tuo profilo.', rolesCount: '{n} posizioni nel talent pool', poolH: 'Come funziona il talent pool', poolP: 'Brightpeer è appena partito. Queste posizioni mostrano il tipo di lavoro di cui i clienti hanno bisogno – non tutte hanno già un progetto attivo. Candidandoti entri nel nostro talent pool: esaminiamo il tuo profilo e, appena un progetto fa per te, ricevi un’offerta concreta con compenso e ore prima di iniziare. Nulla è vincolante finché non accetti.', poolChip: 'Talent pool', howApply3: 'Appena un progetto cliente è adatto al tuo profilo, ti inviamo un’offerta.', o4l: 'Vedi il talent pool' });
Object.assign(es, { featuredH: 'Perfiles que buscamos', featuredSub: 'Únete a nuestra bolsa de talento – remoto, flexible, pagado por hora.', rolesH: 'Bolsa de talento', rolesSub: 'Estos son los puestos para los que buscamos expertos. Postúlate una vez y te contactamos en cuanto un proyecto de cliente encaje con tu perfil.', rolesCount: '{n} puestos en la bolsa de talento', poolH: 'Cómo funciona la bolsa de talento', poolP: 'Brightpeer está empezando. Estos puestos muestran el tipo de trabajo que necesitan nuestros clientes – no todos tienen ya un proyecto activo. Al postularte entras en nuestra bolsa de talento: revisamos tu perfil y, en cuanto un proyecto encaje contigo, recibes una oferta concreta con tarifa y horas antes de empezar. Nada es vinculante hasta que aceptes.', poolChip: 'Bolsa de talento', howApply3: 'En cuanto un proyecto de cliente encaje con tu perfil, te enviamos una oferta.', o4l: 'Ver la bolsa de talento' });
Object.assign(en, { poolShort: 'Talent pool: you get a concrete offer as soon as a matching client project starts.' });
Object.assign(de, { poolShort: 'Talent-Pool: Du bekommst ein konkretes Angebot, sobald ein passendes Kundenprojekt startet.' });
Object.assign(fr, { poolShort: 'Vivier de talents : vous recevez une offre concrète dès qu’un projet client adapté démarre.' });
Object.assign(it, { poolShort: 'Talent pool: ricevi un’offerta concreta appena parte un progetto cliente adatto.' });
Object.assign(es, { poolShort: 'Bolsa de talento: recibes una oferta concreta en cuanto empiece un proyecto de cliente adecuado.' });
