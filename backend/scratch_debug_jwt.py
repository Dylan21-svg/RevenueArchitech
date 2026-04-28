import jwt
try:
    from cryptography.hazmat.primitives import serialization
    print("Cryptography is available")
except ImportError:
    print("Cryptography is NOT available")

try:
    # Just a dummy check for ES256 support
    jwt.get_algorithm_by_name("ES256")
    print("ES256 is supported by PyJWT")
except Exception as e:
    print(f"ES256 is NOT supported: {e}")
