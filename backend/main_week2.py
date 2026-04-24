import time
import asyncio
import re
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import requests
from requests_oauthlib import OAuth2Session
from jose import JWTError, jwt
from passlib.context import CryptContext

# ============================================================================
# CONFIGURATION
# ============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://audit_user:changeme@localhost:5432/sting_engine")
SHOPIFY_API_KEY = os.getenv("SHOPIFY_API_KEY")
SHOPIFY_API_SECRET = os.getenv("SHOPIFY_API_SECRET")
SHOPIFY_REDIRECT_URI = os.getenv("SHOPIFY_REDIRECT_URI", "http://localhost:8000/auth/callback")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# ============================================================================
# DATABASE SETUP (Lazy initialization)
# ============================================================================

def get_engine():
    """Get database engine with lazy initialization."""
    if not hasattr(get_engine, '_engine'):
        get_engine._engine = create_engine(DATABASE_URL)
        # Don't create tables on import - do it when needed
    return get_engine._engine

def init_db():
    """Initialize database tables."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)

Base = declarative_base()

class ShopifyStore(Base):
    __tablename__ = "shopify_stores"

    id = Column(Integer, primary_key=True, index=True)
    shop_domain = Column(String, unique=True, index=True)
    access_token = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    audits = relationship("Audit", back_populates="store")

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("shopify_stores.id"))
    url = Column(String)
    raw_artifacts = Column(JSON)
    audit_result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    store = relationship("ShopifyStore", back_populates="audits")

class ThemeFix(Base):
    __tablename__ = "theme_fixes"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("shopify_stores.id"))
    theme_id = Column(String)
    fix_type = Column(String)  # "css_injection", "liquid_injection"
    original_content = Column(Text)
    modified_content = Column(Text)
    applied_at = Column(DateTime, default=datetime.utcnow)

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(title="Sting Engine API - Week 2: Shopify Integration")

# Rate limiting (10 audits/min free tier)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SlowAPI middleware for rate limiting
app.add_middleware(SlowAPIMiddleware)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================================================
# DATA MODELS: Separated raw artifacts from derived scores
# ============================================================================

class CTABoundingBox(BaseModel):
    """Raw CTA bounding box data."""
    x: float
    y: float
    width: float
    height: float
    selector: str
    text: str
    is_visible: bool

class DOMMetrics(BaseModel):
    """Raw DOM metrics captured from page."""
    text_length: int
    word_count: int
    images: int
    links: int
    headings: int
    buttons: int
    forms: int
    paragraphs: int
    hero_text: int
    hero_images: int
    hero_buttons: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CompetitorExtraction(BaseModel):
    """Raw competitor scrape data with confidence scores."""
    competitor_name: str
    price: Optional[float] = None
    price_confidence: float = Field(ge=0, le=1.0)  # 0.0-1.0 confidence
    offers: List[str] = []
    offers_confidence: float = Field(ge=0, le=1.0)
    dom_path: str  # Where price was found in DOM
    page_context: str  # Surrounding text context
    currency: str = "USD"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RawAuditArtifacts(BaseModel):
    """All raw observations from page scrape."""
    url: str
    h1: str
    hero_alt: str
    hero_box: Optional[CTABoundingBox] = None
    primary_cta: Optional[CTABoundingBox] = None
    ctas_in_viewport: List[CTABoundingBox] = []
    ctas_after_scroll: List[CTABoundingBox] = []
    dom_metrics: DOMMetrics
    first_100_words: List[str]
    competitor_extractions: List[CompetitorExtraction] = []
    load_time: float
    viewport_height: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AccessibilityScore(BaseModel):
    """Composite CTA accessibility index."""
    visibility_score: float = Field(ge=0, le=1.0)  # Is it visible?
    tappability_score: float = Field(ge=0, le=1.0)  # Is tap target large enough?
    contrast_score: float = Field(ge=0, le=1.0)  # Color contrast vs background
    fold_position_score: float = Field(ge=0, le=1.0)  # Distance from fold
    overall_score: float = Field(ge=0, le=1.0)  # Weighted average
    state: str  # "initial_viewport", "post_scroll", "post_overlay"
    reason: str  # Human-readable explanation

class ThumbZoneResult(BaseModel):
    """Enhanced thumb-zone analysis result."""
    initial_viewport_score: AccessibilityScore
    post_scroll_score: Optional[AccessibilityScore] = None
    post_overlay_score: Optional[AccessibilityScore] = None
    best_state: str  # Which state has best CTA accessibility
    best_score: float
    recommendation: str

class AuditResult(BaseModel):
    """Derived scoring results (Week 1 MVP)."""
    url: str
    daily_ad_spend: float

    # Basic scores
    h1_score: str
    hero_score: str
    load_score: str

    # Friction scores
    friction_words_found: List[str]
    action_words_found: List[str]
    micro_friction: float

    # Thumb-zone (new composite)
    thumb_zone_result: ThumbZoneResult

    # Bounce & conversion
    bounce_rate: float
    narrative_alignment_score: float

    # Revenue impact
    wasted_ad_spend: float
    revenue_drop: float

    # Competitor insights
    competitor_comparison: str
    price_delta: float
    offer_parity: str

    # Diagnostics
    x_ray_comparator: str
    narrative_disconnect: str

    # Artifacts reference (for audit replay)
    artifacts_id: Optional[str] = None

# ============================================================================
# SHOPIFY INTEGRATION MODELS
# ============================================================================

class AuditRequest(BaseModel):
    url: str
    niche: Optional[str] = "General"
    daily_ad_spend: Optional[float] = 0.0

class ShopifyAuthRequest(BaseModel):
    shop_domain: str

class ThemeData(BaseModel):
    id: str
    name: str
    role: str
    theme_store_id: Optional[str]
    previewable: bool
    processing: bool

class FixRequest(BaseModel):
    theme_id: str
    fix_type: str  # "css_injection", "liquid_injection"
    css_injection: Optional[str] = None
    liquid_injection: Optional[str] = None

def get_db():
    """Get database session."""
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# SHOPIFY OAUTH FUNCTIONS
# ============================================================================

def create_shopify_oauth_session(shop_domain: str):
    """Create OAuth2 session for Shopify."""
    return OAuth2Session(
        SHOPIFY_API_KEY,
        redirect_uri=SHOPIFY_REDIRECT_URI,
        scope=["read_themes", "write_themes", "read_content", "write_content"]
    )

def get_shopify_auth_url(shop_domain: str) -> str:
    """Generate Shopify OAuth authorization URL."""
    oauth = create_shopify_oauth_session(shop_domain)
    authorization_url, state = oauth.authorization_url(
        f"https://{shop_domain}/admin/oauth/authorize"
    )
    return authorization_url

def exchange_code_for_token(shop_domain: str, code: str) -> str:
    """Exchange authorization code for access token."""
    oauth = create_shopify_oauth_session(shop_domain)
    token_url = f"https://{shop_domain}/admin/oauth/access_token"
    token = oauth.fetch_token(
        token_url,
        code=code,
        client_secret=SHOPIFY_API_SECRET
    )
    return token["access_token"]

# ============================================================================
# SHOPIFY API FUNCTIONS
# ============================================================================

def get_shopify_themes(shop_domain: str, access_token: str) -> List[Dict]:
    """Fetch themes from Shopify Admin API using requests."""
    url = f"https://{shop_domain}/admin/api/2023-10/themes.json"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()

    data = response.json()
    return [{"id": str(t["id"]), "name": t["name"], "role": t["role"]} for t in data["themes"]]

def get_theme_asset(shop_domain: str, access_token: str, theme_id: str, asset_key: str) -> Dict:
    """Get a specific asset from a theme using requests."""
    url = f"https://{shop_domain}/admin/api/2023-10/themes/{theme_id}/assets.json"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }
    params = {"asset[key]": asset_key}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()

    data = response.json()
    asset = data["asset"]
    return {
        "key": asset["key"],
        "value": asset.get("value", ""),
        "content_type": asset.get("content_type", "text")
    }

def update_theme_asset(shop_domain: str, access_token: str, theme_id: str, asset_key: str, new_value: str):
    """Update a theme asset using requests."""
    url = f"https://{shop_domain}/admin/api/2023-10/themes/{theme_id}/assets.json"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }
    data = {
        "asset": {
            "key": asset_key,
            "value": new_value
        }
    }

    response = requests.put(url, headers=headers, json=data)
    response.raise_for_status()

# ============================================================================
# FIX ENGINE
# ============================================================================

class FixEngine:
    """Engine for injecting CSS and Liquid fixes into Shopify themes."""

    @staticmethod
    def inject_css_fix(theme_css: str, fix_css: str) -> str:
        """Inject CSS fixes into theme stylesheet."""
        # Add fix at the end of the CSS
        return theme_css + f"\n\n/* Sting Engine Fix */\n{fix_css}\n"

    @staticmethod
    def inject_liquid_fix(template_liquid: str, fix_liquid: str, injection_point: str = "before_closing_body") -> str:
        """Inject Liquid fixes into theme templates."""
        if injection_point == "before_closing_body":
            # Inject before </body>
            pattern = r'(</body>)'
            replacement = f"{fix_liquid}\n\\1"
            return re.sub(pattern, replacement, template_liquid, flags=re.IGNORECASE)
        elif injection_point == "after_opening_body":
            # Inject after <body>
            pattern = r'(<body[^>]*>)'
            replacement = f"\\1\n{fix_liquid}"
            return re.sub(pattern, replacement, template_liquid, flags=re.IGNORECASE)
        else:
            # Default: append at end
            return template_liquid + f"\n{fix_liquid}"

    @staticmethod
    def generate_thumb_zone_fix(cta_selector: str, accessibility_score: float) -> str:
        """Generate CSS fix for thumb zone issues."""
        if accessibility_score < 0.7:
            return f"""
{cta_selector} {{
    min-height: 44px !important;
    min-width: 44px !important;
    padding: 12px 24px !important;
    font-size: 16px !important;
    background-color: #007bff !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    display: inline-block !important;
    text-align: center !important;
    text-decoration: none !important;
}}
"""
        return ""

    @staticmethod
    def generate_hero_optimization_fix() -> str:
        """Generate Liquid/CSS fixes for hero section optimization."""
        css_fix = """
