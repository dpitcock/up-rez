/**
 * Represents a physical rental property in the portfolio.
 * Contains both structural data (beds, baths) and marketing attributes (description, images).
 */
export interface Property {
    /** Unique identifier for the property, typically matching its slug or ID in the original booking system. */
    id: string;
    /** Public facing name of the property (e.g., "Luxury Beachfront Villa"). */
    name: string;
    /** Geographical area or neighborhood where the property is located. */
    location: string;
    /** Number of beds available in the property. Used as a primary filter for upgrade eligibility. */
    beds: number;
    /** Number of bathrooms available in the property. Significant contributor to the property's fit score. */
    baths: number;
    /** The standard nightly rate (Rack Rate) before any discounts or session-specific pricing is applied. */
    list_nightly_rate: number;
    /** A collection of features (e.g., "Pool", "WiFi"). Can be stored as a JSON string in DB or a parsed string array. */
    amenities: string[] | string;
    /** Internal categorization of the property (e.g., "Apartment", "Villa"). */
    type?: string;
    /** Qualitative grouping for the property (e.g., "Standard", "Premium", "Ultra-Luxury"). */
    category?: string;
    /** Maximum number of people allowed to stay in the property. */
    max_guests?: number;
    /** Total number of separate bedrooms in the property. */
    bedrooms?: number;
    /** Total living area in square meters. */
    size_sqm?: number;
    /** Which floor the property is located on. */
    floor?: number;
    /** Count of elevators serving the property, or a boolean flag represented as 0/1. */
    elevator?: number;
    /** Description of the view from the property (e.g., "Sea View", "Garden View"). */
    view?: string;
    /** Qualitative assessment of the surrounding noise environment. */
    noise_level?: string;
    /** Information regarding who the property is best for (e.g., "Couples", "Families"). */
    suitability?: any;
    /** Specific constraints or requirements for staying at the property. */
    house_rules?: any;
    /** A punchy, one-sentence marketing description for lists and cards. */
    description_short?: string;
    /** The full marketing copy used on the landing page. */
    description_long?: string;
    /** Flexible field for any supplementary data not covered by the standard schema. */
    metadata?: any;
    /** URLs or paths to property photos. Can be a JSON string or parsed array. */
    images?: string[] | string;
    /** ISO 8601 timestamp of when the property was added to the database. */
    created_at: string;
    /** ISO 8601 timestamp of the last modification to the property record. */
    updated_at?: string;
}

/**
 * Represents a guest's reservation for a specific stay.
 * This is the source of truth for current booking status and original pricing.
 */
export interface Booking {
    /** Unique reservation ID. */
    id: string;
    /** The isolated user session this booking belongs to (used for multi-user demo environments). */
    session_id?: string;
    /** The ID of the host or PM company managing this booking. */
    host_id: string;
    /** The ID of the property currently assigned to the guest. */
    prop_id: string;
    /** Check-in date in YYYY-MM-DD format. */
    arrival_date: string;
    /** Check-out date in YYYY-MM-DD format. */
    departure_date: string;
    /** Calculated duration of the stay in nights. */
    nights: number;
    /** Full name of the primary guest. */
    guest_name: string;
    /** Email address for sending offer notifications. */
    guest_email: string;
    /** Number of guests included in the reservation. */
    guests: number;
    /** Internal booking code used by the PM's legacy system. */
    rate_code?: string;
    /** The actual nightly rate the guest paid for their original booking. */
    base_nightly_rate: number;
    /** The total amount (including fees/taxes) paid for the original reservation. */
    total_paid: number;
    /** Lifecycle state of the booking (e.g., 'confirmed', 'upgraded', 'cancelled'). */
    status: string;
    /** ISO 8601 timestamp of when the booking was created. */
    created_at: string;
    /** ISO 8601 timestamp of the last update to the booking. */
    updated_at?: string;
    /** If the booking was upgraded, this stores the ID of the property they were originally in. */
    upgraded_from_prop_id?: string;
    /** The original nightly rate before any upgrade occurred (persisted for reporting). */
    original_base_rate?: number;
    /** The original total price before any upgrade occurred. */
    original_total_paid?: number;
    /** ISO 8601 timestamp of when the guest accepted their upgrade offer. */
    upgrade_at?: string;
}

/**
 * Breakdown of the financial transition from a standard booking to an upgraded one.
 * These details are calculated by the Offer Engine and presented to both host and guest.
 */
export interface PricingDetails {
    /** ISO currency code (e.g., "EUR"). */
    currency: string;
    /** Guest's original Average Daily Rate (ADR). */
    from_adr: number;
    /** The standard (rack) Average Daily Rate of the upgrade property. */
    to_adr_list: number;
    /** The discounted nightly rate offered to the guest as part of the upgrade. */
    offer_adr: number;
    /** Duration of the stay used for the calculation. */
    nights: number;
    /** The original total price paid by the guest. */
    from_total: number;
    /** The new total price the guest will have paid if they accept the upgrade. */
    offer_total: number;
    /** What the guest would have paid if they booked the upgrade property at full price. */
    list_total: number;
    /** The percentage discount applied to the difference between original and list totals. */
    discount_percent: number;
    /** The total monetary value being saved by the guest. */
    discount_amount_total: number;
    /** The additional revenue (profit) generated for the host by this upgrade. */
    revenue_lift: number;
}

