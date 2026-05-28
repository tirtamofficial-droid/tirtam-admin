# Tirtam OS — Cloud Deployment Guide

Deploy Tirtam OS fully in the cloud with no localhost dependencies:

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend (React/Vite) | [Vercel](https://vercel.com) | Always-on static SPA |
| Database | [Supabase](https://supabase.com) | Already cloud-hosted |
| WhatsApp bot | [Railway](https://railway.app) | Always-on Node process (not Vercel) |

---

## Prerequisites

1. GitHub repository with this project pushed
2. Supabase project URL and keys (Dashboard → Settings → API)
3. Accounts on [vercel.com](https://vercel.com) and [railway.app](https://railway.app)

---

## Part A: Deploy website to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Add cloud deployment config"
git push origin main
```

### 2. Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory:** leave as repository root (`.`)
4. Framework Preset: Vite (auto-detected)
5. Build settings (also in `vercel.json`):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** public key |
| `VITE_WHATSAPP_BOT_URL` | Railway bot URL (set after Part B), e.g. `https://tirtam-bot-production.up.railway.app` |

> **Note:** For local dev, copy `.env.example` to `.env` and use `http://localhost:3001` for `VITE_WHATSAPP_BOT_URL`.

### 4. Deploy

Click **Deploy**. Vercel will build and host your SPA. `vercel.json` includes SPA rewrites so client-side routing works.

---

## Part B: Deploy WhatsApp bot to Railway

The bot must run as a long-lived process (WhatsApp session + daily cron). Do **not** deploy it to Vercel.

### 1. Create Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. **Root Directory:** `whatsapp-bot` (no extra path prefix)
5. **Config file path:** leave **empty**, OR set to `railway.json` only — **not** `whatsapp-bot/railway.json` (that path is only when root is the repo `.`)

> **Common error:** `service config at 'whatsapp-bot/railway.json' not found` — you set Root Directory to `whatsapp-bot` *and* Config file to `whatsapp-bot/railway.json`. Fix: clear Config file path or use `railway.json`.

### 2. Environment variables

In Railway → your service → **Variables**, set:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (secret — server only) |
| `WHATSAPP_SESSION_PATH` | `/data/whatsapp-session` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` (optional; Dockerfile sets this) |

Railway sets `PORT` automatically — the bot uses `process.env.PORT`.

> **Security:** Never commit the service role key. It is only set in Railway (and local `whatsapp-bot/.env` for dev).

### 3. Persistent volume (WhatsApp session)

So you only scan the QR code once across restarts:

1. Railway → service → **Volumes** → **Add Volume**
2. Mount path: `/data/whatsapp-session`
3. Ensure `WHATSAPP_SESSION_PATH=/data/whatsapp-session` is set

The bot stores WhatsApp auth under this path via `LocalAuth`.

### 4. Public URL

1. Railway → service → **Settings** → **Networking** → **Generate Domain**
2. Copy the public URL, e.g. `https://tirtam-bot-production.up.railway.app`

### 5. Deploy

Railway builds the Docker image (Chrome + Node) and starts `node index.js`. Check **Deploy Logs** for:

```
=== Tirtam WhatsApp Bot ===
API server listening on port ...
Initializing WhatsApp client...
```

---

## Part C: Connect frontend and bot

1. Open Vercel → Environment Variables
2. Set `VITE_WHATSAPP_BOT_URL` to your Railway URL (no trailing slash)
3. **Redeploy** the Vercel project (env changes require a new build)

The frontend reads this via `import.meta.env.VITE_WHATSAPP_BOT_URL` in `WhatsAppPage.tsx`.

---

## Part D: First-time WhatsApp connection

1. Open `https://<your-railway-domain>/qr` in a browser
2. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device**
3. Scan the QR code shown on the page
4. Wait until `/status` returns `"whatsapp": "connected"`

You can also verify from the Tirtam OS dashboard **WhatsApp** page once `VITE_WHATSAPP_BOT_URL` points to Railway.

### Daily 9am summary

The bot runs a `node-cron` job based on `whatsapp_config` in Supabase (`send_time`, `group_name`, `enabled`). No separate cron service is needed — it runs on the Railway server as long as the service stays up.

---

## Local development

### Frontend

```bash
cp .env.example .env
# Edit VITE_* values
npm install
npm run dev
```

### WhatsApp bot

```bash
cd whatsapp-bot
cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm start
```

Local bot URL: `http://localhost:3001` (default in frontend if `VITE_WHATSAPP_BOT_URL` is unset).

---

## Architecture diagram

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Vercel (SPA)   │ ──────────────►│  Railway (bot)   │
│  React + Vite   │  BOT API calls │  Express :PORT   │
└────────┬────────┘                └────────┬─────────┘
         │                                  │
         │ Supabase anon                    │ service_role
         ▼                                  ▼
         └──────────────┬───────────────────┘
                        │
                 ┌──────▼──────┐
                 │  Supabase   │
                 │  Postgres   │
                 └─────────────┘
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bot shows Offline in dashboard | Check `VITE_WHATSAPP_BOT_URL`, Railway domain, and CORS (bot allows all origins via `cors()`) |
| QR keeps appearing | Volume not mounted or wrong `WHATSAPP_SESSION_PATH` |
| Chrome / Puppeteer errors in Railway logs | Rebuild Docker image; confirm `PUPPETEER_EXECUTABLE_PATH` |
| Missing env on startup | Bot exits with message if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing |
| `whatsapp-bot/railway.json` not found | Root is already `whatsapp-bot` → set Config file to `railway.json` or blank, not `whatsapp-bot/railway.json` |
| Group not found | Use `/groups` endpoint or pick group name from dashboard after connect |

---

## Alternative: Render

You can deploy `whatsapp-bot/` to [Render](https://render.com) as a **Web Service** with the same Dockerfile, env vars, and a persistent disk mounted at `/data/whatsapp-session`. Steps mirror Railway Part B.

---

## Security checklist

- [ ] Service role key only in Railway/Render secrets (not in git)
- [ ] Frontend uses anon key only (`VITE_SUPABASE_ANON_KEY`)
- [ ] `.env` and `whatsapp-bot/.env` in `.gitignore`
- [ ] Railway volume protects WhatsApp session data
