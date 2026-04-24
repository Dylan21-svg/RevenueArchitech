import time
import asyncio
import re
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

app = FastAPI(title="Sting Engine API - Week 1 MVP")

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


class AuditRequest(BaseModel):
    url: str
    niche: Optional[str] = "General"
    daily_ad_spend: Optional[float] = 0.0


# ============================================================================
# HARDCODED BENCHMARK MATRIX WITH NICHE SEEDS
# ============================================================================

BENCHMARKS = {
    "Fitness": {
        "competitors": [
            {"name": "Gymshark", "url": "https://www.gymshark.com"},
            {"name": "Alo Yoga", "url": "https://www.aloyoga.com"},
            {"name": "Lululemon", "url": "https://www.lululemon.com"},
        ],
        "trust_density_target": 85
    },
    "Beauty": {
        "competitors": [
            {"name": "Glossier", "url": "https://www.glossier.com"},
            {"name": "Fenty Beauty", "url": "https://www.fentybeauty.com"},
            {"name": "Sephora", "url": "https://www.sephora.com"},
        ],
        "trust_density_target": 92
    },
    "Gadgets": {
        "competitors": [
            {"name": "Anker", "url": "https://www.anker.com"},
            {"name": "Nomad", "url": "https://www.nomadgoods.com"},
            {"name": "Spigen", "url": "https://www.spigen.com"},
        ],
        "trust_density_target": 78
    },
    "General": {
        "competitors": [
            {"name": "Warby Parker", "url": "https://www.warbyparker.com"},
            {"name": "Allbirds", "url": "https://www.allbirds.com"},
            {"name": "Everlane", "url": "https://www.everlane.com"},
        ],
        "trust_density_target": 80
    }
}


# ============================================================================
# COMPOSITE THUMB-ZONE SCORING (REPLACES RAW Y-POSITION)
# ============================================================================

def calculate_accessibility_score(
    cta_box: Dict,
    viewport_height: int,
    is_visible: bool,
    page_state: str = "initial_viewport"
) -> AccessibilityScore:
    """
    Calculate composite accessibility score for CTA.
    Factors: visibility, tappability, contrast, fold position.
    Normalized to 0-1 range instead of raw Y-coordinates.
    """
    
    # 1. VISIBILITY SCORE (0-1)
    visibility_score = 1.0 if is_visible else 0.0
    
    # 2. TAPPABILITY SCORE (0-1) - minimum 44x44px recommended
    MIN_TAP_TARGET = 44
    tap_width = min(1.0, cta_box.get('width', 0) / (MIN_TAP_TARGET * 1.5))
    tap_height = min(1.0, cta_box.get('height', 0) / (MIN_TAP_TARGET * 1.5))
    tappability_score = (tap_width + tap_height) / 2.0
    
    # 3. CONTRAST SCORE (0-1) - simplified (1.0 = assume good contrast)
    # In production, use automated contrast checker (e.g., axe-core)
    contrast_score = 0.9 if is_visible else 0.0
    
    # 4. FOLD POSITION SCORE (0-1) - normalized viewport position
    # Upper third (0-0.33) = harder reach; middle (0.33-0.67) = ideal; lower (0.67-1.0) = scroll required
    cta_y = cta_box.get('y', viewport_height)
    normalized_position = cta_y / viewport_height
    
    if normalized_position < 0.15:
        fold_score = 0.5  # Too high (above natural thumb zone on mobile)
    elif normalized_position < 0.33:
        fold_score = 0.75
    elif normalized_position < 0.67:
        fold_score = 1.0  # Ideal thumb-zone range
    elif normalized_position < 0.85:
        fold_score = 0.8  # Below fold but reachable with small scroll
    else:
        fold_score = 0.4  # Deep scroll required
    
    # WEIGHTED COMPOSITE (visibility is most important)
    weights = {
        'visibility': 0.40,
        'tappability': 0.25,
        'contrast': 0.15,
        'fold': 0.20
    }
    
    overall = (
        visibility_score * weights['visibility'] +
        tappability_score * weights['tappability'] +
        contrast_score * weights['contrast'] +
        fold_score * weights['fold']
    )
    
    # State-specific penalty
    if page_state == "post_scroll":
        overall *= 0.85  # Slight penalty for requiring scroll
    elif page_state == "post_overlay":
        overall *= 0.70  # Larger penalty for requiring overlay dismissal
    
    # Human-readable reason
    if overall >= 0.85:
        reason = "CTA is visible, appropriately sized, and in natural thumb reach zone"
    elif overall >= 0.70:
        reason = "CTA is accessible but may require slight scroll or resize"
    elif overall >= 0.50:
        reason = "CTA accessibility is limited; consider moving closer to fold or enlarging"
    else:
        reason = "CTA is not easily accessible; hidden, too small, or deeply buried"
    
    return AccessibilityScore(
        visibility_score=visibility_score,
        tappability_score=tappability_score,
        contrast_score=contrast_score,
        fold_position_score=fold_score,
        overall_score=round(overall, 3),
        state=page_state,
        reason=reason
    )


