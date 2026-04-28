import urllib.request
import urllib.error

url = 'https://fwdushzwgsehexidhbam.supabase.co/auth/v1/health'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print('Status:', response.status)
        print('Headers:', response.headers)
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code)
    print('Headers:', e.headers)
    print('Body:', e.read().decode('utf-8', errors='ignore'))
except urllib.error.URLError as e:
    print('URLError:', e.reason)
except Exception as e:
    print('Exception:', e)
