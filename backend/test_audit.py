import requests

try:
    payload = {'url': 'HiSmile', 'niche': 'Beauty'}
    response = requests.post('http://localhost:8000/audit', json=payload, timeout=30)
    print('STATUS', response.status_code)
    print(response.text)
except Exception as exc:
    print('ERROR', exc)

