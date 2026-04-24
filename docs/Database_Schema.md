# Database Schema: RevenueArchitect AI

This schema is designed to support high-speed public audits, seamless "Ghost Account" conversions, and granular tracking of revenue leaks and applied fixes.

---

## 1. Core Platform Entities

### `Users`
Stores authentication and billing data once a user claims their account.
* `id` (UUID, Primary Key)
* `email` (String, Unique)
* `shopify_access_token` (String, Encrypted)
* `subscription_tier` (Enum: free, pro, agency)
* `created_at` (Timestamp)

### `Stores`
Represents the Shopify store. It can exist as a "Ghost Store" before a User claims it.
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> Users.id, Nullable for Ghost Stores)
* `domain` (String, Unique)
* `platform` (String, Default: "shopify")
* `base_currency` (String, Default: "USD")
* `estimated_monthly_traffic` (Integer)

---

## 2. Audit & Diagnostic Entities

### `Audits`
The top-level record of a scan event.
* `id` (UUID, Primary Key)
* `store_id` (UUID, Foreign Key -> Stores.id)
* `status` (Enum: pending, processing, complete, failed)
* `overall_score` (Integer, 0-100)
* `device_type_scanned` (Enum: mobile, desktop)
* `created_at` (Timestamp)
* `completed_at` (Timestamp, Nullable)

### `EngineScores`
Breaks down the overall audit score into the 5 core framework categories.
* `id` (UUID, Primary Key)
* `audit_id` (UUID, Foreign Key -> Audits.id)
* `engine_name` (Enum: Offer, Trust, Page, Checkout, Recovery)
* `score` (Integer, 0-100)

### `DetectedLeaks`
The specific friction points found during the audit.
* `id` (UUID, Primary Key)
* `audit_id` (UUID, Foreign Key -> Audits.id)
* `engine_name` (Enum: Offer, Trust, Page, Checkout, Recovery)
* `title` (String) - e.g., "Missing Shipping Policy on Product Page"
* `description` (Text)
* `severity` (Enum: low, medium, high, critical)
* `estimated_impact_usd` (Decimal) - The "found money" psychological trigger.

---

## 3. Action & Fix Entities

### `RecommendedFixes`
The specific actionable steps tied to a leak.
* `id` (UUID, Primary Key)
* `leak_id` (UUID, Foreign Key -> DetectedLeaks.id)
* `title` (String)
* `deployment_type` (Enum: auto_inject, manual_code, manual_config)
* `copy_paste_snippet` (Text, Nullable)
* `status` (Enum: unapplied, applied, dismissed)
* `applied_at` (Timestamp, Nullable)

### `MetricSnapshots` (For ROI Tracking)
Records the store's performance metrics to prove value over time.
* `id` (UUID, Primary Key)
* `store_id` (UUID, Foreign Key -> Stores.id)
* `recorded_at` (Timestamp)
* `revenue_per_visitor` (Decimal)
* `average_order_value` (Decimal)
* `conversion_rate` (Decimal)
* `notes` (String) - e.g., "Baseline before Trust Engine fixes applied."
