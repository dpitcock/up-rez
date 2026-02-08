# UpRez Template Unification Plan (Easyblocks)

This document outlines the strategy for unifying all guest-facing content (Emails, Landing Pages, and Previews) into a single, cohesive design system powered by **Easyblocks**.

---

## 1. The Core Objective: "Build Once, Render Anywhere"
Currently, the "Upgrade Email" and "Landing Page" are managed as separate, hardcoded React files. The unification plan replaces these with a JSON-driven system where a host edits a template in **Easyblocks**, and that same JSON is rendered differently based on the channel.

### Alignment Map
| Channel | Surface | Target Implementation |
| :--- | :--- | :--- |
| **Email** | Production SendGrid | **Easyblocks Email Renderer** (Inlines CSS) |
| **Email Preview** | `EmailPreviewModal.tsx` | **Easyblocks React Renderer** (In-app simulation) |
| **Landing Page** | `app/offer/[id]/page.tsx` | **Easyblocks Full-Page Renderer** (Rich interactive) |
| **Editor** | `app/templates/page.tsx` | **Easyblocks Editor Canvas** (Live editing) |

---

## 2. Shared Component Library (`UpRezBlocks`)
To achieve alignment, all surfaces will consume the same component registry.

```typescript
// components/UpRezBlocks/registry.ts
export const UpRezComponents = {
  Hero: {
    component: HeroComponent,
    props: {
        headline: "{{ai_headline}}",
        image: "{{prop_image}}",
        mode: "landing" | "email"
    }
  },
  PricingCard: {
    component: PricingComponent,
    props: {
        fee: "{{upgrade_fee_night}}",
        cta_url: "{{offer_url}}"
    }
  },
  AmenityCloud: {
    component: AmenitiesComponent,
    props: {
        items: "{{ai_bullets}}"
    }
  }
};
```

---

## 3. Implementation Steps for Unification

### Step A: Unify the Data Bridge
Update `lib/services/offerService.ts` to generate a single `dataContext` object. This object replaces the ad-hoc prop drilling across the app.

```typescript
const dataContext = {
    guest_name: booking.guest_name,
    ai_headline: offer.headline,
    upgrade_fee_night: pricing.revenue_lift / nights,
    // ... all variables from Section 1
};
```

### Step B: The "Dual-Mode" Renderer
Create a wrapper that handles the subtle differences between a web landing page and a restricted email environment.

```typescript
// components/EasyRenderer.tsx
export const EasyRenderer = ({ templateJson, mode, data }) => {
    // 1. Process template JSON with data (regex replacement)
    // 2. Render Easyblocks components
    // 3. If mode === 'email', apply inline-styles and absolute URLs
    // 4. If mode === 'landing', enable animations and Framer Motion
};
```

### Step C: File-Specific Migrations

#### 1. Landing Page (`app/offer/[id]/page.tsx`)
Replace the thousands of lines of manual Tailwind with:
```tsx
<EasyRenderer 
    templateJson={offer.template} 
    mode="landing" 
    data={offerDataContext} 
/>
```

#### 2. Email Preview (`EmailPreviewModal.tsx`)
Instead of mocking the email with a separate set of `divs`, use the unified renderer:
```tsx
<div className="mail-app-frame">
    <EasyRenderer 
        templateJson={activeTemplate} 
        mode="email" 
        data={previewData} 
    />
</div>
```

#### 3. Production Email (`lib/email/UpgradeEmailTemplate.tsx`)
This file becomes a server-side generator that outputs a static HTML string using the same Easyblocks definitions but optimized for email clients (Outlook, Gmail).

---

## 4. Current Migration Status
- [x] **Registry Definition**: Documented.
- [ ] **Renderer Core**: Pending (requires `@easyblocks/core`).
- [ ] **Component Porting**: Hero, Pricing, and Footer components need to be extracted from `OfferPage.tsx` into `UpRezBlocks.tsx`.
- [ ] **Host Settings Integration**: `active_email_template_id` needs to map to a JSON blob in the database instead of a static ID.

---

## 5. Variable Reference (Recap)
| Variable | Usage |
| :--- | :--- |
| `{{guest_name}}` | Global personalizer |
| `{{upgrade_fee_night}}`| Key financial trigger |
| `{{ai_headline}}` | AI sales hero |
| `{{offer_url}}` | Critical CTA path |
| `{{prop_image}}` | High-intent visual |

**All surfaces MUST use these exact bracketed keys to ensure a template saved in the Editor works immediately in the Email.**
