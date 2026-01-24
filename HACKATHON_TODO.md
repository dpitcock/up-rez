# UpRez Hackathon Preparation Checklist

**Event**: Berlin AI Hackathon - Arbio Track  
**Date**: [Your hackathon date]  
**Deadline**: 2-minute Loom video + public GitHub repo

---

## Pre-Hackathon Setup (Do This NOW)

### 1. API Keys & Accounts ⚡

#### Required (Core MVP)

- [ ] **OpenAI Account**
  - [ ] Sign up at https://platform.openai.com/signup
  - [ ] Get API key from https://platform.openai.com/api-keys
  - [ ] Add $5-10 credits (GPT-4o-mini is cheap: ~$0.15/1M tokens)
  - [ ] Save key in `/Users/dpitcock/Code/up-rez/.env` as `OPENAI_API_KEY=sk-...`
  - [ ] Test with: `curl https://api.openai.com/v1/models -H "Authorization: Bearer sk-..."`

- [ ] **Resend Account (Email)**
  - [ ] Sign up at https://resend.com/signup
  - [ ] Verify email domain OR use onboarding@resend.dev (free)
  - [ ] Create API key from dashboard
  - [ ] Save key in `.env` as `RESEND_API_KEY=re_...`
  - [ ] Send test email via docs: https://resend.com/docs/send-with-fastapi

- [ ] **Ollama (Local LLM)**
  - [ ] Install: `brew install ollama` (Mac) or https://ollama.ai/download
  - [ ] Start service: `ollama serve`
  - [ ] Pull Gemma2: `ollama pull gemma2:2b` (~1.6GB download)
  - [ ] Test: `ollama run gemma2:2b "Hello, world!"`
  - [ ] Verify running: `curl http://localhost:11434/api/tags`

#### Optional (ML Enhancement - High Impact)

- [ ] **Runpod Account (GPU Training)**
  - [ ] Sign up at https://www.runpod.io/
  - [ ] Add $10 credits (GPU pods ~$0.20-0.50/hr)
  - [ ] Choose Jupyter template (PyTorch or TensorFlow)
  - [ ] Upload notebook: `train_purchase_model.ipynb`
  - [ ] **Alternative**: Use Google Colab free tier instead

- [ ] **OpenAI Credits (Synthetic Data)**
  - [ ] Add extra $5 if using GPT-4o for data generation
  - [ ] Estimated cost: ~$2-3 for 10k-50k synthetic rows

### 2. Tools & Infrastructure 🛠️

- [ ] **Docker & Docker Compose**
  - [ ] Verify: `docker --version` and `docker-compose --version`
  - [ ] If not installed: https://docs.docker.com/get-docker/

- [ ] **Ngrok (Webhook Testing)**
  - [ ] Sign up (free): https://ngrok.com/signup
  - [ ] Install: `brew install ngrok` or download
  - [ ] Get auth token from dashboard
  - [ ] Configure: `ngrok config add-authtoken YOUR_TOKEN`
  - [ ] Test: `ngrok http 8080`

- [ ] **Git & GitHub**
  - [ ] Create public repo: `github.com/dpitcock/up-rez`
  - [ ] Initialize: `git init` in `/Users/dpitcock/Code/up-rez`
  - [ ] Add remote: `git remote add origin https://github.com/dpitcock/up-rez.git`

### 3. Property Images 📸

- [ ] **Option 1: Use AI-Generated Images**
  - [ ] Use DALL-E 3 via OpenAI: https://platform.openai.com/docs/guides/images
  - [ ] Generate 9-12 property images (€0.04/image)
  - [ ] Prompts: "Modern vacation rental pool villa Palma Mallorca exterior photo"
  - [ ] Save to `backend/data/images/`

- [ ] **Option 2: Free Stock Photos**
  - [ ] Unsplash: https://unsplash.com/s/photos/vacation-rental
  - [ ] Pexels: https://www.pexels.com/search/villa/
  - [ ] Download 9-12 matching property types
  - [ ] Rename to match property names (e.g., `mid-tier-villa-exterior.jpg`)

