# UpRez - AI-Powered Vacation Rental Upsell Platform

**Status**: In Development  
**Demo Target**: Berlin AI Hackathon (Arbio Track)

## Overview

UpRez is an AI-powered upgrade engine for vacation rentals that:
- Detects upsell opportunities via booking triggers
- Generates personalized offers with intelligent property comparisons
- Sends HTML emails with property photos and pricing details
- Serves dynamic landing pages with AI-powered Q&A chatbot
- Gracefully handles unavailable properties with regeneration

## Tech Stack

- **Backend**: FastAPI (Python) + SQLite
- **Frontend**: Next.js 15 (React)
- **LLMs**: Gemma3 (Ollama) for dev, OpenAI GPT-4o-mini for production
- **RAG**: Property metadata retrieval for bot Q&A
- **Email**: Resend API for HTML emails
- **Deployment**: Docker Compose + Vercel + Ngrok

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Ollama installed with `gemma3:latest` model (for local LLM)
- Resend API key (free tier available)
- OpenAI API key (optional, for production mode)
- **Ngrok** (for local development with public exposure)

### Setup

1. **Clone and configure**:
```bash
cp .env.example .env
# Edit .env with your API keys
```

2. **Seed the database**:
```bash
cd backend
python seed.py
```

3. **Start services**:
```bash
docker-compose up --build
```

4. Access the application:
   - Backend API: http://localhost:8080
   - Frontend: http://localhost:3030
   - Demo page: http://localhost:3030/demo

## Infrastructure: Global Previews (Ngrok + Vercel)

For property images to appear correctly in **Email Templates** and for Vercel to communicate with your local backend, you must set up a public tunnel.

### 1. Local Tunnel (Ngrok)
Run ngrok to expose your local backend:
```bash
ngrok http 8080
```
Capture the `https://...ngrok-free.app` URL.

### 2. Configure Environment Variables
To ensure absolute image paths and cross-origin communication:

**Local Backend (`backend/.env`):**
```env
# URL where your images are hosted (your Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
```

**Vercel Frontend Settings:**
```env
# Point Vercel to your local machine via ngrok
NEXT_PUBLIC_BACKEND_URL=https://your-active-id.ngrok-free.app
```

> **Note**: For images to load in real email clients (Gmail, Outlook), the image files must be hosted on a public URL (like Vercel). The application will automatically prepend `FRONTEND_URL` to all property images during AI generation.

## Project Structure

```
up-rez/
├── backend/                    # FastAPI application
│   ├── services/              # Business logic
│   │   ├── offer_service.py   # Main offer generation
│   │   ├── scoring_service.py # Property comparison
│   │   ├── pricing_service.py # Price calculations
│   │   └── rag_service.py     # Q&A bot
│   ├── routers/               # API endpoints
│   ├── data/                  # Seed data (properties, bookings)
│   ├── database.py            # SQLite schema
│   ├── models.py              # Pydantic models
│   ├── seed.py                # Database seeding
│   └── main.py                # FastAPI app
├── frontend/                   # Next.js application
│   ├── app/                   # Pages
│   │   ├── demo/              # Demo trigger page
│   │   └── offer/[id]/        # Landing pages
│   └── components/            # React components
├── initial_data/              # Documentation and specs
└── docker-compose.yml         # Docker configuration
```

## Key Features

### 1. Intelligent Property Scoring
- Multi-factor viability algorithm
- Considers capacity, amenities, location, family fit
- Configurable host guardrails

### 2. Smart Pricing
- Discount applied to price *difference*, not total
- Configurable discount (25-50%, default 40%)
- Revenue lift optimization

### 3. AI-Powered Q&A
- RAG-based property metadata retrieval
- Ollama (Gemma2) for fast local responses
- OpenAI fallback for production quality

### 4. Graceful Degradation
- Handles unavailable properties automatically
- "Find New Upgrades" regeneration
- No 404s or broken experiences

## Development Status

**Completed**:
- ✅ Docker configuration (ports 8080/3030)
- ✅ Database schema and seed data
- ✅ Property scoring algorithm
- ✅ Pricing calculation service
- ✅ RAG/LLM integration for bot Q&A
- ✅ Main offer generation orchestration

**In Progress**:
- 🔄 API endpoints (webhook, offers, bot)
- 🔄 Email service with Resend
- 🔄 Frontend landing pages
- 🔄 Chatbot widget

**TODO**:
- ⏳ Integration testing
- ⏳ Demo preparation
- ⏳ Production deployment

## License

MIT

## Contact

For demo inquiries: [contact info]
