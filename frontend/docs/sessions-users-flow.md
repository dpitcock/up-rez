## UpRez Demo Session Prefill Requirements

This document outlines requirements for a Node.js script to preprocess `bookings.json` for demo sessions in the Vercel/Neon Postgres setup. The script updates dates relative to February 4, 2026 (today), enabling per-session DB loading with fake, isolated reservations. Each session simulates a unique user with auto-deleting data post-session.

### Script Overview
Run the script manually or via cron to regenerate `bookings.json` before demos. It processes the existing array of bookings, shifting dates forward by one month while computing session-specific metrics. Output overwrites `bookings.json` for frontend/DB seeding.

Key goals:
- Ensure bookings appear "future" for demo interactions (e.g., upsell offers).
- Add `days_out` for UI logic (e.g., countdowns).
- Blank dates post-calc for secure prefill; recompute on-session.

### Input Data
- Source: `bookings.json` array of objects matching:
  ```
  {
    "id": "book_d8c47e07",
    "prop_id": "prop_le1jwd",
    "arrival_date": "2026-03-13",  // YYYY-MM-DD string
    "departure_date": "2026-03-18",
    "nights": 5,  // INT
    "guest_name": "Alice Johnson",
    "guest_email": "dpitcock.dev+book_d8c47e07@gmail.com",
    // ... other fields unchanged (total_paid, channel, etc.)
  }
  ```
- Fixed today: `2026-02-04` (hardcode; make configurable via env var `DEMO_TODAY_DATE`).

### Processing Rules
For each booking object:

1. Parse `arrival_date` as Date; add exactly 1 month (use `new Date(arrival.getFullYear(), arrival.getMonth() + 1, arrival.getDate())` to handle day overflows).
2. Compute `days_out`: Integer days between today (`2026-02-04`) and new `arrival_date` (e.g., `(newArrival - todayDate) / (1000 * 60 * 60 * 24)` floored to INT). Add as new top-level property: `"days_out": 38`.
3. Set `arrival_date` to `""` (empty string).
4. Set `departure_date` to `""` (empty string).
5. Preserve all other fields unchanged.

Example transformation:
```
Input:
{
  "id": "book_d8c47e07",
  "prop_id": "prop_le1jwd",
  "arrival_date": "2026-03-13",
  "departure_date": "2026-03-18",
  "nights": 5,
  ...
}

Output:
{
  "id": "book_d8c47e07",
  "prop_id": "prop_le1jwd",
  "arrival_date": "",
  "departure_date": "",
  "nights": 5,
  "days_out": 38,  // Assuming +1mo lands on 2026-04-13
  ...
}
```
Validate: All `days_out` > 0; log warnings for invalid dates.

### Session DB Loading Flow
Integrate into existing session handler (e.g., Next.js API route `/api/session-init`):

1. On new session (unique session ID, e.g., via cookies/JWT):
   - Load shared `properties.json`.
   - Load prefilled `bookings.json`.
   - For each booking:
     - Recompute `arrival_date` = today + `days_out` days.
     - `departure_date` = arrival + `nights` days (ISO strings).
     - Insert into Neon Postgres `bookings` table (user-scoped, e.g., `user_id` or `session_id` prefix). Perhaps generate a new id for each booking if they are all to be added to one big bookings table (as multiple bookings tables per client is an antipattern)
2. User interactions generate per-session `offers` table entries.
3. On session end (timeout/idle/delete button):
   - DELETE FROM `bookings`, `offers` WHERE `session_id` = ? (cascade or manual).

No shared state across sessions; properties reused.

### Technical Specs
| Aspect | Requirement |
|--------|-------------|
| Language | Node.js (ESM; use `fs/promises`, `path`) |
| Dependencies | None external (native Date; optional `zod` for validation) |
| Output | Overwrite `./public/bookings.json` or `./data/bookings.json` |
| Config | `.env`: `DEMO_TODAY_DATE=2026-02-04`, `BOOKINGS_PATH=./data/bookings.json` |
| Error Handling | Validate JSON parse, dates; throw on failures, log to console |
| Run Command | `node scripts/normalize-bookings.js` (add to package.json) |
| DB Schema | Extend existing: Add `session_id TEXT`, `days_out INT` (nullable). |

### Validation & Testing
- **Unit Tests**: Jest; mock dates, assert transformed objects match examples (3+ cases: month rollover, leap days).
- **E2E**: Load script → init session → verify DB inserts → delete → confirm isolation.
- **Edge Cases**: Invalid dates, `nights=0`, `days_out=0`.
- **Demo Flow**: Script → Vercel deploy → new tab session → interact → reset (no data bleed).

### Deployment Updates
- Vercel: Add script to repo (`scripts/`); GitHub Actions cron for daily normalize (on main).
- Neon Postgres: Per-branch provisioning; session tables auto-pruned via cron job (e.g., delete stale >24h).[8][9]
- Privacy: Sessions self-delete; no PII persistence beyond demo.

Version: v1.0 | Status: Ready for implementation | Next: Coding agent to produce `normalize-bookings.js` + session API diff.





