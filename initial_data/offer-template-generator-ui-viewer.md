# UpRez Offer Template Generator/Editor UI Requirements

**Page:** `/demo/offer-editor`  
**Purpose:** Live preview + AI copy generation for upgrade emails/landing pages

This uses the local LLM or OpenAi from the demo settings.

***

## 1. UI Layout Structure

```
UpRez Offer Template Editor
═══════════════════════════════════════════════════════════════════════════════

[Original Property ▼]    [Upgrade Property ▼]    [Generate Offer Preview]

ORIGINAL BOOKING PREVIEW           UPGRADE PREVIEW
═══════════════════════════        ════════════════════════════════════════════
Budget Beach Apt #1       │        Mid-Tier Villa #4  
[Image: beach apt]        │        [Image: villa pool]                       
1 bed | 150€/n            │        3 beds | 350€/n → YOUR PRICE: 270€/n
Jan 31-Feb 7 | 2 adults   │        +2 beds | Pool | Parking
                         │        Save 560€ vs list price
                         │        +120€/night revenue lift

GENERATED OFFER PREVIEW (Email + Landing Page)
═══════════════════════════════════════════════════════════════════════════════

Subject: Alice, upgrade to Mid-Tier Villa (+2 beds, pool, save 560€)? 

[Full HTML Email Preview] ← Scrollable iframe/mobile preview
[Full Landing Page Preview] 

EDIT COPY:
Subject: [editable field]                                        [Regenerate]
Body: [rich text editor w/ placeholders]                        
Diffs: [+2 beds • Pool • Parking]  [Edit bullets]

[Save as Template]  [Export HTML]  [Send Test Email]
```

***

## 2. Property Selection Requirements

### **Left Panel: Original Property (Budget Tier)**
```
Budget Tier Properties (Demo Mode):
┌─────────────────────────────────────────────────────────────┐
│ Budget Beach Apt #1 ● [SELECTED]                            │
│ City Studio #2                                            │
│ Poolside Apt #6 (mid-budget)                               │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
```
- Filter: list_nightly_rate ≤ 200€ OR predefined "budget" tier
- Show: prop_name, prop_id, beds/baths, adr/night, thumbnail image
- Single select (radio button style)
- Default: Budget Beach Apt #1
```

### **Right Panel: Upgrade Property (Premium Tier)** 
```
Premium Tier Properties (Demo Mode):
┌─────────────────────────────────────────────────────────────┐
│ Family 2BR Apt #3                                          │
│ Mid-Tier Villa #4 ● [SELECTED]                             │
│ Golf Villa #5                                              │
│ Lux Beach House #7                                         │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
```
- Filter: list_nightly_rate ≥ 220€ AND beds ≥ original.beds
- Visual validation: "✅ Same/more capacity" badge
- Single select (radio button style)  
- Default: Mid-Tier Villa #4
- Warning if upgrade.beds < original.beds: "❌ Capacity downgrade"
```

***

## 3. Generated Offer Preview Requirements

### **Dual Preview Panes (Side-by-Side Desktop, Stacked Mobile)**

```
ORIGINAL                  UPGRADE OFFER
┌──────────────┐         ┌─────────────────────────────────────┐
│ Budget Apt   │         │ Mid-Tier Villa                      │
│ [Image]      │         │ [Hero Image: Pool]                  │
│ 150€/n       │         │ List: 350€ → YOURS: 270€/n          │
│ Jan 31-Feb 7 │         │ Save 560€ total (+120€/n lift)      │
│ 2 adults     │         │                                     │
└──────────────┘         │ +2 beds | Private pool | Parking    │
                         └─────────────────────────────────────┘
```

**Requirements:**
```
- Images: Use properties.images[0] (first image)
- Pricing: Auto-calculate 40% discount on price difference
- Revenue lift: Show "(+X€/night revenue lift)" 
- Diffs: Auto-generate "Beds: 1→3", "Pool: No→Yes", etc.
- Real-time recalculation when properties change
```

### **Email Preview (Scrollable iFrame)**
```
Subject: Alice, upgrade to Mid-Tier Villa (+2 beds, pool, save 560€)?

[Full responsive HTML email preview]
- Hero image (upgrade property)
- Concrete diffs bullet list  
- Pricing breakdown (original → list → discounted)
- 48hr countdown timer
- [View 3 Options] CTA button

[MOBILE PREVIEW] [DESKTOP PREVIEW] toggle
```

### **Landing Page Preview (Separate Tab/Section)**
```
Landing Page: /offer/DEMO-123

[3 Option cards mockup - even though single property selected]
Hero: "Alice, upgrade your stay"
Option Cards: Current | Upgrade | Stretch (AI fills gaps)
Countdown timer, bot widget mockup
```

***

## 4. AI Copy Generation Prompt

