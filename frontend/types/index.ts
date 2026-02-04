export interface Property {
    id: string;
    name: string;
    location: string;
    beds: number;
    baths: number;
    list_nightly_rate: number;
    amenities: string[] | string;
    type?: string;
    category?: string;
    max_guests?: number;
    bedrooms?: number;
    size_sqm?: number;
    floor?: number;
    elevator?: number;
    view?: string;
    noise_level?: string;
    suitability?: any;
    house_rules?: any;
    description_short?: string;
    description_long?: string;
    metadata?: any;
    images?: string[] | string;
    created_at: string;
    updated_at?: string;
}

export interface Booking {
    id: string;
    host_id: string;
    prop_id: string;
    arrival_date: string;
    departure_date: string;
    nights: number;
    guest_name: string;
    guest_email: string;
    guest_country?: string;
    adults: number;
    children: number;
    infants: number;
    has_car: number;
    rate_code?: string;
    base_nightly_rate: number;
    total_paid: number;
    channel?: string;
    status: string;
    created_at: string;
    updated_at?: string;
    upgraded_from_prop_id?: string;
    original_base_rate?: number;
    original_total_paid?: number;
    upgrade_at?: string;
}

export interface PricingDetails {
    currency: string;
    from_adr: number;
    to_adr_list: number;
    offer_adr: number;
    nights: number;
    from_total: number;
    offer_total: number;
    list_total: number;
    discount_percent: number;
    discount_amount_total: number;
    revenue_lift: number;
}

export interface UpgradeOption {
    ranking: number;
    prop_id: string;
    prop_name: string;
    location?: string;
    beds?: number;
    baths?: number;
    viability_score: number;
    pricing: PricingDetails;
    diffs: string[];
    headline: string;
    summary: string;
    images: string[];
    ai_copy?: any;
    amenities: string[];
    metadata: any;
    availability: any;
}

export interface Offer {
    id: string;
    booking_id: string;
    status: string;
    expires_at: string;
    regen_count: number;
    top3: UpgradeOption[] | string;
    email_subject?: string;
    email_body_html?: string;
    created_at: string;
    updated_at?: string;
    accepted_at?: string;
    selected_prop_id?: string;
}

export interface HostSettings {
    host_id: string;
    host_name?: string;
    pm_company_name?: string;
    min_revenue_lift_eur_per_night: number;
    max_discount_pct: number;
    min_adr_ratio: number;
    max_adr_multiplier: number;
    channel_fee_pct: number;
    change_fee_eur: number;
    blocked_prop_ids?: string[] | string;
    preferred_amenities?: string[] | string;
    max_distance_to_beach_m: number;
    offer_validity_hours: number;
    use_openai_for_copy: boolean;
    local_llm_model?: string;
}