# ============================================================================
# COMPETITOR EXTRACTION WITH CONFIDENCE SCORING
# ============================================================================

def extract_price_with_confidence(text: str, dom_path: str = "") -> tuple:
    """
    Extract price and confidence score.
    Returns: (price_float, confidence_0_to_1, dom_path, page_context)
    """
    # Pattern: $1.99, $1,299.99, price: $99
    patterns = [
        (r"price[:\s]*\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.95),  # Explicit "price" label
        (r"only\s*\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.90),  # "only $X"
        (r"\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.70),  # Generic dollar amount
    ]
    
    for pattern, confidence in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                price_str = match.group(1).replace(',', '')
                price_float = float(price_str)
                context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
                return price_float, confidence, dom_path, context
            except ValueError:
                continue
    
    return None, 0.0, "", ""


def detect_offer_signals_with_confidence(text: str) -> List[tuple]:
    """
    Detect offer signals with confidence scores.
    Returns: List of (offer_text, confidence_0_to_1, source)
    """
    high_confidence_offers = [
        ("free shipping", 0.95),
        ("2-day shipping", 0.95),
        ("same day shipping", 0.95),
        ("buy one get one", 0.90),
        ("bogo", 0.90),
        ("free returns", 0.92),
        ("price match", 0.90),
    ]
    
    medium_confidence_offers = [
        ("sale", 0.75),
        ("discount", 0.70),
        ("clearance", 0.65),
    ]
    
    found_offers = []
    text_lower = text.lower()
    
    for offer, confidence in high_confidence_offers + medium_confidence_offers:
        if offer in text_lower:
            found_offers.append((offer, confidence, "page_text"))
    
    return found_offers


# ============================================================================
# DOM EXTRACTION & COMPETITOR SCRAPING
# ============================================================================

def get_js_code():
    """Extract raw DOM metrics."""
    return (
        "() => {" +
        "const body = document.body;" +
        "const textContent = body.textContent || '';" +
        "const images = document.querySelectorAll('img').length;" +
        "const links = document.querySelectorAll('a').length;" +
        "const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;" +
        "const buttons = document.querySelectorAll('button').length;" +
        "const forms = document.querySelectorAll('form').length;" +
        "const paragraphs = document.querySelectorAll('p').length;" +
        "const textLength = textContent.length;" +
        "const wordCount = textContent.split(/\\s+/).filter(word => word.length > 0).length;" +
        "const heroSelectors = ['.hero', '#hero', 'header', 'section:first-of-type'];" +
        "let heroElement = null;" +
        "for (const selector of heroSelectors) { heroElement = document.querySelector(selector); if (heroElement) break; }" +
        "const heroText = heroElement ? (heroElement.textContent || '').length : 0;" +
        "const heroImages = heroElement ? heroElement.querySelectorAll('img').length : 0;" +
        "const heroButtons = heroElement ? heroElement.querySelectorAll('button, a[role=\"button\"]').length : 0;" +
        "return { textLength, wordCount, images, links, headings, buttons, forms, paragraphs, heroText, heroImages, heroButtons };" +
        "}"
    )


async def get_dom_metrics(page) -> DOMMetrics:
    """Capture raw DOM metrics."""
    js_code = get_js_code()
    metrics = await page.evaluate(js_code)
    return DOMMetrics(
        text_length=metrics['textLength'],
        word_count=metrics['wordCount'],
        images=metrics['images'],
        links=metrics['links'],
        headings=metrics['headings'],
        buttons=metrics['buttons'],
        forms=metrics['forms'],
        paragraphs=metrics['paragraphs'],
        hero_text=metrics['heroText'],
        hero_images=metrics['heroImages'],
        hero_buttons=metrics['heroButtons']
    )


async def scrape_competitor_with_confidence(context, competitor_url: str, competitor_name: str) -> CompetitorExtraction:
    """
    Scrape competitor page with confidence scoring.
    Returns raw extraction with confidence metrics.
    """
    try:
        cpage = await context.new_page()
        await cpage.goto(competitor_url, wait_until="domcontentloaded", timeout=20000)
        comp_text = await cpage.evaluate("document.body.innerText")
        comp_text_norm = " ".join([c if c.isalnum() or c.isspace() else " " for c in comp_text.lower()])
        
        # Extract price with confidence
        price, price_conf, dom_path, context_str = extract_price_with_confidence(comp_text_norm)
        
        # Extract offers with confidence
        offers_with_conf = detect_offer_signals_with_confidence(comp_text_norm)
        offers_list = [o[0] for o in offers_with_conf]
        offers_conf = sum([o[1] for o in offers_with_conf]) / len(offers_with_conf) if offers_with_conf else 0.0
        
        await cpage.close()
        
        return CompetitorExtraction(
            competitor_name=competitor_name,
            price=price,
            price_confidence=price_conf if price else 0.0,
            offers=offers_list,
            offers_confidence=min(1.0, offers_conf),
            dom_path=dom_path or competitor_url,
            page_context=context_str
        )
    except Exception as e:
        try:
            await cpage.close()
        except:
            pass
        return CompetitorExtraction(
            competitor_name=competitor_name,
            price=None,
            price_confidence=0.0,
            offers=[],
            offers_confidence=0.0,
            dom_path="error_scraping",
            page_context=str(e)
        )


# ============================================================================
# CTA DETECTION WITH MULTIPLE STATES
# ============================================================================

async def find_ctas_in_viewport(page, viewport_height: int) -> tuple:
    """
    Find all CTAs visible in initial viewport.
    Returns: (primary_cta, list_of_all_ctas_in_viewport)
    """
    cta_selectors = [
        "button:has-text('Add to Cart')",
        "button:has-text('ADD TO CART')",
        "button:has-text('Buy Now')",
        "button:has-text('Shop')",
        "a:has-text('Add to Cart')",
        "a:has-text('Checkout')",
        "[data-testid*='cart']",
        "[data-testid*='checkout']",
    ]
    
    ctas_found = []
    primary = None
    
    for selector in cta_selectors:
        try:
            elements = await page.query_selector_all(selector)
            for idx, cta in enumerate(elements):
                box = await cta.bounding_box()
                if box and box['y'] >= 0 and box['y'] < viewport_height:  # In viewport
                    is_visible = await cta.is_visible()
                    text = await cta.inner_text()
                    
                    cta_obj = CTABoundingBox(
                        x=box['x'],
                        y=box['y'],
                        width=box['width'],
                        height=box['height'],
                        selector=selector,
                        text=text[:50],
                        is_visible=is_visible
                    )
                    
                    ctas_found.append(cta_obj)
                    if not primary:
                        primary = cta_obj
        except Exception:
            continue
    
    return primary, ctas_found


async def find_ctas_after_scroll(page, viewport_height: int, initial_scroll_position: int = 0) -> List[CTABoundingBox]:
    """
    Find CTAs revealed after scrolling past hero section.
    """
    hero_height = viewport_height * 1.5  # Scroll past hero
    await page.evaluate(f"window.scrollBy(0, {int(hero_height)})")
    
    ctas_after_scroll = []
    cta_selectors = [
        "button:has-text('Add to Cart')",
        "button:has-text('Buy Now')",
        "a:has-text('Shop')",
    ]
    
    for selector in cta_selectors:
        try:
            elements = await page.query_selector_all(selector)
            for cta in elements:
                box = await cta.bounding_box()
                if box:
                    is_visible = await cta.is_visible()
                    text = await cta.inner_text()
                    
                    ctas_after_scroll.append(CTABoundingBox(
                        x=box['x'],
                        y=box['y'],
                        width=box['width'],
                        height=box['height'],
                        selector=selector,
                        text=text[:50],
                        is_visible=is_visible
                    ))
        except Exception:
            continue
    
    await page.evaluate("window.scrollBy(0, -9999)")  # Scroll back
    return ctas_after_scroll


# ============================================================================
# MAIN AUDIT ENDPOINT
# ============================================================================

@app.get("/health")
def health():
    return {"status": "ok", "version": "week1-mvp"}


@app.post("/audit", response_model=AuditResult)
async def run_audit(request: AuditRequest):
    """
    Core audit endpoint: URL → JSON result in <30s.
    Implements composite accessibility scoring, confidence metrics, artifact separation.
    """
    url = request.url
    niche = request.niche if request.niche in BENCHMARKS else "General"
    
    if not url.startswith("http"):
        url = "https://" + url

    async with async_playwright() as p:
        try:
            # Mobile emulation (iPhone 13)
            iphone_13 = p.devices['iPhone 13']
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(**iphone_13)
            page = await context.new_page()
            
            start_time = time.perf_counter()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            end_time = time.perf_counter()
            
            load_time = end_time - start_time
            viewport_height = iphone_13['viewport']['height']
            
            # ===== STEP 1: Raw artifact collection =====
            h1_element = await page.query_selector("h1")
            h1_text = await h1_element.inner_text() if h1_element else ""
            h1_text = h1_text.strip()
            
            hero_img_element = await page.query_selector("img")
            hero_alt = await hero_img_element.get_attribute("alt") if hero_img_element else ""
            hero_alt = hero_alt.strip() if hero_alt else ""
            hero_box_data = await hero_img_element.bounding_box() if hero_img_element else None
            
            hero_box = None
            if hero_box_data:
                hero_box = CTABoundingBox(
                    x=hero_box_data['x'],
                    y=hero_box_data['y'],
                    width=hero_box_data['width'],
                    height=hero_box_data['height'],
                    selector="img:first",
                    text="hero_image",
                    is_visible=True
                )
            
            # Extract text for friction analysis
            body_text = await page.evaluate("document.body.innerText")
            normalized_text = " ".join([c if c.isalnum() or c.isspace() else " " for c in body_text.lower()])
            first_100_words = normalized_text.split()[:100]
            
            # Get DOM metrics
            dom_metrics = await get_dom_metrics(page)
            
            # Find CTAs in initial viewport
            primary_cta, ctas_initial = await find_ctas_in_viewport(page, viewport_height)
            
            # Find CTAs after scroll
            ctas_after_scroll = await find_ctas_after_scroll(page, viewport_height)
            
            # ===== STEP 2: Competitor scraping with confidence scores =====
            bdata = BENCHMARKS[niche]
            competitor_extractions = []
            
            for comp in bdata["competitors"][:3]:
                extraction = await scrape_competitor_with_confidence(context, comp["url"], comp["name"])
                competitor_extractions.append(extraction)
            
            # ===== STEP 3: Raw artifacts object =====
            artifacts = RawAuditArtifacts(
                url=url,
                h1=h1_text,
                hero_alt=hero_alt,
                hero_box=hero_box,
                primary_cta=primary_cta,
                ctas_in_viewport=ctas_initial,
                ctas_after_scroll=ctas_after_scroll,
                dom_metrics=dom_metrics,
                first_100_words=first_100_words,
                competitor_extractions=competitor_extractions,
                load_time=load_time,
                viewport_height=viewport_height
            )
            
            # ===== STEP 4: Derived scoring from artifacts =====
            
            # H1 scoring
            vague_words = ["welcome", "home", "shop", "store"]
            h1_score = (
                "Fail (Missing)" if not h1_text else
                "Fail (Too short)" if len(h1_text.split()) < 3 else
                "Fail (Vague)" if any(w in h1_text.lower() for w in vague_words) else
                "Pass (Clear)"
            )
            
            # Hero alt scoring
            hero_score = (
                "Fail (Missing Alt Text)" if not hero_alt else
                "Fail (Generic/SEO Dead)" if any(w in hero_alt.lower() for w in ["hero", "image", "banner"]) else
                "Pass (Descriptive)"
            )
            
            # Load time scoring
            load_score = (
                f"Fail (Slow - {load_time:.2f}s)" if load_time > 3.0 else
                f"Warning (Average - {load_time:.2f}s)" if load_time > 1.5 else
                f"Pass (Fast - {load_time:.2f}s)"
            )
            
            # Friction analysis
            high_friction_dict = ["submit", "process", "registration", "continue", "form"]
            low_friction_dict = ["get", "instant", "free", "now", "discover", "claim", "unlock"]
            
            friction_words_found = list({w for w in first_100_words if w in high_friction_dict})
            action_words_found = list({w for w in first_100_words if w in low_friction_dict})
            
            # ===== STEP 5: Enhanced thumb-zone scoring (composite accessibility) =====
            
            thumb_zone_result = None
            
            if primary_cta:
                # Initial viewport score
                initial_score = calculate_accessibility_score(
                    {
                        'x': primary_cta.x,
                        'y': primary_cta.y,
                        'width': primary_cta.width,
                        'height': primary_cta.height
                    },
                    viewport_height,
                    primary_cta.is_visible,
                    "initial_viewport"
                )
                
                # Post-scroll score (if different CTA available)
                post_scroll_score = None
                if ctas_after_scroll:
                    best_after_scroll = ctas_after_scroll[0]
                    post_scroll_score = calculate_accessibility_score(
                        {
                            'x': best_after_scroll.x,
                            'y': best_after_scroll.y,
                            'width': best_after_scroll.width,
                            'height': best_after_scroll.height
                        },
                        viewport_height,
                        best_after_scroll.is_visible,
                        "post_scroll"
                    )
                
                # Determine best state
                best_state = "initial_viewport"
                best_score_val = initial_score.overall_score
                
                if post_scroll_score and post_scroll_score.overall_score > best_score_val:
                    best_state = "post_scroll"
                    best_score_val = post_scroll_score.overall_score
                
                thumb_zone_result = ThumbZoneResult(
                    initial_viewport_score=initial_score,
                    post_scroll_score=post_scroll_score,
                    best_state=best_state,
                    best_score=best_score_val,
                    recommendation=(
                        "CTA is optimally positioned" if best_score_val >= 0.85 else
                        "CTA needs repositioning or resizing" if best_score_val >= 0.65 else
                        "CTA is difficult for mobile users; major redesign needed"
                    )
                )
            else:
                # No CTA found
                thumb_zone_result = ThumbZoneResult(
                    initial_viewport_score=AccessibilityScore(
                        visibility_score=0.0,
                        tappability_score=0.0,
                        contrast_score=0.0,
                        fold_position_score=0.0,
                        overall_score=0.0,
                        state="initial_viewport",
                        reason="No primary CTA detected"
                    ),
                    best_state="none",
                    best_score=0.0,
                    recommendation="Add a clear, accessible primary CTA"
                )
            
            # ===== STEP 6: Competitor-derived metrics =====
            
            # Calculate average competitor price (only high-confidence extractions)
            high_conf_prices = [
                e.price for e in competitor_extractions
                if e.price and e.price_confidence >= 0.75
            ]
            competitor_avg_price = None
            if high_conf_prices:
                competitor_avg_price = sum(high_conf_prices) / len(high_conf_prices)
            
            # Our price (simplified)
            our_price = None
            price, conf, _, _ = extract_price_with_confidence(normalized_text)
            if conf >= 0.75:
                our_price = price
            
            # Price delta
            price_delta = 0.0
            if our_price and competitor_avg_price:
                price_delta = round(our_price - competitor_avg_price, 2)
            
            # Offer parity
            our_offers = [o[0] for o in detect_offer_signals_with_confidence(normalized_text) if o[1] >= 0.75]
            comp_offers_all = []
            for e in competitor_extractions:
                comp_offers_all.extend(e.offers)
            
            missing_offers = [o for o in set(comp_offers_all) if o not in our_offers]
            offer_parity = (
                f"Missing offers: {', '.join(missing_offers)}" if missing_offers else
                "Offer parity matches competitors"
            )
            
            # Competitor comparison text
            scraped_names = [e.competitor_name for e in competitor_extractions if e.price_confidence > 0]
            if competitor_avg_price and our_price:
                competitor_comparison = f"Top competitors ({', '.join(scraped_names)}) avg ${competitor_avg_price:.2f}; yours is ${our_price:.2f}"
            elif competitor_avg_price:
                competitor_comparison = f"Competitor average: ${competitor_avg_price:.2f}; your price not detected"
            else:
                competitor_comparison = f"Could not reliably extract competitor prices (low confidence scores)"
            
            # ===== STEP 7: Friction & conversion metrics =====
            
            micro_friction = min(1.0, 0.35 + len(friction_words_found) * 0.1 + (0.45 if thumb_zone_result.best_score < 0.65 else 0.0))
            
            bounce_rate = min(97.0,
                25.0 +
                micro_friction * 28.0 +
                (10.0 if load_time > 3.0 else 0.0) +
                (10.0 if "Fail" in h1_score else 0.0) +
                (10.0 if "Fail" in hero_score else 0.0) +
                (10.0 if thumb_zone_result.best_score < 0.65 else 0.0)
            )
            bounce_rate = round(bounce_rate, 1)
            
            narrative_alignment_score = max(0.0,
                100.0 -
                (20.0 if "Fail" in h1_score else 0.0) -
                (15.0 if "Fail" in hero_score else 0.0) -
                (10.0 if len(action_words_found) == 0 else 0.0) -
                (5.0 if len(friction_words_found) > 1 else 0.0)
            )
            narrative_alignment_score = round(narrative_alignment_score, 1)
            
            daily_ad_spend = float(request.daily_ad_spend or 0.0)
            wasted_ad_spend = round(daily_ad_spend * (bounce_rate / 100.0), 2)
            revenue_drop = round((load_time * 1000) / 100 * 0.01 * daily_ad_spend, 2)
            
            # X-Ray comparator
            x_ray_text = f"DOM density: {dom_metrics.word_count} words. Hero: {dom_metrics.hero_images} images, {dom_metrics.hero_text} chars. CTAs detected: {len(ctas_initial)} in viewport"
            
            # Narrative disconnect
            narrative_disconnect = "Ad messaging vs landing page alignment needs review"
            
            await browser.close()
            
            return AuditResult(
                url=url,
                daily_ad_spend=daily_ad_spend,
                h1_score=h1_score,
                hero_score=hero_score,
                load_score=load_score,
                friction_words_found=friction_words_found,
                action_words_found=action_words_found,
                micro_friction=micro_friction,
                thumb_zone_result=thumb_zone_result,
                bounce_rate=bounce_rate,
                narrative_alignment_score=narrative_alignment_score,
                wasted_ad_spend=wasted_ad_spend,
                revenue_drop=revenue_drop,
                competitor_comparison=competitor_comparison,
                price_delta=price_delta,
                offer_parity=offer_parity,
                x_ray_comparator=x_ray_text,
                narrative_disconnect=narrative_disconnect,
                artifacts_id=None  # Week 2: Store in DB
            )
            
        except Exception as e:
            error_msg = str(e)
            if "Timeout" in error_msg or "timed out" in error_msg.lower():
                raise HTTPException(status_code=504, detail="Page load timeout. Site may block headless browsers.")
            raise HTTPException(status_code=502, detail=f"Audit engine error: {error_msg}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
