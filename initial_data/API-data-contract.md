## UpRez API Contract Spec (MVP)

All responses are JSON. All times are ISO8601 strings. Currency: EUR by default.

***

## 1. Webhook & Demo Triggers

### 1.1 `POST /webhook/channel-manager`

Used for both cron-style triggers and cancellation-style triggers.

**Request (cron-like trigger)**

```json
{
  "event": "cron_pre_arrival",
  "booking_id": 1001
}
```

**Request (cancellation trigger)**

```json
{
  "event": "cancellation",
  "prop_id": 5,
  "arrival_date": "2026-07-01",
  "departure_date": "2026-07-08"
}
```

- `event`: `"cron_pre_arrival"` or `"cancellation"`.
- For cron, you pass a specific `booking_id`.
- For cancellation, the backend finds overlapping bookings for those dates.

**Response (success)**

```json
{
  "status": "ok",
  "offer_id": 5001,
  "booking_id": 1001,
  "created": true,
  "message": "Offer generated and email queued."
}
```

**Response (no viable upgrades)**

```json
{
  "status": "no_offer",
  "booking_id": 1001,
  "message": "No suitable upgrade candidates found."
}
```

***

### 1.2 `POST /demo/trigger`

Used only in demo mode from the `/demo` page.

**Request (cron demo)**

```json
{
  "type": "cron",
  "booking_id": 1001
}
```

**Request (cancellation demo)**

```json
{
  "type": "cancellation",
  "prop_id": 5,
  "arrival_date": "2026-07-01",
  "departure_date": "2026-07-08"
}
```

**Response**

```json
{
  "status": "ok",
  "triggered_event": "cron_pre_arrival",
  "offer_id": 5001
}
```

***

## 2. Offer Retrieval & Regeneration

### 2.1 `GET /offer/{offer_id}`

Primary endpoint the frontend calls for the landing page.

**Path params**

- `offer_id`: integer (e.g., `5001`)

**Response (active)**

```json
{
  "offer_id": 5001,
  "booking_id": 1001,
  "status": "active",          // "active" | "partial" | "expired"
  "expires_at": "2026-06-08T10:30:00Z",
  "regen_count": 0,
  "original_booking": {
    "arrival_date": "2026-06-10",
    "departure_date": "2026-06-17",
    "nights": 7,
    "adults": 2,
    "children": 0,
    "infants": 0,
    "prop_name": "Budget Beach Apt",
    "current_adr": 150,
    "current_total": 1170
  },
  "options": [
    {
      "ranking": 1,
      "prop_id": 3,
      "prop_name": "Family 2BR Apt",
      "images": [
        "family-2br-apt-exterior.jpg",
        "family-2br-apt-living-room.jpg"
      ],
      "headline": "More space for your beach week",
      "summary": "Extra bedroom, underground parking, and a balcony with sea and city glimpses.",
      "viability_score": 8.5,
      "pricing": {
        "currency": "EUR",
        "from_adr": 150,
        "to_adr_list": 220,
        "offer_adr": 192,
        "nights": 7,
        "from_total": 1170,
        "offer_total": 1344,
        "list_total": 1540,
        "discount_percent": 0.4,
        "discount_amount_total": 196,
        "revenue_lift": 174
      },
      "diffs": [
        "+1 extra bedroom (3 beds vs 1)",
        "Includes underground parking",
        "Closer to Palma harbour and park"
      ],
      "availability": {
        "available": true,
        "reason": null
      }
    },
    {
      "ranking": 2,
      "prop_id": 4,
      "prop_name": "Mid-Tier Villa",
      "images": [
        "mid-tier-villa-exterior.jpg",
        "mid-tier-villa-pool.jpg"
      ],
      "headline": "Upgrade to your own villa with pool",
      "summary": "Private pool, garden and space for the whole family in Son Vida hills.",
      "viability_score": 8.2,
      "pricing": {
        "currency": "EUR",
        "from_adr": 150,
        "to_adr_list": 350,
        "offer_adr": 270,
        "nights": 7,
        "from_total": 1170,
        "offer_total": 1890,
        "list_total": 2450,
        "discount_percent": 0.4,
        "discount_amount_total": 560,
        "revenue_lift": 720
      },
      "diffs": [
        "+2 bedrooms, +1 bathroom",
        "Private pool and garden",
        "Driveway parking included"
      ],
      "availability": {
        "available": true,
        "reason": null
      }
    },
    {
      "ranking": 3,
      "prop_id": 12,
      "prop_name": "Poolside Apt",
      "images": [
        "poolside-apt-exterior.jpg",
        "poolside-apt-pool.jpg"
      ],
      "headline": "Poolside upgrade for a relaxed stay",
      "summary": "Ground-floor apartment opening directly onto a shared pool and garden.",
      "viability_score": 7.4,
      "pricing": {
        "currency": "EUR",
        "from_adr": 150,
        "to_adr_list": 250,
        "offer_adr": 210,
        "nights": 7,
        "from_total": 1170,
        "offer_total": 1470,
        "list_total": 1750,
        "discount_percent": 0.4,
        "discount_amount_total": 280,
        "revenue_lift": 300
      },
      "diffs": [
        "+extra space and second bathroom",
        "Shared pool and terrace outside your door",
        "Easy parking on surrounding streets"
      ],
      "availability": {
        "available": false,
        "reason": "Property was booked after the offer was sent."
      }
    }
  ]
}
```

**Response (expired)**

