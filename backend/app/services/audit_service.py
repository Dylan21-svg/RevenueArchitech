import time
import asyncio
import re
from typing import Optional, List
from playwright.async_api import async_playwright
from app.core.supabase import supabase

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

BENCHMARKS = {
    "Fitness": {"competitors": [{"name": "Gymshark", "url": "https://www.gymshark.com"}], "trust_density_target": 85},
    "Beauty": {"competitors": [{"name": "Glossier", "url": "https://www.glossier.com"}], "trust_density_target": 92},
    "Gadgets": {"competitors": [{"name": "Anker", "url": "https://www.anker.com"}], "trust_density_target": 78},
    "General": {"competitors": [{"name": "Amazon", "url": "https://www.amazon.com"}], "trust_density_target": 80}
}

async def scrape_competitor_signals(context, niche: str):
    bdata = BENCHMARKS.get(niche, BENCHMARKS["General"])
    competitor_prices = []
    competitor_offers = []
    scraped_names = []

    for comp in bdata["competitors"][:1]: # Reduced for speed in background task
        try:
            cpage = await context.new_page()
            await cpage.goto(comp["url"], wait_until="domcontentloaded", timeout=15000)
            comp_text = normalize_text(await cpage.evaluate("document.body.innerText"))
            comp_price = extract_price_from_text(comp_text)
            comp_offers = detect_offer_signals(comp_text)

            if comp_price is not None:
                competitor_prices.append(comp_price)
            competitor_offers.extend(comp_offers)
            scraped_names.append(comp["name"])
            await cpage.close()
        except Exception:
            try: await cpage.close()
            except: pass
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
        "const wordCount = textContent.split(/\\s+/).filter(word => word.length > 0).length;" +
        "const heroSelectors = ['.hero', '#hero', 'header', 'section:first-of-type', 'div:first-of-type'];" +
        "let heroElement = null;" +
        "for (const selector of heroSelectors) { heroElement = document.querySelector(selector); if (heroElement) break; }" +
        "const heroImages = heroElement ? heroElement.querySelectorAll('img').length : 0;" +
        "return { wordCount, images, links, headings, heroImages };" +
        "}"
    )

async def run_background_audit(audit_id: str, url: str, niche: str, daily_ad_spend: float):
    print(f"Starting background audit for {audit_id} - {url}")
    try:
        supabase.table("audits").update({"status": "processing"}).eq("id", audit_id).execute()
        if not url.startswith("http"):
            url = "https://" + url

        async with async_playwright() as p:
            iphone_13 = p.devices['iPhone 13']
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(**iphone_13)
            page = await context.new_page()
            
            start_time = time.perf_counter()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            load_time = time.perf_counter() - start_time
            
            # Simple metrics extraction based on your prototype
            h1_element = await page.query_selector("h1")
            h1_text = (await h1_element.inner_text()).strip() if h1_element else ""
            hero_img_element = await page.query_selector("img")
            hero_alt = (await hero_img_element.get_attribute("alt")).strip() if hero_img_element and await hero_img_element.get_attribute("alt") else ""
            
            body_text = await page.evaluate("document.body.innerText")
            normalized_text = "".join([c if c.isalnum() or c.isspace() else " " for c in body_text.lower()])
            first_100_words = normalized_text.split()[:100]

            high_friction = ["submit", "process", "registration", "sign-up", "register", "continue", "form", "apply"]
            low_friction = ["get", "instant", "free", "now", "discover", "claim", "unlock", "start", "shop"]
            friction_words = list({w for w in first_100_words if w in high_friction})
            action_words = list({w for w in first_100_words if w in low_friction})

            # Calculate scores
            bounce_rate = round(min(97.0, 25.0 + len(friction_words)*2 + (10.0 if load_time > 3.0 else 0.0)), 1)
            wasted_ad_spend = round(daily_ad_spend * (bounce_rate / 100.0), 2)
            revenue_drop = round((load_time * 1000) / 100 * 0.01 * daily_ad_spend, 2)
            
            await browser.close()

            result = {
                "status": "completed",
                "h1": h1_text,
                "h1_score": score_h1(h1_text),
                "hero_alt": hero_alt,
                "hero_score": score_hero_alt(hero_alt),
                "load_time": load_time,
                "load_score": score_load_time(load_time),
                "bounce_rate": bounce_rate,
                "wasted_ad_spend": wasted_ad_spend,
                "revenue_drop": revenue_drop,
                # Depending on what your schema requires, you may need to dump friction_words as JSON
            }
            
            # Update the DB
            supabase.table("audits").update(result).eq("id", audit_id).execute()
            print(f"Audit {audit_id} completed successfully.")
            
    except Exception as e:
        print(f"Audit {audit_id} failed: {e}")
        supabase.table("audits").update({
            "status": "failed",
            # if you have an error column you can save it: "error_message": str(e)
        }).eq("id", audit_id).execute()
