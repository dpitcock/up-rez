# Offer Price Calculation Requirements Document
**UpRez MVP - Berlin AI Hackathon**  
**Author**: Hackathon Coach | **Date**: Jan 23, 2026 | **Status**: Final Spec

***

## 📋 Overview

**Purpose**: Define precise logic for calculating upgrade offer prices when presenting alternative properties to guests. Ensures pricing is transparent, competitive, and maximizes conversion while maintaining host profitability.

**Scope**: Price calculation for single booking → multiple upgrade options (top3 candidates), must abide by the constraints defined in the host settings dashboard.

**Key Principle**: Discount applied to **price difference**, not total rate (psychological framing + margin preservation).[1]

***

## 🔢 Core Definitions

### Variables (Per Booking)

| Variable | Field | Unit | Example |
|----------|-------|------|---------|
| **nights** | `departure_date - arrival_date` | days | 7 |
| **from_adr** | Original property nightly rate | EUR/night | 150 |
| **to_adr** | Upgrade property nightly rate | EUR/night | 350 |
| **from_total** | `from_adr × nights` | EUR | 1,050 |
| **to_total_list** | `to_adr × nights` (full list) | EUR | 2,450 |
| **discount_percent** | Applied to diff (typically 40%) | % | 40 |

### Derived Calculations

| Metric | Formula | Example | Logic |
|--------|---------|---------|-------|
| **price_diff_per_night** | `to_adr - from_adr` | 200€ | Marginal cost for upgrade |
| **price_diff_total** | `price_diff_per_night × nights` | 1,400€ | Total upgrade cost (no discount) |
| **discount_amount** | `price_diff_total × discount_percent` | 560€ | Savings offered to guest |
| **offer_adr** | `from_adr + (price_diff_per_night × (1 - discount_percent))` | 270€/night | Nightly rate guest pays for upgrade |
| **offer_total** | `offer_adr × nights` | 1,890€ | Total guest pays for upgraded property |
| **revenue_lift** | `offer_total - from_total` | 840€ | Host revenue increase per stay |
| **upsell_success_value** | `(offer_total - from_total) + ancillaries` | 1,100€ | Total economics (example: + 260€ ancillaries) |

***

## 🎯 Pricing Rules & Logic

### Rule 1: Base Rate Validation
```
IF to_adr <= from_adr:
  REJECT candidate  -- Upgrade must cost more
ELSE:
  PROCEED
```

**Rationale**: No "upgrades" to cheaper properties. RAG classifier prevents this anyway.

### Rule 2: Discount Constraint
```
discount_percent ∈ [0.25, 0.50]  -- 25-50% typical
IF discount_percent < 0.25:
  SET discount_percent = 0.25
IF discount_percent > 0.50:
  SET discount_percent = 0.50
```

**Rationale**: 
- <25%: Not compelling enough (low conversion).[1]
- >50%: Erodes host margin too much.

**Hack Default**: 40% (proven in UpRez brief).[1]

### Rule 3: Price Reasonableness
```
IF to_total_list > from_total × 3:
  FLAG as "luxury jump"
  OPTIONAL: Apply secondary discount or note in copy
ELSE:
  PROCEED as normal
```

**Rationale**: Extreme price jumps reduce conversion. Optional secondary discount for >3x jumps (e.g., budget apt → luxury estate).

### Rule 4: Minimum Price Increment
```
IF offer_total <= from_total:
  REJECT candidate  -- Must increase total price
ELSE:
  PROCEED
```

**Rationale**: Ensures always positive economics for host.

***

## 📊 Example Calculation Scenarios

### Scenario 1: Modest Upgrade (Typical Path)
```
Booking: Jane Smith, 7 nights, Budget Beach Apt (ID:1)
  from_adr = 150€/night
  from_total = 1,050€

Candidate: Mid-Tier Villa (ID:4)
  to_adr = 350€/night
  to_total_list = 2,450€

Calculation:
  price_diff_per_night = 350 - 150 = 200€
  price_diff_total = 200 × 7 = 1,400€
  discount_amount = 1,400 × 0.40 = 560€
  offer_adr = 150 + (200 × (1 - 0.40)) = 150 + 120 = 270€
  offer_total = 270 × 7 = 1,890€
  revenue_lift = 1,890 - 1,050 = 840€

Email Copy:
  "Upgrade to Mid-Tier Villa: 270€/night (save 120€/night off the 350€ list rate).
   Full week: 1,890€ (you save 560€)."
```

