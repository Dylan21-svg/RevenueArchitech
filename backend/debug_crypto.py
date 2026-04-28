import sys
print(f"Python path: {sys.path}")
try:
    import cryptography
    print("Imported cryptography")
    from cryptography.hazmat.primitives import serialization
    print("Imported serialization")
except Exception as e:
    import traceback
    traceback.print_exc()
