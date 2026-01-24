# UpRez MVP Requirements Document
**Berlin AI Hackathon - Arbio Track**  
*AI Agent for Vacation Rental Upsells*  
**Author**: Hackathon Coach | **Date**: Jan 23, 2026 | **Status**: Production-Ready Demo

## 🎯 Product Overview
**UpRez** detects upsell opportunities via channel manager events, generates personalized offers highlighting property diffs, sends HTML emails with images, and serves resilient landing pages with AI bot Q&A. Gracefully handles unavailable options by regenerating alternatives.

**Hack Goals**:
- [x] Use 3 partners: OpenAI, Lovable, Tower
- [x] 2min Loom + public GitHub
- [x] Arbio track prize (Lufthansa tickets)
- [x] Production polish (no 404s, real emails)

### Tech Stack
| Component | Tool | Purpose |
|-----------|------|---------|
| **IDE** | Antigravity (Google AI IDE) | Agentic coding: "Build FastAPI webhook → RAG → Gemma/OpenAI switch → Resend". [3][6] |
| **Frontend** | Next.js 15 (React/Vercel) | Offer page (top3 comparisons), bot UI. Vercel AI SDK. |
| **Backend** | FastAPI (Python) + SQLite | Webhooks, agent logic, DB ops. |
| **DB/Context** | SQLite (local) + Tower (demo) | Properties/offers. FAISS RAG. |
| **LLMs** | Gemma2 (Ollama: `ollama run gemma2:2b`) → OpenAI (GPT-4o-mini) | Gemma dev/Q&A; OpenAI demo/copy. Proxy for seamless switch. [4][5] |
| **Email** | Resend (API key free signup) | Send upsell emails w/ offer links. [1][2] |
| **RAG** | SentenceTransformers + FAISS | Prop metadata retrieval. |
| **Other** | Ngrok (webhooks), Postman (mock events), Docker (portable). |


### Data Requirements (Mocks)
- **12 Palma Properties**: JSON w/ `id, price, beds/baths, amenities[], location, metadata{elevator, bikes, pets, ...}`. [Previous mocks]  
- **Sample Reservations**: 5 JSON (booking_id, prop_id, guest_profile, dates).  
- **Events**: Cron/cancellation payloads for demos.  
Seed script: `python seed_db.py`.

## File Structure Repo ready
```
UpRez/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── agent.py             # LLM logic + RAG
│   ├── models.py            # Pydantic schemas
│   ├── db.py                # SQLite CRUD
│   ├── rag.py               # Embeddings/FAISS
│   ├── seed.py              # Mock data
│   ├── requirements.txt     # fastapi, uvicorn, ollama, openai, resend, sentence-transformers, faiss-cpu
│   └── docker-compose.yml   # Ollama + API
├── frontend/
│   ├── app/                 # Next.js pages: offer/[id], api/chat, host-settings
│   ├── components/          # ComparisonTable, UpgradeBot
│   ├── lib/ai.ts            # Vercel AI SDK (Ollama proxy compatible)
│   └── next.config.js
├── mocks/                   # properties.json, events.json
├── README.md                # Setup, demo script, partners screenshot
└── vercel.json              # Frontend deploy

```

