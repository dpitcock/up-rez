# UpRez Email & Landing Page Content Spec

***

## 1. Overview

This document defines the **content structure, tone, and copy constraints** for:
- **HTML Email** sent to guests with upgrade offer
- **Landing Page** (`/offer/{offer_id}`) where guests view and book upgrades

Both are designed to:
- Feel **personalized and specific** (not generic spam)
- Present **concrete, visual diffs** (extra bedroom, pool, parking—not "better")
- Create **urgency without pressure** (48-hour timer, limited inventory)
- Drive **conversions** while preserving brand trust

***

## 2. Email Template

### 2.1 HTML Email Structure

**Subject line examples:**

```
Alice, upgrade to Family 2BR (+1 bed, +parking, save 280€)
James, villa with pool? Upgrade for just +60€/night
Sofia, here's your beachfront upgrade (48 hours only)
```

**Rules for subject:**
- Personalize with first name
- Highlight **one key diff** (bed, pool, parking, view)
- Include **price anchor** ("save 280€" or "+60€/night")
- Keep under 60 characters for mobile preview
- No emoji, no urgency language ("URGENT!", "ACT NOW!")

***

### 2.2 Email Body Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .hero-image { width: 100%; height: 300px; object-fit: cover; border-radius: 4px; }
    .content { background: #f9f9f9; padding: 30px 20px; }
    .option-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .price-highlight { font-size: 24px; font-weight: bold; color: #667eea; }
    .savings-badge { display: inline-block; background: #4caf50; color: white; 
                     padding: 8px 12px; border-radius: 4px; font-size: 14px; margin: 10px 0; }
    .cta-button { display: inline-block; background: #667eea; color: white; 
                  padding: 14px 28px; border-radius: 6px; text-decoration: none; 
                  font-weight: 600; margin-top: 15px; }
    .cta-button:hover { background: #5568d3; }
    .footer { font-size: 12px; color: #999; text-align: center; padding: 20px; border-top: 1px solid #e0e0e0; }
    .timer { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <div class="header">
      <h1>Exclusive Upgrade for Your Stay</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
        {GUEST_NAME}, we found the perfect upgrade for your trip to {LOCATION}
      </p>
    </div>
    
    <!-- HERO IMAGE -->
    <img src="cid:option1_hero" alt="{PROP_NAME}" class="hero-image" 
         style="display: block; width: 100%; border-radius: 0;">
    
    <!-- CONTENT -->
    <div class="content">
      
      <!-- INTRO PARAGRAPH -->
      <h2 style="font-size: 20px; margin: 0 0 15px 0;">
        More space. Better amenities. Same dates.
      </h2>
      <p style="line-height: 1.6; margin: 0 0 20px 0;">
        We looked at your original booking ({ORIGINAL_PROP_NAME}, {ORIGINAL_DATES}) 
        and found 3 properties that offer genuine upgrades for your group of {GUEST_ADULTS} adults{GUEST_CHILDREN_TEXT}.
      </p>
      <p style="line-height: 1.6; margin: 0 0 30px 0;">
        {PERSONALIZATION_REASON}
      </p>
      
      <!-- EXAMPLE: Personalization reasons -->
      <!-- For family: "With two children, we prioritized quiet neighborhoods with pool access and parking." -->
      <!-- For solo: "As a remote worker, we focused on properties with excellent WiFi and dedicated workspaces." -->
      <!-- For couple: "As a couple seeking privacy and views, we searched for beachfront and garden properties." -->
      
      <!-- TIMER / URGENCY BANNER -->
      <div class="timer">
        <strong>⏱ Offer expires in 48 hours</strong>
        <p style="margin: 5px 0 0 0; font-size: 13px;">
          These prices are locked only until {EXPIRY_DATE_FRIENDLY}. Availability is limited.
        </p>
      </div>
      
      <!-- TOP OPTION (Ranking 1) CARD -->
      <div class="option-card">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">
          🏆 Top Option: {OPTION1_PROP_NAME}
        </h3>
        
        <p style="margin: 0 0 15px 0; line-height: 1.5; font-size: 15px;">
          {OPTION1_SUMMARY}
        </p>
        
        <div style="background: #f0f0f0; padding: 12px; border-radius: 4px; margin: 12px 0;">
          <strong>Why we suggest this:</strong>
          <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px;">
            <li>{OPTION1_DIFF_1}</li>
            <li>{OPTION1_DIFF_2}</li>
            <li>{OPTION1_DIFF_3}</li>
          </ul>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">Your upgrade price:</div>
          <div style="font-size: 14px; margin-bottom: 5px;">
            <strike style="color: #999;">{OPTION1_LIST_TOTAL}€</strike>
            <span class="price-highlight">{OPTION1_OFFER_TOTAL}€</span>
            <span style="font-size: 13px; color: #666;">for {NIGHTS} nights</span>
          </div>
          <div style="font-size: 13px; color: #999; margin-bottom: 8px;">
            ({OPTION1_OFFER_ADR}€/night instead of {FROM_ADR}€/night)
          </div>
          <div class="savings-badge">✓ Save {OPTION1_SAVINGS}€</div>
        </div>
        
        <a href="https://app.uprez.com/offer/{OFFER_ID}?utm_source=email&utm_content=option1" 
           class="cta-button">
          View All 3 Options
        </a>
      </div>
      
      <!-- TWO MORE OPTIONS (Summary) -->
      <p style="margin-top: 25px; font-size: 14px; color: #666; text-align: center;">
        We also found {OPTION2_PROP_NAME} (save {OPTION2_SAVINGS}€) 
        and {OPTION3_PROP_NAME} (save {OPTION3_SAVINGS}€).
      </p>
      <p style="text-align: center; margin-top: 15px;">
        <a href="https://app.uprez.com/offer/{OFFER_ID}?utm_source=email&utm_content=teaser" 
           style="color: #667eea; text-decoration: none; font-weight: 600;">
          See all 3 options on our landing page →
        </a>
      </p>
      
    </div>
    
    <!-- FOOTER -->
    <div class="footer">
      <p style="margin: 0;">
        Questions? Reply to this email or <a href="https://app.uprez.com/offer/{OFFER_ID}" 
        style="color: #667eea; text-decoration: none;">
        ask our AI assistant on the landing page
        </a>.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px;">
        UpRez © 2026 | 
        <a href="https://app.uprez.com/unsubscribe" style="color: #999; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
    
  </div>
</body>
</html>
```

***

### 2.3 Email Placeholders & Data Mapping

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{GUEST_NAME}` | `bookings.guest_name` | `Alice` |
| `{LOCATION}` | `properties.location` | `Palma` |
| `{ORIGINAL_PROP_NAME}` | Original property name | `Budget Beach Apt` |
| `{ORIGINAL_DATES}` | `arrival_date` to `departure_date` | `Jun 10–17` |
| `{GUEST_ADULTS}` | `bookings.adults` | `2` |
| `{GUEST_CHILDREN_TEXT}` | Conditional pluralization | `, 2 children` or `` (empty) |
| `{PERSONALIZATION_REASON}` | Generated per guest archetype (see below) | `With children in tow, we prioritized properties with pools, parking, and family-friendly spaces.` |
| `{EXPIRY_DATE_FRIENDLY}` | `offers.expires_at` formatted | `June 8, 10:30 AM` |
| `{OPTION1_PROP_NAME}` | `offers.top3[0].prop_name` | `Family 2BR Apt` |
| `{OPTION1_SUMMARY}` | `offers.top3[0].summary` | `Extra bedroom, parking, and balcony with sea view.` |
| `{OPTION1_DIFF_1}` | `offers.top3[0].diffs[0]` | `+1 extra bedroom (2 beds vs 1)` |
| `{OPTION1_DIFF_2}` | `offers.top3[0].diffs[1]` | `Underground parking included` |
| `{OPTION1_DIFF_3}` | `offers.top3[0].diffs[2]` | `Quieter neighborhood, 200m to beach` |
| `{OPTION1_LIST_TOTAL}` | `offers.top3[0].pricing.list_total` | `1540` |
| `{OPTION1_OFFER_TOTAL}` | `offers.top3[0].pricing.offer_total` | `1344` |
| `{OPTION1_OFFER_ADR}` | `offers.top3[0].pricing.offer_adr` | `192` |
| `{OPTION1_SAVINGS}` | `list_total - offer_total` | `196` |
| `{FROM_ADR}` | `bookings.base_nightly_rate` | `150` |
| `{NIGHTS}` | `bookings.nights` | `7` |
| `{OFFER_ID}` | `offers.id` | `5001` |
| `{OPTION2_PROP_NAME}` | `offers.top3[1].prop_name` | `Mid-Tier Villa` |
| `{OPTION2_SAVINGS}` | `offers.top3[1].pricing.list_total - offer_total` | `560` |
| `{OPTION3_PROP_NAME}` | `offers.top3[2].prop_name` | `Poolside Apt` |
| `{OPTION3_SAVINGS}` | `offers.top3[2].pricing.list_total - offer_total` | `280` |

***

### 2.4 Personalization Reason by Guest Archetype

Generated by LLM or rule-based logic. Goal: 1–2 sentences, 20–40 words.

**Family with children:**
```
"With children in tow, we prioritized quiet neighborhoods with pool access, 
parking for your rental car, and family-friendly outdoor space."
```

**Solo traveler / Remote worker:**
```
"As a digital nomad, we focused on properties with excellent WiFi, 
dedicated workspaces, and central locations with good cafés."
```

**Couple (romance focus):**
```
"For two of you, we searched for beachfront properties, private pools, 
and romantic views—places where you can unwind together."
```

**Group / Party:**
```
"For your group of {ADULTS}, we prioritized spacious villas with 
multiple bedrooms, shared living areas, and garden space."
```

**Business traveler:**
```
"Given your work needs, we highlighted properties with high-speed WiFi, 
dedicated office space, and proximity to the city center."
```

***

### 2.5 Email Copy Tone & Constraints

- **Personalized, not salesy**: "We found X for you" not "Don't miss out!"
- **Concrete over abstract**: "Pool, parking, 2 bedrooms" not "luxury upgrade"
- **Guest-centric**: Focus on their benefit, not your revenue
- **Honest pricing**: Show discounts, but don't hide true cost
- **Friendly urgency**: "48-hour offer" is reason enough; avoid "URGENT!", "LAST CHANCE!"
- **No misleading scarcity**: Only mention if property is actually limited (e.g., only 1 unit left)
- **First-person clarity**: "We found" / "We suggest" creates partnership feeling

***

## 3. Landing Page Content

### 3.1 Landing Page URL & Layout

```
https://app.uprez.com/offer/{offer_id}
```

**Structure (top to bottom):**

1. **Hero banner** (property image, countdown timer, guest greeting)
2. **Original booking summary** (small, recapitulation)
3. **3 Upgrade option cards** (side-by-side on desktop, stacked on mobile)
4. **AI Q&A bot** (right sidebar or bottom, persistent)
5. **Graceful degradation** (if options become unavailable)
6. **Footer** (FAQ, contact, unsubscribe)

***

### 3.2 Hero Banner (Top)

```html
<div class="hero-banner">
  <div class="hero-content">
    <h1>Upgrade your stay, {GUEST_NAME}</h1>
    <p class="subheading">3 better options for the same dates</p>
    
    <div class="timer-badge">
      <span class="timer-icon">⏱</span>
      <span class="timer-text">Offer expires in <strong id="countdown">47h 35m</strong></span>
      <p class="timer-small">
        {ORIGINAL_PROP_NAME} → {LOCATION}
        <br>
        {ARRIVAL_DATE_FRIENDLY} to {DEPARTURE_DATE_FRIENDLY}
      </p>
    </div>
  </div>
  
  <div class="hero-image" style="background-image: url('{OPTION1_HERO_IMAGE}');"></div>
</div>
```

**Copy rules:**
- Always use first name (friendly, personal)
- Confirm dates and original property (reassurance)
- Countdown timer updates every minute (JavaScript)
- After expiry: timer turns grey, [BOOK] buttons disable

***

### 3.3 Booking Summary Card (Optional, collapsible)

Small recapitulation so guest doesn't lose context:

```
Your original booking
═════════════════════════════════════
Budget Beach Apt, Palma
Jun 10–17, 2026 (7 nights)
2 adults
150€/night × 7 = 1,050€

        [Compare with upgrades below ↓]
```

***

### 3.4 Option Cards (Main Content)

Three cards in a grid layout (desktop: 1/3 width each, mobile: stacked full width).

```html
<div class="option-card option-1">
  <!-- RANKING BADGE -->
  <div class="ranking-badge">🏆 Top Option</div>
  
  <!-- IMAGE CAROUSEL (simplified for MVP: single large image) -->
  <div class="option-image-carousel">
    <img src="{OPTION1_IMAGE_1}" alt="{OPTION1_PROP_NAME}" 
         class="option-hero-image">
    <span class="image-count">1 of {IMAGE_COUNT}</span>
  </div>
  
  <!-- PROPERTY NAME & LOCATION -->
  <h2 class="option-name">{OPTION1_PROP_NAME}</h2>
  <p class="option-location">📍 {LOCATION}, {BEACH_DISTANCE}</p>
  
  <!-- HEADLINE -->
  <p class="option-headline">{OPTION1_HEADLINE}</p>
  
  <!-- SUMMARY -->
  <p class="option-summary">{OPTION1_SUMMARY}</p>
  
  <!-- KEY DIFFS (Bullet list) -->
  <div class="option-diffs">
    <strong>What's better:</strong>
    <ul>
      <li>{OPTION1_DIFF_1}</li>
      <li>{OPTION1_DIFF_2}</li>
      <li>{OPTION1_DIFF_3}</li>
    </ul>
  </div>
  
  <!-- PRICING BOX -->
  <div class="option-pricing">
    <div class="pricing-row">
      <span class="label">Your current rate:</span>
      <span class="price-old">{FROM_ADR}€/night</span>
    </div>
    <div class="pricing-row emphasis">
      <span class="label">Upgrade price:</span>
      <span class="price-new">{OPTION1_OFFER_ADR}€/night</span>
    </div>
    <div class="pricing-row savings">
      <span class="label">Total for {NIGHTS} nights:</span>
      <span class="savings-amount">
        <strike>{OPTION1_LIST_TOTAL}€</strike> 
        <strong>{OPTION1_OFFER_TOTAL}€</strong>
      </span>
    </div>
    <div class="savings-badge">
      ✓ Save {OPTION1_SAVINGS}€ with this upgrade
    </div>
  </div>
  
  <!-- AMENITIES QUICK VIEW (icons or tags) -->
  <div class="option-amenities">
    <span class="amenity-tag" title="WiFi">📶</span>
    <span class="amenity-tag" title="Pool">🏊</span>
    <span class="amenity-tag" title="Parking">🅿️</span>
    <span class="amenity-tag" title="Workspace">💻</span>
    <!-- More icons as needed -->
  </div>
  
  <!-- CTA BUTTON -->
  <button class="cta-button btn-primary" data-prop-id="{OPTION1_PROP_ID}">
    BOOK THIS UPGRADE
  </button>
  
  <!-- SECONDARY: ASK BOT -->
  <p class="option-footer">
    <a href="#bot-chat" class="ask-bot-link">
      Questions? Ask our AI assistant
    </a>
  </p>
  
  <!-- AVAILABILITY WARNING (if unavailable) -->
  <div class="availability-warning" style="display: none;">
    ❌ This property was booked after your offer was sent.
    <br>
    <a href="javascript:regenOffers()">Find new upgrades</a>
  </div>
</div>

<!-- REPEAT for options 2 and 3 (same structure) -->
```

***

### 3.5 Option Card Copy Rules

**Headlines** (one-liner hook, max 60 chars):
```
"More space for your beach week"
"Upgrade to your own villa with pool"
"Poolside comfort at beachfront prices"
"Luxury without the luxury price tag"
```

**Summaries** (one sentence, 15–25 words):
```
"Extra bedroom, underground parking, and a balcony with sea and city glimpses."
"Private pool, garden and space for the whole family in quiet hills."
"Ground-floor apartment opening directly onto a shared pool and garden."
```

**Diffs** (concrete, specific, 3 max):
```
"+1 extra bedroom (3 beds vs 1)"
"Includes underground parking"
"Closer to Palma harbour and park"
```

vs. bad:
```
"Better location" ← too vague
"More luxury" ← subjective
"Modern finishes" ← not a concrete diff
```

***

### 3.6 Pricing Display Rules

**Always show:**
1. Guest's original nightly rate (reference)
2. Upgrade property's list rate (transparency)
3. Discounted upgrade rate (offer)
4. Total cost for stay
5. Savings in EUR (concrete, emotional)

**Example:**
```
Original: 150€/night
List price for upgrade: 220€/night
Your upgrade price: 192€/night  (40% discount on difference)
Total for 7 nights: 1,344€  (vs. 1,540€ list)
✓ Save 196€
```

**Never:**
- Hide the list price (looks scammy)
- Use percentage savings without EUR (too abstract)
- Show only "40% off" without context (off what?)

***

### 3.7 Graceful Degradation: Unavailable Option

If option 1 gets booked after email sent:

```html
<div class="option-card option-1 unavailable">
  <div class="unavailable-overlay">
    <div class="unavailable-content">
      <p class="unavailable-icon">❌</p>
      <p class="unavailable-title">No longer available</p>
      <p class="unavailable-text">
        {OPTION1_PROP_NAME} was booked after your offer was sent.
      </p>
      <p class="unavailable-note">
        But options 2 & 3 below are still yours for 48 hours.
      </p>
      <button class="cta-button btn-secondary" onclick="regenOffers()">
        Find New Upgrades
      </button>
    </div>
  </div>
  <!-- Greyed-out card content behind overlay -->
</div>
```

**Toast notification** when regenerating:
```
🔄 Searching for new upgrade options...
(3 seconds, then)
✓ Found 2 new matches! Scroll down to see.
```

***

### 3.8 AI Q&A Bot (Sidebar / Bottom)

**Persistent chatbot with property context:**

```
┌─────────────────────────────────────┐
│  Ask our AI (powered by UpRez)    │
├─────────────────────────────────────┤
│                                     │
│  Guest: "Does the Family 2BR have   │
│  a washing machine?"                │
│                                     │
│  Bot: "Yes. The Family 2BR Apt     │
│  includes a washing machine in the  │
│  utility area."                     │
│                                     │
│  [Input field]                      │
│  [Submit button]                    │
│                                     │
└─────────────────────────────────────┘
```

**Supported questions:**
- "Does it have [amenity]?"
- "How far is it from the beach?"
- "Is there WiFi? How fast?"
- "Can we work from there?"
- "Is it kid-friendly / pet-friendly?"
- "What's the parking like?"
- "Can I see more photos?"

**Bot instructions** (for LLM):

```
You are a helpful, knowledgeable assistant for vacation rental upgrades.
You have access to detailed property metadata.

Guest context:
- Original property: {ORIGINAL_PROP_NAME}
- Upgrade property: {UPGRADE_PROP_NAME}
- Guest: {GUEST_NAME}, {GUEST_COUNTRY}, {ADULTS} adults, {CHILDREN} children

Property meta
{METADATA_JSON}

Answer questions concisely (1–2 sentences max).
Be honest: if you don't know, say "I'm not sure; please contact the host."
Focus on helping them make a good decision, not hard-selling.
```

***

### 3.9 Landing Page Copy Tone

- **Reassuring**: "We handpicked these" / "These match your trip"
- **Clear, not pushy**: Explain diffs, let guest decide
- **Friendly**: "Hey Alice" / "For your family of 4" / "With your car"
- **Specific**: Talk about parking, WiFi, pools—not "amazing" or "beautiful"
- **Honest about trade-offs**: "A bit further from beach, but much quieter"
- **Action-oriented**: Buttons are clear ("BOOK"), secondary actions accessible ("Ask bot")

***

## 4. Email + Landing Page Integration

### 4.1 Tracking & Analytics

**Email tracking:**
- `utm_source=email`
- `utm_content=option1` (if clicked from email)
- Track opens (via tracking pixel)
- Track clicks (via link wrapper)

**Landing page tracking:**
- Track pageviews (Google Analytics or custom)
- Track bot interactions
- Track regen clicks
- Track conversion (book button)

**Example analytics:**
```
Email sent: 100
Email opened: 45 (45%)
Email clicked: 25 (25%)
Landing page: 25
Bot queries: 8 (32%)
Book clicked: 5 (20%)
Conversion rate: 20% (5 / 25)
```

***

### 4.2 Fallback Copy (Edge Cases)

**Offer expired:**
```
⏱ This offer has expired (48 hours ago).
Your original booking ({ORIGINAL_PROP_NAME}) is still confirmed.
Would you like us to search for new upgrades?

[Find New Upgrades]
```

**No upgrades found:**
```
We checked your dates and location,
but didn't find any suitable upgrades at this time.

Your original booking ({ORIGINAL_PROP_NAME}) remains unchanged.
Feel free to reach out if you'd like us to try again closer to your trip.

[← Back to Booking]
```

**Technical error:**
```
Sorry, something went wrong.
Please try refreshing the page, or contact our support team.

support@UpRez.com
```

***

## 5. Copy Examples (Full Email)

### Example 1: Family with children

**Subject:** Alice, family villa with pool? Upgrade for just +60€/night

**Email body highlights:**
```
Personalization reason:
"With two children, we prioritized quiet neighborhoods with pool access, 
parking for your rental car, and family-friendly outdoor spaces."

Option 1 headline:
"Upgrade to your own villa with pool"

Option 1 summary:
"Private pool, garden and space for the whole family in Son Vida hills."

Diffs:
• +2 bedrooms, +1 bathroom (5 beds vs 1)
• Private pool and garden (safe for kids)
• Driveway parking included
```

***

### Example 2: Solo digital nomad

**Subject:** Sofia, upgrade to a space you can work from (+80€/night, 48h only)

**Email body highlights:**
```
Personalization reason:
"As a digital nomad, we focused on properties with excellent WiFi, 
dedicated workspaces, and walkable neighborhoods with good cafés."

Option 1 headline:
"City apartment with dedicated office"

Option 1 summary:
"Modern 1BR in Palma center with high-speed WiFi, dedicated desk, 
and proximity to cafés and coworking."

Diffs:
• Excellent 200 Mbps WiFi (vs. 30 Mbps)
• Dedicated office/workspace
• Walkable to city center and cafés
```

***

### Example 3: Couple seeking romance

**Subject:** James & partner, beachfront upgrade? Save 300€ total

**Email body highlights:**
```
Personalization reason:
"For the two of you, we searched for beachfront properties with 
private spaces, stunning views, and romantic settings."

Option 1 headline:
"Beachfront villa with direct beach access"

Option 1 summary:
"4-bed luxury home 50m from the beach with pool, garden, 
and expansive sea views from the terrace."

Diffs:
• Direct beach access (50m, vs. 800m away)
• Private pool and garden
• Sea-view terrace perfect for sunsets
```

***

## 6. Implementation Checklist

**For backend/LLM engineers:**

- [ ] Email subject line: dynamic generation with first name + key diff + price
- [ ] Email body: template rendering with all placeholders mapped
- [ ] Email images: embed as CIDs (Content-ID) for reliable display
- [ ] Landing page: fetch offer data from `/offer/{offer_id}` API
- [ ] Countdown timer: JavaScript that updates every minute, disables after expiry
- [ ] Availability check: poll or refresh option statuses periodically
- [ ] Bot context: prepare property metadata JSON for RAG + LLM
- [ ] Graceful degradation: mark unavailable options, offer regen
- [ ] Tracking: add UTM params to links, track bot interactions
- [ ] Responsive design: test email on mobile, test landing page on all viewports
- [ ] Copy review: have human proofread at least 5 example emails before demo

***

**Next steps:**
1. Create email template in HTML (use this spec as basis)
2. Build landing page React component with option cards
3. Integrate bot chat widget (e.g., Vercel AI SDK)
4. Test email rendering in Resend + Gmail / Outlook
5. A/B test subject lines if time permits (unlikely at hackathon)

