# HR Agent 🤖

An **agentic AI HR platform** where employees and HR interact through a single AI assistant that takes real action — not just chats.

The assistant plans multi-step workflows, remembers user preferences across sessions, and always asks before mutating data. Four HR workflows (Leave, Profile, Documents, Tickets) all flow through the same draft → confirm → audit pipeline.

## 🔗 Live demo

**👉 [https://hr-agent.vercel.app](https://hr-agent.vercel.app)**

### Demo accounts (pre-filled on the landing page)

| Role | Email | Password |
|---|---|---|
| 👤 Employee | `rahul@xyzcorp.com` | `password123` |
| 👔 HR Admin | `priya.hr@xyzcorp.com` | `password123` |

> ⏳ **First request takes ~30 seconds.** Backend runs on Render's free tier which sleeps after 15 min idle. Subsequent requests are fast.

---

## ✨ What's inside

### 4 HR workflows
- 🌴 **Leave** — balance, drafts, requests, atomic balance updates on approval
- 👤 **Profile** — view + edit personal info with field-level audit log
- 📄 **Documents** — request letters (Employment, Salary, Experience, Address Proof, NOC) → HR approves → auto-generated letter ready to print/download
- 🎫 **Tickets** — threaded HR / IT / Payroll / Benefits / Policy conversations with a 4-state status machine

### 17 AI tools across the platform
Each workflow exposes 2–4 tools to the agent. Examples:
`getLeaveBalance` · `draftLeaveRequest` · `getMyProfile` · `draftProfileUpdate` · `draftDocumentRequest` · `listMyDocuments` · `draftTicket` · `getTicketsAwaitingMyReply` · `rememberThis` · `recallMemories` · `getMyNotifications` …

### 🧠 Long-term memory (pgvector + Cohere)
The agent quietly captures user preferences from conversation, stores them as 384-dim vectors, and retrieves the top-K most relevant memories per query via cosine similarity. Memories get injected into the system prompt — enabling personalization across sessions. Users see and control everything in the `/memories` page.

### 🔀 Multi-step planning with streaming reasoning
For complex requests like *"plan my Diwali week off"*, the agent runs a **ReAct planning loop**:
1. The LLM produces a JSON plan upfront
2. Each step executes a tool sequentially
3. Progress streams to the UI via **Server-Sent Events**
4. The user sees each reasoning step appear live

This is the unique differentiator — visible reasoning, not a black box.

### 🛡️ Human-in-the-loop everywhere
The AI **never auto-mutates state**. Every leave, profile change, document request, or ticket needs explicit user confirmation. HR approval gates apply on top for organizational data. Three checkpoints for state-changing operations.

---

## 🎬 Try the AI

After logging in, click the 🤖 bubble and try these prompts:

| Prompt | What it shows |
|---|---|
| `how many casual leaves do I have?` | Simple tool call + reply |
| `plan my Diwali week off` | 🤩 Multi-step planning with visible reasoning |
| `I need an experience letter for a new job` | Document draft → confirm → HR approves → letter generated |
| `my last paycheck was missing the WFH allowance` | AI categorizes as PAYROLL ticket, drafts it |
| `please remember that I prefer Friday afternoons off` | Explicit memory capture |
| `give me a complete overview of my account` | Multi-step planning across balance + tickets + notifications |
| `update my emergency contact phone to +91-9000000000` | Profile draft → confirm → save |

The agent decides whether to use **single-shot tool calling** (fast, for simple lookups) or **multi-step planning** (visible reasoning, for complex requests).

---

## 🏗️ Architecture

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  React (Vercel)  │──────▶│ Node + Express   │──────▶│   PostgreSQL    │
│   hr-agent.app   │ HTTPS │   (Render)       │  TLS  │   (Supabase)     │
└──────────────────┘       └────────┬─────────┘       │  + pgvector      │
▲                           │                         └──────────────────┘
│ SSE                       │
│ (thought stream)          │ HTTPS
│                           ▼
│                  ┌──────────────────┐       ┌──────────────────┐
│                  │ Llama 3.3 70B    │       │ Cohere Embeddings│
│                  │     (Groq)       │       │  (memory vectors)│
│                  └──────────────────┘       └──────────────────┘
│
└─── User watches reasoning steps appear in real time


**Request flow for a complex query:**
1. User types into the floating ChatBox
2. Frontend detects "complex" → calls `POST /plan/stream` (SSE)
3. Backend asks Llama to produce a JSON plan
4. Each plan step calls a registered tool (DB query + business logic)
5. Step results stream back to the browser
6. Final reply + optional draft card rendered
7. User clicks Confirm → real `POST /leave` (or `/documents`, `/tickets`, etc.)
8. HR sees the request in their unified queue → approves → atomic balance update → notification fires

---

## 🧠 Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind v4 + React Router | Fast dev, modern utility-first styling, file-based routing |
| **Backend** | Node.js + Express + Zod | Standard, minimal, schema validation built in |
| **Database** | PostgreSQL on Supabase (Transaction Pooler) | Free tier, generous limits, pgvector support |
| **Vector store** | pgvector with HNSW index | Co-located with relational data, fast cosine similarity |
| **LLM** | Llama 3.3 70B via Groq (OpenAI SDK-compatible) | Free, blazing fast inference, function calling |
| **Embeddings** | Cohere `embed-english-light-v3.0` | Free tier, 384-d vectors, OpenAI-compatible API |
| **Auth** | JWT (HS256) + bcrypt | Standard, stateless, role-based access |
| **Notifications** | In-app polling (30s) | Simple, no extra infra |
| **Streaming** | Server-Sent Events | Native HTTP, no WebSocket complexity |
| **Hosting** | Vercel (frontend) + Render (backend) + Supabase (DB) | Three free tiers, deployed end-to-end |

---

## 🛡️ Safety design

- 🔒 The frontend **never** talks directly to Groq, Cohere, or the database. All requests go through the backend.
- 🔑 JWT is verified on every protected route via middleware.
- 🛡️ Role-based access (`requireRole('admin')`) enforced server-side.
- 🤖 Tool calls execute with the **authenticated user's identity** — the LLM cannot ask for someone else's data.
- 🛟 Balance updates use a database transaction so status flip + balance deduct are atomic.
- 🚫 Every state-changing AI tool returns a **draft** that requires explicit user `Confirm`. The AI cannot create or approve on its own.
- 📋 Every mutation is recorded in the `audit_log` table with `actor_user_id`, old/new values, and an `ai_assisted` flag.
- 🔐 Per-user memory isolation — pgvector queries always filter by `user_id`.

---

## 🚀 Run locally

### Prerequisites
- Node.js 20+ (24+ tested)
- A free https://console.groq.com/keys
- A free https://dashboard.cohere.com/api-keys
- A free https://supabase.com Postgres database with the `pgvector` extension enabled

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and fill in:
#   JWT_SECRET=anything-long-and-random
#   OPENAI_API_KEY=gsk_your_groq_key
#   OPENAI_BASE_URL=https://api.groq.com/openai/v1
#   OPENAI_MODEL=llama-3.3-70b-versatile
#   COHERE_API_KEY=Co_your_cohere_key
#   COHERE_EMBED_MODEL=embed-english-light-v3.0
#   DATABASE_URL=postgresql://postgres.xxxxx:[pwd]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
npm run seed
npm run dev

Backend runs at http://localhost:4000. Test it: curl http://localhost:4000/health

Frontend

cd frontend
npm install
npm run dev

Frontend runs at http://localhost:5173. Open it and log in with one of the demo accounts.

Enable pgvector in Supabase
Once on the dashboard → SQL Editor → run:

CREATE EXTENSION IF NOT EXISTS vector;

Then npm run seed will create the memories table and the rest of the schema.

🌐 Deploy your own
Backend → Render

Push the repo to GitHub.
Render → New Web Service → connect your repo.
Settings:

Root Directory: backend
Build Command: npm install
Start Command: npm start


Environment variables: copy from your local .env (omit PORT). Add FRONTEND_URL=https://your-vercel-app.vercel.app once the frontend deploys.

Frontend → Vercel

Vercel → Add New Project → import the repo.
Settings:

Root Directory: frontend
Framework: Vite (auto-detected)


Environment variables:

VITE_API_URL: your Render backend URL, no trailing slash.



Database → Supabase

1. Create a free project (note the database password).
2. Enable pgvector: CREATE EXTENSION IF NOT EXISTS vector;
3. Use the Transaction Pooler connection string (port 6543) — works on Render and is safer for short-lived connections.
4. Add it as DATABASE_URL in Render's env vars.

## 📁 Project structure

hr-agent/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   ├── runner.js           # Single-shot agent loop with memory injection
│   │   │   ├── planner.js          # Multi-step JSON plan builder
│   │   │   ├── tools.js            # All 17 agent tools (registry)
│   │   │   └── systemPrompt.js
│   │   ├── db/
│   │   │   ├── connection.js       # pg pool with prepare/get/all/run shim
│   │   │   ├── schema.sql          # 11 tables
│   │   │   └── seed.js             # Idempotent seed: users, types, profiles, balances
│   │   ├── middleware/
│   │   │   └── authJwt.js          # JWT verify + requireRole(role)
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /auth/login
│   │   │   ├── leave.js            # GET/POST/PATCH /leave/*
│   │   │   ├── profile.js          # GET/PATCH /profile + /history
│   │   │   ├── documents.js        # CRUD + admin approval + auto-gen letters
│   │   │   ├── tickets.js          # CRUD + threaded replies + status machine
│   │   │   ├── notifications.js    # GET + mark-read
│   │   │   ├── memories.js         # CRUD for the memory inspector
│   │   │   ├── agent.js            # POST /agent/chat (single-shot)
│   │   │   └── plan.js             # POST /plan/stream (SSE multi-step)
│   │   ├── services/
│   │   │   ├── notifications.js    # notify / notifyAdmins helpers
│   │   │   ├── audit.js            # logAudit helper
│   │   │   ├── embeddings.js       # Cohere embedding wrapper
│   │   │   ├── memoryStore.js      # save / search / list / delete
│   │   │   └── letterGenerator.js  # 5 letter templates
│   │   └── server.js               # Express app with dynamic CORS
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                    # fetch wrappers per domain
│   │   ├── auth/                   # AuthContext (JWT in localStorage)
│   │   ├── components/
│   │   │   ├── ChatBox.jsx         # The agentic floating bubble (5 draft types)
│   │   │   ├── ThoughtStream.jsx   # The visible reasoning panel
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── BalanceCards.jsx
│   │   │   ├── LeaveRequestForm.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   ├── MarketingNav.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Marketing page with capability showcase
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx       # Home overview with greeting + quick actions + activity
│   │   │   ├── Leave.jsx           # Dedicated leave page
│   │   │   ├── Profile.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Tickets.jsx
│   │   │   ├── TicketDetail.jsx
│   │   │   ├── Memories.jsx        # Memory inspector
│   │   │   └── AdminQueue.jsx      # Unified queue for HR (leaves + docs + tickets)
│   │   └── App.jsx                 # Router + <Protected>
│   ├── package.json
│   └── vite.config.js
└── README.md


🎓 What I learned building this

Function-calling LLMs — designing tools as JSON-schema'd functions and orchestrating multi-tool sequences
The ReAct pattern — building a plan-then-execute loop that's resilient to malformed tool calls
Server-Sent Events — streaming reasoning progress to the UI without WebSocket complexity
pgvector at the edge — semantic memory with HNSW indexing for sub-100ms retrieval
The draft-confirm safety pattern — a generalizable abstraction for any AI mutation; the same UI primitive serves leaves, profiles, documents, and tickets
Migrating SQLite → Postgres mid-project — by building a compatibility shim around pg, the route handlers barely changed
CORS + JWT + multi-service deploys — wiring Vercel (frontend) + Render (backend) + Supabase (DB) + Groq + Cohere into one cohesive system
Defensive tool design — having LLM-callable tools return structured "draft_incomplete" results instead of crashing on partial inputs


📄 License
MIT — feel free to fork, learn from, and adapt.


👤 Author
Built by Neev Sahu

💼 https://www.linkedin.com/in/neev-sahu
🐙 https://github.com/neevvvv

If you found this interesting, a ⭐ on the repo would mean a lot.
