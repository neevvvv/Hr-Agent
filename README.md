# HR Agent 🤖

An **agentic AI HR leave management system**. Employees chat with an AI to check balances, look up policy, and draft leave requests. HR admins approve from a separate queue. Built with **human-in-the-loop** safety: the AI drafts, the user confirms, the admin approves — no auto-actions.

## 🔗 Live demo

**App**: [https://hr-agent-omega.vercel.app/]  *(replace with your Vercel URL)*
**Code**: https://github.com/neevvvv/hr-agent

### Demo accounts

| Role | Email | Password |
|---|---|---|
| 👤 Employee | `rahul@xyzcorp.com` | `password123` |
| 👔 HR Admin | `priya.hr@xyzcorp.com` | `password123` |

> ⏳ **First request takes ~30 seconds.** The backend is on Render's free tier, which sleeps after 15 minutes of inactivity. Subsequent requests are fast.

---

## ✨ What it does

### For employees
- 📊 View leave balance (Annual / Sick / Casual) for the current year
- 📝 Submit leave requests via a form or by chatting with the AI
- 📋 Track personal request history with status badges (pending / approved / rejected)
- 🤖 Ask the AI: *"how many casual leaves do I have?"*, *"draft a leave for 2026-08-10 to 2026-08-12 for a wedding"*

### For HR admins
- 📥 See all pending requests across the org in a single queue
- ✅ Approve or ❌ reject with one click
- 🤖 See which requests were AI-drafted (violet badge)
- 🔒 Role-gated: regular employees can't access this view

### The "agentic" part
The AI doesn't just chat — it can **take actions**:
1. **Decides** which tool to use based on the user's intent
2. **Calls** the tool (`getLeaveBalance`, `getLeavePolicy`, `listMyRequests`, `draftLeaveRequest`)
3. **Reads** the database with the user's identity (via JWT)
4. **Replies** in natural language

When the AI drafts a leave request, it appears as an **amber confirmation card** in the chat. Only when the user clicks **Confirm** does it actually hit the DB. The AI cannot create or approve leave on its own.

---

## 🧠 Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind v4 + React Router |
| **Backend** | Node.js + Express + Zod (validation) |
| **Database** | PostgreSQL (Supabase Transaction Pooler) |
| **AI** | Llama 3.3 70B via Groq (OpenAI SDK-compatible function calling) |
| **Auth** | JWT (12h expiry) + bcrypt password hashing |
| **Hosting** | Vercel (frontend) + Render (backend) + Supabase (database) |

---

## 🏗️ Architecture

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  React (Vercel)  │──────▶│ Node + Express   │──────▶│   PostgreSQL     │
│  hr-agent.app    │ HTTPS │   (Render)       │  TLS  │   (Supabase)     │
└──────────────────┘       └────────┬─────────┘       └──────────────────┘
│
│ HTTPS
▼
┌──────────────────┐
│ Llama 3.3 70B    │
│     (Groq)       │
└──────────────────┘

### Security design

- 🔒 The frontend **never** talks directly to Groq or the database. All requests go through the backend.
- 🔑 JWT is verified on every protected route via middleware.
- 🛡️ Role-based access is enforced server-side (`requireRole('admin')`).
- 🤖 Tool calls execute server-side with the **authenticated user's identity** — the LLM cannot ask for someone else's data.
- 🛟 Balance updates use a database transaction, so status flip + balance deduct are atomic.
- 🚫 The AI's `draftLeaveRequest` tool returns a draft only — never writes to the DB. The actual `POST /leave` only fires when the human clicks **Confirm**.

---

## 📁 Project structure

hr-agent/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   ├── runner.js         # OpenAI/Groq tool-calling loop
│   │   │   ├── tools.js          # 4 tools: balance, policy, requests, draft
│   │   │   └── systemPrompt.js
│   │   ├── db/
│   │   │   ├── connection.js     # pg pool with prepare/get/all/run shim
│   │   │   ├── schema.sql        # 5 tables (PostgreSQL)
│   │   │   └── seed.js           # Idempotent seed: users, types, balances
│   │   ├── middleware/
│   │   │   └── authJwt.js        # JWT verify + requireRole(role)
│   │   ├── routes/
│   │   │   ├── auth.js           # POST /auth/login
│   │   │   ├── leave.js          # GET/POST/PATCH /leave/*
│   │   │   └── agent.js          # POST /agent/chat
│   │   └── server.js             # Express app with dynamic CORS
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js         # fetch wrapper with token header
│   │   │   ├── leave.js
│   │   │   └── agent.js
│   │   ├── auth/
│   │   │   └── AuthContext.jsx   # JWT in localStorage
│   │   ├── components/
│   │   │   ├── BalanceCards.jsx
│   │   │   ├── LeaveRequestForm.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   └── ChatBox.jsx       # Floating bubble + draft confirm card
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx     # Employee view
│   │   │   └── AdminQueue.jsx    # Admin view
│   │   └── App.jsx               # Router +  wrapper
│   ├── package.json
│   └── vite.config.js
└── README.md

---

## 🚀 Run locally

### Prerequisites
- Node.js 20+ (24+ tested)
- A free [Groq](https://console.groq.com/keys) API key for the LLM
- A free https://supabase.com/ Postgres database (or any Postgres connection string)

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
#   DATABASE_URL=postgresql://...:6543/postgres  (use Supabase Transaction Pooler)
npm run seed
npm run dev

Backend runs at http://localhost:4000. Test it: curl http://localhost:4000/health
Frontend
Shellcd frontendnpm installnpm run devShow more lines
Frontend runs at http://localhost:5173. Log in with one of the demo accounts above.

🌐 Deploy your own
Backend → Render

Push the repo to GitHub.
Render → New Web Service → connect your repo.
Settings:

Root Directory: backend
Build Command: npm install
Start Command: npm start


Environment variables: copy from your local .env (without PORT). Add FRONTEND_URL=https://your-vercel-app.vercel.app once you deploy the frontend.

Frontend → Vercel

Vercel → Add New Project → import the repo.
Settings:

Root Directory: frontend
Framework: Vite (auto-detected)


Environment variables:

VITE_API_URL: your Render backend URL, no trailing slash.



Database → Supabase

Create a free project, note the database password.
Use the Transaction Pooler connection string (port 6543) — works on Render and is safer for short-lived connections.
Add it as DATABASE_URL in Render's env vars.

📜 The AI's tools
The LLM has 4 tools available. Each is a JSON-schema-described function. The runner loops until the LLM stops calling tools, then returns the final reply.



ToolWhat it doesSide effectsgetLeaveBalance()Reads the current user's balanceNonegetLeavePolicy()Returns hardcoded policyNonelistMyRequests({ status })Lists the user's requestsNonedraftLeaveRequest({ leave_type, start_date, end_date, reason })Computes business days, checks balance, returns a draft objectNone — does NOT write to DB
The actual leave submission happens via POST /leave, which is triggered only by the frontend after the user clicks Confirm.

🧪 Try the AI
After logging in as Rahul, click the 🤖 bubble and try:

hi
what is the leave policy?
how many sick days do I have?
list my pending requests
I want leave from 2026-08-10 to 2026-08-12 for a wedding  (triggers draft card)
draft a sick leave for tomorrow

Edge case: I want 25 days annual leave starting 2026-09-01 — the draft card appears with a warning and the Confirm button is disabled because it exceeds your balance.

🎓 What I learned building this

How to design a tool-calling LLM loop with strict server-side execution
Why human-in-the-loop is non-negotiable for AI agents that can mutate data
How JWT + role middleware composes for a multi-role API
How to migrate a backend from SQLite to PostgreSQL with minimal route changes (via a prepare/get/all/run compatibility shim)
How to ship a free production stack: Vercel + Render + Supabase + Groq


📄 License
MIT — feel free to fork, learn from, and adapt.

Built with ☕ by https://github.com/neevvvv · A weekend project that turned into a real product.

---

## 🛠️ How to install it (the easy way)

### Option A — Run this in PowerShell (one command, creates the file for you)

```powershell
$env:Path += ";C:\Program Files\Git\cmd"
cd C:\Users\neev.sahu\hr-agent

@'
PASTE THE ENTIRE README CONTENT FROM ABOVE HERE
'@ | Out-File -Encoding utf8 README.md

git add README.md
git commit -m "docs: comprehensive README with architecture, tools, deploy guide"
git push