### Scenario 2: Luxury Jump (Secondary Discount)
```
Booking: Mike Johnson, 7 nights, City Studio (ID:2)
  from_adr = 120€/night
  from_total = 840€

Candidate: Luxury Estate (ID:10)
  to_adr = 800€/night
  to_total_list = 5,600€
  Ratio: 5,600 / 840 = 6.67x (extreme)

Apply secondary logic:
  Base discount = 40%
  Luxury_factor = (to_total_list / from_total - 3) / 3 = (6.67 - 3) / 3 = 1.22
  Adjusted_discount = 0.40 + (0.10 × min(luxury_factor, 1.0)) = 0.50 (capped)

Calculation (50% discount):
  price_diff_per_night = 800 - 120 = 680€
  offer_adr = 120 + (680 × (1 - 0.50)) = 120 + 340 = 460€
  offer_total = 460 × 7 = 3,220€
  revenue_lift = 3,220 - 840 = 2,380€

Email Copy:
  "Experience Luxury Estate: 460€/night (50% off upgrade cost, save 340€/night).
   Full week: 3,220€ (save 2,380€ off list rate, plus free 5-star pool access)."
```

### Scenario 3: Multi-Night Discount (Optional Volume Bonus)
```
If nights >= 14 (two weeks), offer additional incentive:
  volume_bonus_percent = min(0.05, nights / 100)  -- e.g., 14 days = 5% extra
  
Applied to offer_adr:
  offer_adr_with_volume = offer_adr × (1 - volume_bonus_percent)
  
Example: 14 nights, otherwise 270€/night
  offer_adr_with_volume = 270 × (1 - 0.05) = 256.50€
  New message: "14-night volume discount applied: 256.50€/night"
```

***

## 💾 Data Storage (SQLite)

### Bookings Table (Complete)
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  prop_id INTEGER NOT NULL,
  
  -- Dates & occupancy
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  infants INTEGER DEFAULT 0,
  
  -- Guest
  guest_name TEXT,
  guest_email TEXT,
  guest_country TEXT,
  
  -- Pricing (in cents for precision)
  rate_code TEXT,                      -- FLEX, NONREF, WEEKLY
  base_nightly_rate_cents INTEGER,
  total_base_amount_cents INTEGER,
  fees_cents INTEGER DEFAULT 0,
  taxes_cents INTEGER DEFAULT 0,
  discounts_cents INTEGER DEFAULT 0,
  total_paid_cents INTEGER NOT NULL,
  
  -- Meta
  channel TEXT,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Offer Candidates Table
```sql
CREATE TABLE offer_candidates (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  from_prop_id INTEGER NOT NULL,
  to_prop_id INTEGER NOT NULL,
  
  -- Calculated fields
  nights INTEGER NOT NULL,
  from_adr_cents INTEGER NOT NULL,
  to_adr_cents INTEGER NOT NULL,
  price_diff_per_night_cents INTEGER NOT NULL,
  price_diff_total_cents INTEGER NOT NULL,
  
  -- Discount & offer
  discount_percent REAL NOT NULL,      -- e.g., 0.40
  discount_amount_cents INTEGER,
  offer_adr_cents INTEGER NOT NULL,
  offer_total_cents INTEGER NOT NULL,
  revenue_lift_cents INTEGER NOT NULL,
  
  -- Ranking
  viability_score REAL,                -- 0-10 (bed+pool+parking+guest_fit)
  ranking INTEGER,                     -- 1-3 (top3)
  
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(booking_id) REFERENCES bookings(id)
);
```

### Offers Table (Persisted for Email/Landing Page)
```sql
CREATE TABLE offers (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  
  top3 JSON,  -- Array of offer_candidates (flattened, sorted by ranking)
  
  -- Offer state
  status TEXT DEFAULT 'active',        -- active, partial, expired
  expires_at TIMESTAMP,
  regen_count INTEGER DEFAULT 0,
  
  -- Email metadata
  email_sent_at TIMESTAMP,
  email_opened_at TIMESTAMP,
  email_clicked_at TIMESTAMP,
  
  -- HTML content
  generated_copy TEXT,
  html_email TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(booking_id) REFERENCES bookings(id)
);
```

***

## 🔄 Calculation Workflow (Agent)

**Trigger**: Webhook (cron/cancel) with booking ID.

```
1. Fetch booking from DB
   ├── Extract: nights, from_adr, from_total, guest_needs

2. RAG query available props
   ├── Filter: nights available, not same as from_prop_id

3. For each candidate:
   ├── Fetch to_adr from DB
   ├── Calculate price_diff_per_night
   ├── Calculate price_diff_total
   ├── Apply discount_percent (lookup via rules or config)
   ├── Calculate offer_adr, offer_total
   ├── Validate: offer_total > from_total ✓
   ├── Score: viability (RAG diffs + guest_fit)
   └── Store in offer_candidates

4. Rank top3 by viability_score
   └── Return sorted JSON

5. Generate copy (OpenAI)
   ├── Input: top3 JSON + guest profile
   └── Output: personalized upsell text (email + page)

6. Store offer, send Resend email
   └── Link to landing page with offer.id
```

***

## 📱 Frontend Display

