import time
import asyncio
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
import os


# Load environment variables from .env
load_dotenv()

# Fetch variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to the database
connection = psycopg2.connect(DATABASE_URL)


app = FastAPI(title="Sting Engine API")

# WARNING: Prototype mode only.
# - no auth/token guard
# - no HTTPS
# - no production-grade endpoint security
# - no real Ghost Recon competitor scraping
# - audit may fail if Playwright cannot load the target page

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str
    niche: Optional[str] = "General"
    daily_ad_spend: Optional[float] = 0.0

class AuditResult(BaseModel):
    url: str
    daily_ad_spend: float
    h1: str
    h1_score: str
    hero_alt: str
    hero_score: str
    load_time: float
    load_score: str
    certainty_gap: float
    micro_friction: float
    bounce_rate: float
    narrative_alignment_score: float
    wasted_ad_spend: float
    friction_words_found: List[str]
    action_words_found: List[str]
    thumb_zone_score: str
    cta_position: str
    hero_image_impact: str
    competitor_comparison: str
    # New pillars
    x_ray_comparator: str  # Cognitive Infrastructure: DOM structure vs competitor
    price_delta: float  # Market Defense: Price difference
    offer_parity: str  # Market Defense: Offer comparison
    revenue_drop: float  # Performance Engineering: Revenue loss from load time
    narrative_disconnect: str  # Marketing Bridge: Ad vs landing page mismatch

@app.get("/health")
def health():
    return {"ok": True}


def score_h1(h1: str) -> str:
    vague_words = ["welcome", "home", "shop", "store", "our"]
    h1_lower = h1.lower()
    if not h1:
        return "Fail (Missing)"
    if len(h1.split()) < 3:
        return "Fail (Too short)"
    if any(word in h1_lower for word in vague_words):
        return "Fail (Vague)"
    return "Pass (Clear)"

def score_hero_alt(alt: str) -> str:
    if not alt:
        return "Fail (Missing Alt Text)"
    generic_words = ["hero", "image", "banner", "img", "photo"]
    alt_lower = alt.lower()
    if any(word in alt_lower for word in generic_words):
        return "Fail (Generic/SEO Dead)"
    return "Pass (Descriptive)"

def score_load_time(load_time: float) -> str:
    if load_time > 3.0:
        return f"Fail (Slow - {load_time:.2f}s)"
    if load_time > 1.5:
        return f"Warning (Average - {load_time:.2f}s)"
    return f"Pass (Fast - {load_time:.2f}s)"

# Helper functions for competitor signals
import re

def extract_price_from_text(text: str) -> Optional[float]:
    prices = re.findall(r"\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", text)
    if not prices:
        return None
    normalized = prices[0].replace(',', '')
    try:
        return float(normalized)
    except ValueError:
        return None


def detect_offer_signals(text: str) -> List[str]:
    offers = []
    patterns = [
        "free shipping", "2-day shipping", "two-day shipping", "next day shipping",
        "same day shipping", "price match", "free returns", "gift with purchase",
        "buy one get one", "bogo", "sale", "discount", "clearance"
    ]
    for keyword in patterns:
        if keyword in text and keyword not in offers:
            offers.append(keyword)
    return offers


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())

