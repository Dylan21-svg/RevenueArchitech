import time
import re
import asyncio
from typing import Optional, List, Dict
from playwright.async_api import async_playwright
from app.core.supabase import supabase
from app.models.audit import PageFeatures
from app.services.scoring import generate_audit_report
from app.services.issue_generator import generate_issues_and_fixes

async def extract_features(page, url: str) -> PageFeatures:
    """
    Detection Layer: Capture page data and convert to numerical features.
    """
    # 1. Performance
    start_time = time.perf_counter()
    
    # Block heavy resources to speed up analysis
    async def intercept_route(route):
        if route.request.resource_type in ["image", "media", "font", "stylesheet"]:
            await route.abort()
        else:
            await route.continue_()
            
    await page.route("**/*", intercept_route)
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        print(f"Warning: Page load timed out or failed: {e}")
        
    load_time = time.perf_counter() - start_time
    
    # 2. DOM Analysis
    # Get structured semantic context for the LLM
    dom_context = await page.evaluate("""
        () => {
            const getVisibleText = (el) => {
                if (el.offsetWidth <= 0 && el.offsetHeight <= 0) return '';
                return el.innerText.trim();
            };

            const sections = [];
            document.querySelectorAll('section, header, footer, [role="main"]').forEach(el => {
                const text = getVisibleText(el);
                if (text.length > 50) {
                    sections.push({
                        tag: el.tagName,
                        id: el.id || el.className,
                        text: text.substring(0, 500) // Truncate to save tokens
                    });
                }
            });

            const ctas = Array.from(document.querySelectorAll('button, a.btn, a.button'))
                .filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.height > 0 && rect.width > 0;
                })
                .map(el => ({
                    text: el.innerText.trim(),
                    type: el.tagName
                }));

            return {
                title: document.title,
                meta_description: document.querySelector('meta[name="description"]')?.content || '',
                sections: sections.slice(0, 10),
                ctas: ctas.slice(0, 5),
                full_text_preview: document.body.innerText.substring(0, 2000)
            };
        }
    """)
    
    body_text = dom_context['full_text_preview']
    normalized_text = body_text.lower()
    
    # Feature: Offer Clarity (Heuristic: Presence of benefit-oriented words)
    benefit_words = ["save", "best", "exclusive", "free", "get", "unlock", "instant"]
    offer_clarity = sum(1 for w in benefit_words if w in normalized_text) / len(benefit_words)
    
    # Feature: Trust (Heuristic: Review counts, badges)
    trust_patterns = [r"review", r"star", r"guarantee", r"secure", r"safe"]
    trust_density = sum(1 for p in trust_patterns if re.search(p, normalized_text)) / len(trust_patterns)
    
    # Feature: Checkout steps
    checkout_steps = 3 # Default fallback
    if "one-page-checkout" in normalized_text:
        checkout_steps = 1
        
    # Feature: Payment options
    payments = ["visa", "mastercard", "paypal", "apple pay", "google pay", "stripe"]
    payment_count = sum(1 for p in payments if p in normalized_text)
    
    # Feature: CTA Visibility (Heuristic: Buttons in first viewport)
    cta_count = len(dom_context['ctas'])
    
    # Friction Calculation
    high_friction = ["submit", "process", "registration", "sign-up", "register"]
    friction_count = sum(1 for w in high_friction if w in normalized_text[:1000])
    bounce_rate = round(min(95.0, 20.0 + (friction_count * 5) + (load_time * 5)), 1)

    features = PageFeatures(
        offer_clarity=clamp(offer_clarity),
        value_proposition_strength=clamp(offer_clarity * 1.1),
        trust_signal_density=clamp(trust_density),
        cta_visibility=clamp(cta_count / 3),
        checkout_steps=checkout_steps,
        payment_option_count=payment_count,
        local_currency_present=True,
        load_time=load_time,
        bounce_rate=bounce_rate,
        page_density=0.5
    )
    
    return features, dom_context

def clamp(v: float) -> float:
    return max(0.0, min(1.0, v))

async def run_background_audit(audit_id: str, url: str, niche: str, daily_ad_spend: float):
    """
    Main Pipeline Orchestrator
    """
    print(f"Starting Engine for Audit {audit_id}")
    try:
        supabase.table("audits").update({"status": "running"}).eq("id", audit_id).execute()
        
        if not url.startswith("http"):
            url = "https://" + url

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            # Mobile-first detection
            iphone_13 = p.devices['iPhone 13']
            context = await browser.new_context(**iphone_13)
            page = await context.new_page()
            
            # 1. Detection Layer
            features, context = await extract_features(page, url)
            
            await browser.close()
            
            # 2. Interpretation & Scoring Layer
            report = generate_audit_report(audit_id, features, daily_ad_spend)
            
            # 3. Fix Generation Layer
            top_fixes = generate_issues_and_fixes(features, daily_ad_spend, context)
            report.top_fixes = top_fixes
            
            # 4. Persistence Layer
            final_data = {
                "status": "complete",
                "score": report.leak_score,
                "summary": report.primary_bottleneck,
                "estimated_wasted_ad_spend": report.estimated_impact.get("wasted_daily_spend", 0.0),
                "trust_score": report.category_scores.get("trust", 0.0),
                "page_density": features.page_density,
                "report": report.dict(), # Enabled: Saving fixes to DB
                "completed_at": "now()" # Supabase helper
            }
            
            supabase.table("audits").update(final_data).eq("id", audit_id).execute()
            print(f"Audit {audit_id} Finalized. Leak Score: {report.leak_score}")
            
    except Exception as e:
        print(f"Audit {audit_id} Failed: {e}")
        supabase.table("audits").update({"status": "failed"}).eq("id", audit_id).execute()
