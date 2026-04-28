from app.models.audit import PageFeatures, Issue, Fix, AuditReport
from typing import List, Dict

def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))

def calculate_checkout_score(f: PageFeatures) -> float:
    """Score from 0 to 1 based on checkout friction."""
    s = 1.0
    # Steps: 1-2 is ideal, >3 is friction
    s -= 0.18 * clamp((f.checkout_steps - 1) / 4)
    # Payment options: <3 is friction
    s -= 0.12 * clamp(1 - f.payment_option_count / 5)
    # Currency
    s += 0.10 if f.local_currency_present else -0.05
    return clamp(s)

def generate_audit_report(audit_id: str, f: PageFeatures, daily_ad_spend: float) -> AuditReport:
    """
    Implements the Mathematical Scoring Layer:
    overall_health = sum(w_i * s_i)
    leak_score = 100 * (1 - overall_health)
    """
    
    # 1. Calculate Category Scores (0..1)
    offer_score = clamp((f.offer_clarity + f.value_proposition_strength) / 2)
    trust_score = clamp(f.trust_signal_density)
    structure_score = clamp((f.cta_visibility + f.branding_consistency + (1 - f.page_density)) / 3)
    checkout_score = calculate_checkout_score(f)
    recovery_score = clamp(f.recovery_flow_presence)
    
    # 2. Weighted Aggregation
    # Weights based on CRO impact importance
    weights = {
        "offer": 0.22,
        "trust": 0.26,
        "structure": 0.18,
        "checkout": 0.20,
        "recovery": 0.14
    }
    
    overall_health = (
        weights["offer"] * offer_score +
        weights["trust"] * trust_score +
        weights["structure"] * structure_score +
        weights["checkout"] * checkout_score +
        weights["recovery"] * recovery_score
    )
    
    leak_score = int(round((1 - overall_health) * 100))
    
    # 3. Identify Primary Bottleneck
    scores = {
        "offer": offer_score,
        "trust": trust_score,
        "structure": structure_score,
        "checkout": checkout_score,
        "recovery": recovery_score
    }
    
    # Bottleneck is the category with the lowest score
    primary_bottleneck = min(scores, key=scores.get)
    
    # 4. Revenue Impact Estimation
    # Simple wasted spend based on daily ad spend and bounce rate
    estimated_wasted_spend = daily_ad_spend * (f.bounce_rate / 100.0)
    
    # CVR Lift Estimation (Heuristic: 10% of the leak score as potential lift)
    estimated_cvr_lift = (leak_score / 1000.0) 
    
    report = AuditReport(
        audit_id=audit_id,
        leak_score=leak_score,
        primary_bottleneck=primary_bottleneck,
        category_scores=scores,
        estimated_impact={
            "wasted_daily_spend": round(estimated_wasted_spend, 2),
            "potential_cvr_lift": round(estimated_cvr_lift, 3)
        }
    )
    
    return report
