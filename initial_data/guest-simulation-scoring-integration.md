# UpRez Guest Simulation Scoring Integration Requirements

## Overview

See local demo settings option where the user can select to use OpenAI or local LLM.  Then proceed with the rest of the requirements using the selected LLM.

**Hybrid ranking system** for offer generation:

```
1. LLM Guest Simulator → Ranks properties by guest preference (1,2,3)
2. Revenue Maximization → Calculates expected_lift per option  
3. Historical Model → Predicts purchase probability (if available)
4. Final Ranking → Weighted blend: guest_pref * revenue_weight * p_history
```

**Goal:** Top3 options that are **guest-desired** AND **profitable**.

***

## 1. Updated Offer Generation Flow

```
Step 1: Generate 8–12 raw candidates (rules + LLM classification)
         ↓
Step 2: Apply host_settings guardrails (min_lift, max_discount, etc.)
         ↓ (6–10 viable candidates remain)
Step 3: LLM Guest Simulator → Rank by guest preference [guest_rank_score]
         ↓
Step 4: Revenue Scoring → expected_lift = revenue_lift * discount_factor
         ↓  
Step 5: Historical Model → p_purchase (if model.pkl exists)
         ↓
Step 6: Final Score = guest_rank_score * revenue_weight * p_history
         ↓
Step 7: Select top3 by final_score → Send offer
         ↓
Step 8: Log all 6–10 options to offer_option_history for future training
```

***

## 2. Detailed Scoring Requirements

### 2.1 **LLM Guest Simulator** (Primary Rank Signal)

**Input:** Raw candidates + booking context → **guest_rank_score** (1.0, 0.67, 0.33)

```
POST /internal/llm-guest-simulator

Request:
{
  "booking": {guest_name, country, adults, children, has_car, ...},
  "original_prop": {...},
  "candidates": [  // 6–10 options
    {
      "prop_id": 4,
      "prop_name": "Mid-Tier Villa",
      "summary": "Private pool, garden, driveway parking",
      "pricing": {offer_adr: 270, revenue_lift: 840, discount_pct: 0.4},
      "diffs": ["+2 beds", "+pool", "+parking"]
    }
  ]
}

Response:
{
  "top3_guest_ranking": [4, 1, 7],  // prop_ids in guest-preferred order
  "reasoning": "Family prefers pool + space (Prop 4), then parking (Prop 1)..."
}
```

**Scoring:**
```
guest_rank_score = {
  rank1: 1.00,
  rank2: 0.67, 
  rank3: 0.33,
  unranked: 0.10
}
```

### 2.2 **Revenue Maximization Score**

```
revenue_score = min(revenue_lift / host_settings.min_revenue_lift, 2.0)

# Caps at 2.0x minimum lift (diminishing returns on huge jumps)
# Example: min_lift=30€, revenue_lift=90€ → revenue_score=2.0 (capped)
# Example: min_lift=30€, revenue_lift=45€ → revenue_score=1.5
```

### 2.3 **Historical Model Score** (Optional)

```
IF model.pkl exists:
  p_purchase = predict_purchase_prob(features)
  history_score = p_purchase * 2.0  # Scale to [0,2]
ELSE:
  history_score = 1.0  # Neutral
```

### 2.4 **Final Blended Score**

```
final_score = (
  guest_rank_score * 0.50 +    # 50% weight: Guest will actually want it
  revenue_score * 0.35 +       # 35% weight: Host makes money  
  history_score * 0.15         # 15% weight: Proven to convert
)

# host_settings weights override (future):
# final_score = guest_rank * host_settings.guest_weight + ...
```

**Example calculation:**
```
Prop 4 (LLM #1, revenue_lift=840€, p_history=0.16):
guest_rank_score = 1.00
revenue_score = min(840/30, 2.0) = 2.0
history_score = 0.16 * 2.0 = 0.32
final_score = (1.0*0.5) + (2.0*0.35) + (0.32*0.15) = 1.40

Prop 1 (LLM #2, revenue_lift=174€, p_history=0.12):
final_score = (0.67*0.5) + (min(174/30,2)*0.35) + (0.12*2*0.15) = 0.95
```

***

## 3. Backend Implementation Requirements

### **New Internal API: `/internal/llm-guest-simulator`**

```
POST /internal/llm-guest-simulator

Request:
{
  "booking_id": 123,
  "candidates": [array of 6–10 candidate objects]
}

Response:
{
  "top3_guest_ranking": [4,1,7],  // prop_ids
  "all_rank_scores": {            // For logging
    "4": 1.0,
    "1": 0.67,
    "7": 0.33,
    "2": 0.10  // Unranked
  }
}
```

### **Updated `generate_offer()` Function:**

