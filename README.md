# Lead Scraper

A standalone Google Maps lead scraper — niche + city in, a table of real businesses (phone,
website, rating, address) out. Built to replace the Base44-locked workshop template with
something you fully own and run yourself.

Apify still does the actual scraping (Google Maps doesn't have a public API for this, and
Apify's actor handles pagination/CAPTCHAs reliably). Everything else — the app, the database,
the UI — is yours.

## Stack

- **Backend:** Node.js + Express. Talks to Apify's API, stores leads in a local JSON file.
- **Frontend:** React (Vite). Form to kick off a scrape, polling status indicator, results
  table with CSV export and a "Qualified" checkbox per lead.

## Setup

### 1. Get an Apify token

Sign up at [apify.com](https://apify.com) (no affiliate link needed — direct signup is free),
then grab your API token from **Settings → Integrations**.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# open .env and paste your real APIFY_TOKEN in
npm start
```

Runs on `http://localhost:4000`.

### 3. Frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173` (Vite will tell you the exact port).

### 4. Use it

Open the frontend URL, enter a niche (e.g. "roofing contractors") and a city, hit Scrape.
First run takes 30-90 seconds depending on result count — the status bar polls automatically
and the table fills in once the scrape finishes.

## Notes on data storage

Leads are stored in `server/data/db.json` — a flat file, not a real database. This is
intentional for getting started fast with zero setup. The file `server/src/db/store.js` is the
only place that knows about this; every route calls functions like `getProspects()` and
`insertProspect()` without caring how data is stored.

To move to a real database later (Postgres, MySQL, SQLite with a working native build, etc.):
rewrite the internals of `store.js` to hit your database instead of the JSON file, keeping the
same exported function names. Nothing else in the app needs to change.

## Security note

Never commit `server/.env` or paste your Apify token anywhere public (chat, screenshots,
GitHub commits). `.gitignore` already excludes it. If a token is ever exposed, revoke it
immediately in the Apify console and generate a new one.

## Deploying it as a website (Render + Vercel, both free)

This makes the app reachable from any browser, not just your own machine. Since it's for your
use only, it's protected by a simple access code (set below) so nobody else who finds the URL
can run scrapes on your Apify account.

### 1. Put the code on GitHub

You'll need a GitHub account (free). Create a new repository and push this folder to it —
either via GitHub Desktop (easiest if you're not comfortable with git commands) or the
command line. Both Render and Vercel deploy by connecting to a GitHub repo.

### 2. Deploy the backend to Render

1. Sign up at [render.com](https://render.com) (free, can use GitHub login)
2. **New → Web Service** → connect your GitHub repo
3. Set **Root Directory** to `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Under **Environment Variables**, add:
   - `APIFY_TOKEN` → your real Apify token
   - `ACCESS_CODE` → make up a passcode only you know (e.g. a word + number)
7. Deploy. Render gives you a URL like `https://your-app-name.onrender.com`

Note: Render's free tier "sleeps" after inactivity and takes ~30 seconds to wake up on the
next request — normal for free hosting, not a bug.

### 3. Deploy the frontend to Vercel

1. Sign up at [vercel.com](https://vercel.com) (free, can use GitHub login)
2. **Add New → Project** → import the same GitHub repo
3. Set **Root Directory** to `client`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE` → your Render URL + `/api`, e.g. `https://your-app-name.onrender.com/api`
5. Deploy. Vercel gives you a URL like `https://your-app-name.vercel.app`

### 4. Use it

Open your Vercel URL from any device. You'll be asked for the access code you set in step 2 —
enter it once and it's remembered for that browser session.



- No Base44 dependency — this is a plain Node/React app you can host anywhere (or just run
  locally).
- No vendor lock-in on the data layer — your leads live in a file you control, swappable to
  any real database.
- Same core feature set: niche/city/max-results form, paginated-ish results table, CSV export,
  Qualified checkbox, dedup by Google place ID across scrapes.
