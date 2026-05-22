# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Next.js    │────▶│  API Routes      │────▶│  MongoDB    │
│  Frontend   │     │  (App Router)    │     │             │
└──────┬──────┘     └────────┬─────────┘     └─────────────┘
       │                     │
       │                     ▼
       │            ┌──────────────────┐
       │            │  Service Layer   │
       │            │  NLP / Chat /    │
       │            │  Analytics       │
       │            └────────┬─────────┘
       │                     │
       ▼                     ▼
┌─────────────┐     ┌──────────────────┐
│ Socket.IO   │     │  Rasa / OpenAI   │
│ Server      │     │  NLP Engines     │
└─────────────┘     └──────────────────┘
```

## Message Flow

1. User sends message via `/api/chat` or Socket.IO (escalated chats).
2. `chat.service` stores user message and calls `nlp.service`.
3. NLP mode (`NLP_MODE` env):
   - **`db`** (default): MongoDB intents → local keywords
   - **`rasa`**: Rasa NLU → MongoDB → local keywords
   - **`hybrid`**: Rasa → MongoDB → OpenAI (if enabled) → local keywords
4. If confidence < threshold (`AI_CONFIDENCE_THRESHOLD`), conversation status becomes `escalated`.
5. Escalated chats appear in agent dashboard; agents join via Socket.IO rooms.

Check runtime config: `GET /api/nlp/status`

## Security Layers

- **JWT** access (15m) + refresh (7d) tokens
- **bcrypt** password hashing (12 rounds)
- **Zod** input validation on all API bodies
- **Rate limiting** per IP/user
- **RBAC** middleware for admin/agent routes
- **CORS** on Socket.IO server

## Data Models

- **User** – auth, roles, online status
- **Conversation** – embedded messages, escalation state
- **Intent** – training examples and responses
- **Analytics** – event stream for metrics

## Deployment Split

| Component | Platform |
|-----------|----------|
| Next.js app | Vercel |
| Socket.IO | Railway / Render / AWS |
| MongoDB | Atlas |
| Rasa | Docker / dedicated VM |

Vercel serverless cannot host persistent WebSocket connections; the Socket.IO server runs as a separate Node process.
