# Implementation Plan: Unified Dashboard Architecture

## 1. Core Architecture
- **Global Context**: Utilize the `LogContext` (already created) to store activity logs. This ensures logs persist as the user navigates between the "Demo Center", "Offer Editor", and "Analytics" pages.
- **Unified Layout**: All dashboard/demo pages will be children of a single `DashboardLayout` component.
- **Slot Pattern**: `DashboardLayout` will provide a `subHeader` prop for page-specific controls (e.g., the property dropdown in the Editor or Global Triggers in the Demo Center).

## 2. Layout Component (DashboardLayout.tsx)
- **Top Toolbar**: 
    - Position: Fixed Top.
    - Content: UpRez Logo (Left), System Status Indicator, Theme Toggle, and Profile/Logout (Right).
- **Left Sidebar**: 
    - Position: Persistent Sticky Left.
    - Top Section: Primary Navigation (Demo, Offers, Analytics, Economics).
    - Middle Section: **Live Metrics Panel** (derived from provided screenshot) showing 7-day bookings and cancellations.
    - Bottom Section: **Activity Log** showing real-time system events with auto-scroll.
- **Main Content**:
    - Optional **Sub-Header Toolbar**: A breadcrumb/action area for buttons and property selectors.
    - Responsive Scroll Area: For the primary page content.

## 3. Component Refactors
### A. Demo Page (`/demo`)
- Remove internal navigation and legacy log panels.
- Populate `DashboardLayout`'s `subHeader` with:
    - Normalize (Icon Button + Tooltip)
    - Reset DB (Icon Button + Tooltip)
    - Rebuild UI (Icon Button + Tooltip)
    - Check Ngrok (Icon Button + Tooltip)
- The main body will focus solely on the **Cron Trigger** and **Cancellation Simulation** sections.

### B. Offer Editor Page (`/demo/offer-editor`)
- Remove old layout wrappers.
- Populate `DashboardLayout`'s `subHeader` with:
    - **Property Selector**: A dropdown button showing the current selected property.
    - **Template Actions**: Save, Preview, and Send buttons as icon-only or compact buttons.
- The main body will display the side-by-side Editor and Real-time Preview.

### C. Dashboard Pages (`/dashboard/*`)
- Wrap `Analytics`, `Offers`, and `Settings` in the same layout for a seamless transition from the "Demo" experience to the "Product" experience.

## 4. Visual Polish (Aesthetics)
- **Typography**: Inter/Outfit with heavy weights (`font-black`) for headers to match the premium brand.
- **Colors**: Deep slate/black backgrounds with vibrant orange accents (`orange-600`).
- **Glassmorphism**: 80% opacity on toolbars with heavy backdrop-blur (2xl).
- **Tooltips**: Implement subtle tooltips using CSS `group-hover` or basic title attributes for sub-header icons.

## 5. Execution Steps
1. **[x] LogContext**: Initialize global log state.
2. **[x] DashboardLayout**: Heavy refactor to add the top toolbar and sidebar panels.
3. **[ ] Demo Page**: Move all control panel buttons into the sub-header.
4. **[ ] Offer Editor Page**: Convert property selection to a sub-header dropdown.
5. **[ ] Styling**: Final CSS pass for sidebar consistency and mobile responsiveness.
