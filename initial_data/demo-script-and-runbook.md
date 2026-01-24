# UpRez Demo Script & Runbook

**Berlin AI Hackathon – Arbio Track**  
**Saturday Evening – 10 minutes on stage**

***

## 1. Pre-Demo Checklist (30 minutes before)

**DO NOT START DEMO UNTIL ALL CHECKED:**

- [ ] **Ollama running locally**
  ```bash
  ollama serve
  # Should output: "Listening on 127.0.0.1:11434"
  ```

- [ ] **Gemma2:2b model pulled**
  ```bash
  ollama list
  # Should show: gemma2:2b (3.3GB)
  ```

- [ ] **SQLite database seeded**
  ```bash
  cd backend
  python seed.py
  # Should output: "✓✓✓ Database seeded: UpRez.db"
  ```

- [ ] **FastAPI running**
  ```bash
  cd backend
  uvicorn main:app --reload
  # Should output: "Uvicorn running on http://127.0.0.1:8000"
  ```

- [ ] **Next.js running**
  ```bash
  cd frontend
  npm run dev
  # Should output: "Ready in X.XXs"
  # Check: http://localhost:3000 loads without error
  ```

- [ ] **Ngrok tunnel open** (if demoing from laptop to projector)
  ```bash
  ngrok http 8000
  # Copy public URL (e.g., https://abc123.ngrok.io)
  # Update frontend API URL if needed
  ```

- [ ] **Resend API key in `.env`**
  ```bash
  cd backend
  cat .env | grep RESEND_API_KEY
  # Should be set, not empty
  ```

- [ ] **Demo page accessible**
  ```
  http://localhost:3000/demo
  # Should load with "Trigger Cron" and "Simulate Cancel" buttons
  ```

- [ ] **Email inbox ready**
  - Open Gmail / Resend test inbox in separate tab
  - Refresh before demo starts
  - **Know your test email address** (e.g., test@UpRez-demo.com)

- [ ] **Projector / HDMI connected & tested**
  - Display looks good (brightness, font size readable)
  - Audio working if needed

- [ ] **Slack / chat closed** (no notifications mid-demo)

- [ ] **Phone on silent**

***

## 2. Demo Flow (10 minutes total)

### **Timeline**

| Time | Action | Duration |
|------|--------|----------|
| 0:00 | Intro + problem statement | 1 min |
| 1:00 | **[TRIGGER CRON]** Show offer generation in real time | 1 min |
| 2:00 | Check email, show HTML email design | 1 min |
| 3:00 | **[CLICK OFFER LINK]** Load landing page | 1 min |
| 4:00 | Scroll through 3 upgrade options, explain pricing | 2 min |
| 6:00 | **[BOT Q&A]** Ask property question, show AI response | 1 min |
| 7:00 | **[SIMULATE BLOCK]** Show unavailable state + regen | 1 min |
| 8:00 | Show revenue math / impact slide | 1 min |
| 9:00 | Call to action / next steps | 1 min |

***

## 3. Demo Script (Word-for-Word)

### **Intro (0:00–1:00)**

> "Hi everyone. I'm [NAME], and I'm going to show you UpRez—an AI-powered upgrade engine for vacation rentals.
>
> **The problem:** Vacation rental managers have huge untapped revenue sitting on the table. When a guest books a budget apartment, they often don't know that a better property is available for just 40–60€ more per night. And when a property cancels, managers miss the window to offer upgrades to overlapping bookings.
>
> **Why AI?** Every property is unique. Comparing a city studio to a beachfront villa is complicated—you need to understand the guest, the property diffs, and the price-to-value ratio. That's where an AI agent comes in.
>
> Let's see it in action. I'm going to trigger an upgrade offer for a real booking and walk through the entire flow—from offer generation to the guest experience."

***

### **Step 1: Trigger Cron (1:00–2:00)**

**Action on screen:**

1. Navigate to `http://localhost:3000/demo`
2. Click **[Trigger Cron Event]** button
3. Show console / logs updating in real time

**Narration:**

> "We have a guest named Alice who booked a budget beach apartment in Palma for 7 nights. It's 7 days before her arrival—the perfect moment to suggest an upgrade.
>
> Let me trigger the cron event that scans for these opportunities..."
>
> *[Click button]*
>
> "Watch the logs. The system is now:
> 1. Finding Alice's booking
> 2. Scanning all 9 available properties
> 3. Scoring them for viability (extra beds, amenities, location fit)
> 4. Calculating smart pricing—offering a 40% discount on the price difference
> 5. Generating personalized copy
> 6. And... queuing an email to send."
>
> *[Wait 3–5 seconds for logs to complete]*
>
> "Done. Offer ID 5001 created. Email queued. Now let's check Alice's inbox."

