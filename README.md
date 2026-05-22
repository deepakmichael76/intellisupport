# AI-Powered Customer Support Chatbot Platform

Enterprise-grade customer support platform with NLP intent recognition, real-time live agent handover, analytics, and admin training — built with **Next.js 15**, **MongoDB**, **Socket.IO**, **Rasa**, and **OpenAI**.

## Features

- JWT authentication with refresh tokens and role-based access (`user`, `admin`, `support-agent`)
- ChatGPT-style chat UI with typing indicators, dark mode, emoji picker, file upload
- Configurable NLP pipeline via `NLP_MODE` (`db` | `rasa` | `hybrid`) — **no API keys required** in default mode
- Confidence-based escalation to live support agents via Socket.IO
- Admin dashboard with Recharts analytics
- Intent management and user/agent administration
- Chat export, conversation search, rate limiting, Zod validation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI, Framer Motion |
| Backend | Next.js API Routes, Node.js |
| Real-time | Socket.IO (standalone server) |
| Database | MongoDB + Mongoose |
| AI/NLP | MongoDB intents + Rasa (optional) + local rules |
| Auth | JWT, bcrypt |

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Optional: Rasa server (for `NLP_MODE=rasa` or `hybrid`)
- **No OpenAI API key needed** for the recommended setup

## Recommended setup (no API keys)

This is the default configuration — best for college demos and local development.

**`.env.local`:**
```env
NLP_MODE=db
USE_OPENAI_FALLBACK=false
AI_CONFIDENCE_THRESHOLD=0.6
```

**Flow:**
```
User message → MongoDB intents (seed/admin) → custom response
                    ↓ no match
              local keyword rules → response
                    ↓ low confidence
              escalate to live agent (Socket.IO)
```

| `NLP_MODE` | Pipeline | API keys? |
|------------|----------|-----------|
| `db` *(default)* | MongoDB intents → local keywords | No |
| `rasa` | Rasa NLU → DB → local | No |
| `hybrid` | Rasa → DB → OpenAI (if enabled) → local | Only if OpenAI enabled |

Verify NLP config: [http://localhost:3000/api/nlp/status](http://localhost:3000/api/nlp/status)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB URI and secrets.

### 3. Seed database

```bash
npm run seed
```

Default accounts:
- **Admin:** `admin@supportai.com` / `Admin123!`
- **Agent:** `agent@supportai.com` / `Agent123!`

### 4. Run development servers

Terminal 1 – Next.js:
```bash
npm run dev
```

Terminal 2 – Socket.IO:
```bash
npm run dev:socket
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Optional: Rasa

```bash
cd rasa
rasa train
rasa run --enable-api --cors "*"
```

Set in `.env.local`:
```env
NLP_MODE=rasa
RASA_URL=http://localhost:5005
```

## Project Structure

```
src/
├── app/              # Pages & API routes
├── components/       # UI components
├── lib/              # DB, auth, validators
├── services/         # NLP, chat, analytics
├── models/           # Mongoose schemas
├── middleware/       # Auth helpers
├── socket/           # Socket.IO server
├── hooks/            # React hooks
├── store/            # Zustand auth store
└── types/            # TypeScript types
rasa/                 # Rasa training data
scripts/seed.ts       # Database seeder
```

## API Overview

See [docs/API.md](docs/API.md) for full API documentation.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/chat` | Send message, get AI reply |
| GET | `/api/history` | Conversation history |
| POST | `/api/intent` | Create/update intent (admin) |
| GET | `/api/analytics` | Analytics dashboard (admin) |
| POST | `/api/live-agent/connect` | Escalate to live agent |

## Deployment

### Vercel (Frontend + API)

1. Push to GitHub and import in Vercel
2. Set environment variables from `.env.example`
3. Use MongoDB Atlas for `MONGODB_URI`
4. Deploy Socket.IO server separately (Railway/Render)

### Docker

```bash
docker compose up -d
```

### Socket server (Railway/Render)

Deploy `src/socket/server.ts` with:
- `npm run start:socket`
- Env: `MONGODB_URI`, `JWT_SECRET`, `SOCKET_PORT`, `CORS_ORIGIN`

## Architecture

**Default (`NLP_MODE=db`):**
```
User → Chat UI → /api/chat → NLP (DB intents → local rules)
              ↓
        MongoDB (conversations, intents, analytics)
              ↓
   confidence < threshold? → Socket.IO → Live Agent
```

**With Rasa (`NLP_MODE=rasa` or `hybrid`):**
```
User → Rasa (intent + response) → fallback to DB/local if Rasa unavailable
```

## License

MIT