## 📊 Data Models (SQLite Schema)
```sql
-- Properties (seed from mocks)
CREATE TABLE properties (
  id INTEGER PRIMARY KEY,
  name TEXT,
  price INTEGER,
  beds INTEGER, baths INTEGER,
  amenities JSON,  -- ["pool", "AC"]
  location TEXT,
  parking BOOLEAN, pool BOOLEAN,
  metadata JSON,   -- {"elevator": true, "bikes": 2}
  images JSON      -- ["pool.jpg", "exterior.jpg"]
);

-- Bookings
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  prop_id INTEGER NOT NULL,

  -- Core stay info
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  nights INTEGER NOT NULL,             -- derived: DATEDIFF(departure, arrival)
  
  -- Guest & occupancy
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  infants INTEGER DEFAULT 0,
  guest_country TEXT,
  guest_email TEXT,
  guest_name TEXT,

  -- Rate & pricing
  rate_code TEXT,                      -- e.g. FLEX, NONREF, WEEKLY
  base_nightly_rate_cents INTEGER,     -- original ADR in cents
  total_base_amount_cents INTEGER,     -- base_nightly_rate * nights
  fees_cents INTEGER DEFAULT 0,        -- cleaning, service, etc.
  taxes_cents INTEGER DEFAULT 0,
  discounts_cents INTEGER DEFAULT 0,   -- original discount, if any
  total_paid_cents INTEGER NOT NULL,   -- what they actually pay now

  currency TEXT DEFAULT 'EUR',

  -- Channel / meta
  channel TEXT,                        -- 'Airbnb','Direct','Booking'
  booking_source TEXT,                 -- 'website','OTA','phone'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Offers
CREATE TABLE offers (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER,
  original_prop_id INTEGER,
  top3 JSON,       -- [{"prop_id":4, "score":8, "diffs":["+pool"]}]
  copy TEXT,       -- Generated upsell text
  html_email TEXT,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',  -- active/partial/expired
  regen_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE host_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id TEXT NOT NULL UNIQUE,
  host_name TEXT,
  
  -- Revenue guardrails
  min_revenue_lift_eur_per_night DECIMAL(5,2) DEFAULT 30.00,
  max_discount_pct DECIMAL(3,2) DEFAULT 0.25,
  min_adr_ratio DECIMAL(3,2) DEFAULT 1.10,
  max_adr_multiplier DECIMAL(3,2) DEFAULT 2.50,
  
  -- Fee tracking
  channel_fee_pct DECIMAL(3,2) DEFAULT 0.18,
  change_fee_eur DECIMAL(5,2) DEFAULT 25.00,
  
  -- Operational constraints
  blocked_prop_ids TEXT,  -- JSON: [5,12]
  preferred_amenities TEXT,  -- JSON: ["pool","parking"]
  max_distance_to_beach_m INTEGER DEFAULT 5000,
  
  -- Offer strategy
  offer_validity_hours INTEGER DEFAULT 48,
  max_offers_per_month INTEGER,
  auto_regen_enabled INTEGER DEFAULT 1,
  
  -- Communication
  email_sender_address TEXT,
  email_sender_name TEXT,
  use_openai_for_copy INTEGER DEFAULT 0,
  
  -- Analytics (updated by system)
  offers_sent_this_month INTEGER DEFAULT 0,
  revenue_lifted_this_month DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate_pct DECIMAL(5,2),
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);
```

### Environment Vars
```
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
USE_OPENAI=false  # Flip for demo
DATABASE_URL=sqlite:///./offers.db
BACKEND_PORT=8080
FRONTEND_PORT=3030
```

## 🔄 Core Workflows

### 1. **Event Triggers** (2 Types)
| Trigger | Source | Payload Example |
|---------|--------|-----------------|
| **Cron (1wk Pre-Arrival)** | APScheduler daily 9AM | Scan `bookings` where `arrival_date - now = 7d` |
| **Cancellation** | Channel Manager Webhook | `{"event":"cancel", "prop_id":5, "dates":["2026-03-01:07"]}` |

### 2. **Offer Generation** (`POST /webhook`)
```
Webhook/Cron → Gemma classify top3 → OpenAI personalize copy → Store offer → Resend HTML email → Return offer_id
```

### 3. **Landing Page** (`GET /offer/{id}`)
```
Fetch offer → Check availability/expiry → Render available → Bot Q&A → "Find New" regen if needed
```

### 4. **Fallback Recovery**
```
Unavailable prop → Banner "Now booked" → Button "Find New Upgrades" → POST /regen → Agent alternatives → Optimistic UI
```

## 📱 Frontend Pages & Components

