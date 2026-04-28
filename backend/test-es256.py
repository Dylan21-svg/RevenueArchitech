import jwt

token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature"
try:
    jwt.decode(token, "secret", algorithms=["ES256"])
except Exception as e:
    print(f"Error type: {type(e).__name__}")
    print(f"Error msg: {str(e)}")
