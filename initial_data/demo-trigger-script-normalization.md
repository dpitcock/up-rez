# UpRez Demo Date Normalization + Cancellation Setup Scripts

## Overview

**Two scripts** to maintain demo readiness:

1. **`normalize_demo_dates.py`** – Shift booking dates + **setup cancellation scenarios**
2. **`reset_demo_data.py`** – Full reset to pristine seed state

**Daily run:** `python normalize_demo_dates.py`

***

## 1. Requirements: `normalize_demo_dates.py`

### What it does (Enhanced):

1. **Normalize booking dates** (30% at 7 days, etc.)
2. **Setup 3–5 "cancellation scenarios"**:
   - Book "premium properties" that overlap with "budget bookings"
   - UI shows these as clickable "Cancel this premium booking → trigger upsell"
3. **Preserve overlaps** so cancellations create realistic upgrade opportunities
4. **Log all changes** for audit

### Cancellation Scenario Logic:

```
Goal: Create 3–5 "premium → budget upsell" opportunities

Pattern:
Premium Property A (high ADR, pool/parking) 
  ↓ [Demo simulates "cancellation"]
Budget Booking B (low ADR, overlapping dates)
  ↑ Gets upsell offer for Property A

Example:
Property 4 (Mid-Tier Villa, 350€) overlaps Property 1 (Budget Apt, 150€)
→ Cancel villa → upsell apartment guest to villa
```

### Script Requirements:

```
Input: backend/upstays.db
Output: Updated bookings table + audit log

TARGET_DAYS_TO_ARRIVAL = {
    7: 0.30,   # Prime cron window (3–4 bookings)
    4: 0.20,   # Last-minute (2 bookings)
    12: 0.20,  # Early window (2 bookings)
    25: 0.15,  # Future (1–2 bookings)
    1: 0.15    # Too late (1–2 bookings)
}

CANCELLATION_PAIRS = [
    (4, 1),  # Mid-Tier Villa → Budget Beach Apt
    (7, 6),  # Lux Beach House → Poolside Apt  
    (5, 2),  # Golf Villa → City Studio
]
```

### Detailed Requirements:

```
1. CONNECT to upstays.db

2. NORMALIZE REGULAR BOOKINGS:
   SELECT id, arrival_date, departure_date, nights, prop_id
   FROM bookings WHERE host_id = 'demo_host_001'
   
   FOR each booking:
   - Sample target_days from TARGET_DAYS_TO_ARRIVAL
   - new_arrival = today + target_days (round to Friday 3pm)
   - new_departure = new_arrival + nights
   - UPDATE arrival_date, departure_date, updated_at
   
3. SETUP CANCELLATION SCENARIOS:
   FOR each (premium_prop, budget_prop) in CANCELLATION_PAIRS:
   
   a) Budget booking (7 days from now):
      prop_id = budget_prop
      arrival = today + 7 days (Friday)
      departure = arrival + 7 nights
      guest = "Demo Budget Guest X"
      adr = 140–160€ (low tier)
      
   b) Premium booking (perfect overlap):
      prop_id = premium_prop  
      arrival = SAME as budget booking
      departure = SAME as budget booking
      guest = "Demo Premium Guest X" 
      adr = 300–500€ (high tier)
      Mark as "CANCELLABLE" in UI

4. LOG CHANGES:
   audit_log.json: [
     {"type": "booking_normalized", "booking_id": 123, "old_days": 45, "new_days": 7},
     {"type": "cancellation_prepared", "premium_prop": 4, "budget_prop": 1, "dates": "2026-01-31 to 2026-02-07"}
   ]

5. DRY-RUN MODE (default):
   Print changes without applying
   --apply flag to execute UPDATEs

6. VALIDATION:
   - No overlapping premium/budget conflicts
   - All bookings have valid nights = departure-arrival
   - 3–5 bookings exactly at 7 days (cron-ready)
   - 3–5 cancellation scenarios ready
```

### Demo UI Requirements (`/demo` page):

```
CANCELLATION CONTROLS:
┌─────────────────────────────┐
│ Cancel Premium → Upsell Demo│
├─────────────────────────────┤
│ 🏠 Mid-Tier Villa (Prop 4)  │
│   Dates: Jan 31-Feb 7       │
│   ↓ Cancel → Upsell Budget  │
│   [TRIGGER CANCELLATION]    │
├─────────────────────────────┤
│ 🏖️ Lux Beach House (Prop 7) │
│   Dates: Feb 7-Feb 14       │
│   ↓ Cancel → Upsell Poolside│
│   [TRIGGER CANCELLATION]    │
└─────────────────────────────┘
```

