# API Documentation

Base URL: `http://localhost:3000`

Authentication: Bearer token in `Authorization` header or `accessToken` cookie.

---

## Authentication

### POST `/api/auth/signup`

Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200` – `{ user, accessToken, refreshToken }`

---

### POST `/api/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200` – `{ user, accessToken, refreshToken }`

---

### POST `/api/auth/refresh`

**Body:**
```json
{
  "refreshToken": "..."
}
```

Or send `refreshToken` cookie.

**Response:** `200` – `{ accessToken, refreshToken }`

---

## Chat

### POST `/api/chat`

Send a message and receive an AI response.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "message": "Track my order",
  "conversationId": "optional-mongo-id"
}
```

**Response:**
```json
{
  "conversationId": "...",
  "message": "I can help track your order...",
  "intent": "order_status",
  "confidence": 0.82,
  "escalated": false,
  "source": "local",
  "messages": []
}
```

---

### GET `/api/history`

**Query params:**
- `conversationId` – get single conversation
- `q` – search conversations

---

### GET `/api/export?conversationId=...`

Download chat as plain text file.

---

### POST `/api/upload`

Multipart form with `file` field. Max 5MB.

**Response:** `{ "url": "/uploads/filename" }`

---

## Live Agent

### POST `/api/live-agent/connect`

**Body:**
```json
{
  "conversationId": "..."
}
```

---

## Admin (requires `admin` role)

### GET `/api/analytics`

Returns analytics summary for dashboard charts.

### GET `/api/admin/intents`

List all intents with usage stats.

### DELETE `/api/admin/intents?id=...`

Delete an intent.

### GET `/api/admin/users`

List all users.

### PATCH `/api/admin/users`

```json
{
  "userId": "...",
  "role": "support-agent"
}
```

### GET `/api/admin/conversations`

List escalated conversations (admin + support-agent).

---

## Intents

### POST `/api/intent`

Create or update intent (admin only).

```json
{
  "intentName": "order_status",
  "examples": ["track order", "where is package"],
  "responses": ["Please share your order number."]
}
```

### GET `/api/intent`

List intents (authenticated).

---

## Rate Limits

| Type | Limit |
|------|-------|
| Auth | 10 req/min per IP |
| Chat | 30 req/min per user |
| API | 60 req/min per identifier |

---

## Socket.IO Events

Connect to `NEXT_PUBLIC_SOCKET_URL` with `auth: { token: accessToken }`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_conversation` | Client → Server | `conversationId` |
| `send_message` | Client → Server | `{ conversationId, content }` |
| `typing` | Client → Server | `{ conversationId, isTyping }` |
| `new_message` | Server → Client | `{ conversationId, message }` |
| `active_chats` | Server → Agent | escalated conversations |
| `agent_joined` | Server → User | `{ conversationId, agentName }` |