/**
 * A specific property recommendation within an Offer.
 * Combines property data, scoring metrics, and AI-generated selling points.
 */
export interface UpgradeOption {
    /** The priority rank within the offer (1, 2, or 3). */
    ranking: number;
    /** ID of the candidate property. */
    prop_id: string;
    /** Name of the candidate property. */
    prop_name: string;
    /** Neighborhood or area. */
    location?: string;
    /** Beds in the candidate property. */
    beds?: number;
    /** Baths in the candidate property. */
    baths?: number;
    /** A 1-10 score representing how well this property matches the guest's original booking requirements. */
    viability_score: number;
    /** Full pricing breakdown for this specific option. */
    pricing: PricingDetails;
    /** Array of key benefits (e.g., "Extra Bedroom", "Private Pool") generated by comparing to the original property. */
    diffs: string[];
    /** AI-generated hero title for the landing page (e.g., "Perfect for your family getaway"). */
    headline: string;
    /** AI-generated persuasive summary for the offer cards. */
    summary: string;
    /** List of image URLs specifically curated for this option. */
    images: string[];
    /** Full payload of AI-generated content (subjects, body text, CTAs). */
    ai_copy?: any;
    /** Sanitized list of amenities. */
    amenities: string[];
    /** Snapshot of property metadata at the time the offer was generated. */
    metadata: any;
    /** Current real-time availability status for this property. */
    availability: any;
}

/**
 * The master offer record sent to a guest.
 * Contains up to 3 upgrade options ranked by the UpRez engine.
 */
export interface Offer {
    /** Unique UUID for the offer, used in the public URL. */
    id: string;
    /** The isolated user session this offer belongs to (demo isolation). */
    session_id?: string;
    /** Reference to the guest's original booking. */
    booking_id: string;
    /** Current state: 'active' (viewable), 'accepted', 'expired', or 'cancelled'. */
    status: string;
    /** ISO 8601 timestamp. The offer will no longer be accept-able after this time. */
    expires_at: string;
    /** Number of times the host has requested a regeneration of AI copy for this offer. */
    regen_count: number;
    /** The collection of up to 3 properties being offered as upgrades. Stored as JSON in DB. */
    top3: UpgradeOption[] | string;
    /** The personalized subject line generated by AI for the notification email. */
    email_subject?: string;
    /** The full rendered HTML content of the offer email. */
    email_body_html?: string;
    /** ISO 8601 timestamp of creation. */
    created_at: string;
    /** ISO 8601 timestamp of last metadata or status change. */
    updated_at?: string;
    /** ISO 8601 timestamp of when the guest clicked 'Accept'. */
    accepted_at?: string;
    /** The ID of the specific prop_id the guest chose from the top3 list. */
    selected_prop_id?: string;
}

/**
 * Global configuration settings for a Host (Property Manager).
 * Controls revenue guardrails, AI behavior, and branding.
 */
export interface HostSettings {
    /** Unique identifier for the host (e.g., 'demo_host_001'). */
    host_id: string;
    /** Display name of the host/contact person. */
    host_name?: string;
    /** Direct contact number for the host appearing in emails/footer. */
    host_phone?: string;
    /** Legal or trade name of the property management company. */
    pm_company_name?: string;
    /** REVENUE GUARDRAIL: The absolute minimum profit (in EUR) the host will accept for an upgrade per night. */
    min_revenue_lift_eur_per_night: number;
    /** REVENUE GUARDRAIL: The maximum percentage discount (0.0 - 1.0) the engine is allowed to apply to the ADR difference. */
    max_discount_pct: number;
    /** Minimum ratio of the new ADR compared to the old one (to prevent under-selling high-value inventory). */
    min_adr_ratio: number;
    /** The maximum allowed multiplier for the new rate (to prevent offering unrealistic properties). */
    max_adr_multiplier: number;
    /** Percentage fee taken by the booking channel (e.g., Airbnb's 15%). */
    channel_fee_pct: number;
    /** Flat fee charged by the channel for booking modifications. */
    change_fee_eur: number;
    /** ID of the template currently used for transactional emails. */
    active_email_template_id?: string;
    /** ID of the design template currently used for the landing pages. */
    active_landing_template_id?: string;
    /** List of property IDs that should never be offered as an upgrade (e.g., owner-occupied). */
    blocked_prop_ids?: string[] | string;
    /** Amenities that the host wants to emphasize in AI-generated copy. */
    preferred_amenities?: string[] | string;
    /** Geographical constraint for the engine (don't offer properties further than this from current location). */
    max_distance_to_beach_m: number;
    /** Duration in hours that an offer remains valid before auto-expiring. */
    offer_validity_hours: number;
    /** Feature flag to enable/disable OpenAI processing for copywriting. */
    use_openai_for_copy: boolean;
    /** If using a local LLM instead of OpenAI, the model string identifier. */
    local_llm_model?: string;
    /** Usage metric: count of offers triggered this billing cycle. */
    offers_sent_this_month?: number;
    /** Usage metric: total extra revenue generated by UpRez this cycle. */
    revenue_lifted_this_month?: number;
}
