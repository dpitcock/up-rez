# UpRez Host Settings Dashboard Requirements

## 1. Database Schema

### Table: `host_settings`

```sql
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

***

## 2. Frontend Dashboard Requirements

### Page Requirements: `/dashboard/settings`

**Layout Structure:**
```
HEADER: "ResLift Host Settings" + description
GRID: 6 sections (2-column responsive)
FOOTER: Save / Reset buttons + analytics summary
```

**Required Sections:**

1. **Revenue Guardrails** 💰
   - Min Revenue Lift (€/night) [number input: 10-100]
   - Max Discount (%) [range slider: 5-50%, step 5%]
   - Min ADR Ratio [number: 1.00-1.50, step 0.05]
   - Max Price Jump (x) [number: 1.50-5.00, step 0.25]

2. **Fee Tracking** 📊
   - Channel Manager Fee (%) [number: 0-30%, step 1%]
   - Reservation Change Fee (€) [number: 0-100]

3. **Operational Constraints** 🔒
   - Blocked Properties [multi-select dropdown from properties table]
   - Preferred Amenities [multi-checkbox: wifi,pool,parking,workspace,...]
   - Max Distance to Beach (m) [number: 0-10000, step 100]

4. **Offer Strategy** 🎯
   - Offer Validity (hours) [number: 24-168, step 24]
   - Max Offers/Month [number: 0-unlimited]
   - Auto-Regenerate Offers [toggle on/off]

5. **Communication** 📧
   - Email Sender Address [email input]
   - Email Sender Name [text input]
   - Use OpenAI for Copy [toggle Gemma/OpenAI]

6. **Analytics** 📈 *(read-only)*
   - Offers Sent This Month [stat card]
   - Revenue Lifted This Month [stat card €X,XXX]
   - Conversion Rate [stat card XX%]

**UI Components Needed:**
```
SettingControl (number, text, email, toggle, range, multi-select, multi-checkbox)
SettingsSection (collapsible sections with icons)
StatCard (read-only metrics)
Toast (save success/error feedback)
```

**Required Actions:**
```
[Save Settings] → PATCH /api/host/{host_id}/settings
[Reset to Defaults] → POST /api/host/{host_id}/settings/reset
[View Recent Offers] → Link to offers list
```

***

## 3. API Requirements

```
GET    /api/host/{host_id}/settings     → Fetch current settings
PATCH  /api/host/{host_id}/settings     → Update settings (partial)
POST   /api/host/{host_id}/settings/reset → Reset to defaults
```

**Required Response Shapes:**
```json
// GET response (full settings object)
{
  "host_id": "host_123",
  "revenue_guardrails": { ... },
  "analytics": { "offers_sent_this_month": 12, ... }
}

// PATCH response
{
  "status": "updated",
  "updated_fields": ["min_revenue_lift", "max_discount_pct"],
  "updated_at": "2026-01-23T22:58:00Z"
}
```

***

## 4. Integration with Existing Logic (REVISIT REQUIRED)

### **ALL EXISTING LOGIC MUST NOW:**

1. **Offer Generation** (`POST /webhook`, `POST /demo/trigger`)
   ```
   OLD: Hardcoded thresholds
   NEW: Load host_settings for booking.host_id → apply guardrails
   
   BEFORE classify_upgrades():
     host_settings = get_host_settings(booking.host_id)
     guardrails = extract_guardrails(host_settings)
     candidates = classify_upgrades(booking, guardrails)
   ```

2. **Pricing Calculation**
   ```
   OLD: Fixed 40% discount
   NEW: host_settings.max_discount_pct
   
   offer_adr = original_adr + (upgrade_list - original_adr) * (1 - max_discount_pct)
   ```

3. **Candidate Filtering**
   ```
   OLD: Simple bed/bath checks
   NEW: host_settings.blocked_prop_ids, preferred_amenities, max_distance
   
   if candidate.prop_id in blocked_prop_ids: skip
   if not enough_preferred_amenities_match: downrank
   ```

4. **Offer Expiry**
   ```
   OLD: Hardcoded 48h
   NEW: host_settings.offer_validity_hours
   
   expires_at = now + timedelta(hours=offer_validity_hours)
   ```

5. **LLM Copy Generation**
   ```
   OLD: Always Gemma
   NEW: host_settings.use_openai_for_copy
   
   llm_client = OpenAI() if use_openai else Ollama()
   ```

6. **Email Sending**
   ```
   OLD: Fixed from address
   NEW: host_settings.email_sender_address, email_sender_name
   ```

### **Required Code Changes:**

```
backend/services/offer_service.py
├── generate_offer() → Load host_settings FIRST
├── validate_offer() → Use host_settings guardrails  
├── calculate_pricing() → host_settings.max_discount_pct
└── send_email() → host_settings.email config

backend/routers/webhook.py  
└── POST /webhook/* → Pass host_settings to offer_service

backend/routers/demo.py
└── POST /demo/trigger → Use demo host_id "demo_host_001"

database.py
└── Add seed_host_settings() to seed.py
```

***

## 5. Seed Data Requirements

### Add to `seed.py`:

```python
def seed_host_settings(conn):
    """Seed default host settings."""
    defaults = {
        "host_id": "demo_host_001",
        "host_name": "Palma Properties Demo",
        "min_revenue_lift_eur_per_night": 30.00,
        "max_discount_pct": 0.25,
        # ... all defaults
    }
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO host_settings 
        (host_id, host_name, min_revenue_lift_eur_per_night, ...)
        VALUES (?, ?, ?, ...)
    """, list(defaults.values()))
    
    conn.commit()
    print("✓ Seeded demo host settings")
```

### Link bookings to host:
```sql
UPDATE bookings SET host_id = "demo_host_001";
```

***

## 6. Demo Integration

**Demo page requirements (`/demo`):**
```
[Trigger Cron] → Uses demo_host_001 settings
[View Host Settings] → Link to /dashboard/settings?host=demo_host_001
[Change Settings Live] → Modify min_revenue_lift → trigger new offer → show different results
```

**Demo narration addition:**
```
"Hosts configure everything in the dashboard. Let me change the minimum revenue lift from 30€ to 50€..."
[Save settings]
"Now trigger a new offer—watch how the candidates change immediately."
[Different/more restrictive results]
"ResLift respects host economics perfectly."
```

***

## 7. Implementation Priority

```
HIGH PRIORITY (before demo):
1. host_settings table + seed_demo_host()
2. GET /api/host/{host_id}/settings endpoint
3. Apply guardrails to offer generation
4. Link demo bookings to demo_host_001

MEDIUM (post-demo):
1. PATCH endpoint + basic settings form
2. Full dashboard UI
3. Analytics tracking

LOW (production):
1. Authentication (host login)
2. Multi-host support
3. A/B testing
```

***

## 8. Impact on Existing Documents

**Update these docs with host_settings references:**

```
✅ System Architecture → "Load host_settings before classification"
✅ API Contract → Add /api/host/{host_id}/settings endpoints  
✅ Data Contract → Add host_settings table
✅ Demo Script → "Show host settings dashboard"
✅ Guardrails doc → "Loaded from host_settings table"
```