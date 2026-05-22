# Deployment Guide

## Environment Variables

Copy `.env.example` to `.env.local` (development) or configure in your hosting dashboard (production).

Required:
- `MONGODB_URI`
- `JWT_SECRET` / `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `OPENAI_API_KEY` + `USE_OPENAI_FALLBACK=true`
- `RASA_URL`

## Local Development

```bash
npm install
cp .env.example .env.local
npm run seed          # MongoDB must be running
npm run dev           # Terminal 1 – port 3000
npm run dev:socket    # Terminal 2 – port 3001
```

## Vercel (Next.js)

1. Connect GitHub repository
2. Framework preset: **Next.js**
3. Add all env vars from `.env.example`
4. Use **MongoDB Atlas** for `MONGODB_URI`
5. Deploy Socket.IO separately (see below)

> Socket.IO cannot run on Vercel serverless. Deploy `src/socket/server.ts` to Railway or Render.

## Railway / Render (Socket Server)

- **Start command:** `npm run start:socket`
- **Port:** `3001` (set `SOCKET_PORT`)
- **Env:** `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (your Vercel URL)

Update `NEXT_PUBLIC_SOCKET_URL` on Vercel to point to this service.

## Docker

```bash
docker compose up -d
```

Services: `mongodb`, `app` (3000), `socket` (3001), `rasa` (5005).

## Rasa Production

```bash
cd rasa
rasa train -o models
rasa run --enable-api --cors "*"
```

Point `RASA_URL` to your Rasa instance.

## Post-Deploy Checklist

- [ ] Run `npm run seed` on production DB (once)
- [ ] Change default admin/agent passwords
- [ ] Enable HTTPS on all services
- [ ] Set strong `JWT_SECRET` values
- [ ] Configure CORS_ORIGIN to production domain only
