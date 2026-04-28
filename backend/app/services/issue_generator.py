from typing import List, Dict, Any
import json
from openai import OpenAI
from app.models.audit import PageFeatures, Fix
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_issues_and_fixes(f: PageFeatures, daily_ad_spend: float, context: Dict[str, Any]) -> List[Fix]:
    """
    Interpretation Layer: Uses OpenAI to analyze page context and generate structured fixes.
    """
    if not settings.OPENAI_API_KEY:
        print("Warning: OPENAI_API_KEY not set. Using fallback heuristics.")
        return fallback_heuristics(f)

    prompt = f"""
    You are an expert Conversion Rate Optimization (CRO) consultant. 
    Analyze the following Shopify store data and identify the top 3-5 conversion 'leaks'.
    
    STORE CONTEXT:
    - Title: {context.get('title')}
    - Description: {context.get('meta_description')}
    - Daily Ad Spend: ${daily_ad_spend}
    
    KEY METRICS:
    - Estimated Bounce Rate: {f.bounce_rate}%
    - Page Load Time: {f.load_time:.2f}s
    - Payment Options Count: {f.payment_option_count}
    - Checkout Steps: {f.checkout_steps}
    
    PAGE SECTIONS (Truncated):
    {json.dumps(context.get('sections', []), indent=2)}
    
    CALLS TO ACTION (CTAs):
    {json.dumps(context.get('ctas', []), indent=2)}
    
    VISIBLE TEXT PREVIEW:
    {context.get('full_text_preview')}

    GOAL: Identify critical issues that are causing visitors to drop off.
    For each issue, provide a suggested fix, the expected CVR lift (as a float between 0.0 and 1.0), 
    the confidence level (0.0 to 1.0), and a deployment mode (auto-fix, copy/paste, manual).
    Also calculate a 'priority' score (0.0 to 4.0) based on severity and impact.
    """

    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a world-class CRO auditor. Return exactly 3-5 high-impact fixes in JSON format."},
                {"role": "user", "content": prompt},
            ],
            response_format=List[Fix],
        )
        
        fixes = completion.choices[0].message.parsed
        # Sort by priority
        return sorted(fixes, key=lambda x: x.priority, reverse=True)
        
    except Exception as e:
        print(f"LLM Audit Failed: {e}. Falling back to heuristics.")
        return fallback_heuristics(f)

def fallback_heuristics(f: PageFeatures) -> List[Fix]:
    """Simple fallback logic if LLM fails."""
    fixes = []
    if f.offer_clarity < 0.6:
        fixes.append(Fix(
            issue_category="offer",
            title="Vague Value Proposition",
            problem_description="The hero section lacks a clear benefit-driven headline.",
            why_it_hurts_conversion="Users leave within 3 seconds if they don't understand the value.",
            suggested_fix="Rewrite H1 to follow: [Benefit] for [Audience] using [Mechanism].",
            expected_metric_improvement=0.12,
            confidence=0.9,
            deployment_mode="copy/paste",
            supporting_evidence=["Low benefit-word density detected in hero."],
            priority=3.5
        ))
    if f.trust_signal_density < 0.5:
        fixes.append(Fix(
            issue_category="trust",
            title="Weak Social Proof",
            problem_description="Insufficient trust signals (reviews, badges) above the fold.",
            why_it_hurts_conversion="Anonymity breeds friction. Trust is the baseline for conversion.",
            suggested_fix="Add a '4.8/5 Star' review summary directly under the main CTA.",
            expected_metric_improvement=0.08,
            confidence=0.95,
            deployment_mode="auto-fix",
            supporting_evidence=["No trust-badge patterns found in initial viewport."],
            priority=3.0
        ))
    return sorted(fixes, key=lambda x: x.priority, reverse=True)
