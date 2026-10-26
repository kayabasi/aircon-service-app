# Klima Servis

Mobile-first service log for a one-man air-conditioning technician in Marmaris. Turkish UI, built to be used with one thumb, in sunlight, between jobs.

## What it does

| Screen | Job |
|---|---|
| **Bugün** | Today's appointments (Ara / Yol / İş bitti), customers whose maintenance is due (one-tap WhatsApp reminder), this week's appointments |
| **Müşteriler** | Search by name, phone or mahalle (Turkish-accent insensitive); filter by "Bakımı gelen" or mahalle |
| **Müşteri** | Big Ara / WhatsApp / Yol tarifi buttons, location note, warning note, AC units as "service stickers" with a maintenance gauge, appointments, service history |
| **+ (center)** | Yapılan işi kaydet · Randevu ver · Yeni müşteri |
| **İş kaydı** | 3–4 step wizard: customer → which AC(s) → what was done (tap chips, no typing) → next maintenance. Ends with "Müşteriye WhatsApp'tan bildir" |
| **Takvim** | Week strip + day-by-day agenda; add an appointment to any day |
| **Ayarlar** | Business info, reminder message template with live preview, reminder window, editable task/part/fault-code lists, JSON backup export |

Other details: "Rehberden seç" (import from phone contacts, Android Chrome), "Şu anki konumu kaydet" (GPS pin so Yol tarifi goes to the exact door), photo of the unit label instead of typing serial numbers, photos are downscaled on the phone before upload, installable to the home screen (PWA), autosaving settings.

### Changes vs. the prototype
- **One name field** instead of first/last name.
- **Rooms** on AC units ("Salon", "Yatak odası") so a 3-unit house is readable.
- **Planned appointments** are real records (`visits.status = 'planned'`) and turn into the service record when completed — no double entry.
- **Reminders are derived**, not pre-generated: each unit stores `next_due_date`; anything due within N days (default 30) shows on Bugün until he reminds the customer (hidden for 14 days) or books them.
- **Reminder sending = WhatsApp/SMS deep link** with a prefilled message, free and works today. Automatic SMS (Netgsm / İleti Merkezi via a Supabase Edge Function + `pg_cron`) can be added later on the same data.
- Failure codes/parts stored as text arrays on the visit (no join tables); the libraries live in `settings`.

## Stack
- Vite + React 18 + TypeScript, Tailwind v4, `vaul` (bottom sheets), `sonner` (toasts), `lucide-react`, `date-fns` (tr locale), Onest font (self-hosted).
- Data: **Supabase** (Postgres + Auth + Storage, free tier is plenty for one technician). Without env vars the app runs in **demo mode** with localStorage and sample data.
- No server code: it's a static site. Deploy to Vercel / Netlify / Cloudflare Pages for free.

## Setup

```bash
npm install
npm run dev          # demo mode at http://localhost:5173
```

### Connect Supabase
1. Create a project at supabase.com (region: Frankfurt is closest).
2. SQL Editor → paste and run `supabase/schema.sql` (tables, RLS, private `photos` bucket).
3. Authentication → Users → **Add user** with his email + password. (There is no sign-up screen on purpose — nobody else can register.) Optionally turn off "Allow new users to sign up".
4. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. `npm run build` → deploy `dist/`. Set the same two env vars in the hosting dashboard.
6. On his phone: open the URL → Share/menu → **Ana ekrana ekle**. Log in once; the session persists.

Free-tier note: Supabase pauses projects after 7 days without traffic. A technician using it daily won't hit this, but in the off-season a free uptime ping (e.g. cron-job.org hitting the site) keeps it awake.

### Shareable preview
`npx vite build -c vite.preview.config.ts` produces one self-contained `dist-preview/index.html` in demo mode.

## Structure
```
src/
  lib/        types, constants (mahalleler, brands, BTU, defaults), util (dates, phone → wa.me, search)
  repo/       Repo interface + local (demo) and Supabase implementations, seed data
  store.tsx   in-memory snapshot, optimistic writes, due-list selector
  components/ ui kit, sheets (customer / unit / appointment / visit), rows & unit "sticker"
  screens/    Today, Customers, CustomerDetail, JobFlow, Calendar, Settings, Login
supabase/schema.sql
```

The whole dataset is loaded once at login (one technician = a few thousand rows at most), so search and the due list are instant and work while the signal drops in a basement.