- [ ] **Option 3: Placeholder Service**
  - [ ] Use https://placehold.co/600x400?text=Property+Image
  - [ ] Quick but less impressive for demo

### 4. Deployment Accounts 🚀

#### Frontend (Next.js)

- [ ] **Vercel Account**
  - [ ] Sign up: https://vercel.com/signup (use GitHub login)
  - [ ] Import project from GitHub
  - [ ] Set environment variables in Vercel dashboard
  - [ ] Auto-deploy enabled ✓

#### Backend (FastAPI)

- [ ] **Option 1: Railway**
  - [ ] Sign up: https://railway.app/
  - [ ] Free $5/month credits for hobby projects
  - [ ] Deploy from GitHub
  - [ ] Add Postgres addon if needed (SQLite works for demo)

- [ ] **Option 2: Render**
  - [ ] Sign up: https://render.com/
  - [ ] Free tier available
  - [ ] Deploy web service from GitHub
  - [ ] Set environment variables

- [ ] **Option 3: Local + Ngrok (Easiest for Demo)**
  - [ ] Just run `docker-compose up`
  - [ ] Expose via `ngrok http 8080`
  - [ ] Use ngrok URL for frontend API calls

---

## Environment Variables Summary 📝

Create `.env` file in project root:

```bash
# OpenAI (Required for production mode + ML data gen)
OPENAI_API_KEY=sk-proj-...

# Resend (Required for emails)
RESEND_API_KEY=re_...

# Ollama (Local LLM - should auto-work)
OLLAMA_URL=http://host.docker.internal:11434

# Mode Toggle
USE_OPENAI=false  # Set to 'true' for demo with better copy

# Database (SQLite for demo)
DATABASE_URL=sqlite:///./UpRez.db
```

Frontend `.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
# OR if deployed:
NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
```

---

## Day-Before Checklist ✅

### Testing

- [ ] Run database seed: `cd backend && python seed.py`
- [ ] Start services: `docker-compose up --build`
- [ ] Test backend: `curl http://localhost:8080/health`
- [ ] Test frontend: Open http://localhost:3030
- [ ] Trigger demo offer: Click "Cron Trigger" button
- [ ] Check email inbox for offer email
- [ ] Verify landing page loads: http://localhost:3030/offer/1
- [ ] Test bot Q&A: "Does this property have parking?"
- [ ] Test Gemma → OpenAI toggle works

### Presentation Prep

- [ ] Practice demo script (aim for <2 min)
- [ ] Prepare slides (3 max: Problem, Solution, Impact)
- [ ] Screenshot key moments for fallback
- [ ] Pre-record backup Loom if possible
- [ ] Prepare partner proof screenshots:
  - [ ] OpenAI API logs
  - [ ] Resend email dashboard
  - [ ] Ollama model list

---

## Estimated Costs 💰

| Item | Cost | When Needed |
|------|------|-------------|
| OpenAI API (core) | $5-10 | Before demo |
| OpenAI (ML data gen) | $2-3 | Optional |
| Resend Email | **FREE** | Core |
| Runpod GPU | $5-10 | Optional |
| Vercel Deploy | **FREE** | Core |
| Railway Deploy | **FREE** | Core (free tier) |
| Ngrok | **FREE** | Core (free tier) |
| **Total (Core MVP)** | **$5-10** | |
| **Total (with ML)** | **$20-25** | |

---

## Emergency Contacts & Links 🆘

- OpenAI Status: https://status.openai.com/
- Resend Docs: https://resend.com/docs
- Ollama Discord: https://discord.gg/ollama
- Hackathon Slack: [Your channel]
- Backup plan: Run everything locally + ngrok

---

## Final Pre-Demo

**30 minutes before:**

- [ ] All services running (`docker-compose up`)
- [ ] Ollama serving (`ollama serve`)
- [ ] Database seeded fresh (`python seed.py`)
- [ ] Browser open to demo page
- [ ] Email inbox ready (Gmail tab)
- [ ] Ngrok tunnel stable (if using)
- [ ] Phone on silent
- [ ] Slack notifications off
- [ ] Demo script visible (printed or second screen)

**You've got this! 🚀**
