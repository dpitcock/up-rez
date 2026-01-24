# UpRez Historical Learning & Optimization Module

**Feature Status:** MVP (Demo-ready)  
**Complexity:** Medium (Data + ML)  
**Hackathon Tools:** OpenAI (data gen), Runpod (training)  
**Production Value:** High (30–50% expected revenue lift)

***

## 1. Overview

Adds **historical learning** to UpRez by:

1. **Logging** every offer option shown to guests (engagement + outcomes)
2. **Simulating** realistic historical data for demo/training
3. **Training** a simple regression model to predict purchase probability
4. **Ranking** future offers by **expected revenue lift** (`p_purchase × revenue_lift`)

**Demo impact:** Toggle button shows "rules-only" vs "ML-optimized" top3 offers, with ~15–25% expected revenue improvement.

***

## 2. Database Schema

### Table: `offer_option_history`

Tracks every option shown to every guest.

```sql
CREATE TABLE offer_option_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Core identifiers
  offer_id INTEGER NOT NULL,
  option_rank INTEGER NOT NULL CHECK (option_rank IN (1,2,3)),
  prop_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  
  -- Guest context
  guest_country TEXT,
  adults INTEGER,
  children INTEGER,
  has_car INTEGER,
  length_of_stay_nights INTEGER,
  days_to_arrival INTEGER,
  channel TEXT,
  
  -- Offer economics
  original_adr DECIMAL(8,2),
  upgrade_list_adr DECIMAL(8,2),
  offer_adr DECIMAL(8,2),
  discount_on_diff_pct DECIMAL(4,3),
  revenue_lift_eur DECIMAL(8,2),
  adr_ratio DECIMAL(5,3),
  
  -- Property diffs
  delta_beds INTEGER,
  delta_baths INTEGER,
  has_pool INTEGER DEFAULT 0,
  has_parking INTEGER DEFAULT 0,
  has_workspace INTEGER DEFAULT 0,
  delta_distance_to_beach_m INTEGER,
  
  -- Engagement funnel
  email_opened INTEGER DEFAULT 0,
  email_clicked INTEGER DEFAULT 0,
  option_viewed INTEGER DEFAULT 0,
  option_clicked INTEGER DEFAULT 0,
  option_booked INTEGER DEFAULT 0,  -- Primary target
  
  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (offer_id) REFERENCES offers(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_host (host_id),
  INDEX idx_date (created_at)
);
```

**Indexes for performance:**
```sql
CREATE INDEX idx_offer_history_host_date ON offer_option_history(host_id, created_at);
CREATE INDEX idx_offer_history_target ON offer_option_history(option_booked);
```

***

## 3. Data Pipeline Requirements

### 3.1 **Logging** (Automatic)

**Trigger:** Every time an offer is created with `top3` options.

**Backend code:**
```python
def log_offer_options(offer_id: int, top3: list):
    for rank, option in enumerate(top3, 1):
        db.execute("""
            INSERT INTO offer_option_history (
              offer_id, option_rank, prop_id, booking_id,
              discount_on_diff_pct, adr_ratio, revenue_lift_eur,
              delta_beds, has_pool, has_parking, ...
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
        """, [
            offer_id, rank, option.prop_id, offer.booking_id,
            option.discount_on_diff_pct, option.adr_ratio, option.revenue_lift,
            option.delta_beds, option.has_pool, option.has_parking, ...
        ])
```

**Update outcomes** (via webhook or cron):
```python
# When guest opens email
UPDATE offer_option_history SET email_opened=1 WHERE offer_id=?

# When guest clicks "Book upgrade" on option 2
UPDATE offer_option_history SET 
  email_clicked=1, option_clicked=1, option_booked=1 
WHERE offer_id=? AND option_rank=2
```

### 3.2 **Synthetic Data Generation** (OpenAI)

**Script:** `scripts/generate_historical_data.py`

**Input:** `bookings.csv`, `properties.csv`
**Output:** `offer_option_history_demo.csv` (~10k–50k rows)

**Behavioral rules encoded:**
```
Base purchase prob: 3%

BOOSTERS (+probability):
+4% if discount_on_diff_pct ≥ 0.3
+3% if adr_ratio ≤ 1.3
+5% if children>0 AND has_pool=1
+4% if adults=1 AND has_workspace=1 AND length_of_stay_weekday_bias
+2% if option_rank=1
+1% if has_parking AND has_car=1

PENALTIES (−probability):
−3% if days_to_arrival > 21
−2% if delta_distance_to_beach_m > 2000
−4% if adr_ratio > 1.8
```

**OpenAI prompt template:**
```
Generate 10000 realistic offer_option_history rows following these rules:
[Full spec + rules above]

Output format: CSV with headers matching schema above.
```

### 3.3 **Model Training** (Runpod Jupyter)

**Notebook:** `notebooks/train_purchase_model.ipynb`