.sting-hero-optimization {
    position: relative;
    overflow: hidden;
}

.sting-hero-optimization .hero-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 2;
}

.sting-hero-optimization .hero-cta {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 15px 30px;
    border-radius: 50px;
    color: white;
    text-decoration: none;
    font-weight: bold;
    display: inline-block;
    margin-top: 20px;
    transition: all 0.3s ease;
}

.sting-hero-optimization .hero-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
"""
        liquid_fix = """
{% if template == 'index' %}
<div class="sting-hero-optimization">
    <div class="hero-content">
        <h1>{{ shop.name }}</h1>
        <p>Optimized for maximum conversion</p>
        <a href="/collections/all" class="hero-cta">Shop Now</a>
    </div>
</div>
{% endif %}
"""
        return css_fix, liquid_fix

# ============================================================================
# AUDIT ENGINE (FROM WEEK 1, ENHANCED)
# ============================================================================

async def scrape_page(url: str) -> RawAuditArtifacts:
    """Scrape page and extract raw artifacts."""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 375, 'height': 667},  # Mobile-first
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        )
        page = await context.new_page()

        start_time = time.time()
        await page.goto(url, wait_until='networkidle')
        load_time = time.time() - start_time

        # Extract basic info
        h1 = await page.locator('h1').first.inner_text() if await page.locator('h1').count() > 0 else ""
        hero_alt = await page.locator('img[alt]').first.get_attribute('alt') or ""

        # Get viewport height
        viewport_height = await page.evaluate("window.innerHeight")

        # Extract DOM metrics
        dom_metrics = await extract_dom_metrics(page)

        # Find CTAs
        ctas_in_viewport = await find_ctas_in_viewport(page)
        ctas_after_scroll = await find_ctas_after_scroll(page)

        # Extract first 100 words
        first_100_words = await extract_first_100_words(page)

        await browser.close()

        return RawAuditArtifacts(
            url=url,
            h1=h1,
            hero_alt=hero_alt,
            ctas_in_viewport=ctas_in_viewport,
            ctas_after_scroll=ctas_after_scroll,
            dom_metrics=dom_metrics,
            first_100_words=first_100_words,
            load_time=load_time,
            viewport_height=viewport_height
        )

async def extract_dom_metrics(page) -> DOMMetrics:
    """Extract comprehensive DOM metrics."""
    metrics = await page.evaluate("""
        () => {
            const text = document.body.innerText || '';
            const words = text.split(/\\s+/).filter(w => w.length > 0);

            return {
                text_length: text.length,
                word_count: words.length,
                images: document.images.length,
                links: document.links.length,
                headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
                buttons: document.querySelectorAll('button').length,
                forms: document.querySelectorAll('form').length,
                paragraphs: document.querySelectorAll('p').length,
                hero_text: document.querySelectorAll('[class*="hero"] *, [id*="hero"] *').length,
                hero_images: document.querySelectorAll('[class*="hero"] img, [id*="hero"] img').length,
                hero_buttons: document.querySelectorAll('[class*="hero"] button, [id*="hero"] button').length
            };
        }
    """)
    return DOMMetrics(**metrics)

async def find_ctas_in_viewport(page) -> List[CTABoundingBox]:
    """Find CTAs visible in initial viewport."""
    ctas = await page.evaluate("""
        () => {
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            const elements = document.querySelectorAll('a, button, [role="button"], input[type="submit"]');
            const ctas = [];

            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 &&
                    rect.left < viewport.width && rect.right > 0 &&
                    rect.top < viewport.height && rect.bottom > 0) {

                    const text = el.textContent?.trim() || el.value || '';
                    if (text.length > 0 && /click|buy|shop|order|purchase|subscribe|get|start/i.test(text)) {
                        ctas.push({
                            x: rect.left,
                            y: rect.top,
                            width: rect.width,
                            height: rect.height,
                            selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : ''),
                            text: text.substring(0, 50),
                            is_visible: true
                        });
                    }
                }
            }
            return ctas.slice(0, 5); // Top 5 CTAs
        }
    """)
    return [CTABoundingBox(**cta) for cta in ctas]

async def find_ctas_after_scroll(page) -> List[CTABoundingBox]:
    """Find CTAs after scrolling to reveal more content."""
    await page.evaluate("window.scrollTo(0, window.innerHeight * 0.5)");
    await page.wait_for_timeout(500)

    return await find_ctas_in_viewport(page)

async def extract_first_100_words(page) -> List[str]:
    """Extract first 100 words from page."""
    text = await page.locator('body').inner_text()
    words = re.findall(r'\b\w+\b', text.lower())
    return words[:100]

def calculate_accessibility_score(cta: CTABoundingBox, viewport_height: int, state: str) -> AccessibilityScore:
    """Calculate composite accessibility score for CTA."""
    # Visibility score (is it actually visible?)
    visibility_score = 1.0 if cta.is_visible else 0.0

    # Tappability score (44px minimum touch target)
    tappability_score = min(1.0, (cta.width * cta.height) / (44 * 44))

    # Contrast score (placeholder - would need actual color analysis)
    contrast_score = 0.8  # Assume decent contrast for now

    # Fold position score (prefer above fold, but not too high)
    fold_position = cta.y / viewport_height
    if fold_position < 0.2:  # Too high
        fold_position_score = 0.7
    elif fold_position < 0.8:  # Good zone
        fold_position_score = 1.0
    else:  # Below fold
        fold_position_score = 0.5

    # Weighted average
    overall_score = (
        visibility_score * 0.3 +
        tappability_score * 0.3 +
        contrast_score * 0.2 +
        fold_position_score * 0.2
    )

    reason = f"CTA '{cta.text}' in {state}: "
    if overall_score >= 0.8:
        reason += "Excellent accessibility"
    elif overall_score >= 0.6:
        reason += "Good, minor improvements needed"
    else:
        reason += "Needs significant improvement"

    return AccessibilityScore(
        visibility_score=visibility_score,
        tappability_score=tappability_score,
        contrast_score=contrast_score,
        fold_position_score=fold_position_score,
        overall_score=overall_score,
        state=state,
        reason=reason
    )

def analyze_thumb_zone(artifacts: RawAuditArtifacts) -> ThumbZoneResult:
    """Analyze CTA accessibility across different states."""
    initial_ctas = artifacts.ctas_in_viewport
    scroll_ctas = artifacts.ctas_after_scroll

    # Calculate scores for each state
    initial_scores = [calculate_accessibility_score(cta, artifacts.viewport_height, "initial_viewport")
                     for cta in initial_ctas]

    scroll_scores = [calculate_accessibility_score(cta, artifacts.viewport_height, "post_scroll")
                    for cta in scroll_ctas]

    # Find best scores
    all_scores = initial_scores + scroll_scores
    if all_scores:
        best_score = max(s.overall_score for s in all_scores)
        best_state = max(all_scores, key=lambda s: s.overall_score).state
    else:
        best_score = 0.0
        best_state = "no_ctas_found"

    # Generate recommendation
    if best_score >= 0.8:
        recommendation = "CTA accessibility is excellent"
    elif best_score >= 0.6:
        recommendation = "Minor CTA improvements recommended"
    else:
        recommendation = "Significant CTA accessibility issues - fix immediately"

    return ThumbZoneResult(
        initial_viewport_score=initial_scores[0] if initial_scores else None,
        post_scroll_score=scroll_scores[0] if scroll_scores else None,
        best_state=best_state,
        best_score=best_score,
        recommendation=recommendation
    )

def calculate_audit_scores(artifacts: RawAuditArtifacts, daily_ad_spend: float) -> AuditResult:
    """Calculate all audit scores from raw artifacts."""
    # Basic scores
    h1_score = "Good" if len(artifacts.h1) > 10 else "Needs H1 optimization"
    hero_score = "Good" if artifacts.hero_alt else "Missing hero image alt text"
    load_score = "Fast" if artifacts.load_time < 3.0 else "Slow - optimize images"

    # Friction analysis
    friction_words = ['wait', 'limited', 'only', 'few', 'last', 'hurry', 'quick', 'fast']
    action_words = ['buy', 'order', 'purchase', 'subscribe', 'get', 'start', 'join']

    friction_found = [w for w in friction_words if w in ' '.join(artifacts.first_100_words)]
    action_found = [w for w in action_words if w in ' '.join(artifacts.first_100_words)]

    micro_friction = len(friction_found) / max(1, len(artifacts.first_100_words)) * 100

    # Thumb zone analysis
    thumb_zone_result = analyze_thumb_zone(artifacts)

    # Bounce rate estimation
    bounce_rate = min(0.95, 0.3 + micro_friction / 10 + (1 - thumb_zone_result.best_score))

    # Narrative alignment (simplified)
    narrative_alignment_score = 1.0 - micro_friction / 100

    # Revenue impact
    wasted_ad_spend = daily_ad_spend * bounce_rate
    revenue_drop = wasted_ad_spend * 0.1  # Assume 10% conversion rate

    # Competitor insights (placeholder)
    competitor_comparison = "Analysis pending"
    price_delta = 0.0
    offer_parity = "Unknown"

    # Diagnostics
    x_ray_comparator = "Standard e-commerce structure detected"
    narrative_disconnect = "Minor friction detected" if micro_friction > 5 else "Clean narrative flow"

    return AuditResult(
        url=artifacts.url,
        daily_ad_spend=daily_ad_spend,
        h1_score=h1_score,
        hero_score=hero_score,
        load_score=load_score,
        friction_words_found=friction_found,
        action_words_found=action_found,
        micro_friction=micro_friction,
        thumb_zone_result=thumb_zone_result,
        bounce_rate=bounce_rate,
        narrative_alignment_score=narrative_alignment_score,
        wasted_ad_spend=wasted_ad_spend,
        revenue_drop=revenue_drop,
        competitor_comparison=competitor_comparison,
        price_delta=price_delta,
        offer_parity=offer_parity,
        x_ray_comparator=x_ray_comparator,
        narrative_disconnect=narrative_disconnect
    )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "week2"}

@app.post("/audit")
@limiter.limit("10/minute")
async def audit_website(request: AuditRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Main audit endpoint with persistent storage."""
    try:
        # Initialize DB if needed
        init_db()

        # Scrape the page
        artifacts = await scrape_page(request.url)

        # Calculate scores
        result = calculate_audit_scores(artifacts, request.daily_ad_spend or 0.0)

        # Store in database (async background task)
        background_tasks.add_task(store_audit_in_db, db, artifacts, result)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")

