import requests

payload = {
    'url': 'https://www.cartinsight.io',
    'niche': 'Beauty'
}

try:
    resp = requests.post('http://localhost:8000/audit', json=payload, timeout=30)
    print('STATUS', resp.status_code)
    print(resp.text)
except Exception as e:
    print('ERROR', e)
