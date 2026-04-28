import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Detection Layer (Features) ---

class PageFeatures(BaseModel):
    # Offer
    offer_clarity: float = 0.0
    value_proposition_strength: float = 0.0
    
    # Trust
    trust_signal_density: float = 0.0
    review_count: int = 0
    trust_badges_count: int = 0
    
    # Structure
    cta_visibility: float = 0.0
    branding_consistency: float = 0.0
    page_density: float = 0.0
    
    # Checkout
    checkout_steps: int = 0
    payment_option_count: int = 0
    local_currency_present: bool = False
    
    # Recovery
    recovery_flow_presence: float = 0.0
    
    # Technical
    load_time: float = 0.0
    bounce_rate: float = 0.0

# --- Interpretation Layer (Issues & Scoring) ---

class Issue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # offer, trust, structure, checkout, recovery
    title: str
    severity: str  # critical, warning, optimization
    severity_weight: float # 1 to 4
    confidence: float # 0 to 1
    why_it_matters: str
    evidence: Optional[str] = None
    metric_impact: str # e.g. "Expected +5% CVR"

class Fix(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    issue_category: str
    title: str
    problem_description: str
    why_it_hurts_conversion: str
    suggested_fix: str
    expected_metric_improvement: float
    confidence: float
    deployment_mode: str
    supporting_evidence: List[str]
    priority: float = 0.0

# --- Reporting Layer ---

class AuditReport(BaseModel):
    audit_id: str
    leak_score: int
    primary_bottleneck: str
    top_fixes: List[Fix] = []
    estimated_impact: Dict[str, float] = {} # {"cvr_lift": 0.05, "revenue_lift": 5000}
    category_scores: Dict[str, float] = {}

# --- Database Models (Supabase Mapping) ---

class AuditCreate(BaseModel):
    url: str
    niche: Optional[str] = "General"
    daily_ad_spend: Optional[float] = 0.0
    target_market: Optional[str] = "Global"

class AuditResponse(BaseModel):
    id: str
    store_id: str
    url: str
    status: str
    score: Optional[float] = None
    summary: Optional[str] = None
    estimated_wasted_ad_spend: Optional[float] = 0.0
    conversion_risk: Optional[str] = None
    add_to_cart_risk: Optional[str] = None
    checkout_risk: Optional[str] = None
    thumb_zone_score: Optional[float] = None
    trust_score: Optional[float] = None
    page_density: Optional[float] = None
    report: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