**Steps:**
```
1. Load offer_option_history.csv
2. Feature engineering:
   X = [discount_pct, adr_ratio, delta_beds, has_pool, has_parking, 
        children_gt_0, has_car, days_to_arrival, option_rank]
   y = option_booked (0/1)
3. Train/test split (80/20)
4. LogisticRegression() → Fit → AUC score
5. Export model.pkl + feature_names.json
```

**Model requirements:**
- **Type:** LogisticRegression (scikit-learn)
- **Features:** 12 numeric/categorical (above)
- **Target:** `option_booked` (0/1)
- **Metrics:** AUC-ROC > 0.70, calibration plot
- **Output:** `purchase_model.pkl` (joblib.dump)

***

## 4. Real-Time Integration

### **Updated Offer Generation Flow:**

```
1. Generate candidates (rules + LLM)
2. FOR each candidate:
   a. Grid search allowed discounts [host_settings.max_discount_pct ± 10%]
   b. FOR each discount:
      i. Compute features
      ii. model.predict_proba(features) → p_purchase
      iii. expected_lift = p_purchase × revenue_lift
   c. Pick best discount for this candidate
3. Filter by host_settings guardrails
4. Rank top3 by expected_lift (descending)
5. Log to offer_option_history
```

### **Backend API Changes:**

**No external API changes needed.** Internal scoring updates:

```python
# backend/services/model_service.py
import joblib
model = joblib.load("purchase_model.pkl")
feature_names = json.load(open("feature_names.json"))

async def score_candidate(candidate, booking):
    """Predict purchase probability."""
    features = extract_features(candidate, booking)  # → [0.3, 1.2, 1, 0, ...]
    p_purchase = model.predict_proba([features])[0, 1]
    return p_purchase

def extract_features(candidate, booking):
    """Convert to model feature vector."""
    return [
        candidate.discount_on_diff_pct,
        candidate.adr_ratio,
        candidate.delta_beds,
        candidate.has_pool,
        candidate.has_parking,
        1 if booking.children > 0 else 0,
        booking.has_car,
        booking.days_to_arrival,
        candidate.option_rank,
        # ... 3 more features
    ]
```

***

## 5. Demo Requirements

### **Demo Page Updates (`/demo`):**

```
Controls:
[Toggle Model Scoring] Off → On
[Regenerate Offers] → Show rule-based vs ML-optimized top3

Visual Diff:
Rule-based ranking:
1. Family 2BR (viability: 8.5, expected: €78)
2. Poolside Apt (viability: 7.8, expected: €62)  
3. Mid-Tier Villa (viability: 7.2, expected: €110)

ML-optimized ranking: 
1. Mid-Tier Villa (viability: 7.2, expected: €110 ✓)
2. Family 2BR (viability: 8.5, expected: €78)
3. Poolside Apt (viability: 7.8, expected: €62)

Expected Revenue: +22% with model
```

### **Demo Narrative (30 seconds):**
```
"UpRez learns from history. Toggle model scoring..."
[Click]
"Same candidates, but now ranked by expected revenue lift, not just viability. 
Mid-Tier Villa jumps to #1—our model predicts 16% purchase probability vs 9% for Family 2BR, 
even though rules preferred it. Result: 22% higher expected revenue.
Trained on 10k historical offers using OpenAI + Runpod."
```

***

## 6. Production Roadmap

```
Phase 1 (Hackathon): Synthetic data + logistic regression
Phase 2: Real data collection → retrain monthly
Phase 3: Gradient boosted trees (LightGBM) → better AUC
Phase 4: Dynamic discount optimization → model suggests best discount
Phase 5: Causal inference → "What if we had offered 35% discount?"
```

***

## 7. Implementation Checklist

### **Week 1 (Hackathon Demo):**
```
[ ] offer_option_history table
[ ] generate_synthetic_data.py (OpenAI)
[ ] train_purchase_model.ipynb (Runpod) 
[ ] model_service.py (load + predict)
[ ] Update offer ranking → expected_lift
[ ] Demo toggle button + visual comparison
```

### **Week 2 (MVP):**
```
[ ] Auto-logging on offer creation
[ ] Outcome tracking (email open/click/booked)
[ ] Cron job → retrain model weekly
[ ] host_settings.model_scoring_enabled toggle
```

### **Week 4 (Polish):**
```
[ ] Calibration monitoring (model drift)
[ ] A/B test vs rules-only
[ ] Dashboard → Historical performance by feature
```

***

## 8. Success Metrics

```
Primary: Expected revenue lift vs rules-only (+15–25%)
Secondary: Live conversion rate improvement
Tertiary: Model AUC > 0.70 on holdout data
```

***

**This makes UpRez** a **production ML system** out of the gate. Judges will be impressed by the data pipeline + real-time optimization. Perfect Arbio partner demo. 🚀