### Pages
```
app/
├── demo/page.tsx           # Trigger buttons (Cron/Cancel sim)
├── offer/[offer_id]/page.tsx  # Dynamic landing (no 404s)
└── api/
    ├── chat/route.ts       # Bot endpoint
    └── regen/route.ts      # Fallback handler
```

### Components
```
- ComparisonTable (top3 cards w/ images/diffs)
- UpgradeCard (available/unavailable states)
- UpgradeBot (Vercel AI chat → /bot)
- AlertBanner (expired/partial/regenerated)
```

## 🛠 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/channel-manager` | Handle cron/cancel → generate → email |
| GET | `/offer/{offer_id}` | Fetch + availability check |
| POST | `/regen/{offer_id}` | Fallback alternatives |
| POST | `/bot/query` | RAG + LLM Q&A |
| GET | `/demo/trigger/{type}` | Hack demo buttons |

## 🤖 Agent Logic (Gemma → OpenAI)

### Classify Top3
```
Input: booking, dates
Query available props → Score: beds(+2), pool(+3), parking(+2), family_fit
Output: top3 JSON
```

### Generate Copy
```
Template: "Hi {name}, upgrade to {prop}: +{diffs}. €{discount} off diff. 48h only!"
```

### Bot Q&A
```
Query → RAG(metadata) → "Using {context}, answer: {q}"
```

## 📧 HTML Email Template (Resend)
```html
<h1>Exclusive Palma Upgrade!</h1>
<p>Your Budget Apt → <strong>Poolside Villa: +1bed +pool +parking</strong></p>
<img src="cid:pool" width="300"/>  <!-- Upsell hero -->
<table> <!-- Diffs table --> </table>
<a href="/offer/{id}" style="background:#0070f3">View 3 Options (48h)</a>
```

## ⏰ Expiration & States
| State | Trigger | UI |
|-------|---------|----|
| **Active** | Fresh | Full top3 |
| **Partial** | 1-2 blocked | Banners + "Find New" |
| **Expired** | Time up | "Check new offers" + bot |

## 🎥 Demo Script (2min Loom)
```
1. Demo page → "Cron Trigger" → Email sent
2. Open HTML email → Click link → Offer page loads
3. "Simulate block" → Banners appear
4. "Find New" → Live regen + toast "2 new matches!"
5. Bot: "Elevator? Bikes?" → Metadata answers
6. "Switch to OpenAI" → Enhanced copy
7. Partners proof + €1.2k rev calc
```

## 🚀 Setup & Deploy
```
# Local
1. ollama run gemma2:2b
2. python seed.py  # Mocks
3. uvicorn main:app --reload
4. npm run dev
5. ngrok http 8000  # Webhooks

# Deploy
- Vercel: Frontend auto
- Railway: Backend + SQLite
- Resend: API key (.env)

# Switch LLM
USE_OPENAI=true
```

## 📦 Dependencies
**Python** (`requirements.txt`):
```
fastapi uvicorn sqlalchemy sqlite3
openai ollama-python resend
sentence-transformers faiss-cpu
apscheduler pydantic
```

**Next.js** (`package.json`):
```
next react @ai-sdk/openai lucide-react
tailwindcss clsx
```

### Detailed Implementation Steps

