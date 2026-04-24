from supabase import create_client

url = "https://RevenueArchitect-AI.supabase.co"
key = ",a9js4QM5!NXhka"

supabase = create_client(url, key)

print("Supabase connected!")