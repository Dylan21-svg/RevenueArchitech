# Product Requirements Document (PRD): RevenueArchitect AI

## 1. Product Vision & Goal
**RevenueArchitect AI** is a Conversion-as-a-Service (CaaS) platform for Shopify merchants. It moves beyond traditional "button color" CRO and vanity metrics. Instead, it identifies exact revenue leaks, explains the psychological and structural friction causing them, and recommends or safely deploys fixes that directly improve **Revenue Per Visitor (RPV)**, **Profit Per Visitor (PPV)**, and **Average Order Value (AOV)**.

**Core Promise:** "Find the exact revenue leaks on your Shopify store, then fix them with one-click recommendations."

## 2. Target Audience
- **Shopify Store Owners:** Under immense pressure to grow margins without simply increasing ad spend.
- **Growth Marketers / CRO Specialists:** Need faster audits and prioritized, high-leverage action items.
- **Ecommerce Agencies:** Looking for a repeatable, professional diagnostic tool to land retainers and prove value.

## 3. Product Principles
1. **Diagnose Business Pain, Not Just UI:** Every finding must tie to a business metric (RPV, AOV, Conversion Rate).
2. **Actionable Clarity:** Prefer blunt, clear language over generic CRO jargon.
3. **Speed to Value:** The first result must feel immediate and hyper-specific.
4. **Safe Automation:** Only auto-fix what is 100% safe (CSS, simple settings). Provide copy/paste or manual guides for the rest.
5. **The Tunnel Experience:** Prioritize frictionless auditing over standard signup walls ("Ghost Accounts").

## 4. The 5 Analysis Engines
The platform runs a mobile-first audit evaluating the storefront across five core dimensions:

| Module | What it Detects | Primary Metric Impact | Action Mode |
| :--- | :--- | :--- | :--- |
| **1. Offer Engine** | Weak price framing, lack of bundles, missing guarantees, fake/weak urgency, unclear value proposition. | RPV, AOV, Conversion Rate | Auto-suggest frameworks & templates. |
| **2. Trust Engine** | Missing reviews, hidden shipping/refund policies, lack of objection handling, missing User Generated Content (UGC). | Conversion Rate, Checkout Completion | Auto-suggest first, auto-deploy (UI injects) later. |
| **3. Page Engine** | Slow load times, poor visual hierarchy, buried CTAs, inconsistent typography/branding, dense text blocks, low-res visuals. | Add-to-Cart Rate, Bounce Rate | Auto-suggest + optional Shopify-safe CSS auto-fixes. |
| **4. Checkout Engine** | Multi-click cart flows, missing drawer cart, hidden shipping costs, missing payment badges, lack of local currency detection. | Reach Checkout Rate, Checkout Completion | Auto-suggest + limited safe theme config fixes. |
| **5. Recovery Engine** | Cart abandonment flow status, lack of post-purchase upsell/downsell structure. | Recovered Revenue, LTV, AOV | Suggest automated flows; integrate with Klaviyo/SMS tools. |

## 5. Core User Journey: The Diagnostic Tunnel
1. **The Hook:** User lands on the homepage and enters their Shopify URL. No signup required.
2. **The Scan:** Platform runs a simulated, mobile-first scan. UI shows a compelling animation (checking Offer, Trust, Speed).
3. **The Reveal (Leak Summary):** User is presented with a high-level "Revenue Leak Score" and their #1 biggest bottleneck (e.g., "Your buried CTA and lack of shipping clarity is costing an estimated $3,400/mo").
4. **The Handshake:** To view the full list of fixes and deploy them, the user authorizes via a frictionless Shopify OAuth one-click login.
5. **The Fix Workspace:** User reviews the Top 3 recommended fixes, complete with "Why it hurts", "Expected Impact", and "Deployment Method" (Auto-fix, Copy/Paste, or Guide).

## 6. MVP Scope vs. Future Deferrals

**In Scope for MVP:**
- URL audit input with the "Ghost Account" tunnel flow.
- Mobile-first scraping and analysis of the public storefront.
- Implementation of the **Page Engine** and **Trust Engine** scoring logic (highest accuracy for MVP).
- Basic **Offer Engine** manual questionnaire or lightweight scraping (e.g., detecting missing bundle apps).
- Top 3 prioritized fix recommendations per audit.
- Clean dashboard with audit history.
- One-click export of fixes/reports.

**Deferred for Post-MVP:**
- Automated theme surgery (modifying Liquid files directly).
- Complex competitor benchmarking.
- Deep A/B testing framework.
- Multi-channel marketing attribution.
- Deep Shopify backend integrations (reading historical order data) – keep MVP focused on public storefront analysis.

## 7. Data & Entity Model (High-Level)
- **Store:** URL, Industry, Estimated Traffic, Connected Status.
- **Audit:** Timestamp, Device Type, Overall Score, Processing Status.
- **Detected Issue:** Category (Engine), Severity, Confidence Score, Explanation, Metric Impact.
- **Recommended Fix:** Fix Type (Auto/Manual), Code Snippet / Guide, Status (Applied/Pending).

## 8. Success Metrics (KPIs)
- **Tunnel Conversion:** % of users who enter a URL that complete the Shopify OAuth handshake.
- **Action Rate:** % of recommended fixes that are marked as "Applied" or "Exported".
- **Time to Value:** Average time from landing on the homepage to viewing the first recommended fix.
- **Impact Measurement:** 30-day post-fix lift in Add-to-Cart or Conversion Rate (measured via Shopify API integration later).