***

### **Step 2: Show Email (2:00–3:00)**

**Action on screen:**

1. Switch to email tab (Gmail / Resend test inbox)
2. Refresh and open the UpRez email

**Narration:**

> "Here's the email Alice just received. Notice a few things:
>
> **Subject line:** 'Alice, upgrade to Family 2BR (+1 bed +parking, save 280€)' — personalized, specific, mentions price.
>
> **Hero image:** Photo of the upgraded property. We use content IDs (CIDs) to embed images directly, so they load reliably.
>
> **Copy:** We explain *why* this upgrade makes sense for Alice. In this case, she's a solo traveler from Germany—we don't know her exact needs, but the system identifies the best matches and explains the diffs concretely.
>
> **Diffs section:** Not 'luxury upgrade' or 'better quality'—actual concrete upgrades:
> - +1 extra bedroom
> - Underground parking
> - Closer to harbor and park
>
> **Pricing breakdown:** Current rate (150€/night), upgrade property list rate (220€), her discounted upgrade rate (192€), and the total savings (196€ for the week). Transparent, not misleading.
>
> **Call to action:** 'View All 3 Options' with a link to the landing page. 48-hour timer creates gentle urgency.
>
> Let me click that link..."

***

### **Step 3: Load Landing Page (3:00–4:00)**

**Action on screen:**

1. Click the CTA link in the email (or navigate to `/offer/5001`)
2. Wait for page to load (~2 seconds)

**Narration:**

> "Welcome to the landing page. This is where Alice makes her decision.
>
> **Top of the page:** Hero banner with her name, the original booking details, and a countdown timer that updates every minute. This is her original booking—budget beach apartment, June 10–17.
>
> Below that, three upgrade option cards. Let me scroll through them and explain the design."

***

### **Step 4: Walk Through Option Cards (4:00–6:00)**

**Action on screen:**

Scroll down slowly, highlighting each option card.

**Narration (Option 1):**

> "**Option 1: Family 2BR Apt** — our top recommendation.
>
> This one has a viability score of 8.5 out of 10. Why? Alice needs space and quiet, and this apartment delivers:
> - +1 extra bedroom (she has a guest room now)
> - Parking (important for vacation renters)
> - Quieter neighborhood, 200m to beach
>
> **Pricing:** Current rate is 150€/night. This property lists at 220€. We're offering it to her for 192€/night—that's a 40% discount on the price difference.
> - Total: 1,344€ for 7 nights (instead of 1,540€ list price)
> - She saves 196€
>
> There's a big green button: 'BOOK THIS UPGRADE'. If she clicks it, it's routed to the channel manager (Booking.com, Airbnb, or the PMS directly) to modify her reservation."

**Narration (Option 2):**

> "**Option 2: Mid-Tier Villa** — the luxury jump.
>
> This is a 3-bedroom villa in Son Vida hills with a private pool and garden. Viability score: 8.2. For guests who want to splurge, this is the 'wow' option.
> - Pricing: 270€/night (vs. 350€ list)
> - Save 560€ total
> - Revenue lift for the operator: 720€"

**Narration (Option 3):**

> "**Option 3: Poolside Apt** — the middle ground.
>
> Ground-floor apartment with access to a shared pool. Quieter than the first option, cheaper than the villa.
> - Pricing: 210€/night
> - Save 280€
>
> Now here's where it gets interesting. What if someone books Option 1 between when we sent the email and when Alice clicks through? Let me simulate that..."

***

### **Step 5: Simulate Block & Regen (6:00–7:00)**

**Action on screen:**

1. Click the **[Simulate Block]** button (or manually run SQL: `UPDATE bookings SET prop_id=3 WHERE id=1002` — actually, use the demo button)
2. Refresh the landing page or show it auto-updates

**Narration:**

> "I'm simulating that the Family 2BR apartment just got booked by another guest. Watch what happens...
>
> *[Click button / refresh page]*
>
> The Family 2BR is now greyed out with a message: 'No longer available. This property was booked after your offer was sent.'
>
> But here's the key: the landing page doesn't break or throw an error. It gracefully degrades. Options 2 and 3 are still available, and there's a button: **[Find New Upgrades]**.
>
> When Alice clicks it, our system re-runs the classification algorithm *in real time*, excluding the now-booked property, and presents her with two fresh candidates.
>
> *[Click 'Find New Upgrades']*
>
> *[Toast notification: '🔄 Searching... ✓ Found 2 new matches!']*
>
> Beautiful. No dead-end. No frustration. The guest stays engaged."