# ============================================================================
# SHOPIFY INTEGRATION ENDPOINTS
# ============================================================================

@app.post("/auth/initiate")
async def initiate_shopify_auth(request: ShopifyAuthRequest):
    """Initiate Shopify OAuth flow."""
    try:
        auth_url = get_shopify_auth_url(request.shop_domain)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth initiation failed: {str(e)}")

@app.get("/auth/callback")
async def shopify_auth_callback(
    code: str = Query(...),
    shop: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle Shopify OAuth callback."""
    try:
        # Exchange code for token
        access_token = exchange_code_for_token(shop, code)

        # Store or update store in database
        store = db.query(ShopifyStore).filter(ShopifyStore.shop_domain == shop).first()
        if store:
            store.access_token = access_token
            store.updated_at = datetime.utcnow()
        else:
            store = ShopifyStore(shop_domain=shop, access_token=access_token)
            db.add(store)

        db.commit()

        return {"message": "Shopify store connected successfully", "store_id": store.id}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")

@app.get("/themes/{store_id}")
async def get_themes(store_id: int, db: Session = Depends(get_db)):
    """Get themes for a connected Shopify store."""
    store = db.query(ShopifyStore).filter(ShopifyStore.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    try:
        themes = get_shopify_themes(store.shop_domain, store.access_token)
        return {"themes": themes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch themes: {str(e)}")

@app.post("/fix/{store_id}")
async def apply_fix(store_id: int, request: FixRequest, db: Session = Depends(get_db)):
    """Apply a fix to a Shopify theme."""
    store = db.query(ShopifyStore).filter(ShopifyStore.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    try:
        fix_engine = FixEngine()

        if request.fix_type == "css_injection" and request.css_injection:
            # Get current theme CSS
            asset = get_theme_asset(store.shop_domain, store.access_token, request.theme_id, "assets/theme.css")

            # Apply fix
            modified_css = fix_engine.inject_css_fix(asset["value"], request.css_injection)

            # Update theme
            update_theme_asset(store.shop_domain, store.access_token, request.theme_id, "assets/theme.css", modified_css)

            # Store fix record
            fix_record = ThemeFix(
                store_id=store_id,
                theme_id=request.theme_id,
                fix_type="css_injection",
                original_content=asset["value"],
                modified_content=modified_css
            )
            db.add(fix_record)
            db.commit()

        elif request.fix_type == "liquid_injection" and request.liquid_injection:
            # Get current theme template
            asset = get_theme_asset(store.shop_domain, store.access_token, request.theme_id, "templates/index.liquid")

            # Apply fix
            modified_liquid = fix_engine.inject_liquid_fix(asset["value"], request.liquid_injection)

            # Update theme
            update_theme_asset(store.shop_domain, store.access_token, request.theme_id, "templates/index.liquid", modified_liquid)

            # Store fix record
            fix_record = ThemeFix(
                store_id=store_id,
                theme_id=request.theme_id,
                fix_type="liquid_injection",
                original_content=asset["value"],
                modified_content=modified_liquid
            )
            db.add(fix_record)
            db.commit()

        return {"message": "Fix applied successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply fix: {str(e)}")

@app.post("/fix/auto/{store_id}")
async def apply_auto_fix(store_id: int, theme_id: str, audit_url: str, db: Session = Depends(get_db)):
    """Automatically apply fixes based on audit results."""
    store = db.query(ShopifyStore).filter(ShopifyStore.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    try:
        # Get recent audit for this store
        audit = db.query(Audit).filter(
            Audit.store_id == store_id,
            Audit.url == audit_url
        ).order_by(Audit.created_at.desc()).first()

        if not audit:
            raise HTTPException(status_code=404, detail="No audit found for this store and URL")

        audit_result = audit.audit_result

        fix_engine = FixEngine()
        fixes_applied = []

        # Apply thumb zone fix if needed
        if audit_result.get("thumb_zone_result", {}).get("best_score", 1.0) < 0.7:
            css_fix = fix_engine.generate_thumb_zone_fix(".btn, button, .button", audit_result["thumb_zone_result"]["best_score"])
            if css_fix.strip():
                # Apply CSS fix
                asset = get_theme_asset(store.shop_domain, store.access_token, theme_id, "assets/theme.css")
                modified_css = fix_engine.inject_css_fix(asset["value"], css_fix)
                update_theme_asset(store.shop_domain, store.access_token, theme_id, "assets/theme.css", modified_css)

                fixes_applied.append("thumb_zone_css")

        # Apply hero optimization if hero score is poor
        if audit_result.get("hero_score") != "Good":
            css_fix, liquid_fix = fix_engine.generate_hero_optimization_fix()

            # Apply CSS
            asset = get_theme_asset(store.shop_domain, store.access_token, theme_id, "assets/theme.css")
            modified_css = fix_engine.inject_css_fix(asset["value"], css_fix)
            update_theme_asset(store.shop_domain, store.access_token, theme_id, "assets/theme.css", modified_css)

            # Apply Liquid
            asset = get_theme_asset(store.shop_domain, store.access_token, theme_id, "templates/index.liquid")
            modified_liquid = fix_engine.inject_liquid_fix(asset["value"], liquid_fix)
            update_theme_asset(store.shop_domain, store.access_token, theme_id, "templates/index.liquid", modified_liquid)

            fixes_applied.append("hero_optimization")

        return {"message": "Auto fixes applied", "fixes": fixes_applied}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto fix failed: {str(e)}")

# ============================================================================
# DATABASE UTILITIES
# ============================================================================

def store_audit_in_db(db: Session, artifacts: RawAuditArtifacts, result: AuditResult):
    """Store audit artifacts and results in database."""
    try:
        # For now, store without store_id (will be enhanced when Shopify integration is complete)
        audit = Audit(
            store_id=None,  # Will be set when we have Shopify store context
            url=result.url,
            raw_artifacts=artifacts.dict(),
            audit_result=result.dict()
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Failed to store audit in DB: {e}")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)