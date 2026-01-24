"""
Pydantic models for UpRez API requests and responses.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime


class PropertyBase(BaseModel):
    name: str
    location: str
    beds: int
    baths: int
    list_nightly_rate: float
    amenities: List[str]
    metadata: Optional[Dict[str, Any]] = {}
    images: Optional[List[str]] = []



class Property(PropertyBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None


class BookingBase(BaseModel):
    prop_id: str
    arrival_date: str
    departure_date: str
    nights: int
    guest_name: str
    guest_email: EmailStr
    guest_country: Optional[str] = None
    adults: int = 2
    children: int = 0
    infants: int = 0
    has_car: int = 0
    rate_code: Optional[str] = "FLEX"
    base_nightly_rate: float
    total_paid: float
    channel: Optional[str] = "direct"


class Booking(BookingBase):
    id: str
    host_id: str = "demo_host_001"
    created_at: str
    updated_at: Optional[str] = None


class PricingDetails(BaseModel):
    currency: str = "EUR"
    from_adr: float
    to_adr_list: float
    offer_adr: float
    nights: int
    from_total: float
    offer_total: float
    list_total: float
    discount_percent: float
    discount_amount_total: float
    revenue_lift: float


class UpgradeOption(BaseModel):
    ranking: int
    prop_id: str
    prop_name: str
    viability_score: float
    pricing: PricingDetails
    diffs: List[str]
    headline: str
    summary: str
    images: List[str]
    availability: Dict[str, Any]


class OfferResponse(BaseModel):
    offer_id: str
    booking_id: str
    status: str
    expires_at: str
    regen_count: int
    original_booking: Dict[str, Any]
    options: List[UpgradeOption]


class WebhookPayload(BaseModel):
    event: str  # "cron_pre_arrival" or "cancellation"
    booking_id: Optional[str] = None
    prop_id: Optional[str] = None
    arrival_date: Optional[str] = None
    departure_date: Optional[str] = None


class DemoTriggerPayload(BaseModel):
    type: str  # "cron" or "cancellation"
    booking_id: Optional[str] = None
    prop_id: Optional[str] = None
    arrival_date: Optional[str] = None
    departure_date: Optional[str] = None


class BotQueryRequest(BaseModel):
    offer_id: str
    prop_id: str
    question: str


class BotQueryResponse(BaseModel):
    offer_id: str
    prop_id: str
    answer: str
    source: Optional[Dict[str, Any]] = None


class RegenRequest(BaseModel):
    exclude_prop_ids: Optional[List[str]] = []
    reason: str = "user_requested_regen"


class HostSettings(BaseModel):
    host_id: str
    host_name: Optional[str] = None
    min_revenue_lift_eur_per_night: float = 30.00
    max_discount_pct: float = 0.40
    min_adr_ratio: float = 1.10
    max_adr_multiplier: float = 2.50
    channel_fee_pct: float = 0.18
    change_fee_eur: float = 25.00
    blocked_prop_ids: Optional[List[str]] = []
    preferred_amenities: Optional[List[str]] = []
    max_distance_to_beach_m: int = 5000
    offer_validity_hours: int = 48
    max_offers_per_month: Optional[int] = None
    auto_regen_enabled: bool = True
    email_sender_address: Optional[str] = None
    email_sender_name: Optional[str] = "UpRez"
    use_openai_for_copy: bool = False
    offers_sent_this_month: int = 0
    revenue_lifted_this_month: float = 0.00
    conversion_rate_pct: Optional[float] = None
    local_llm_model: Optional[str] = "gemma2:2b"
    active_email_template_id: Optional[str] = None
    active_landing_template_id: Optional[str] = None