***

### **Step 6: Bot Q&A (7:00–8:00)**

**Action on screen:**

1. Scroll to the bot chat widget (sidebar or bottom of page)
2. Type a question, e.g., "Does the Family 2BR have a washing machine?"
3. Wait for bot response (~2 seconds)

**Narration:**

> "One more feature: the Q&A bot. Guests often have specific questions before committing to an upgrade. Instead of making them email or call, they can ask right here.
>
> Let me ask: 'Does the Family 2BR have a washing machine?'
>
> *[Type question, hit send]*
>
> The bot searches the property's metadata, retrieves the answer, and streams a response:
>
> 'Yes, the Family 2BR Apt includes a washing machine in the utility area.'
>
> This is powered by a local Gemma2 model for speed and cost, but the same system can upgrade to OpenAI for better quality answers if needed.
>
> The bot gives Alice confidence to book."

***

### **Step 7: Revenue Math (8:00–9:00)**

**Action on screen:**

Show a slide or dashboard with numbers:

```
Original booking: 1,250€ (7 nights @ 150€ + taxes/fees)
Upgraded offer: 1,344€ (7 nights @ 192€ + taxes/fees)
Revenue lift per stay: 94€

Assumptions:
- 40% conversion rate (realistic for personalized offers)
- 30 budget bookings per month for one mid-size host

Monthly impact:
- Upgrades completed: 12 (30 × 40%)
- Additional revenue: 1,128€ (12 × 94€)
- Plus ancillaries (boats, parkig, etc.): ~260€ per upgraded stay
- Total monthly uplift: 4,248€ per host

Scale to 100 hosts → 424,800€ monthly revenue potential
```

**Narration:**

> "Let's talk impact. The original booking was 1,250€. Alice upgrades to the Family 2BR at 1,344€. That's 94€ additional revenue *per booking*.
>
> If a mid-size host has 30 budget bookings per month and 40% convert to upgrades, that's 12 upgrades × 94€ = 1,128€ per month. Add ancillaries (parking, boats, activities), and you're looking at 4,000€+ in new revenue per host per month.
>
> Scale that: UpRez handles 100 hosts, 50 bookings each per month, 40% conversion—that's real, meaningful revenue for the platform and for hosts."

***

### **Step 8: Closing / Next Steps (9:00–10:00)**

**Action on screen:**

Go back to the original demo page or show a final slide.

**Narration:**

> "What you just saw is the core loop of UpRez:
>
> 1. **Listen for moments** (7 days before arrival, cancellations)
> 2. **Understand the guest & property** (demographics, amenities, location)
> 3. **Find real upgrades** (not sidegrades; concrete, valuable improvements)
> 4. **Price smartly** (discount on difference, not on total)
> 5. **Communicate clearly** (personalized email, detailed landing page)
> 6. **Handle real-world mess** (unavailable options, graceful degradation, regeneration)
> 7. **Empower guests** (bot Q&A, clear info, honest pricing)
>
> **Why this matters:**
> - Revenue managers spend hours manually managing upsells. UpRez does it in seconds.
> - Guests get genuinely better options, not spam. Conversion rates are higher.
> - The AI gets smarter over time, learning which upgrades work for which guests.
>
> **What's next for us:**
> - Hook into Arbio's PMS directly (webhook integration)
> - Train on real booking and property data
> - Optimize pricing with dynamic supply-demand signals
> - Add multi-language support for European guests
>
> UpRez is the missing revenue copilot for vacation rental operators. Thanks for watching!"

***

## 4. Slide Deck (Optional Visual Aid)

If you have 2–3 slides:

### Slide 1: Problem
```
Problem & Opportunity

• Vacation rentals are non-standard: every unit is unique
• Data is fuzzy: missing key details (workspace, noise, parking)
• Upsells are manual: managers miss opportunities
• Timing is hard: 7-day window closes fast

Result: Huge untapped revenue (avg 3–5% of annual)
```

### Slide 2: Solution
```
UpRez: AI Upgrade Engine

✓ Listens for high-opportunity moments
✓ Understands guests (demographics, needs, country)
✓ Finds real upgrades (not sidegrades)
✓ Calculates fair pricing (discount on difference)
✓ Sends personalized, compelling offers
✓ Handles real-world edge cases gracefully

Powered by: AI agents, local LLMs (Gemma), OpenAI, RAG
```