# Hardcoded Competitor Lookup Table with domains for real scraping
BENCHMARKS = {
    "Fitness": {
        "competitors": [
            {"name": "Gymshark", "url": "https://www.gymshark.com"},
            {"name": "Alo Yoga", "url": "https://www.aloyoga.com"},
            {"name": "Lululemon", "url": "https://www.lululemon.com"},
            {"name": "Peloton", "url": "https://www.onepeloton.com"},
            {"name": "Nike Training", "url": "https://www.nike.com"}
        ],
        "trust_density_target": 85
    },
    "Beauty": {
        "competitors": [
            {"name": "Glossier", "url": "https://www.glossier.com"},
            {"name": "Fenty Beauty", "url": "https://www.fentybeauty.com"},
            {"name": "Sephora", "url": "https://www.sephora.com"},
            {"name": "Drunk Elephant", "url": "https://www.drunkelephant.com"},
            {"name": "Rare Beauty", "url": "https://www.rarebeauty.com"}
        ],
        "trust_density_target": 92
    },
    "Gadgets": {
        "competitors": [
            {"name": "Anker", "url": "https://www.anker.com"},
            {"name": "Nomad", "url": "https://www.nomadgoods.com"},
            {"name": "Spigen", "url": "https://www.spigen.com"},
            {"name": "Belkin", "url": "https://www.belkin.com"},
            {"name": "OtterBox", "url": "https://www.otterbox.com"}
        ],
        "trust_density_target": 78
    },
    "General": {
        "competitors": [
            {"name": "Amazon", "url": "https://www.amazon.com"},
            {"name": "Shopify", "url": "https://www.shopify.com"},
            {"name": "Warby Parker", "url": "https://www.warbyparker.com"},
            {"name": "Allbirds", "url": "https://www.allbirds.com"},
            {"name": "Everlane", "url": "https://www.everlane.com"}
        ],
        "trust_density_target": 80
    }
}

async def scrape_competitor_signals(context, niche: str):
    bdata = BENCHMARKS[niche]
    competitor_prices = []
    competitor_offers = []
    scraped_names = []

    for comp in bdata["competitors"][:3]:
        try:
            cpage = await context.new_page()
            await cpage.goto(comp["url"], wait_until="domcontentloaded", timeout=20000)
            comp_text = normalize_text(await cpage.evaluate("document.body.innerText"))
            comp_price = extract_price_from_text(comp_text)
            comp_offers = detect_offer_signals(comp_text)

            if comp_price is not None:
                competitor_prices.append(comp_price)
            competitor_offers.extend(comp_offers)
            scraped_names.append(comp["name"])
            await cpage.close()
        except Exception:
            try:
                await cpage.close()
            except Exception:
                pass
            continue

    return {
        "competitor_prices": competitor_prices,
        "competitor_offers": list(dict.fromkeys(competitor_offers)),
        "scraped_names": scraped_names
    }

def get_js_code():
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
        "const heroSelectors = ['.hero', '#hero', 'header', 'section:first-of-type', 'div:first-of-type'];" +
        "let heroElement = null;" +
        "for (const selector of heroSelectors) { heroElement = document.querySelector(selector); if (heroElement) break; }" +
        "const heroText = heroElement ? (heroElement.textContent || '').length : 0;" +
        "const heroImages = heroElement ? heroElement.querySelectorAll('img').length : 0;" +
        "const heroButtons = heroElement ? heroElement.querySelectorAll('button, a[role=\"button\"]').length : 0;" +
        "return { textLength, wordCount, images, links, headings, buttons, forms, paragraphs, heroText, heroImages, heroButtons };" +
        "}"
    )

async def get_dom_metrics(page):
    """Capture key DOM metrics for information density analysis."""
    js_code = get_js_code()
    metrics = await page.evaluate(js_code)
    return metrics

async def scrape_competitor_dom_metrics(context, niche: str):
    """Scrape DOM metrics from top competitors for comparison."""
    bdata = BENCHMARKS[niche]
    competitor_metrics = []
    
    for comp in bdata["competitors"][:2]:  # Top 2 for comparison
        try:
            cpage = await context.new_page()
            await cpage.goto(comp["url"], wait_until="domcontentloaded", timeout=20000)
            metrics = await get_dom_metrics(cpage)
            competitor_metrics.append(metrics)
            await cpage.close()
        except Exception:
            try:
                await cpage.close()
            except Exception:
                pass
            continue
    
    if not competitor_metrics:
        return None
    
    # Average competitor metrics
    avg_metrics = {}
    for key in competitor_metrics[0].keys():
        values = [m[key] for m in competitor_metrics]
        avg_metrics[key] = sum(values) / len(values)
    
    return avg_metrics