```
You are UpRez, generating personalized upgrade offer copy.

ORIGINAL BOOKING:
Property: {original_prop_name} ({original_prop_id})
Location: {location}
Dates: {arrival_date} - {departure_date} ({nights} nights)
Party: {adults} adults, {children} children
Has car: {has_car}
Rate: {original_adr}€/night

UPGRADE PROPERTY: 
Property: {upgrade_prop_name} ({upgrade_prop_id})
List rate: {upgrade_list_adr}€/night
OFFER rate: {upgrade_offer_adr}€/night (40% off price difference)
Total: {upgrade_total}€ (Save {savings}€ vs list)
Key upgrades: {upgrade_diffs}

GUEST CONTEXT:
{guest_context}  // "Family trip", "Solo remote work", etc.

GENERATE:

1. EMAIL SUBJECT (60 chars max, personalized):
   "Alice, [key benefit] (+{beds}, save {savings}€)"

2. EMAIL BODY HTML (200 words max):
   - Greeting with first name
   - "We found a perfect upgrade for your {trip_purpose}"
   - 3 concrete benefit bullets 
   - Pricing: "Yours: {offer_adr}€ vs {list_adr}€ list"
   - 48hr urgency
   - Clear CTA

3. LANDING PAGE COPY:
   - Hero headline (8 words)
   - Option summary (1 sentence)
   - 3 diff bullets
   - Pricing breakdown

4. 3 KEY DIFFS (ultra-concrete):
   - "+2 bedrooms (sleeps 5 vs 2)"
   - "Private pool (shared none)" 
   - "Driveway parking included"

Output ONLY valid JSON:
{
  "subject": "...",
  "email_html": "<div>...full HTML...</div>", 
  "landing_hero": "...",
  "landing_summary": "...",
  "diff_bullets": ["...", "...", "..."],
  "trip_purpose": "family_vacation"
}
```

***

## 5. Copy Editor Requirements

```
EDIT GENERATED COPY:
═══════════════════════════════════════════════════════════════

Subject: [Alice, upgrade to Mid-Tier Villa (+2 beds, pool, save 560€)?]
                                                    [Regenerate AI]

Key Diffs:
☑ +2 bedrooms (sleeps 5 vs 2)          [✏️ Edit] [Re-gen]
☑ Private pool + garden                [✏️ Edit] [Re-gen]  
☑ Driveway parking                     [✏️ Edit] [Re-gen]

Email Preview: [Live HTML refresh on edit]
Landing Preview: [Live refresh on edit]

[💾 Save as Template "Family Pool Upgrade"]
[📧 Send Test Email]     [💾 Export HTML]
```

**Requirements:**
```
- Rich text editor for email body (Quill/TipTap)
- Inline editable diff bullets  
- [Regenerate AI] → Re-run prompt with edited fields
- Live preview refresh (500ms debounce)
- Template library (future: save/load named templates)
```

***

## 6. Backend API Requirements

### **Primary API: `POST /demo/offer-preview`**
```
Request:
{
  "original_prop_id": 1,
  "upgrade_prop_id": 4,
  "guest_name": "Alice Weber", 
  "adults": 2,
  "children": 1,
  "has_car": true
}

Response:
{
  "pricing": {
    "original_adr": 150,
    "upgrade_list": 350,
    "upgrade_offer": 270,
    "revenue_lift": 840,
    "savings": 560
  },
  "copy": {
    "subject": "Alice, upgrade to Mid-Tier Villa (+2 beds, pool, save 560€)?",
    "email_html": "<html>...</html>",
    "diff_bullets": ["+2 bedrooms...", "Private pool...", "Driveway parking..."]
  },
  "images": {
    "original": "/images/budget-beach-apt.jpg",
    "upgrade": "/images/mid-tier-villa-pool.jpg"
  }
}
```

***

## 7. Demo Workflow Integration

**Live Demo Flow (2 mins):**

```
1. Navigate to /demo/offer-editor
2. "Let me show you how UpRez generates personalized copy..."
3. Select Budget Apt → Mid-Tier Villa
4. [Generate Offer Preview] → AI writes copy instantly
5. "Watch - AI understands family needs (pool, space) and crafts concrete benefits"
6. Edit one bullet → Live preview updates
7. [Send Test Email] → Check inbox live
8. "Production-ready HTML + responsive design"
```

***

## 8. Implementation Priority

```
🚀 CRITICAL (Demo Today):
1. Property selection panels (budget/premium filter)
2. POST /demo/offer-preview API + AI prompt
3. Side-by-side preview panes
4. Subject + diffs editor

📋 POLISH (Post-Demo):
1. Rich text email editor
2. Mobile/desktop preview toggle
3. Template save/load
4. Send test email (Resend integration)

🎨 BONUS:
1. Drag/drop image upload
2. A/B testing (2 subject lines)
3. Landing page full mockup
```

***

## 9. Success Criteria

```
✅ Demo ready when:
- Property selection works (budget → premium validation)
- AI generates compelling copy in <3s
- Live preview refreshes instantly on edits
- Email renders perfectly on mobile/desktop
- [Send Test] delivers to inbox
```

**Demo narration:** *"UpRez doesn't just find upgrades - it sells them. AI crafts personalized copy that converts."*

***

Production-grade offer preview tool. Judges see the **full guest journey** from offer generation to inbox! 🚀