### Offer Card (Landing Page)
```
┌─ Option 1: Mid-Tier Villa (270€/night) ───────┐
│ Original: Budget Beach Apt (150€/night, 7 nights)
│ Upgrade Cost: +200€/night
│ Your Discount: -120€/night (40% off)
│ NEW RATE: 270€/night
│ 
│ Total: 1,890€ (Save 560€ vs list rate)
│ Revenue Lift: +840€ from original booking
│
│ ✓ +1 bed  ✓ Pool  ✓ Parking  ✓ Better location
│ [BOOK NOW] [Details]
└────────────────────────────────────────────────┘
```

### Email Preview
```
Hi Jane,

Great news! We found a perfect upgrade for your upcoming stay.

Mid-Tier Villa (Son Vida)
Save 560€ on your upgrade

List Rate: 350€/night
Your Special Rate: 270€/night (40% off the difference!)

For 7 nights: 1,890€ (originally 1,050€ for Budget Apt)

Why this upgrade?
• +1 extra bedroom for the kids
• Private pool access
• Dedicated parking
• Beautiful hilltop views

Limited Time: Offer expires in 48 hours
[VIEW OFFER & BOOK]
```

***

## 🔧 Implementation Checklist

### Backend (Python/FastAPI)
- [ ] Parse booking from DB: extract nights, from_adr, guest fields
- [ ] Query available properties (via RAG or DB query)
- [ ] For each candidate:
  - [ ] Fetch to_adr
  - [ ] Calculate price_diff_per_night, price_diff_total
  - [ ] Apply discount_percent (config or rule-based)
  - [ ] Calculate offer_adr, offer_total
  - [ ] Validate offer_total > from_total
  - [ ] Score viability (classifier diffs + guest_fit)
- [ ] Sort top3 by viability_score
- [ ] Store in offer_candidates table
- [ ] Create offer record with top3 JSON
- [ ] Generate email copy (OpenAI + template)
- [ ] Send Resend email with offer link

### Frontend (Next.js)
- [ ] Fetch offer by offer_id from `/api/offer/{id}`
- [ ] Render ComparisonTable with top3
  - [ ] Display price breakdown per option
  - [ ] Show savings (discount_amount_cents / 100)
  - [ ] Highlight revenue_lift
- [ ] Display offer expiration timer
- [ ] Render fallback "Find New" button if unavailable
- [ ] Integration with bot Q&A on metadata

### Testing
- [ ] Unit: price calculation (all scenarios)
- [ ] Integration: booking → candidates → offer creation
- [ ] E2E: trigger event → email sent → landing page loads
- [ ] Edge cases: extreme price jumps, luxury discounts, volume bonuses

***

## 📈 Metrics & Insights

### Tracked for Analytics (in offers table)
- **Offer performance**: email_sent_at, email_opened_at, email_clicked_at
- **Conversion**: booked flag (will add after MVP)
- **Revenue impact**: revenue_lift × conversion_rate = potential uplift
- **Guest sentiment**: Can add "helpful?" on landing page

### Demo Metrics (for 2min Loom)
```
Sample metrics:
- Original booking value: 1,050€
- Upgrade offer: 1,890€
- Revenue lift: 840€
- Ancillaries (kayaks, boat): +260€ (from UpRez brief)
- Total economics: 1,100€ per conversion
- Expected conversion rate: 7-10% (if execution tight)
```

***

## 🎯 Success Criteria

1. ✅ **Accurate Pricing**: offer_total always > from_total
2. ✅ **Transparent Copy**: Guest sees discount amount + savings clearly
3. ✅ **Competitive**: Discount percent (40%) drives 7.8x conversion lift[1]
4. ✅ **Scalable**: Works for budget→mid, mid→luxury, niche jumps
5. ✅ **Data-Driven**: Revenue lift quantified in landing page + email
6. ✅ **Fallback Resilient**: Regen logic handles blocking, recalculates offer prices

***

## 📝 Notes for Antigravity

**Prompt**: "Implement complete offer price calculation system. Schema (bookings, offer_candidates, offers). Agent: fetch booking → classify candidates → calc diffs/discounts → rank top3 → store → email. Rules: discount 25-50%, offer_total > from_total, handle luxury jumps. Frontend: show price breakdown + savings. Test: all scenarios, edge cases."

**Key Formula to Code**:
```
offer_adr = from_adr + (price_diff_per_night × (1 - discount_percent))
offer_total = offer_adr × nights
revenue_lift = offer_total - from_total
```

Ready to integrate with the full UpRez spec? Antigravity implementation scope clear?[2][3][1]

Sources
[1] UpRez-Vacation-Rental-Upsell.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/143557486/e58ad8b2-5d53-429a-abd6-90d26a72cf35/UpRez-Vacation-Rental-Upsell.pdf
[2] Vacation Rental Revenue Management: The Detailed Guide https://www.hostfully.com/blog/vacation-rental-revenue-management/
[3] Reporting Terms | Lodgify Vacation Rental Encyclopedia https://www.lodgify.com/encyclopedia/category/reporting/