***

## 2. Requirements: `reset_demo_data.py`

### What it does:

1. **Delete** all bookings for `demo_host_001`
2. **Re-run** original `seed.py` (properties + pristine bookings)
3. **Seed** fresh `host_settings` for demo host
4. **Verify** clean state

```
Usage: python reset_demo_data.py
Output: "✓ Reset complete. 9 properties, 12 bookings, demo ready."
```

### Requirements:

```
1. DELETE FROM offer_option_history WHERE host_id = 'demo_host_001'
2. DELETE FROM offers WHERE booking_id IN (SELECT id FROM bookings WHERE host_id = 'demo_host_001')
3. DELETE FROM bookings WHERE host_id = 'demo_host_001'  
4. DELETE FROM host_settings WHERE host_id = 'demo_host_001'

5. python backend/seed.py --demo-only

6. VALIDATE:
   SELECT COUNT(*) FROM bookings WHERE host_id = 'demo_host_001' → 12
   SELECT COUNT(*) FROM properties → 9
   SELECT * FROM host_settings WHERE host_id = 'demo_host_001' → 1 row

7. PRINT STATUS:
   "Demo reset complete at [timestamp]"
   "Run 'normalize_demo_dates.py' to prepare fresh demo state"
```

***

## 3. Demo Workflow Integration

### **Pre-Demo (5 mins):**
```
1:00 PM: python reset_demo_data.py           # Clean slate
1:02 PM: python normalize_demo_dates.py      # Fresh + cancellable
1:05 PM: Browse /demo → Verify 3–5 cron-ready + 3 cancellation scenarios
```

### **Live Demo Flow:**
```
1. [Trigger Cron] → Hits 7-day bookings
2. [Cancel Premium Villa] → Triggers cancellation webhook → Budget guest gets villa offer  
3. Show both workflows work perfectly
```

### **Post-Demo Cleanup:**
```
6:00 PM: python reset_demo_data.py         # Team can continue working
```

***

## 4. Script Arguments & Flags

```
normalize_demo_dates.py:
  --dry-run        Preview changes (default)
  --apply          Apply changes  
  --db=PATH        Database path (default: backend/upstays.db)
  --host=ID        Demo host ID (default: demo_host_001)

reset_demo_data.py:
  --force          Skip confirmation prompt
  --db=PATH        Database path  
```

***

## 5. Audit & Safety

### **Safety checks (both scripts):**
```
[ ] No bookings outside demo_host_001 affected
[ ] All date calculations preserve nights length  
[ ] Premium/budget overlaps are perfect (100% date match)
[ ] No data loss (audit_log.json created)
[ ] Transactions: All or nothing per booking
```

### **Audit log format:**
```json
[
  {"timestamp": "2026-01-24T13:45:00Z", "script": "normalize", "changes": 18},
  {"type": "booking_normalized", "booking_id": 123, "prop_id": 1, "old": "2026-01-10", "new": "2026-01-31"},
  {"type": "cancellation_prepared", "premium": 4, "budget": 1, "dates": "2026-01-31 to 2026-02-07"}
]
```

***

## 6. Implementation Priority

```
🚀 CRITICAL (Demo Today):
1. normalize_demo_dates.py (date normalization)
2. Demo UI cancellation controls  
3. reset_demo_data.py

📋 NICE (Post-Demo):
1. Audit logging to JSON
2. Configurable TARGET_DAYS_TO_ARRIVAL
3. Weekend detection logic
```


# UpRez Demo UI Requirements: Trigger Controls

**Page:** `/demo`  
**Purpose:** Live demo controls for judges

***

## Layout Structure

```
UpRez Demo Control Panel
═══════════════════════════════════════════════════════════════════════════════

[Toggle Model Scoring] Off → On    [Normalize Demo Dates]    [Reset All Data]

1️⃣ CRON TRIGGER (7-Day Window)
   Select booking → [Trigger Cron Upgrade Offer]

2️⃣ CANCELLATION TRIGGER (Instant Upsell)
   Select premium booking → [Cancel → Upsell Budget Guest]

3️⃣ RECENT ACTIVITY
   Live log of triggers + results

4️⃣ STATS
   Demo readiness indicators
═══════════════════════════════════════════════════════════════════════════════
```