```json
{
  "offer_id": 5001,
  "booking_id": 1001,
  "status": "expired",
  "expires_at": "2026-06-08T10:30:00Z",
  "regen_count": 1,
  "options": [],
  "message": "This upgrade offer has expired. You can check for new upgrade options below."
}
```

Frontend rule: **never 404** offers; always render something based on `status`.

***

### 2.2 `POST /regen/{offer_id}`

Regenerates upgrade options if some are unavailable or guest clicks “Find new upgrades”.

**Path params**

- `offer_id`: integer

**Request body**

```json
{
  "exclude_prop_ids": [4], 
  "reason": "user_requested_regen"
}
```

- `exclude_prop_ids`: optional list of property IDs to exclude (e.g. blocked since creation).

**Response**

```json
{
  "offer_id": 5001,
  "status": "active",
  "regen_count": 1,
  "message": "Regenerated 2 new upgrade options.",
  "options": [
    {
      "ranking": 1,
      "prop_id": 3,
      "prop_name": "Family 2BR Apt",
      "viability_score": 8.5,
      "pricing": {
        "currency": "EUR",
        "from_adr": 150,
        "to_adr_list": 220,
        "offer_adr": 192,
        "nights": 7,
        "from_total": 1170,
        "offer_total": 1344,
        "list_total": 1540,
        "discount_percent": 0.4,
        "discount_amount_total": 196,
        "revenue_lift": 174
      },
      "availability": { "available": true, "reason": null }
    },
    {
      "ranking": 2,
      "prop_id": 9,
      "prop_name": "Seafront 2BR",
      "viability_score": 7.8,
      "pricing": {
        "currency": "EUR",
        "from_adr": 150,
        "to_adr_list": 280,
        "offer_adr": 228,
        "nights": 7,
        "from_total": 1170,
        "offer_total": 1596,
        "list_total": 1960,
        "discount_percent": 0.4,
        "discount_amount_total": 364,
        "revenue_lift": 426
      },
      "availability": { "available": true, "reason": null }
    }
  ]
}
```

***

## 3. Bot Q&A

### 3.1 `POST /bot/query`

Answers guest questions about a specific upgrade option using property metadata + RAG.

**Request**

```json
{
  "offer_id": 5001,
  "prop_id": 4,
  "question": "Does this villa have a washing machine and is the WiFi good enough for video calls?"
}
```

**Response**

```json
{
  "offer_id": 5001,
  "prop_id": 4,
  "answer": "Yes. The Mid-Tier Villa includes a washing machine in the utility area, and WiFi is described as 'good 100mbps', which is generally sufficient for HD video calls and remote work.",
  "source": {
    "amenities": [
      "washing_machine",
      "wifi"
    ],
    "metadata": {
      "wifi_speed": "good 100mbps"
    }
  }
}
```

If no answer is possible from meta

```json
{
  "offer_id": 5001,
  "prop_id": 4,
  "answer": "The existing information doesn’t clearly state this. I recommend confirming with your host before upgrading.",
  "source": null
}
```

***

## 4. Offer Inspection (Internal / Admin)

### 4.1 `GET /admin/offer/{offer_id}`

Optional but useful for debugging and demo.

**Response**

```json
{
  "offer_id": 5001,
  "booking_id": 1001,
  "status": "active",
  "expires_at": "2026-06-08T10:30:00Z",
  "regen_count": 0,
  "booking": {
    "prop_id": 1,
    "prop_name": "Budget Beach Apt",
    "arrival_date": "2026-06-10",
    "departure_date": "2026-06-17",
    "nights": 7,
    "adults": 2,
    "children": 0,
    "guest_country": "Germany",
    "rate_code": "FLEX",
    "base_nightly_rate": 150,
    "total_paid": 1170
  },
  "candidates_raw": [
    {
      "to_prop_id": 3,
      "score_components": {
        "capacity": 3,
        "amenities": 3,
        "location": 1,
        "reviews": 0.5,
        "guest_fit": 1
      },
      "viability_score": 8.5
    },
    {
      "to_prop_id": 4,
      "score_components": {
        "capacity": 4,
        "amenities": 4,
        "location": -1,
        "reviews": 0.2,
        "guest_fit": 1
      },
      "viability_score": 8.2
    }
  ]
}
```

***

## 5. Frontend-Facing Summary API (Optional)

### 5.1 `GET /offer/{offer_id}/summary`

Lightweight endpoint for preloading:

**Response**

```json
{
  "offer_id": 5001,
  "status": "active",
  "expires_at": "2026-06-08T10:30:00Z",
  "options_count": 3
}
```

***

## 6. Error & Status Conventions

- All success: HTTP 200 with `status` field where relevant.
- Validation errors: HTTP 400 with:

```json
{
  "error": "invalid_request",
  "message": "booking_id is required for cron_pre_arrival events."
}
```

- Not found (wrong ID): HTTP 404 only for **admin** endpoints; for `/offer/{offer_id}` you still return a JSON with `status: "expired"` or `status: "invalid"`:

```json
{
  "offer_id": 9999,
  "status": "invalid",
  "message": "Offer does not exist or cannot be displayed."
}
```

***

## 7. Implementation Notes (for you / Antigravity)

- Implement these as FastAPI routes under `/api` or root.  
- Frontend will primarily use:
  - `GET /offer/{offer_id}`  
  - `POST /regen/{offer_id}`  
  - `POST /bot/query`  
- Webhook + demo triggers will use:
  - `POST /webhook/channel-manager`  
  - `POST /demo/trigger`  

