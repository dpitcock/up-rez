# UpRez Dynamic Trigger Timing Optimization (Tower Integration)

**Feature:** Use **historical booking window data** + **Tower lakehouse** to trigger offers at **optimal moments** (maximizing fill rate + revenue).

**Status:** Phase 2 (Post-hackathon)  
**Hackathon Demo:** Mock data + Tower side-challenge mention  
**Tower.dev Role:** Lakehouse for historical data + feature engineering

***

## 1. Problem Statement

**Current triggers** (static):
```
Cron: Always 7 days before arrival
Cancellation: Immediate
```

**Problems:**
- **Too early** (14+ days): Upgrade property gets pulled from hot-selling window → goes unbooked
- **Too late** (1–3 days): Budget guest can't change plans → low conversion  
- **Booking window mismatch**: Premium properties have different optimal sell-through (e.g., 30–90 days vs budget 0–60 days)

**Goal:** Dynamic triggers using **big data patterns**:
```
Optimal trigger = f(upgrade_prop.booking_window, budget_prop.booking_window, days_to_arrival, seasonality)
```

***

## 2. Tower.dev Data Pipeline Requirements

### **Data Sources (Tower acquires):**
```
1. Historical offer_option_history (internal)
   - offer_id, prop_id, days_to_arrival, option_booked

2. Historical bookings (internal)  
   - prop_id, booking_date, arrival_date, adr, channel

3. External market data (Tower web APIs):
   - Competitor occupancy (AirDNA, etc.)
   - Seasonal demand patterns
   - Booking lead time distributions

4. Property master 
   - prop_tier (budget/mid/premium)
   - adr_bucket (100-200, 200-400, 400+)
```

### **Tower Lakehouse Tables:**

```
property_booking_patterns (feature table):
prop_id | tier | adr_bucket | optimal_trigger_days | avg_lead_time_days
4       | mid  | 300-400   | 10-18               | 45
1       | budget | 100-200 | 5-12                | 28

upgrade_success_by_timing:
budget_tier | upgrade_tier | days_to_arrival | success_rate | avg_revenue_lift
budget      | mid          | 7               | 0.42         | 840
budget      | premium      | 14              | 0.18         | 1200

market_demand:
location | date | occupancy_pct | demand_multiplier
Palma    | 2026-02 | 87%         | 1.25
```

### **Tower Pipeline (Python):**
```
tower pipeline run optimal_timing.py

1. Acquire: Historical bookings → booking_patterns table
2. Transform: 
   - Compute optimal_trigger_window per prop_tier + adr_bucket
   - success_rate = booked / shown by days_to_arrival bins
3. Feature engineering:
   - demand_multiplier = current_occupancy / historical_avg
4. Output: dynamic_triggers table for real-time lookup
```

***

## 3. Dynamic Trigger Logic Requirements

### **New Triggers Table:**

```sql
CREATE TABLE dynamic_triggers (
  id INTEGER PRIMARY KEY,
  budget_prop_tier TEXT,     -- 'budget', 'mid'
  upgrade_prop_tier TEXT,    -- 'mid', 'premium'  
  days_to_arrival_min INTEGER,
  days_to_arrival_max INTEGER,
  success_rate_threshold DECIMAL(4,3),  -- 0.25 min
  expected_revenue_lift_min DECIMAL(8,2),
  priority INTEGER DEFAULT 1,           -- Higher = more frequent checks
  enabled INTEGER DEFAULT 1,
  tower_pipeline_last_run TEXT
);
```

**Example rows:**
```
budget → mid    | 6-9 days   | 0.42     | 500€ | priority 3
budget → premium| 10-16 days | 0.28     | 900€ | priority 2  
mid → premium   | 12-20 days | 0.22     | 1200€| priority 1
```

### **Trigger Engine Requirements:**

```
CRON JOBS (tower-orchestrated):

1. HOURLY: Check dynamic_triggers for active windows
   SELECT bookings.* FROM bookings b
   JOIN dynamic_triggers dt ON b.prop_tier = dt.budget_prop_tier
   WHERE b.days_to_arrival BETWEEN dt.min AND dt.max
   AND dt.enabled = 1
   → Queue webhook events

2. DAILY: Tower re-computes optimal windows
   tower run optimal_timing_pipeline.py
   → Update dynamic_triggers table

3. REALTIME: Cancellation still immediate (high conversion)
```

***

## 4. Backend Integration Requirements

### **Updated Webhook Handler:**
```
POST /webhook/dynamic-trigger

From Tower cron:
{
  "event": "dynamic_trigger",
  "booking_id": 123,
  "trigger_window": "budget_to_mid_6-9days",
  "expected_success_rate": 0.42,
  "tower_pipeline_version": "v1.2"
}

→ Same offer generation flow, but log trigger_source = "dynamic_tower"
```

### **Host Settings Extension:**
```
host_settings:
dynamic_triggers_enabled: true
preferred_trigger_windows: ["budget_to_mid_6-9", "budget_to_premium_10-16"]
tower_data_source: "historical_6mo"  // 3mo, 6mo, 12mo, market
```

***

## 5. Demo Requirements (Hackathon)

### **Mock Data in Tower (Side-challenge eligible):**