***

## 1. Cron Trigger Section

```
1️⃣ CRON TRIGGER (7-Day Window)
═══════════════════════════════════════════════════════════════════════════════

Bookings ready for cron (7 days to arrival):
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Alice Weber (Budget Beach Apt) → 7 days                  │
│   Jan 31-Feb 7 | 150€/n | 2 adults                         │
│   [SELECT → Trigger Cron]                                   │
├─────────────────────────────────────────────────────────────┤
│ 📱 James Collins (City Studio) → 7 days                     │
│   Feb 7-Feb 14 | 140€/n | 2 adults, 2 kids                 │
│   [SELECT → Trigger Cron]                                   │
├─────────────────────────────────────────────────────────────┤
│ 🏖️ Sofia García (Poolside Apt) → 7 days                     │
│   Feb 14-Feb 21 | 250€/n | 2 adults                         │
│   [SELECT → Trigger Cron]                                   │
└─────────────────────────────────────────────────────────────┘

[TRIGGER SELECTED CRON EVENT]    Status: Ready (3 bookings)
```

**Requirements:**
```
- Auto-populate from bookings where days_to_arrival = 7 AND host_id = 'demo_host_001'
- Show: guest_name, prop_name, dates, adr/night, adults/children summary
- Single-select radio buttons
- [TRIGGER] → POST /demo/trigger/cron?booking_id=123
- Live status updates (logs below)
```

***

## 2. Cancellation Trigger Section

```
2️⃣ CANCELLATION TRIGGER (Instant Upsell)
═══════════════════════════════════════════════════════════════════════════════

Premium bookings ready to cancel (triggers budget guest upsell):
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Mid-Tier Villa (Prop 4) → Upsell Budget Apt Guest        │
│   Jan 31-Feb 7 | 350€/n | Alice Weber would get offer      │
│   [CANCEL PREMIUM → TRIGGER]                                │
├─────────────────────────────────────────────────────────────┤
│ 🏖️ Lux Beach House (Prop 7) → Upsell Poolside Guest        │
│   Feb 7-Feb 14 | 550€/n | Sofia García would get offer     │
│   [CANCEL PREMIUM → TRIGGER]                                │
├─────────────────────────────────────────────────────────────┤
│ ⛳ Golf Villa (Prop 5) → Upsell City Studio Guest           │
│   Feb 14-Feb 21 | 450€/n | James Collins would get offer   │
│   [CANCEL PREMIUM → TRIGGER]                                │
└─────────────────────────────────────────────────────────────┘

[TRIGGER SELECTED CANCELLATION]   Status: Ready (3 scenarios)
```

**Requirements:**
```
- Auto-populate from overlapping premium/budget pairs (from normalize_demo_dates.py)
- Show: premium_prop_name (Prop ID), dates, adr/night, "→ Upsell [budget guest name]"
- Single-select radio buttons  
- [TRIGGER] → POST /demo/trigger/cancellation?prop_id=4&dates=2026-01-31_2026-02-07
- Button text: "CANCEL PREMIUM → TRIGGER"
- Live status updates (logs below)
```

***

## 3. Global Controls (Top Bar)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UpRez Demo Control Panel                 Model: [Off ● On]  | Ready ✓      │
│                                                                    [Reset] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
```
Model Scoring Toggle:
- [Off ● On] → Controls whether ranking uses expected_lift vs viability_score
- Persists in localStorage, defaults OFF for "pure rules" demo

Normalize Demo Dates:
- [Normalize Dates] → python normalize_demo_dates.py (backend call or shell)
- Refreshes booking lists below

Reset All Data:  
- [Reset] → python reset_demo_data.py → Full clean slate
- Confirmation dialog: "This deletes ALL demo bookings. Continue?"
```

***

## 4. Recent Activity Log (Bottom)

```
3️⃣ RECENT ACTIVITY
═══════════════════════════════════════════════════════════════════════════════
14:32:15  Cron triggered (Alice Weber, Budget Apt) → Offer #5001 created ✓
14:33:22  Cancellation (Prop 4) → James got villa upsell → Offer #5002 ✓  
14:34:01  Model scoring ON → Expected revenue +18%
14:35:47  Email sent to Alice (Offer #5001)
═══════════════════════════════════════════════════════════════════════════════
```