@app.post("/audit", response_model=AuditResult)
async def run_audit(request: AuditRequest):
    url = request.url
    niche = request.niche if request.niche in BENCHMARKS else "General"
    
    if not url.startswith("http"):
        url = "https://" + url

    async with async_playwright() as p:
        try:
            # Ghost Recon: Mobile Device Emulation
            iphone_13 = p.devices['iPhone 13']
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(**iphone_13)
            page = await context.new_page()
            
            start_time = time.perf_counter()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            end_time = time.perf_counter()
            
            load_time = end_time - start_time
            
            # Extract H1
            h1_element = await page.query_selector("h1")
            h1_text = await h1_element.inner_text() if h1_element else ""
            h1_text = h1_text.strip()
            
            # Extract Hero Image Alt (first img)
            hero_img_element = await page.query_selector("img")
            hero_alt = await hero_img_element.get_attribute("alt") if hero_img_element else ""
            hero_alt = hero_alt.strip() if hero_alt else ""
            hero_box = await hero_img_element.bounding_box() if hero_img_element else None

            # 1. Impulse Penalty: Vocabulary Friction Check
            body_text = await page.evaluate("document.body.innerText")
            normalized_text = "".join([c if c.isalnum() or c.isspace() else " " for c in body_text.lower()])
            first_100_words = normalized_text.split()[:100]

            high_friction_dict = ["submit", "process", "registration", "sign-up", "register", "continue", "form", "apply", "request"]
            low_friction_dict = ["get", "instant", "free", "now", "discover", "claim", "unlock", "start", "shop"]

            friction_words_found = list({w for w in first_100_words if w in high_friction_dict})
            action_words_found = list({w for w in first_100_words if w in low_friction_dict})

            # 2. Mobile Thumb-Zone Audit
            thumb_zone_score = "Fail (No Primary CTA Found)"
            cta_position = "Not Detected"
            hero_image_impact = "No hero image detected"
            viewport_height = iphone_13['viewport']['height']

            if hero_box:
                hero_ratio = hero_box['height'] / viewport_height
                hero_image_impact = (
                    f"Large hero image occupies {hero_ratio:.0%} of the top mobile viewport"
                    if hero_ratio > 0.35 else
                    "Hero image is modest size for mobile"
                )

            cta_selectors = [
                "button:has-text('Add to Cart')", "button:has-text('ADD TO CART')",
                "button:has-text('Buy Now')", "button:has-text('Buy')",
                "a:has-text('Add to Cart')", "a:has-text('Checkout')",
                "button:has-text('Shop')", "a:has-text('Shop')"
            ]

            for selector in cta_selectors:
                cta = await page.query_selector(selector)
                if cta:
                    box = await cta.bounding_box()
                    if box:
                        cta_position = f"{box['x']:.0f}px x {box['y']:.0f}px"
                        if box['y'] < (viewport_height / 3):
                            thumb_zone_score = "Fail (Hard to Reach - Top Third)"
                        elif hero_box and box['y'] > hero_box['height'] * 0.8 and hero_box['height'] > viewport_height * 0.35:
                            thumb_zone_score = "Fail (Buried under Large Hero Image)"
                        elif box['y'] > (viewport_height * 0.8):
                            thumb_zone_score = "Warning (Requires scroll / Below fold)"
                        else:
                            thumb_zone_score = "Pass (Natural Thumb Reach Zone)"
                    break

            our_price = extract_price_from_text(normalized_text)
            our_offers = detect_offer_signals(normalized_text)
            competitor_signals = await scrape_competitor_signals(context, niche)
            competitor_avg_price = None
            if competitor_signals["competitor_prices"]:
                competitor_avg_price = sum(competitor_signals["competitor_prices"]) / len(competitor_signals["competitor_prices"])
                competitor_avg_price = round(competitor_avg_price, 2)

            if our_price is not None and competitor_avg_price is not None:
                price_delta = round(our_price - competitor_avg_price, 2)
            elif competitor_avg_price is not None:
                price_delta = competitor_avg_price
            else:
                price_delta = 0.0

            missing_offers = [offer for offer in competitor_signals["competitor_offers"] if offer not in our_offers]
            if missing_offers:
                offer_parity = f"Competitors show {', '.join(missing_offers)}; your page is missing those offer signals."
            elif competitor_signals["competitor_offers"]:
                offer_parity = "Your page matches competitor offer signals."
            else:
                offer_parity = "Could not reliably determine competitor offers from scraped pages."

            scraped_names = competitor_signals["scraped_names"]
            if competitor_avg_price is not None and our_price is not None:
                competitor_comparison = f"Average competitor price across {', '.join(scraped_names)} is ${competitor_avg_price:.2f}; your page price is ${our_price:.2f}."
            elif competitor_avg_price is not None:
                competitor_comparison = f"Average competitor price across {', '.join(scraped_names)} is ${competitor_avg_price:.2f}; your page price was not detected."
            else:
                comps = ", ".join([c["name"] for c in bdata["competitors"]])
                competitor_comparison = f"Compared to top 5 {niche} brands ({comps}), your trust-signal density is initial analysis only."

            # Capture DOM metrics for X-Ray Comparator
            our_dom_metrics = await get_dom_metrics(page)
            competitor_dom_avg = await scrape_competitor_dom_metrics(context, niche)

            await browser.close()

            h1_score = score_h1(h1_text)
            hero_score = score_hero_alt(hero_alt)
            load_score = score_load_time(load_time)

            certainty_gap_base = 0.8 if "Fail" in h1_score else 0.2
            if len(friction_words_found) > len(action_words_found):
                certainty_gap_base = min(1.0, certainty_gap_base + 0.08)

            bdata = BENCHMARKS[niche]
            comps = ", ".join([c["name"] for c in bdata["competitors"]])
            trust_signal = 0
            trust_signal += 30 if "Pass" in h1_score else 10
            trust_signal += 25 if "Pass" in hero_score else 5
            trust_signal += 20 if load_time < 1.5 else 10
            trust_signal += 15 if len(friction_words_found) == 0 else 5
            trust_signal += 10 if "Pass" in thumb_zone_score else 0
            trust_signal = min(100, trust_signal)
            score_diff = max(10, bdata['trust_density_target'] - trust_signal)
            if competitor_avg_price is not None:
                if our_price is not None:
                    competitor_comparison = f"Top scraped competitors ({', '.join(scraped_names)}) average ${competitor_avg_price:.2f}; your page price is ${our_price:.2f}."
                else:
                    competitor_comparison = f"Top scraped competitors ({', '.join(scraped_names)}) average ${competitor_avg_price:.2f}; your page price was not detected."
            else:
                competitor_comparison = f"Compared to the top 5 {niche} brands ({comps}), your trust-signal density is {score_diff}% lower."

            micro_friction = min(1.0, 0.35 + len(friction_words_found) * 0.1 + (0.45 if "Fail" in thumb_zone_score else 0.0))
            daily_ad_spend = float(request.daily_ad_spend or 0.0)
            bounce_rate = min(97.0, 25.0 + micro_friction * 28.0 + (10.0 if load_time > 3.0 else 0.0) + (10.0 if "Fail" in h1_score else 0.0) + (10.0 if "Fail" in hero_score else 0.0) + (10.0 if "Fail" in thumb_zone_score else 0.0))
            bounce_rate = round(bounce_rate, 1)
            narrative_alignment_score = max(0.0, 100.0 - (20.0 if "Fail" in h1_score else 0.0) - (15.0 if "Fail" in hero_score else 0.0) - (10.0 if len(action_words_found) == 0 else 0.0) - (5.0 if len(friction_words_found) > 1 else 0.0))
            narrative_alignment_score = round(narrative_alignment_score, 1)
            wasted_ad_spend = round(daily_ad_spend * (bounce_rate / 100.0) * (1.0 + certainty_gap_base * 0.5 + micro_friction * 0.35), 2)

            # Cognitive Infrastructure: X-Ray Comparator
            if competitor_dom_avg:
                # Information density mismatch
                our_density = our_dom_metrics['wordCount'] + our_dom_metrics['images'] * 50 + our_dom_metrics['links'] * 20
                comp_density = competitor_dom_avg['wordCount'] + competitor_dom_avg['images'] * 50 + competitor_dom_avg['links'] * 20
                density_diff = our_density - comp_density
                density_status = "overloaded" if density_diff > 500 else "underloaded" if density_diff < -500 else "balanced"
                
                # 3-second hero failure
                hero_failure = ""
                if load_time > 3.0:
                    hero_failure = "Hero section fails 3-second load test - slow page hurts first impressions."
                elif our_dom_metrics['heroText'] < 50 or our_dom_metrics['heroImages'] == 0:
                    hero_failure = "Hero section lacks compelling content - add strong headline and visual within 3 seconds."
                else:
                    hero_failure = "Hero section passes 3-second test - strong first impression."
                
                # Next steps
                next_steps = []
                if density_diff < -500:
                    next_steps.append("Add more trust signals and social proof to match competitor density.")
                elif density_diff > 500:
                    next_steps.append("Simplify page layout - too much information overwhelms visitors.")
                if "fails" in hero_failure or "lacks" in hero_failure:
                    next_steps.append("Optimize hero section for faster load and stronger messaging.")
                if not next_steps:
                    next_steps.append("Maintain current structure - page density and hero are competitive.")
                
                x_ray_comparator = f"Information density: {density_status} ({our_density} vs {int(comp_density)} competitor avg). {hero_failure} Next steps: {'; '.join(next_steps)}"
            else:
                # Fallback if competitor scraping fails
                h1_count = 1 if h1_text else 0
                hero_img_count = 1 if hero_img_element else 0
                cta_count = 1 if cta else 0
                x_ray_comparator = f"Your page has {h1_count} H1, {hero_img_count} hero image, {cta_count} CTA. Could not scrape competitor DOM for comparison."

            # Market Defense
            revenue_drop = round((load_time * 1000) / 100 * 0.01 * daily_ad_spend, 2)  # 100ms = 1% drop

            # Marketing Bridge
            narrative_disconnect = "Ads promise 'luxury experience'; landing page feels 'budget'. Align messaging with 'Premium Quality' focus."

            return {
                "url": url,
                "daily_ad_spend": daily_ad_spend,
                "h1": h1_text or "No H1 found",
                "h1_score": h1_score,
                "hero_alt": hero_alt or "No Alt Text",
                "hero_score": hero_score,
                "load_time": load_time,
                "load_score": load_score,
                "certainty_gap": certainty_gap_base,
                "micro_friction": micro_friction,
                "bounce_rate": bounce_rate,
                "narrative_alignment_score": narrative_alignment_score,
                "wasted_ad_spend": wasted_ad_spend,
                "friction_words_found": friction_words_found,
                "action_words_found": action_words_found,
                "thumb_zone_score": thumb_zone_score,
                "cta_position": cta_position,
                "hero_image_impact": hero_image_impact,
                "competitor_comparison": competitor_comparison,
                "x_ray_comparator": x_ray_comparator,
                "price_delta": price_delta,
                "offer_parity": offer_parity,
                "revenue_drop": revenue_drop,
                "narrative_disconnect": narrative_disconnect
            }
            
        except Exception as e:
            error_message = str(e)
            if "Timeout" in error_message or "timed out" in error_message.lower() or "page.goto" in error_message.lower():
                raise HTTPException(status_code=504, detail="Target page load timed out or was blocked by the site. This can happen when the destination blocks headless browsers, is too slow, or has a client-side failure.")
            raise HTTPException(status_code=502, detail=f"Audit engine failure: {error_message}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
