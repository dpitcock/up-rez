# Property Comparison & Upgrade Offer Logic  
**UpRez MVP – Property Classification & Upgrade Determination**

***

## 1. Goal & Constraints

**Goal**: Given a guest’s current booking, find and rank **better properties** that are legitimate upgrades, then decide which ones to offer and at what economics.

**Constraints**:
- Vacation rentals are non-standard (unlike hotel room types).  
- Upgrades must:  
  - Abide by the constraints defined in the host settings dashboard. 
  - Be clearly **better** in ways that matter to this guest.  
  - Preserve or increase **host revenue**.  
  - Remain **credible** (no “sidegrades” that feel like scams).

***

## 2. Inputs & Normalized Property Model

### 2.1. Property Input (from your JSON)

Each property $$P$$ has:

```json
{
  "id": 4,
  "name": "Mid-Tier Villa",
  "price": 350,                      // base nightly rate (ADR) for demo
  "beds": 3,
  "baths": 2,
  "amenities": ["pool","AC","WiFi","garden"],
  "location": "Son Vida (hills)",
  "parking": true,
  "pool": true,
  "metadata": {
    "elevator": false,
    "bicycles": 1,
    "pets_allowed": false,
    "baby_crib": false,
    "high_chair": true,
    "workspace": "small table",
    "noise_level": "moderate street",
    "building_age": "2020s",
    "checkin_method": "host meetup",
    "wifi_speed": "basic 50mbps",
    "ac_type": "window units",
    "kitchen_equipped": "gourmet",
    "laundry": "none",
    "outdoor_space": "garden",
    "beach_distance": "<5min walk",
    "walk_score": "car needed",
    "reviews_rating": 4.3,
    "superhost": true
  },
  "images": [
    "mid-tier-villa-exterior.jpg",
    "mid-tier-villa-living-room.jpg",
    "mid-tier-villa-kitchen.jpg"
  ]
}
```

This is your **canonical property record** for both:
- Eligibility (is this an upgrade?)  
- Explanation (what makes it better?)  
- Bot Q&A context (elevator, bikes, etc.)

### 2.2. Booking Context

Booking $$B$$:

```json
{
  "id": 101,
  "prop_id": 1,
  "arrival_date": "2026-03-10",
  "departure_date": "2026-03-17",
  "nights": 7,
  "adults": 2,
  "children": 2,
  "infants": 0,
  "guest": {
    "name": "Jane Smith",
    "country": "USA",
    "email": "jane@example.com",
    "has_car": true
  },
  "pricing": {
    "currency": "EUR",
    "rate_code": "FLEX",
    "base_nightly_rate": 150,
    "total_paid": 1250
  },
  "channel": "Airbnb"
}
```

***

## 3. What Counts as an “Upgrade”?

### 3.1. Hard Constraints (Must-Haves)

For a candidate property $$C$$ to be considered an upgrade over original $$O$$:

1. **No Downgrades on Core Capacity**  
   - $$ C.beds \ge O.beds $$  
   - $$ C.baths \ge O.baths $$

2. **Amenity Superset / No Loss on Critical Amenities**  
   - All *critical* amenities of $$O$$ must exist in $$C$$:  
     - WiFi, AC (if present), washing/laundry (if important), pets_allowed if the guest has pets (future).  
   - Formally:  
     - $$ \text{critical\_amenities}(O) \subseteq \text{amenities}(C \cup C.metadata) $$

3. **Location Non-Regressive for Core Intent**  
   - If guest booked “beach” (e.g., `Playa de Palma`, `beach_distance` <= "<5min walk"), don’t “upgrade” them to inland unless there’s a strong compensating benefit (e.g., huge house + pool for families).  
   - Base rule:  
     - If $$O$$ is “beachfront or <5min walk” and $$C$$ is “>15min”, penalize heavily or exclude unless scoring compensates.

4. **Price Direction**  
   - Candidate’s **ADR** should be **higher than original** (it’s an upgrade):  
     - $$ to\_adr > from\_adr $$

### 3.2. Soft Constraints (Scoring Factors)

Among candidates that pass hard filters, we compute a **viability score** $$\in $$ based on:[0][10]

- Extra bedrooms / bathrooms  
- Additional premium amenities (pool, private pool, garden, sea view, rooftop, etc.)  
- Parking vs no parking, especially if `has_car=true`  
- Workspace quality if they look like remote workers (guess from origin/metadata later)  
- Reviews rating difference  
- Host type (superhost bonus)  
- Distance to beach or “better” location for their intent (e.g., nightlife vs quiet)

