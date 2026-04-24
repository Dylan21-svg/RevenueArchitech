# Week 1 Quick Start Guide

**Goal:** Get the Sting Engine MVP running in 5 minutes

---

## 🚀 Fastest Path: Docker Compose

```bash
# 1. Navigate to backend
cd backend

# 2. Start everything
docker-compose up -d

# 3. Verify services running
docker ps
# Should show: api, worker, redis, postgres, flower

# 4. Check health
curl http://localhost:8000/health

# 5. Run test audit
curl -X POST http://localhost:8000/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "shopify.com",
    "niche": "General",
    "daily_ad_spend": 1000
  }'

# 6. Monitor tasks (Flower)
open http://localhost:5555

# 7. View logs
docker logs sting-api -f
docker logs sting-worker -f
```

**Expected output:** JSON response in <30s

---

## 🔧 Local Development Setup

```bash
# 1. Prerequisites
#    macOS: brew install redis python@3.11
#    Ubuntu: sudo apt-get install redis-server python3.11
#    Windows: Use WSL2 or Docker

# 2. Clone & enter
cd backend

# 3. Virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# or .venv\Scripts\Activate.ps1  # Windows

# 4. Install
pip install -r requirements.txt
playwright install chromium

# 5. Configure (copy template)
cp .env.example .env

# 6. Terminal 1: Redis
redis-server

# 7. Terminal 2: Celery Worker
celery -A tasks celery_app worker --loglevel=info

# 8. Terminal 3: FastAPI
uvicorn main_week1:app --reload --port 8000

# 9. Terminal 4: Test (in new terminal)
curl http://localhost:8000/health
```

---

## 📊 Test an Audit

### Curl Command
```bash
curl -X POST http://localhost:8000/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example-shopify-store.myshopify.com",
    "niche": "General",
    "daily_ad_spend": 2000
  }'
```

### Python Script
```python
import requests
import json

response = requests.post(
    "http://localhost:8000/audit",
    json={
        "url": "https://example.myshopify.com",
        "niche": "Fitness",
        "daily_ad_spend": 1500
    }
)

audit = response.json()
print(json.dumps(audit, indent=2))

# Key fields to inspect:
print(f"CTA Score: {audit['thumb_zone_result']['best_score']}")
print(f"Wasted Ad Spend: ${audit['wasted_ad_spend']}")
print(f"Bounce Rate: {audit['bounce_rate']}%")
```

---

## 🎯 Key Improvements to Verify

### 1. Composite Thumb-Zone (Not Raw Y-Position)
```json
"thumb_zone_result": {
  "initial_viewport_score": {
    "visibility_score": 1.0,      // ✓ Is it visible?
    "tappability_score": 0.95,    // ✓ Is tap target 44x44+?
    "contrast_score": 0.9,        // ✓ Color contrast OK?
    "fold_position_score": 1.0,   // ✓ Natural reach zone?
    "overall_score": 0.975        // ✓ Weighted composite (not raw px)
  }
}
```

### 2. Confidence Scores on Competitors
```json
"competitor_extractions": [
  {
    "competitor_name": "Warby Parker",
    "price": 89.99,
    "price_confidence": 0.95,     // ✓ How confident in this price?
    "offers": ["free shipping"],
    "offers_confidence": 0.95,    // ✓ How confident in offers?
    "dom_path": "/html/body/span[3]"  // ✓ Where it was found
  }
]
```

### 3. Multiple CTA States
```json
"thumb_zone_result": {
  "initial_viewport_score": {...},
  "post_scroll_score": {...},      // ✓ CTAs revealed after scroll
  "best_state": "post_scroll",     // ✓ Which is best?
  "best_score": 0.92
}
```

---

## 📡 Monitor Celery Background Work

### Flower Dashboard
```
http://localhost:5555
```
Shows:
- Running tasks
- Worker status
- Task history
- Performance graphs

### Command Line
```bash
# List active tasks
celery -A tasks celery_app inspect active

# Worker stats
celery -A tasks celery_app inspect stats

# Task history
celery -A tasks celery_app inspect active_queues
```

---

## 🚨 Troubleshooting

