# UpRez - AI-Powered Vacation Rental Upsell Platform

**Status**: Vercel-Ready Monorepo 🚀  
**Target**: Berlin AI Hackathon (Arbio Track)

## Overview

UpRez is an AI-powered upgrade engine for vacation rentals that:
- **Detects Upsell Opportunities**: Automated triggers for pre-arrival and cancellations.
- **Personalized Offers**: Generates high-fidelity fit scores and property comparisons.
- **AI Copywriting**: Crafts personalized email and landing page copy via OpenAI.
- **Interactive AI Concierge**: Real-time Q&A bot for guests to ask about upgrade features.
- **Conversion-Ready**: Integrated email delivery (SendGrid) and dynamic landing pages.

## Tech Stack

- **Framework**: Next.js 15 (TypeScript) - Monorepo (UI + API)
- **Database**: Vercel Postgres (Powered by Neon)
- **Generative AI**: OpenAI GPT-4o-mini
- **Email**: SendGrid API
- **Deployment**: Vercel (Frontend & Serverless Functions)

## System Architecture

UpRez is built as a unified Next.js monorepo, making it extremely easy to deploy and maintain on Vercel.

```mermaid
graph TD
    subgraph "Vercel Platform"
        FE[Frontend - Next.js]
        API[API Routes - Serverless]
        DB[(Vercel Postgres)]
    end

    subgraph "External Services"
        OI[OpenAI - AI Copy & Chat]
        SG[SendGrid - Email Delivery]
    end

    %% Data Flow
    FE <--> API
    API <--> DB
    
    %% Service Integration
    API -- "Personalized Copy & Bot Q&A" --> OI
    API -- "HTML Offer Delivery" --> SG
```

## Quick Start (Local Development)

### Prerequisites

- Node.js (v20+) or **Docker**
- **SendGrid API Key** (with verified sender)
- **OpenAI API Key**
- A Postgres database (Local or Vercel Postgres)

### Docker Flow (Recommended)

1. **Launch Stack**:
   ```bash
   docker-compose up -d
   ```

2. **Replicate Vercel Build (Inside Docker)**:
   To ensure your code passes Vercel's strict production checks (TypeScript, Route verification), run:
   ```bash
   docker-compose exec frontend npm run build
   ```

3. **Reset/Seed Data**:
   Visit `http://localhost:3030/api/demo/reset` or run:
   ```bash
   docker-compose exec frontend curl http://localhost:3030/api/demo/reset -X POST
   ```

## Quick Start

### 1. Configure Environment
Regardless of your setup, you need to configure your API keys:
```bash
cp .env.example .env
# Edit .env with your OpenAI, SendGrid, and Postgres credentials
```

---

### Option A: Docker (Recommended) 🐳
Best for a consistent environment. Docker handles Node.js, Dependencies, and the Dev Server automatically.

1. **Start the Platform**:
   ```bash
   docker-compose up -d
   ```

2. **Use the CLI Helper**:
   We've provided a simple script to run common tasks inside the container:
   - **Seed/Reset Data**: `./uprez.sh reset`
   - **Production Build Check**: `./uprez.sh build`
   - **Follow Logs**: `./uprez.sh logs`
   - **Shell Access**: `./uprez.sh shell`

3. **Launch**: Open [http://localhost:3030/demo](http://localhost:3030/demo)

---

### Option B: Manual (Host machine)
Use this if you prefer running Node.js directly on your machine.

1. **Install Dependencies**:
   ```bash
   cd frontend && npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
3. **Seed Database**:
   Visit [http://localhost:3030/api/demo/reset](http://localhost:3030/api/demo/reset) to initialize data.

---

## Deployment

UpRez is optimized for **Vercel**. For detailed infrastructure provisioning (Postgres, Secrets, etc.), see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Project Structure

```
up-rez/
├── frontend/                   # Next.js Application (Monorepo)
│   ├── app/                    # Pages & API Routes
│   │   ├── api/                # Backend Logic (Python logic ported here)
│   │   ├── demo/               # Demo Dashboard
│   │   └── offer/[id]/         # Personalized Landing Pages
│   ├── components/             # UI Components
│   ├── lib/                    # Shared Utilities
│   │   ├── db.ts               # Database Layer (Vercel Postgres)
│   │   └── services/           # Ported Business Logic (Offer, Email, RAG)
│   ├── types/                  # TypeScript Interfaces
│   └── scripts/                # Data Scripts
├── initial_data/               # Reference Specs & Specs
└── docker-compose.yml          # Container config for local dev
```

## License

MIT