#### 1. Backend (FastAPI + Gemma/OpenAI + Resend)
```python
# main.py (excerpts)
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import resend
from openai import OpenAI  # Proxy compatible
import ollama
import sqlite3
from sentence_transformers import SentenceTransformer
import faiss

app = FastAPI()
resend.api_key = os.getenv("RESEND_API_KEY")
use_openai = os.getenv("USE_OPENAI", "false").lower() == "true"

client = OpenAI(base_url="http://localhost:11434/v1" if not use_openai else None, api_key="ollama")

class WebhookPayload(BaseModel):
    event: str
    booking_id: int
    dates: list

@app.post("/webhook/channel-manager")
def handle_webhook(payload: WebhookPayload):
    # 1. Classify top3 (Gemma)
    top3 = classify_upgrades(payload.booking_id)  # RAG + LLM
    
    # 2. Gen copy (OpenAI/Gemma)
    copy = generate_copy(top3, payload)
    
    # 3. Store
    offer_id = store_offer(payload.booking_id, top3, copy)
    
    # 4. Send Resend email
    resend.Emails.send({
        "from": "UpRez <onboarding@resend.dev>",
        "to": ["guest@example.com"],
        "subject": "Upgrade Your Palma Stay!",
        "html": f"<p>{copy}</p><a href='http://localhost:3000/offer/{offer_id}'>View Offers</a>"
    })
    return {"offer_id": offer_id}

@app.post("/bot/query")
def bot_query(query: str, offer_id: int):
    context = rag_retrieve(offer_id, query)
    resp = client.chat.completions.create(
        model="gemma2" if not use_openai else "gpt-4o-mini",
        messages=[{"role": "user", "content": f"Context: {context}\nQ: {query}"}]
    )
    return {"answer": resp.choices[0].message.content}
```

#### 2. Frontend (Next.js)
```tsx
// app/offer/[id]/page.tsx
import { fetchOffer } from '@/lib/api';

export default async function OfferPage({ params }: { params: { id: string } }) {
  const offer = await fetchOffer(params.id);
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>Upgrade Options</h1>
      <ComparisonTable options={offer.top3} />
      <UpgradeBot offerId={params.id} />
    </div>
  );
}

// components/UpgradeBot.tsx (Vercel AI SDK)
'use client';
import { useChat } from 'ai/react';

export function UpgradeBot({ offerId }: { offerId: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `/api/chat?offer_id=${offerId}`  // Proxies to FastAPI /bot
  });
  // Chat UI...
}
```

#### 3. Switch Gemma → OpenAI
- Dev: `USE_OPENAI=false` → Ollama proxy (`base_url: http://localhost:11434/v1`).[4][5]
- Demo: `true` → Real OpenAI (show credits usage).  
Ollama: `ollama serve & ollama pull gemma2:2b`.

#### 4. Resend Setup
1. Signup resend.com → Free API key.  
2. Verify domain (or use resend.dev).  
3. `pip install resend` → Done.[2][1]


## ✅ Success Metrics (Judges)
- **Technical**: Agent fallback, RAG bot, real emails, cron
- **Arbio Fit**: Post-onboarding revenue → property diffs from metadata
- **Demo**: End-to-end, no crashes, € lift calc
- **Polish**: No 404s, images, responsive UI

#### Hack Deliverables
- **Repo**: Public GitHub w/ Docker, seeds, README (partners proof).  
- **Video**: 2min: Mock cancel → Resend email → Page + bot Q&A → "Switch to OpenAI live".  
- **Live Demo**: Vercel frontend + ngrok backend.[7]

#### Partner Integration Screenshots
```
- OpenAI: API logs screenshot
- Tower: "DB traces" (SQLite → Tower migration)
- Lovable: "UI generated via TECHEUROPEBERLIN"
```

***

**Antigravity Prompt**: "Implement this complete UpRez MVP spec. Start with FastAPI backend (webhook/cron/regen/bot), SQLite schema+seed, Gemma RAG. Then Next.js frontend (demo/offer pages, bot). Add Resend HTML emails with images. No 404s—graceful fallbacks. Docker-ready repo."

**Estimated Build**: 6-8h solo | **Team Roles**: You (React/Python), Backend (1), Designer (UI polish).

**Paste this into Antigravity** → Execute plan → Win Arbio track! 🏆[1][2]

Sources
[1] {Tech: Europe} Berlin AI Hackathon - Luma https://luma.com/berlin-ai-hack
[2] Send emails with FastAPI - Resend https://resend.com/docs/send-with-fastapi
[3] UpRez-Vacation-Rental-Upsell.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/143557486/e58ad8b2-5d53-429a-abd6-90d26a72cf35/UpRez-Vacation-Rental-Upsell.pdf
