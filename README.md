# LEAFVA — IT Intelligence, Powered by Nature and Technology

Full-stack IT services platform with a public marketing site, AI-powered intake chat, and an internal admin dashboard (ERP).

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TailwindCSS, shadcn/ui, React Router |
| Backend | Python 3.11+, FastAPI, uvicorn |
| Database | **Supabase** (PostgreSQL) |
| AI | **Groq** — open-source LLaMA 3.3 70B via OpenAI-compatible API |
| Payments | Stripe (direct SDK) |
| Email | Resend |
| Hosting | Cloudflare Pages (frontend) |

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `backend/supabase_schema.sql`
3. Copy your **Project URL** and **service_role** key

### 2. Groq API Key
Get a free key at [console.groq.com](https://console.groq.com/keys)

### 3. Backend
```bash
cd backend
cp .env.example .env          # fill in your keys
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env          # set REACT_APP_API_URL
yarn install
yarn start
```

### 5. Deploy to Cloudflare Pages
- Connect your GitHub repo in the [Cloudflare Pages dashboard](https://dash.cloudflare.com/)
- **Build command:** `yarn build`
- **Build output:** `build`
- **Root directory:** `frontend`
- Add `REACT_APP_API_URL` as an environment variable pointing to your live backend

## Default Admin
- **URL:** `/admin/login`
- **Email:** `admin@leafva.com`
- **Password:** `LeafvaAdmin@2026`

> Change this immediately via **Admin → Settings** after first login.
