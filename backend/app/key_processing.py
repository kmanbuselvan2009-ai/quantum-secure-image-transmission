"""
Key processing: derive a 256-bit AES key from BB84 sifted key material.

We use HKDF (HMAC-based Key Derivation Function) with SHA-256 to derive
a proper 256-bit AES key from the raw BB84 sifted key bits.

The raw sifted key bits are first converted to bytes (padding if necessary).
"""

import hashlib
import math
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes


def bits_to_bytes(bits: list[int]) -> bytes:
    """Convert a list of bits to a bytes object (MSB first, zero-padded)."""
    n = len(bits)
    if n == 0:
        return b""
    # Pad to multiple of 8
    padded = bits + [0] * ((8 - n % 8) % 8)
    result = bytearray()
    for i in range(0, len(padded), 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | padded[i + j]
        result.append(byte)
    return bytes(result)


def derive_aes_key(raw_sifted_bits: list[int], info: bytes = b"quantum-aes-key") -> bytes:
    """
    Derive a 256-bit (32-byte) AES key from BB84 sifted key material.

    Uses HKDF-SHA256 for proper key derivation.
    If the sifted key is too short (< 8 bits), we still attempt derivation
    but note that short keys are insecure.

    Returns 32 bytes of AES key material.
    """
    raw_bytes = bits_to_bytes(raw_sifted_bits)
    if len(raw_bytes) == 0:
        raise ValueError("Cannot derive AES key from empty sifted key.")

    # Use SHA-256 hash of raw bits as IKM for HKDF
    # This ensures the key material is well-distributed
    ikm = hashlib.sha256(raw_bytes).digest()

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=info,
    )
    return hkdf.derive(ikm)


def sifted_key_summary(raw_sifted_bits: list[int]) -> dict:
    """Return non-sensitive metadata about the sifted key."""
    return {
        "sifted_bit_count": len(raw_sifted_bits),
        "sifted_byte_count": math.ceil(len(raw_sifted_bits) / 8),
        "derived_key_bits": 256,
        "kdf": "HKDF-SHA256",
    }