```python
async def generate_offer(booking_id: int, db):
    booking = get_booking(booking_id)
    host_settings = get_host_settings(booking.host_id)
    
    # 1. Generate raw candidates (existing logic)
    raw_candidates = classify_upgrades(booking)
    
    # 2. Filter by host guardrails
    viable_candidates = filter_by_guardrails(raw_candidates, host_settings)
    
    if len(viable_candidates) < 3:
        return {"status": "no_offer"}
    
    # 3. NEW: LLM Guest Simulator
    guest_ranking = await llm_guest_simulator(booking, viable_candidates)
    
    # 4. Score each candidate
    scored_candidates = []
    for candidate in viable_candidates:
        candidate.guest_rank_score = guest_ranking.get(candidate.prop_id, 0.10)
        candidate.revenue_score = min(candidate.revenue_lift / host_settings.min_revenue_lift, 2.0)
        candidate.history_score = predict_history_prob(candidate, booking) if model_exists else 1.0
        
        candidate.final_score = (
            candidate.guest_rank_score * 0.50 +
            candidate.revenue_score * 0.35 +
            candidate.history_score * 0.15
        )
        
        scored_candidates.append(candidate)
    
    # 5. Top3 by final_score
    top3 = sorted(scored_candidates, key=lambda x: x.final_score, reverse=True)[:3]
    
    # 6. Create offer + LOG ALL candidates to history
    offer = create_offer(booking_id, top3)
    log_offer_candidates(offer.id, scored_candidates)  # All 6–10, not just top3
    
    return {"status": "ok", "offer_id": offer.id}
```

***

## 4. Logging Requirements

**Log ALL viable candidates** (not just top3) to `offer_option_history`:

```
For each of the 6–10 viable_candidates:
INSERT INTO offer_option_history (
  offer_id, option_rank, prop_id, booking_id,
  guest_rank_score, revenue_score, history_score, final_score,
  option_viewed=1  -- All shown to guest simulator
)
```

**Later update outcomes:**
```
UPDATE offer_option_history SET 
  email_clicked=1, option_clicked=1, option_booked=1
WHERE offer_id=? AND prop_id=?
```

***

## 5. Demo Visualization Requirements

**Demo page** (`/demo`) shows scoring breakdown:

```
OFFER SCORING BREAKDOWN (Live)
═══════════════════════════════════════════════════════════════

Prop 4 (Mid-Tier Villa)    Final: 1.40 ✓ #1
  Guest pref: 1.00 (LLM #1)
  Revenue: 2.00 (+840€ lift)
  History: 0.32 (16% p_buy)

Prop 1 (Family 2BR)        Final: 0.95  #2
  Guest pref: 0.67 (LLM #2) 
  Revenue: 1.80 (+294€ lift)
  History: 0.24 (12% p_buy)

Prop 7 (Lux Beach)         Final: 0.72  #3
  Guest pref: 0.33 (LLM #3)
  Revenue: 2.00 (+1120€ lift) 
  History: 0.18 (9% p_buy)

[Toggle: Rules Only | LLM Guest | Full Hybrid]
```

**Requirements:**
- Live table updates when [Regenerate Offers] clicked
- Color-code final_score (green high → red low)
- Toggle switches scoring modes for A/B demo

***

## 6. Fallbacks & Defaults

```
No LLM response → guest_rank_score = 1.0 / (rank + 1)
No model.pkl → history_score = 1.0
< 3 viable candidates → Fall back to rules-only ranking
LLM ranks same prop twice → Assign average score
```

***

## 7. Host Settings Extension

**Add to `host_settings` table:**
```
scoring_weights JSON DEFAULT '{"guest": 0.50, "revenue": 0.35, "history": 0.15}'
model_scoring_enabled INTEGER DEFAULT 1
llm_guest_simulation_enabled INTEGER DEFAULT 1
```

**Host dashboard toggles:**
```
[ ] LLM Guest Simulator (ranks by guest preference)
[ ] Historical Model (predicts purchase probability) 
[ ] Revenue Maximization (weights by € lift)
```

***

## 8. Implementation Checklist

```
🚀 CRITICAL:
1. /internal/llm-guest-simulator endpoint
2. Update generate_offer() → hybrid scoring  
3. Log ALL viable candidates to history table
4. Demo visualization (scoring breakdown table)

📋 POLISH:
1. host_settings.scoring_weights
2. Fallback logic (no LLM/model)
3. Demo toggle for scoring modes

🎯 PRODUCTION:
1. Rate limiting on LLM simulator
2. Model versioning (model_v1.pkl → v2.pkl)
3. A/B test vs rules-only baseline
```

***

## Demo Script Addition (30s)

```
"UpRez uses a hybrid scoring system..."

1. [Toggle: Rules Only] → "Host viability ranking"
2. [Toggle: LLM Guest] → "What guests actually want"
3. [Toggle: Full Hybrid] → "Guest pref × revenue × history = optimal top3"

"Watch Mid-Tier Villa jump from #3 to #1. Expected revenue +22%."
```

**Transformative.** Now UpRez is **truly intelligent**—not just rules, but **learned guest economics**. Hackathon killer! 🚀