**Requirements:**
```
- Auto-scrolling log (last 10 events)
- Timestamps (HH:MM:SS)
- Color-coded: ✓ green success, ⚠ yellow warning, ✗ red error
- WebSocket or Server-Sent Events for live updates
- Clear on Reset
```

***

## 5. Demo Readiness Stats (Bottom Right)

```
4️⃣ STATS                    Demo Ready ✓
═══════════════════════════
Cron-ready bookings: 3/3   Cancellation pairs: 3/3
Offers this session: 5     Expected revenue lift: +22%
Last normalize: 14:20      Last reset: 13:45
═══════════════════════════
```

**Requirements:**
```
- Cron-ready: COUNT(bookings WHERE days_to_arrival=7)
- Cancellation pairs: COUNT(premium bookings with budget overlap)
- Green ✓ when both ≥ 3 (demo minimum)
- Red ✗ when < 3 → "Run Normalize Dates"
- Timestamps link to audit logs
```

***

## 6. Backend API Requirements

### Existing APIs (extend):
```
POST /demo/trigger/cron?booking_id=123
→ Existing webhook flow

POST /demo/trigger/cancellation?prop_id=4
→ Simulate cancellation webhook:
  {
    "event": "cancellation",
    "prop_id": 4,
    "arrival_date": "2026-01-31",
    "departure_date": "2026-02-07"
  }
```

### New APIs:
```
GET /demo/status
→ {
    "cron_ready_count": 3,
    "cancellation_ready_count": 3,
    "demo_ready": true,
    "normalize_timestamp": "2026-01-24T14:20:00Z"
  }

POST /demo/normalize-dates
→ Shell exec: python normalize_demo_dates.py

POST /demo/reset-data  
→ Shell exec: python reset_demo_data.py
```

***

## 7. Visual Design Requirements

```
Colors:
✓ Green: Ready/success (cron-ready=3, demo-ready)
⚠ Yellow: Warning (cron-ready=1–2)
✗ Red: Error/problem (cron-ready=0)

Buttons:
Primary [TRIGGER]: Blue → Purple hover → Loading → Green ✓
Secondary [Normalize]: Grey → Blue hover
Destructive [Reset]: Red outline → Red fill (confirm dialog)

Icons:
1️⃣ Cron: 🔄 (refresh/loop)
2️⃣ Cancel: ✂️ (scissors/cut)
Model toggle: 🤖 (robot)
Normalize: 📅 (calendar)
Reset: 🔄↩️ (refresh back)

Layout:
- Sticky top bar (global controls)
- Two-column main (Cron left, Cancel right)  
- Full-width log + stats bottom
- Responsive: Mobile stacks vertically
```

***

## 8. Interaction Flow (Live Demo)

```
Judge: "Show me the cron workflow"
1. Scroll to Cron section → 3 green options  
2. "Alice's Budget Apt is 7 days out..." → [SELECT] → [TRIGGER]
3. Live log: "Cron triggered → Offer #5001 ✓"
4. Switch to email inbox → Show email

Judge: "Now cancellation"
1. Scroll to Cancellation → "Mid-Tier Villa overlaps..." 
2. [CANCEL PREMIUM → TRIGGER]
3. Live log: "Cancellation webhook → Budget guest offer ✓"
4. "James now gets villa upsell email"
```

***

## 9. Implementation Priority

```
🚀 DAY 1 (Today):
1. Cron section (reuse existing trigger)
2. Live log (WebSocket/simple polling)
3. Global controls (model toggle)
4. Cancellation section  
5. Stats panel
6. Backend APIs (/demo/status, /demo/normalize)

🎨 BONUS:
1. Icons/animations
2. Responsive design
```

***

## 7. Success Criteria

```
✅ Demo ready when:
- 3–4 bookings show "7 days to arrival" 
- 3 premium/budget pairs ready for cancellation demo
- /demo page shows clear [TRIGGER CANCELLATION] buttons
- Both cron + cancellation workflows work end-to-end
```

**Demo narration:** *"UpRez keeps demos fresh automatically. This script ensures we always have prime upgrade opportunities ready."*

***

Perfect. Your demo will **never break** due to stale dates. Always cron-ready + cancellation-ready. Professional polish! 🚀
