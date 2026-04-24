# API Endpoint Map: RevenueArchitect AI

This API is designed to support the frictionless "Ghost Account" tunnel flow. The frontend first interacts with public/unauthenticated endpoints to run the audit and show the teaser. Once the user connects via Shopify, the authenticated endpoints unlock the full diagnostic payload and deployment actions.

---

## 1. Public Endpoints (The Tunnel Flow)

### `POST /api/v1/audits/init`
**Purpose:** Kicks off a new audit for a given URL without requiring user signup.
* **Request Body:** `{ "url": "https://examplestore.com" }`
* **Response:** `{ "audit_id": "aud_123abc", "status": "processing" }`
* **Behavior:** Validates the URL, creates a "Ghost Store" record, and pushes the audit job to a background queue (e.g., Celery/Redis).

### `GET /api/v1/audits/{audit_id}/status`
**Purpose:** Polled by the frontend to update the scanning animation (e.g., "Checking Offer Engine...", "Checking Page Speed...").
* **Response:** 
  ```json
  {
    "audit_id": "aud_123abc",
    "status": "in_progress",
    "current_step": "evaluating_trust_signals",
    "progress_percent": 65
  }
  ```

### `GET /api/v1/audits/{audit_id}/teaser`
**Purpose:** Returns the summary data needed for "The Reveal" step in the tunnel to hook the user.
* **Response:**
  ```json
  {
    "audit_id": "aud_123abc",
    "status": "complete",
    "overall_score": 42,
    "primary_leak_headline": "Buried CTA & Missing Shipping Clarity",
    "estimated_monthly_loss_usd": 3400,
    "is_locked": true
  }
  ```

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/shopify/handshake`
**Purpose:** Completes the frictionless OAuth flow, converts the "Ghost Account" to a real user, and associates the previous `audit_id` with their new account.
* **Request Body:** `{ "shop": "examplestore.myshopify.com", "audit_id_to_claim": "aud_123abc" }`
* **Response:** `{ "access_token": "jwt_token_here", "user_id": "usr_999" }`

---

## 3. Authenticated Endpoints (The Dashboard)

*(Requires Authorization: Bearer Token)*

### `GET /api/v1/audits/{audit_id}/full`
**Purpose:** Retrieves the fully unlocked diagnostic report across all 5 engines.
* **Response:**
  ```json
  {
    "engines": {
      "offer": { "score": 60, "leaks": [...] },
      "trust": { "score": 30, "leaks": [...] },
      "page": { "score": 45, "leaks": [...] },
      "checkout": { "score": 80, "leaks": [...] },
      "recovery": { "score": 20, "leaks": [...] }
    },
    "top_fixes": [
      {
        "fix_id": "fix_101",
        "title": "Inject Trust Badges near Add-to-Cart",
        "impact": "+$1,200/mo",
        "is_auto_deployable": true
      }
    ]
  }
  ```

### `POST /api/v1/fixes/{fix_id}/deploy`
**Purpose:** Triggers an auto-fix directly to the user's Shopify theme.
* **Request Body:** `{ "target_theme_id": "123456789" }`
* **Response:** `{ "status": "success", "message": "Snippet injected safely into theme.liquid" }`

### `GET /api/v1/stores/{store_id}/metrics`
**Purpose:** Fetches baseline vs. post-fix metrics (RPV, AOV, Conversion Rate) over time to prove the platform's ROI.
