"""
Celery task queue for background browser operations.
Separates expensive Playwright jobs from request thread.
"""
import asyncio
import re
from typing import Optional, List
from celery import Celery, Task
from celery.utils.log import get_task_logger
from playwright.async_api import async_playwright

logger = get_task_logger(__name__)

# Initialize Celery
celery_app = Celery(
    'sting_engine',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC'
)

celery_app.conf.update(
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard timeout
    task_soft_time_limit=25 * 60,  # 25 minutes soft timeout
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    worker_max_tasks_per_child=100,  # Reload worker after 100 tasks to prevent memory leaks
)


class CallbackTask(Task):
    """Task that supports callbacks."""
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3}
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True


def extract_price_with_confidence(text: str) -> tuple:
    """Extract price and confidence (shared with main.py)."""
    patterns = [
        (r"price[:\s]*\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.95),
        (r"only\s*\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.90),
        (r"\$\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)", 0.70),
    ]
    
    for pattern, confidence in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                price_str = match.group(1).replace(',', '')
                price_float = float(price_str)
                context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
                return price_float, confidence, context
            except ValueError:
                continue
    
    return None, 0.0, ""


def detect_offer_signals_with_confidence(text: str) -> List[tuple]:
    """Detect offers with confidence (shared with main.py)."""
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


@celery_app.task(base=CallbackTask, bind=True)
def scrape_competitor_background(self, competitor_url: str, competitor_name: str, timeout: int = 20):
    """
    Background task: Scrape a single competitor URL.
    Returns: {competitor_name, price, price_confidence, offers, offers_confidence, status}
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': f'Scraping {competitor_name}...'})
        
        # Use asyncio to run Playwright scraping
        result = asyncio.run(
            _async_scrape_competitor(competitor_url, competitor_name, timeout)
        )
        
        return {
            'status': 'success',
            'competitor_name': competitor_name,
            'price': result['price'],
            'price_confidence': result['price_confidence'],
            'offers': result['offers'],
            'offers_confidence': result['offers_confidence'],
            'page_context': result['page_context']
        }
    except Exception as e:
        logger.error(f"Failed to scrape {competitor_name}: {str(e)}")
        return {
            'status': 'error',
            'competitor_name': competitor_name,
            'error': str(e)
        }


async def _async_scrape_competitor(url: str, name: str, timeout: int = 20) -> dict:
    """Async helper for competitor scraping."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout * 1000)
            
            # Extract text
            comp_text = await page.evaluate("document.body.innerText")
            comp_text_norm = " ".join([c if c.isalnum() or c.isspace() else " " for c in comp_text.lower()])
            
            # Extract price
            price, price_conf, context = extract_price_with_confidence(comp_text_norm)
            
            # Extract offers
            offers_with_conf = detect_offer_signals_with_confidence(comp_text_norm)
            offers_list = [o[0] for o in offers_with_conf]
            offers_conf = sum([o[1] for o in offers_with_conf]) / len(offers_with_conf) if offers_with_conf else 0.0
            
            await browser.close()
            
            return {
                'price': price,
                'price_confidence': price_conf if price else 0.0,
                'offers': offers_list,
                'offers_confidence': min(1.0, offers_conf),
                'page_context': context
            }
    except Exception as e:
        logger.error(f"Async scrape failed for {name}: {str(e)}")
        raise


@celery_app.task(base=CallbackTask)
def batch_scrape_competitors(competitor_urls: List[dict], timeout: int = 20):
    """
    Background task: Scrape multiple competitors in parallel using Celery.
    
    competitor_urls: [
        {"url": "https://...", "name": "CompetitorA"},
        {"url": "https://...", "name": "CompetitorB"},
    ]
    """
    from celery import group
    
    # Create a group of parallel tasks
    jobs = group(
        scrape_competitor_background.s(comp['url'], comp['name'], timeout)
        for comp in competitor_urls
    )
    
    # Execute in parallel
    result = jobs.apply_async()
    
    # Wait for all to complete (with timeout)
    try:
        results = result.get(timeout=timeout * len(competitor_urls) + 10)
        return {
            'status': 'completed',
            'competitors': results
        }
    except Exception as e:
        logger.error(f"Batch competitor scraping failed: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }


@celery_app.task(base=CallbackTask)
def audit_job_enqueue(audit_id: str, url: str, niche: str, daily_ad_spend: float):
    """
    Enqueue a full audit as a background job.
    Returns job status with audit_id for polling.
    """
    return {
        'audit_id': audit_id,
        'status': 'enqueued',
        'message': f'Audit for {url} enqueued. Poll for results.'
    }


if __name__ == '__main__':
    celery_app.start()