***

## 4. Scoring Model (Step-by-Step)

### 4.1. Base Scoring Pseudocode

For each candidate $$C$$:

```python
score = 0

# 1) Capacity
if C.beds > O.beds: 
    score += 2
if C.baths > O.baths:
    score += 1

# 2) Premium Amenities
def has(amenity): 
    return amenity in C['amenities'] or C['metadata'].get('outdoor_space') == amenity

if 'pool' in C['amenities'] or C.get('pool'):
    score += 3
if has('garden'):
    score += 1
if 'sea view' in C['amenities']:
    score += 2
if C['metadata']['wifi_speed'] in ['fast 500mbps', 'gigabit']:
    score += 1

# 3) Parking / Car Fit
if guest['has_car'] and C.get('parking', False) and not O.get('parking', False):
    score += 2

# 4) Family Fit
if booking.children > 0:
    if C.beds >= O.beds + 1:
        score += 2
    if C['metadata'].get('baby_crib'):
        score += 1
    if C['metadata'].get('high_chair'):
        score += 0.5

# 5) Location
# Example simple rules
if "beach" in O['location'].lower() or O['metadata'].get('beach_distance') in ['beachfront', '<5min walk']:
    # Guest expects beach
    if C['metadata'].get('beach_distance') in ['beachfront', '<5min walk']:
        score += 2
    elif C['metadata'].get('beach_distance') == '10min walk':
        score += 1
    else:
        score -= 2  # likely disqualify later

# 6) Reviews & Host Quality
delta_rating = C['metadata']['reviews_rating'] - O['metadata']['reviews_rating']
score += max(0, delta_rating) * 1.0  # +0 to +1
if C['metadata']['superhost'] and not O['metadata']['superhost']:
    score += 0.5
```

After scoring, normalize to 0–10 if desired:

```python
score = min(10, max(0, score))
```

### 4.2. Price Reasonableness Filter

After scoring, we eliminate or down-rank:

- **Extreme jumps**:  
  - If `to_adr > from_adr * 3`, apply penalty unless this is a “luxury jump” where you’ll show it as **Option 3 – stretch upgrade**.  
- **Too small improvements**:  
  - If `score < 3` difference vs original property, discard (not enough added value).

***

## 5. Upgrade Candidate Selection Algorithm

### Step 1: Fetch Context

Given booking $$B$$:

1. Original property $$O = properties[booking.prop_id]$$.  
2. Guest profile (family, kids, has_car, origin, etc.).  
3. Booking window (dates, nights) – used for availability filter.

### Step 2: Filter Available Properties

You can mock availability or just assume all non-original IDs are available for the demo.

```python
candidates = [P for P in properties if P['id'] != O['id']]
```

Later, availability will check overlapping bookings/blocks.

### Step 3: Apply Hard Filters

```python
eligible = []
for C in candidates:
    # Beds/baths
    if C['beds'] < O['beds']: 
        continue
    if C['baths'] < O['baths']:
        continue
    
    # Mandatory amenities
    if 'WiFi' in O['amenities'] and 'WiFi' not in C['amenities']:
        continue
    if 'AC' in O['amenities'] and 'AC' not in C['amenities']:
        continue

    # Pets (future: only if guest brings pets)
    # if guest_has_pets and not C['metadata']['pets_allowed']:
    #     continue

    eligible.append(C)
```

### Step 4: Score Each Eligible Candidate

Use scoring model above with booking + property metadata.

```python
scored = []
for C in eligible:
    score = compute_score(O, C, booking)
    scored.append({"prop": C, "score": score})
```

### Step 5: Combine Score with Economics

Now we integrate **price**:

- from_adr = booking.pricing.base_nightly_rate  
- to_adr = C.price (or dynamic rate if you have one)

Pseudocode:

```python
for item in scored:
    C = item['prop']
    to_adr = C['price']
    from_adr = booking['pricing']['base_nightly_rate']
    if to_adr <= from_adr:
        continue  # Not an upgrade economically
    
    price_ratio = to_adr / from_adr
    # Soft penalty if extremely expensive:
    if price_ratio > 3:
        item['score'] -= 2  # but keep as candidate for "lux" option

# Drop any with final score <= 0
scored = [s for s in scored if s['score'] > 0]
```

