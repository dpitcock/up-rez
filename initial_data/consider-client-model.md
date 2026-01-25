# UpRez Offer Template Preview Chatbot - Informational Requirements

**Decision Pending:** Nano vs Backend vs Mock. **Document for discussion.**

***

## Context & Tradeoffs

| Mode | Pros | Cons | Demo Fit |
|------|------|------|----------|
| **Gemini Nano** | On-device, private, instant | Static context, Chrome-only, quota limits | ✅ Hackathon wow (on-device AI) |
| **OpenAI Backend** | Dynamic RAG, full context, reliable | Backend dependency, latency, API costs | ❌ Demo risk (backend must work) |
| **Mock Responses** | No dependencies, always works | Less impressive, static answers | ✅ Safe demo fallback |

***

## Option 1: Gemini Nano (Recommended for Demo)

### **Pros for Hackathon:**
- **Zero backend dependency** – Pure client-side
- **On-device AI** – Judges love privacy + speed  
- **Works offline** after model load
- **Multimodal** – Property image analysis

### **Implementation:**
```
✅ navigator.ml detection (Chrome 137+)
✅ Static JSON context in initialPrompts (2k tokens max)
✅ Fixed chat UI (bottom-right)
✅ No server calls = demo bulletproof
```

### **Context Limits:**
```
Single JSON blob (reservation + top3 upgrades):
- ~1500–2500 tokens max
- No live updates (frozen snapshot)
- Property images as multimodal input
```

**Status Badge:** `Gemini Nano ● (on-device, private)`

***

## Option 2: OpenAI Backend RAG

### **Pros:**
- **Dynamic context** – Live offers, full inventory
- **Better reasoning** – GPT-4o-mini > Nano
- **Production path**

### **Cons for Demo:**
```
❌ Backend must be 100% reliable
❌ Latency (500ms+ roundtrip)
❌ API quota/cost risk
❌ Single point of failure
```

### **Implementation:**
```
Backend /api/chat → RAG retrieval → OpenAI
Dynamic: Current offer top3 + preferred property
Unlimited context size
```

**Status Badge:** `Cloud AI ● (OpenAI GPT-4o-mini)`

***

## Option 3: Mock Responses (Safe Fallback)

### **Pros:**
- **Always works** – Pure frontend JS
- **Fastest** – No network calls
- **Customizable** – Tailor for demo narrative

### **Cons:**
- **Less impressive** – No real AI
- **Static** – Pre-written responses

### **Implementation:**
```
if (query.includes("pool")) → "Yes, private pool in garden."
if (query.includes("parking")) → "Driveway parking included."
Default: "Great question! Mid-Tier Villa has [feature]. Upgrade expires soon."
```

**Status Badge:** `Demo Mode ● (Try Chrome for Nano)`

***

## Decision Matrix

| Criteria | Nano | Backend | Mock |
|----------|------|---------|------|
| Demo Reliability | ✅✅✅ | ❌❌ | ✅✅✅ |
| Wow Factor | ✅✅✅ | ✅✅✅ | ✅ |
| Backend Dependency | ✅✅✅ | ❌❌ | ✅✅✅ |
| Production Path | ✅✅ | ✅✅✅ | ❌ |
| Implementation Time | 2h | 4h | 30m |

**Hackathon Recommendation:** **Gemini Nano** (reliable wow-factor). **Mock** as emergency fallback.

***

## Shared Requirements (All Modes)

### **UI Components:**
```
✅ Fixed bottom-right chat (300x500px)
✅ Message bubbles (user right, bot left)
✅ Typing indicator
✅ 8-message scrollback
✅ Context badge (mode indicator)
✅ [Clear Chat] button
```

### **Context Schema** (Nano Static, Backend Dynamic):
```json
{
  "reservation": { id, guest_name, dates, original_property },
  "upgrades": [  // top3 or current offer
    { id, name, beds, amenities, offer_price, images, preferred }
  ]
}
```

### **Supported Queries:**
```
- Amenities: "pool?", "parking?", "WiFi?", "elevator?"
- Capacity: "sleep 5?", "workspace?"
- Pricing: "total cost?", "savings?"
- Location: "beach distance?", "quiet?"
- Images: [Auto-attach upgrade photo] → "Nice pool?"
```

### **Response Style:**
```
1-2 sentences max
Concrete facts from context
End with CTA: "48hr offer!" or "View upgrade →"
```

***

## Frontend Decision Point

**Choose one implementation:**

### **A. Nano-Only (Recommended Demo)**
```
if (!useNano) {
  return <DisabledChat>Please use Chrome for Gemini Nano chat!</DisabledChat>
}
```

### **B. Nano + Backend Fallback**
```
if (useNano) nanoChat()
else backendChat()
```

### **C. Mock-Only (Bulletproof)**
```
Always mock responses based on static context
```

***

## Backend Decision Point (If Backend Chosen)

```
POST /api/chat (RAG):
1. Fetch reservation + current_offer
2. RAG context: original + live top3 + preferred
3. OpenAI GPT-4o-mini
4. Return response
```

***

## Demo Script (Nano Version)

```
1. Open /demo/offer-editor → Select properties → Generate
2. "Now test guest experience..." → Chat appears
3. "Does the villa have parking?" → Nano answers instantly
4. "Gemini Nano runs **on-device**, knows the exact upgrade context, 
   fully private. No server needed."
5. [Switch to mock/backend if time]
```

**Production Path:** Nano (consumer demo) + Backend RAG (authenticated users).

***

**Decision Time:** Nano for demo wow/safety ratio? Let's pick **Option A** (Nano-only) for bulletproof presentation! 🚀