### Slide 3: Impact
```
Revenue Opportunity

Per host (30 budget bookings/month):
• 12 upgrades × 94€ = 1,128€/month
• + ancillaries = 4,000€/month uplift

For Arbio (100 hosts):
• 424,800€/month revenue potential
• New high-margin product line
```

***

## 5. Fallback Scenarios (What If...?)

### Scenario A: Ollama is slow to respond

**Problem:** Bot response takes 10+ seconds.

**Solution:**
- Pre-generate the bot response before demo (copy/paste into chat manually if needed)
- Say: "In production, responses are cached and faster. Here we're using a local model for cost savings."

### Scenario B: Email doesn't arrive

**Problem:** Resend API fails silently.

**Solution:**
- Have a pre-sent email screenshot ready in your slide deck
- Show it and say: "Here's what Alice receives..."
- Continue with landing page demo (most important part)

### Scenario C: Landing page won't load

**Problem:** Frontend fails to fetch from backend.

**Solution:**
- Check API URL in `.env` (if using ngrok, update it)
- Open browser dev tools, show the network request, explain the issue briefly
- Have a screenshot of the landing page as fallback
- Skip to revenue math slide

### Scenario D: Countdown timer doesn't update

**Problem:** JavaScript isn't running or setInterval failed.

**Solution:**
- Not critical to demo; skip past it
- Say: "Timer updates every minute; I manually verified it works in testing."

### Scenario E: Network fails (ngrok down)

**Problem:** Projector can't reach localhost.

**Solution:**
- Use a local HDMI connection, not screen-share over WiFi
- Test ngrok 30 minutes before demo; have a wired backup
- If truly broken, run everything locally on the demo laptop and project directly

***

## 6. Q&A Talking Points

**Q: How do you handle refunds if the guest cancels the upgrade?**

> "Great question. The upgrade is handled at the PMS level (Airbnb, Booking.com, or their own system), so cancellation policies follow their standard rules. For direct bookings, hosts can set their own policy. We're not in the refund logic—we just facilitate the offer."

**Q: How accurate is the scoring? What if the LLM makes a bad call?**

> "The scoring is rule-based + LLM, not pure LLM. Hard filters come first: beds, baths, essential amenities. The LLM refines the ranking. If it scores wrong, guests get feedback (regen, bot Q&A), and we learn from booking data over time. Early data shows 40%+ conversion, which is strong."

**Q: What about seasonality? Do prices change?**

> "In this MVP, we use static list prices. In production, we'd factor in dynamic pricing: seasonal demand, day-of-week, lead time, etc. The discount (40% on difference) stays consistent to maintain fairness."

**Q: How do you avoid annoying guests with too many offers?**

> "One offer per booking, at two key moments: 7 days before arrival and immediately after a cancellation frees up supply. That's it. No spam, no bombardment. Guest controls regen."

**Q: What about properties that are legitimately better but guests don't want (e.g., further from beach)? How do you handle trade-offs?**

> "The scoring factors in location distance. If an upgrade is further from the beach, it has to offer enough other benefits (pool, extra bedroom, parking, price savings) to outweigh the trade-off. The bot also helps guests understand trade-offs explicitly."

**Q: Can you integrate with our existing PMS / channel manager?**

> "Yes. We use webhooks. Your PMS sends us: new booking, cancellation, availability change. We reply with upgrade offers. The booking modification happens at your PMS level, not ours. We're middleware, not a replacement."

***

## 7. Post-Demo Engagement

**If time permits, offer:**

- "Happy to do a technical deep dive on the scoring algorithm or LLM integration."
- "If you're interested in integrating this into Arbio, here's a one-page architecture diagram."
- "We have a Loom video showing the full system from backend to frontend if you want to share internally."

***

## 8. Final Checklist (5 Minutes Before Going Live)

- [ ] All terminals still running (Ollama, FastAPI, Next.js)
- [ ] Demo page loads without errors
- [ ] Email inbox is refreshed and ready
- [ ] Projector is focused and readable
- [ ] Have phone on silent, Slack closed
- [ ] Note down offer_id in case you need to reference it (e.g., 5001)
- [ ] Do a final practice run of the click flow (1:00–3:00 mark)
- [ ] Confirm the cron button triggers correctly
- [ ] Breathe. You've got this.

***

**Good luck on stage! 🚀**