### "Connection refused" on port 8000
```bash
# Check if API running
curl http://localhost:8000/health

# If not, restart
docker restart sting-api
# or
uvicorn main_week1:app --port 8000
```

### "No CTA found" in results
- Page might not have standard button text
- Check selectors in main_week1.py `cta_selectors` list
- CTA might be hidden/dynamic (loaded after JavaScript)

### Slow audits (>30s)
1. Check Flower dashboard for competitor scraping delays
2. Verify Playwright is not timing out
3. Test page load directly: `time curl https://example.com`

### Redis connection error
```bash
# Start Redis
redis-server

# Verify running
redis-cli ping
# Should respond: PONG
```

### Celery worker not starting
```bash
# Check logs
celery -A tasks celery_app inspect active

# Restart worker
pkill -f "celery worker"
celery -A tasks celery_app worker --loglevel=debug
```

---

## 📈 Performance Targets (Week 1)

| Metric | Target | How to Test |
|--------|--------|------------|
| Audit Response | <30s | `curl -w "@curl-format.txt"` |
| Page Load | <8s | Check `load_score` in result |
| Competitor Scraping | <15s (bg) | View Flower dashboard |
| Uptime | 100% | Run for 24h, check health endpoint every 60s |

**Performance check script:**
```bash
#!/bin/bash
for i in {1..10}; do
  start=$(date +%s%N)
  curl -s http://localhost:8000/audit \
    -H "Content-Type: application/json" \
    -d '{"url":"example.com","daily_ad_spend":500}' > /dev/null
  end=$(date +%s%N)
  elapsed=$(( (end - start) / 1000000 ))
  echo "Audit $i: ${elapsed}ms"
done
```

---

## 📝 Files Modified/Created

### New Files (Week 1)
- ✅ `main_week1.py` - Enhanced audit engine
- ✅ `tasks.py` - Celery background jobs
- ✅ `docker-compose.yml` - Full stack orchestration
- ✅ `Dockerfile` - Container image
- ✅ `.env.example` - Configuration template
- ✅ `WEEK1_README.md` - Full deployment guide
- ✅ `IMPLEMENTATION_SUMMARY.md` - Technical summary
- ✅ `QUICKSTART.md` - This file!

### Modified Files
- ⚠️ `requirements.txt` - Added celery, redis, slowapi, etc.
- ⚠️ `main.py.backup` - Backup of original

### Unchanged
- ✓ `test_audit.py` - Can now test with new models
- ✓ `audit_test.py` - Helper functions

---

## 🎓 What Week 1 Does (vs. Original)

### ✅ Now Included
1. **Composite thumb-zone scoring** → `AccessibilityScore` with 4 weighted factors
2. **Confidence metrics** on all competitor extractions (0-1)
3. **Raw artifacts stored separately** → Enables audit replay (Week 2)
4. **Multiple CTA states** → Initial, post-scroll, post-overlay
5. **Celery job queue** → Background competitor scraping
6. **Docker stack** → Redis + API + Worker + Postgres ready
7. **Rate limiting** → 10 audits/min setup (Week 5 to bill)
8. **Error handling** → Structured logging + Sentry ready

### ❌ Coming Week 2+
- Shopify OAuth + API connection
- Fix Engine (CSS/Liquid generation)
- Persistent audit storage (PostgreSQL)
- Audit replay (re-score without re-scrape)

---

## 🎯 Next Steps After Week 1 Works

1. **Test with 5-10 real Shopify stores** → Collect audit samples
2. **Build frontend** (React/Vite) → See [../frontend/README.md](../frontend/README.md)
3. **Shopify integration** (Week 2) → OAuth + theme access
4. **Fix Engine** (Week 2) → Generate + deploy CSS fixes
5. **Deploy to Railway** → Go live with beta

---

## ❓ Questions?

- **API docs:** POST /audit request/response format in `WEEK1_README.md`
- **Architecture:** Diagram in `IMPLEMENTATION_SUMMARY.md`
- **Celery:** Monitoring at http://localhost:5555
- **Logs:** `docker logs sting-api -f` or `tail -f celery.log`

---

**Status:** ✅ Week 1 MVP Complete - Ready to Test
**Next:** Frontend & Shopify Integration (Week 2)