```
Tower lakehouse mock tables:
property_booking_patterns (100 rows)
upgrade_success_by_timing (50 rows × 10 day bins)

Demo flow:
1. "UpRez uses Tower for dynamic timing"
2. Show Tower dashboard (lakehouse tables)
3. [Trigger Dynamic Offer] → "Tower says 6-9 days optimal for budget→mid"
4. Generate offer → "Expected 42% conversion per historical data"
```

### **Demo Stats Visualization:**
```
Dynamic Triggers Active:
budget→mid (6-9d): 42% success  + Tower ✓
budget→premium (10-16d): 28%   + Tower ✓
Static cron (7d): 35% baseline
```

***

## 6. Tower.dev Implementation Plan

### **Hackathon (Side-challenge):**
```
1. tower init uprez-timing-pipeline
2. tower acquire → Mock CSV → lakehouse tables
3. tower transform → Compute optimal windows
4. tower schedule → Daily cron (demo)
5. Webhook → UpRez FastAPI
```

### **Production Pipeline:**
```
tower pipeline optimal_timing.py:
├── acquire: 
│   ├── Internal: offer_option_history, bookings
│   └── External: AirDNA occupancy APIs
├── transform:
│   ├── booking_patterns: lead_time_distributions by tier
│   ├── success_by_timing: conversion_heatmap[days_to_arrival]
│   └── demand_forecast: seasonality multipliers
└── output: dynamic_triggers table → UpRez API
```

**Tower config:**
```
Towerfile:
schedules:
  - name: daily-timing-update
    cron: "2 2 * * *"  # 2AM daily
    pipeline: optimal_timing.py
```

***

## 7. Success Metrics

```
Primary:
- Trigger success_rate > static cron baseline (+20%)
- Reduced "upgrade property unbooked" rate (-30%)
- Revenue per triggered offer > baseline

Tower-specific:
- Pipeline runs < 15min daily
- Lakehouse query latency < 500ms
- Feature freshness < 24h
```

***

## 8. Host Dashboard Requirements

```
Dynamic Triggers (Powered by Tower)
═══════════════════════════════════════════════

Active Windows:
☑ budget→mid (6-9d): 42% conv  +720€ avg
☑ budget→premium (10-16d): 28% +1200€ avg

Tower Status: ✓ Fresh data (2h ago)
[Refresh Tower Pipeline] [View Lakehouse]

Last 30 days:
Static cron: 35 offers, 12% conv
Dynamic triggers: 28 offers, 42% conv (+200%)
```

***

## 9. Implementation Priority

```
🚀 HACKATHON (Tower side-challenge):
1. Mock lakehouse tables in Tower
2. Static dynamic_triggers table (10 rows)
3. /webhook/dynamic-trigger endpoint
4. Demo visualization

📈 PHASE 2 (1 month):
1. Tower CLI pipeline
2. Real historical data acquisition
3. Daily cron scheduling

🎯 PHASE 3 (3 months):
1. External market data (AirDNA)
2. ML demand forecasting
3. Per-property optimal windows
```

***

**Hackathon pitch:** *"UpRez + Tower = data-driven timing that beats static rules by 20% conversion. Lakehouse-powered triggers from historical patterns."*

Tower side-challenge winner material! 🚀

Sources
[1] UpStays-Vacation-Rental-Upsell.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/143557486/e58ad8b2-5d53-429a-abd6-90d26a72cf35/UpStays-Vacation-Rental-Upsell.pdf
[2] Data & AI Hackathon: Information, ingenuity and innovation ... https://data-ai-hackathon.devpost.com
[3] we won the biggest hackathon in Europe! built an AI data ... https://www.instagram.com/reel/DTl5ImZjAF5/
[4] AI Launchpad 2025: Tower https://www.youtube.com/watch?v=TZ7cdlGk12A
[5] The Denodo GenAI Hackathon Challenge https://www.denodo.com/en/AWS-AI-Hackathon
[6] WHA Digital Launches “WHA Data Hackathon 2025 https://www.wha-group.com/en/news-media/company-news/2483/wha-digital-launches-wha-data-hackathon-2025-rise-of-ai-heroes-empowering-ai-talent-to-drive-the-organization-toward-a-digital-future
[7] AI for hackathons: How to accelerate and optimize your ... https://taikai.network/en/blog/ai-tools-for-hackathons
[8] Serhii Sokolenko 🇺🇦's Post https://www.linkedin.com/posts/ssokolenko_excited-to-partner-with-tech-europe-on-activity-7416421808381452288-aS2g
[9] Learn to Build with Tower | Notion https://learn.tower.dev
[10] We organize data & AI hackathons and workshops https://www.artefact.com/offers/transformation-data-ai-strategy/hackathons/
[11] need free ai tools suggestion to build a hackathon project ... https://www.reddit.com/r/aipromptprogramming/comments/1mpeint/need_free_ai_tools_suggestion_to_build_a/
[12] Join our AI Hackathons | Lablab.ai https://lablab.ai/ai-hackathons
[13] How to Build Winning AI Projects: Tools from Hackathon ... https://www.youtube.com/watch?v=jzEQVD3vMEo
[14] Agentic AI Hackathon (Strands, AgentCore) https://aws-experience.com/emea/de-central-growth/e/67946/ai-hackathon-by-aws
[15] The Global Agent Hackathon https://github.com/global-agent-hackathon/global-agent-hackathon-may-2025
[16] Google Cloud launches $100000 AI hackathon for data ... https://www.linkedin.com/posts/paramsethi_bigquery-ai-building-the-future-of-data-activity-7362501624390381568-0WE-
