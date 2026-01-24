# UpRez System Architecture & Data Flow
**Berlin AI Hackathon – Arbio Track MVP**

***

## 1. High-Level System Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UpRez SYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   EVENT SOURCES          │
│  ┌────────────────────┐  │
│  │ Cron Job (9AM)     │  │
│  │ 1 week pre-arrival │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ Cancellation Hook  │  │
│  │ 5 days pre-arrival │  │
│  └────────────────────┘  │
└──────────────────────────┘
           │
           │ Webhook Payload
           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Python)                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ POST /webhook/channel-manager (Event Handler)             │  │
│  │  - Parse booking_id & event type                          │  │
│  │  - Fetch booking + original property from SQLite          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                       │
│                           ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ LLM Agent Layer (Gemma local → OpenAI flag)              │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ 1. Classify Upgrades (RAG + Scoring)                │ │  │
│  │  │    - Query available properties                      │ │  │
│  │  │    - Compute diffs (beds, amenities, location)       │ │  │
│  │  │    - Score viability (0-10)                          │ │  │
│  │  │    - Rank top3                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ 2. Calculate Offer Prices                            │ │  │
│  │  │    - from_adr (guest's current nightly rate)         │ │  │
│  │  │    - to_adr (upgrade property rate)                  │ │  │
│  │  │    - Apply 40% discount to diff                      │ │  │
│  │  │    - Output: offer_adr, offer_total, revenue_lift    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ 3. Generate Copy (OpenAI)                            │ │  │
│  │  │    - Personalized email subject + body               │ │  │
│  │  │    - Landing page copy snippet                       │ │  │
│  │  │    - "reasons" bullets for comparisons               │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                       │
│                           ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Data Persistence (SQLite)                                 │  │
│  │  - Store offer_candidates (top3 diffs + economics)        │  │
│  │  - Store offers (persisted for landing page)              │  │
│  │  - Track availability for regen logic                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            │ offer_id
                            ↓
        ┌───────────────────────────────────┐
        │   Email Service (Resend API)      │
        │  - HTML email with images         │
        │  - CID embedded property photos   │
        │  - Link: /offer/{offer_id}        │
        │  - 48h countdown timer            │
        └───────────────────────────────────┘
                            │
                Guest clicks link
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│              NEXT.JS FRONTEND (React + Vercel)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Landing Page: /offer/[offer_id]                           │ │
│  │  - Fetch offer from FastAPI: GET /offer/{offer_id}        │ │
│  │  - Check expiry + availability                            │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Render 3 Upgrade Options (Available ones)            │ │ │
│  │  │  ┌────────────────────────────────────────────────┐  │ │ │
│  │  │  │ Option 1 (Ranking 1)                           │  │ │ │
│  │  │  │  - Property name + images carousel             │  │ │ │
│  │  │  │  - Price breakdown: offer_adr, savings, total  │  │ │ │
│  │  │  │  - Diffs: +beds, +pool, +parking, +workspace   │  │ │ │
│  │  │  │  - [BOOK NOW] button                           │  │ │ │
│  │  │  └────────────────────────────────────────────────┘  │ │ │
│  │  │  ┌────────────────────────────────────────────────┐  │ │ │
│  │  │  │ Option 2 (Ranking 2)                           │  │ │ │
│  │  │  │ ...                                            │  │ │ │
│  │  │  └────────────────────────────────────────────────┘  │ │ │
│  │  │  ┌────────────────────────────────────────────────┐  │ │ │
│  │  │  │ Option 3 (Ranking 3 – "Stretch" luxury)       │  │ │ │
│  │  │  │ ...                                            │  │ │ │
│  │  │  └────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Unavailable State (Graceful Degradation)            │ │ │
│  │  │  - Show banner: "Option 1 now booked"               │ │ │
│  │  │  - [Find New Upgrades] button                        │ │ │
│  │  │    ↓ POST /regen/{offer_id}                         │ │ │
│  │  │    ↓ Agent re-classifies top3                       │ │ │
│  │  │    ↓ Updates offer in DB                            │ │ │
│  │  │    ↓ Page refreshes with new options                │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Upgrade Bot (AI Q&A)                                 │ │ │
│  │  │  - "Does it have an elevator?" query                 │ │ │
│  │  │  - RAG + Gemma/OpenAI retrieves metadata             │ │ │
│  │  │  - Streams answer via Vercel AI SDK                  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Expiry Timer: show countdown, disable book after 48h     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Demo Page: /demo (For on-stage trigger)                   │ │
│  │  - "Cron Trigger" button → POST /demo/trigger/cron        │ │
│  │  - "Simulate Cancel" button → POST /demo/trigger/cancel   │ │
│  │  - Real-time logs: offer created, email sent              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

***

## 2. Data Flow Sequences

### Sequence A: Cron Event → Offer Generation → Email

```
Timeline: 1 week before arrival (Cron fires at 9 AM)

1. TRIGGER
   ┌─────────────────────────────────┐
   │ APScheduler (background)        │
   │ check_cron_offers()             │
   │ → Find bookings: arrival_date - 7d = today
   └─────────────────────────────────┘
                  │
                  ↓ Webhook payload

2. BACKEND RECEIVES
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /webhook/channel-manager                              │
   │ {                                                           │
   │   "event": "cron",                                         │
   │   "booking_id": 1001                                       │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ SQL query

3. FETCH CONTEXT
   ┌─────────────────────────────────────────────────────────────┐
   │ SQLite SELECT queries:                                     │
   │  - booking: id=1001, prop_id=1, nights=7, guest={...}    │
   │  - property(1): Budget Beach Apt, price=150, beds=1      │
   │  - properties (all): for upgrade scoring                   │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ Python agent call

4. LLM AGENT CLASSIFIES UPGRADES (Gemma or OpenAI)
   ┌─────────────────────────────────────────────────────────────┐
   │ compute_score(original, candidate, booking)               │
   │  for each candidate in properties:                         │
   │   - Hard filter: beds >= 1, baths >= 1, WiFi present ✓  │
   │   - Score: +2 if beds>1, +3 if pool, +2 if parking       │
   │   - Filter by reasonableness (price_ratio < 5)            │
   │  Sort by score DESC → top3                                │
   │                                                            │
   │ Example result:                                            │
   │  1. Family 2BR Apt (id:3) → score 8.5                    │
   │  2. Mid-Tier Villa (id:4) → score 8.0                    │
   │  3. Poolside Apt (id:12) → score 7.5                     │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ Price calculation

5. CALCULATE OFFER PRICES
   ┌─────────────────────────────────────────────────────────────┐
   │ For each of top3:                                          │
   │  from_adr = 150€ (booking booking nightly)                │
   │  to_adr = {220, 350, 250} (candidates)                    │
   │  price_diff_per_night = {70, 200, 100}                    │
   │  discount = 40%                                            │
   │  offer_adr = from_adr + (diff × (1 - 0.40))             │
   │           = {150+42, 150+120, 150+60}                     │
   │           = {192, 270, 210}€/night                        │
   │  offer_total = offer_adr × 7 nights                       │
   │             = {1344, 1890, 1470}€                         │
   │  revenue_lift = {294, 840, 420}€                          │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ LLM copy generation

6. GENERATE PERSONALIZED COPY (OpenAI)
   ┌─────────────────────────────────────────────────────────────┐
   │ OpenAI GPT-4o-mini prompt:                                │
   │  "Guest: Alice, Germany, 2 adults, no car.                │
   │   Original: Budget Beach Apt (150€/nt, no pool, 1bed)    │
   │   Top option: Family 2BR (220€/nt, parking, +1 bed)      │
   │   Generate email copy (max 150 words) highlighting:       │
   │    - Extra bedroom, parking, better value."               │
   │                                                            │
   │ Output:                                                   │
   │  Subject: "Alice, upgrade to Family 2BR (+1 bed +parking)│
   │  Body: "Hi Alice, we found a perfect upgrade... ↓         │
   │   Save 280€ when you upgrade to the Family 2BR Apt!"     │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ SQL INSERT

7. PERSIST OFFER
   ┌─────────────────────────────────────────────────────────────┐
   │ INSERT into offers table:                                 │
   │  - offer_id = 5001 (auto-increment)                       │
   │  - booking_id = 1001                                      │
   │  - top3 = JSON:                                           │
   │    [{"prop_id":3,"offer_adr":192,"revenue_lift":294...}, │
   │     {"prop_id":4,"offer_adr":270,"revenue_lift":840...}, │
   │     {"prop_id":12,"offer_adr":210,"revenue_lift":420...}]│
   │  - status = 'active'                                      │
   │  - expires_at = now + 48h                                 │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ HTTP request to Resend

8. SEND EMAIL
   ┌─────────────────────────────────────────────────────────────┐
   │ Resend.Emails.send({                                      │
   │   "from": "UpRez <noreply@resend.dev>",               │
   │   "to": "alice.weber@example.com",                       │
   │   "subject": "Alice, upgrade to Family 2BR (+1 bed...)", │
   │   "html": "<h1>Exclusive Upgrade</h1>                    │
   │            <p>Save 280€ when you upgrade...</p>          │
   │            <img src='cid:family2br-pool' />              │
   │            <a href='https://app.uprez/offer/5001'>     │
   │              View 3 Options (48h)</a>"                   │
   │ })                                                         │
   │ → Resend returns response with message_id                │
   └─────────────────────────────────────────────────────────────┘
                  │
                  ↓ Guest clicks email link

9. GUEST LANDS ON /offer/5001
   ┌─────────────────────────────────────────────────────────────┐
   │ Next.js page: app/offer/[offer_id]/page.tsx              │
   │  - Parse URL param: offer_id = "5001"                    │
   │  - Fetch: GET /api/offer/5001                            │
   │  - Backend query: SELECT from offers WHERE id=5001       │
   │  - Return: offer object with top3, pricing, copy         │
   │  - Render: 3 option cards with [BOOK] buttons            │
   │  - Display: countdown timer (expires in 47h 23m)         │
   └─────────────────────────────────────────────────────────────┘
```

### Sequence B: Cancellation Event → Instant Upsell → Fallback Handling

```
Timeline: Guest on Property5 cancels 5 days before arrival (same dates as booking 1002)

1. TRIGGER
   ┌──────────────────────────────────────────┐
   │ Cancellation webhook from channel mgr    │
   │ {                                        │
   │   "event": "cancellation",               │
   │   "prop_id": 5,                          │
   │   "dates": ["2026-07-01", "2026-07-08"] │
   │ }                                        │
   └──────────────────────────────────────────┘
                  │
                  ↓ Match to overlapping bookings

2. FIND MATCHING BOOKINGS
   ┌──────────────────────────────────────────────────────────────┐
   │ SQLite query:                                              │
   │  SELECT * from bookings                                   │
   │  WHERE arrival_date <= "2026-07-08"                       │
   │    AND departure_date >= "2026-07-01"                     │
   │    AND id != 5  -- Don't re-offer to cancelled booking   │
   │                                                            │
   │ Result: booking_id=1002 (James Collins, 7 nights, 1450€) │
   └──────────────────────────────────────────────────────────────┘
                  │
                  ↓ Generate new offer

3. CLASSIFY & PRICE (same as Seq A steps 4-7)
   ┌──────────────────────────────────────────────────────────────┐
   │ Top3 for James (has_car=true, 2 children):               │
   │  1. Mid-Tier Villa (id:4) – score 9.5 (pool! kids!)     │
   │  2. Golf Villa (id:8) – score 8.0 (golf not relevant)    │
   │  3. Lux Beach House (id:5) – score 7.8 (luxury jump)    │
   │                                                            │
   │ Pricing for option 1:                                    │
   │  from_adr = 145€ (booked rate, EARLY_BIRD)              │
   │  to_adr = 350€                                           │
   │  offer_adr = 145 + (205 × 0.6) = 268€                   │
   │  offer_total = 268 × 7 = 1876€                           │
   │  revenue_lift = 426€                                     │
   └──────────────────────────────────────────────────────────────┘
                  │
                  ↓ Persist & send email (as above)

4. JAMES OPENS OFFER PAGE /offer/5002
   ┌──────────────────────────────────────────────────────────────┐
   │ Availability check on load:                              │
   │  GET /offer/5002                                         │
   │   → Check: is prop_id=4 (Mid-Tier Villa) still available?│
   │   → Query overlapping bookings 2026-07-01 to 07-08      │
   │   → Result: NOT booked (still available) ✓              │
   │   → Render all 3 options normally                        │
   └──────────────────────────────────────────────────────────────┘

5. LATER: SOMEONE BOOKS PROP_ID=4 FOR THOSE DATES
   ┌──────────────────────────────────────────────────────────────┐
   │ James refreshes page (or real-time sync):                │
   │  GET /offer/5002                                         │
   │   → Check: is prop_id=4 still available?                 │
   │   → Result: NOW BOOKED ✗                                 │
   │   → Option 1 becomes unavailable                         │
   │   → Return status='partial'                              │
   └──────────────────────────────────────────────────────────────┘

6. FRONTEND: GRACEFUL DEGRADATION
   ┌──────────────────────────────────────────────────────────────┐
   │ Landing page re-renders:                                 │
   │  ┌──────────────────────────────────────────────────────┐│
   │  │ ❌ Option 1: Mid-Tier Villa – UNAVAILABLE            ││
   │  │    (This property was just booked. Sorry!)           ││
   │  │    [Find New Upgrades for Same Dates] ← Button       ││
   │  └──────────────────────────────────────────────────────┘│
   │  ┌──────────────────────────────────────────────────────┐│
   │  │ ✓ Option 2: Golf Villa (still available)             ││
   │  │   268€/night → Save 420€ total                       ││
   │  │   [BOOK NOW]                                         ││
   │  └──────────────────────────────────────────────────────┘│
   │  ┌──────────────────────────────────────────────────────┐│
   │  │ ✓ Option 3: Lux Beach House (still available)        ││
   │  │   ...                                                ││
   │  └──────────────────────────────────────────────────────┘│
   └──────────────────────────────────────────────────────────────┘

7. JAMES CLICKS [FIND NEW UPGRADES]
   ┌──────────────────────────────────────────────────────────────┐
   │ Frontend: POST /regen/5002                               │
   │  → Backend re-runs classification                        │
   │  → Excludes prop_id=4 from candidates                    │
   │  → Regenerates top3 (next best matches)                  │
   │  → Updates DB: offers.top3 = new JSON, regen_count++    │
   │  → Returns new top3                                      │
   │                                                            │
   │ New ranking (excluding prop_id=4):                        │
   │  1. Golf Villa (id:8) – was #2, now #1                  │
   │  2. Lux Beach House (id:5) – was #3, now #2             │
   │  3. Seafront 2BR (id:9) – now #3 (new)                  │
   │                                                            │
   │ Page updates with toast: "✓ Found 2 new matches!"       │
   └──────────────────────────────────────────────────────────────┘

8. JAMES ASKS BOT: "Does the Golf Villa have WiFi?"
   ┌──────────────────────────────────────────────────────────────┐
   │ Frontend sends to Vercel AI:                             │
   │  POST /api/chat?offer_id=5002                            │
   │  { "message": "Does it have WiFi?" }                    │
   │                                                            │
   │  → Backend RAG:                                          │
   │    - Retrieve properties[8] metadata                     │
   │    - Extract: wifi=true, wifi_speed="good 100mbps"      │
   │                                                            │
   │  → Gemma2 reasoning:                                     │
   │    "Prompt: Using metadata, answer: Does it have WiFi? │
   │     Answer: Yes, the Golf Villa includes reliable WiFi   │
   │     (100 Mbps), suitable for remote work or streaming."  │
   │                                                            │
   │  → Frontend streams response in real-time               │
   └──────────────────────────────────────────────────────────────┘
```

***

## 3. Component Interaction Matrix

| Component | Calls | Called By | Data Flow |
|-----------|-------|-----------|-----------|
| **APScheduler (cron)** | `POST /webhook` | FastAPI | Event trigger payload |
| **FastAPI Backend** | Query SQLite, LLM, Resend | Scheduler, Next.js, ngrok webhooks | JSON request/response |
| **LLM Agent (Gemma→OpenAI)** | Classification, pricing, copy gen | FastAPI | Structured prompts + JSON |
| **SQLite** | Schema: bookings, properties, offers, offer_candidates | FastAPI | SQL queries, INSERT/UPDATE |
| **Resend API** | HTML email send | FastAPI | Email payload with CIDs |
| **Next.js Frontend** | GET /offer/{id}, POST /regen, POST /bot | Guest browser | JSON from FastAPI |
| **Vercel AI SDK** | Stream LLM responses | Next.js bot component | Server actions + streaming |
| **RAG (FAISS)** | Property metadata retrieval | LLM Agent (for bot Q&A) | Embedding similarity |

***

## 4. Data Storage & Persistence

### SQLite Tables Overview

```
bookings
├── id (PK)
├── prop_id (FK → properties)
├── arrival_date, departure_date, nights
├── adults, children, infants
├── guest JSON {name, email, country, has_car}
├── pricing JSON {rate_code, base_nightly_rate, total_paid, ...}
└── channel, created_at

properties
├── id (PK)
├── name, price (ADR), beds, baths
├── amenities [], location, parking, pool
├── metadata JSON {elevator, bicycles, pets_allowed, ...}
└── images []

offer_candidates
├── id (PK)
├── booking_id (FK)
├── from_prop_id, to_prop_id
├── viability_score, ranking (1-3)
├── offer_adr_cents, offer_total_cents, revenue_lift_cents
├── created_at

offers
├── id (PK)
├── booking_id (FK)
├── top3 JSON [offer_candidates...]
├── status (active / partial / expired)
├── expires_at TIMESTAMP
├── regen_count INT
├── generated_copy TEXT
├── html_email TEXT
├── email_sent_at, email_opened_at, email_clicked_at
└── created_at
```

### Data Life Cycle
```
1. Seed: seed.py → SQLite (properties.json, bookings.json)
2. Trigger: Event → Webhook → FastAPI
3. Classify: Agent → Score candidates → offer_candidates table
4. Persist: Insert offer row with top3 JSON
5. Send: Resend email with offer_id link
6. Fetch: Next.js GET /offer/{id} → Offers table
7. Check: Availability loop → Mark unavailable if booked
8. Regen: POST /regen → Re-classify, update top3
9. Expire: Cron checks offers.expires_at, marks expired
```

***

## 5. Key Integration Points

### Integration 1: Gemma (Local) ↔ OpenAI (Demo)
```
Environment variable: USE_OPENAI=false (default: Gemma)

GEMMA FLOW (Dev):
  Booking → FastAPI → Ollama HTTP://localhost:11434
          → Gemma2:2b classify, price, copy
          → Fast, free, local
          → Good for iteration

OPENAI FLOW (Demo):
  USE_OPENAI=true → OpenAI API (sk-...)
                  → GPT-4o-mini classify, price, copy
                  → Real credits used, better quality
                  → Show judges improved results

Toggle: Single env var, zero code changes (thanks to OpenAI-compatible proxy)
```

### Integration 2: Next.js ↔ FastAPI
```
Frontend (Vercel): /offer/[id]
  ├── useEffect(() => fetch(`/api/offer/${id}`))
  └── GET http://localhost:8000/offer/{id}  (dev)
      or GET https://UpRez-api.railway.app/offer/{id}  (prod)

Same origin: Vercel proxy /api/* to backend via env var
            (API_URL=https://backend.com in next.config.js)

Bot streaming: POST /api/chat
  ├── Vercel AI SDK useChat()
  └── Server Action calls FastAPI /bot/query
      (streams Gemma/OpenAI response)
```

### Integration 3: Resend ↔ Landing Page
```
Email link structure:
  https://UpRez.vercel.app/offer/5001?utm_source=email

Backend attaches meta
  - offers.email_sent_at = timestamp
  - Can track opens/clicks via Resend webhooks (future)

Offer expiry:
  - Email subject: "Upgrade (expires in 48 hours)"
  - Landing page timer countdown
  - DB enforces: offers.expires_at < now → 404 → "Offer expired"
```

### Integration 4: Bot RAG ↔ LLM
```
User asks: "Does it have an elevator?"

Bot flow:
  1. /api/chat → FastAPI /bot/query (prop_id, question)
  2. RAG retrieval:
     - properties[prop_id].metadata.elevator = true/false
     - Fetch context from offer_candidates.raw metadata
  3. Prompt:
     "Context: {prop_metadata_json}
      Q: Does it have an elevator?
      Answer concisely and helpfully."
  4. Gemma2 or OpenAI → Stream response

Example Q&A:
  Q: "Does the Golf Villa have WiFi?"
  A: "Yes, the Golf Villa includes WiFi (100 Mbps internet),
      ideal for remote work and video calls."
```

***

## 6. Demo Flow (Saturday Night Live)

```
Time: 10 minutes on stage

SETUP (hidden, pre-demo):
  ✓ Ollama running (ollama serve & ollama run gemma2:2b)
  ✓ SQLite seeded with bookings + properties
  ✓ FastAPI running (uvicorn main:app --reload)
  ✓ Next.js running (npm run dev)
  ✓ Ngrok tunnel open (ngrok http 8000)
  ✓ Resend API key in .env

DEMO STEPS:

1. [TRIGGER CRON] (30 sec)
   - Click button on /demo page
   - "Simulate 1-week pre-arrival for booking 1001 (Alice)"
   - Real-time logs: "Classified 12 properties... Top3: Family 2BR, Mid-Tier, Poolside"

2. [SHOW EMAIL] (30 sec)
   - Check email inbox (Resend test inbox or live)
   - "Subject: Alice, upgrade to Family 2BR Apt (+1 bed, +parking, save 280€)"
   - Scroll HTML email showing diff bullets + CID images

3. [CLICK OFFER PAGE] (2 min)
   - Click email link → /offer/5001
   - Page loads with 3 options side-by-side:
     ┌────────────────────────┐
     │ Option 1: Family 2BR   │
     │ 192€/night, save 280€  │
     │ +bed +parking +view    │
     │ [BOOK NOW]             │
     └────────────────────────┘
   - Scroll to bot chat
   - Type: "Does it have a washing machine?"
   - Bot replies in real-time: "Yes, the Family 2BR includes a washing machine..."

4. [SIMULATE BLOCK] (1 min)
   - "But what if that property got booked?"
   - Click "Simulate Block" button (or manually run SQL UPDATE)
   - Option 1 becomes grey, banner: "❌ Now unavailable"
   - Click [FIND NEW UPGRADES]
   - Page re-ranks: Mid-Tier Villa now #1
   - Toast: "✓ Found 2 new matches!"

5. [SWITCH TO OPENAI] (30 sec)
   - Toggle in demo: "USE_OPENAI=true"
   - Refresh page
   - "Now using OpenAI GPT-4o-mini for superior copy"
   - Show diff in bot response (more natural, nuanced)

6. [REVENUE MATH] (1 min)
   - Show slide / dashboard screenshot:
     Original booking: 1,250€ (7 nights @ 150€ + fees)
     Upgraded offer: 1,344€ (7 nights @ 192€ + fees)
     Revenue lift: 94€ per stay
     With 40% conversion rate: 40 upgrades/month = 3,760€ extra
     Plus ancillaries (boats, kayaks): +260€ per stay
     = 10,400€ monthly potential (from one host!)
```

***

## Summary

This diagram covers:
- **Event sources** (cron, webhooks)  
- **Backend orchestration** (FastAPI, LLM agent, SQLite)  
- **Frontend rendering** (Next.js offer page, demo page, bot)  
- **Email delivery** (Resend with images)  
- **Availability + fallback** (graceful degradation + regen)  
- **LLM layer** (Gemma dev → OpenAI demo)  
- **Data flows** (2 key sequences: cron → offer, cancel → instant upsell)  
- **Demo runbook** (on-stage walkthrough)