### Step 6: Sort & Pick Top 3

```python
scored.sort(key=lambda x: x['score'], reverse=True)
top3 = scored[:3]
```

Each entry in `top3` now has:

```json
{
  "prop": { /* full property record */ },
  "score": 8.5
}
```

These become **upgrade candidates** fed to the **offer price calculation** system you defined earlier.

***

## 6. Data Structure for “Upgrade Candidate”

For each candidate, you’ll store an enriched object used by both:

- Landing page comparison  
- Offer price calculation  
- Email copy generation

Example:

```json
{
  "booking_id": 101,
  "from_prop_id": 1,
  "to_prop_id": 4,
  "viability_score": 8.5,
  "reasons": [
    "+1 bedroom",
    "+1 bathroom",
    "+private pool",
    "faster WiFi",
    "parking included",
    "better family fit"
  ],
  "raw": {
    "from_beds": 1,
    "to_beds": 3,
    "from_baths": 1,
    "to_baths": 2,
    "from_amenities": ["AC","WiFi"],
    "to_amenities": ["pool","AC","WiFi","garden"],
    "from_metadata": { "parking": false, "wifi_speed": "good 100mbps" },
    "to_metadata":   { "parking": true,  "wifi_speed": "fast 500mbps" }
  }
}
```

**Note**: `reasons[]` is critical for both UX and LLM prompts.

***

## 7. Upgrade Determination Flow (End-to-End)

Putting it all together:

1. **Trigger** (cron or cancellation)  
   - Input: booking ID.

2. **Load Booking & Original Prop**  
   - `B = get_booking(id)`  
   - `O = get_property(B.prop_id)`

3. **Find Eligible Candidates**  
   - Filter by capacity + mandatory amenity + basic economics.

4. **Score Candidates**  
   - Call `compute_score(O, C, B)` for each.  
   - Optionally incorporate embeddings later for more subtle semantic similarity (e.g., description text, not just metadata).

5. **Select Top 3**  
   - Sort by `score`, pick top3.

6. **Calculate Offer Prices**  
   - For each of the 3: run your **offer price calculation** (diff-based discount).  
   - Attach pricing details to candidate.

7. **Persist as Offer**  
   - Store in `offer_candidates` / `offers` tables.  
   - Generate email + landing page data.

***

## 8. How AI Fits In

Initially, you can implement logic in Python for determinism. Then you can **augment** with AI:

### 8.1. Rule + AI Hybrid

- **Rules**: Hard filters (capacity, amenities, price monotonicity).  
- **AI (Gemma/OpenAI)**:
  - Rank borderline choices using natural language reasoning:
    - Prompt: “Given original property and candidates, rank them best to worst upgrade for this guest family.”  
  - Generate `reasons[]` from structured diffs:
    - “+1 bedroom, +private pool, closer to beach”  
  - Smooth edge cases (e.g., tradeoff between location vs amenities).

### 8.2. Embedding-Based Similarity (Later)

- Use embeddings over property descriptions or concatenated metadata text:
  - To ensure upgrades are in the **same “experience cluster”** (e.g., beach holiday vs city business trip).  
- Example: avoid offering a **Golf Villa** to someone who clearly booked **Playa de Palma beachfront** for sea/sun.

***

## 9. Document Summary for Antigravity / Implementation

**Implementation tasks**:

1. Write `compute_score(original, candidate, booking)` as pure Python.  
2. Write `find_upgrade_candidates(booking, properties)` that:
   - Filters by hard rules.  
   - Scores each candidate.  
   - Applies price ratio penalties.  
   - Produces top3 with `reasons[]`.  
3. Connect this to **offer price calculator**:  
   - Enrich candidate with economics metrics.  
4. Store in DB: `offer_candidates` for each offer.  
5. Expose through `GET /offer/{id}` so frontend can render comparisons.  
6. Use AI (Gemma/OpenAI) to:
   - Refine `reasons[]` into human-friendly copy.  
   - Optionally re-rank close scores.

If you want, I can next draft the exact Python function signatures for `compute_score` and `find_upgrade_candidates` and give you ready-to-paste skeletons.

Sources
[1] UpRez-Vacation-Rental-Upsell.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/143557486/e58ad8b2-5d53-429a-abd6-90d26a72cf35/UpRez-Vacation-Rental-Upsell.pdf
