"""
AES-GCM image encryption and decryption.

Uses the Python `cryptography` library for authenticated encryption.
The encryption key is derived from BB84 sifted key material.
"""

import os
import hashlib
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_image(image_bytes: bytes, aes_key: bytes) -> dict:
    """
    Encrypt image bytes using AES-GCM.

    Parameters:
      image_bytes - raw bytes of the image file
      aes_key     - 32-byte AES-256 key

    Returns dict with:
      nonce      - 12-byte random nonce (hex)
      ciphertext - encrypted bytes (hex preview + base64 for storage)
      tag        - authentication tag extracted from ciphertext (last 16 bytes)
      plaintext_size
      ciphertext_size
      first_32_bytes_plaintext
      first_32_bytes_ciphertext
    """
    if len(aes_key) != 32:
        raise ValueError(f"AES key must be 32 bytes, got {len(aes_key)}")

    # Generate random 96-bit (12-byte) nonce
    nonce = os.urandom(12)

    aesgcm = AESGCM(aes_key)
    # AESGCM.encrypt returns ciphertext + 16-byte tag appended
    ciphertext_with_tag = aesgcm.encrypt(nonce, image_bytes, None)

    # The last 16 bytes of ciphertext_with_tag is the authentication tag
    tag = ciphertext_with_tag[-16:]
    ciphertext_only = ciphertext_with_tag[:-16]

    # Hex previews (first 32 bytes)
    pt_preview = " ".join(f"{b:02X}" for b in image_bytes[:32])
    ct_preview = " ".join(f"{b:02X}" for b in ciphertext_only[:32])

    return {
        "nonce_hex": nonce.hex(),
        "nonce_bytes": nonce,  # kept server-side for decryption
        "ciphertext_with_tag": ciphertext_with_tag,  # full payload
        "tag_hex": tag.hex(),
        "plaintext_size": len(image_bytes),
        "ciphertext_size": len(ciphertext_only),
        "ciphertext_with_tag_size": len(ciphertext_with_tag),
        "first_32_bytes_plaintext_hex": pt_preview,
        "first_32_bytes_ciphertext_hex": ct_preview,
    }


def decrypt_image(
    ciphertext_with_tag: bytes,
    nonce: bytes,
    aes_key: bytes,
) -> tuple[bytes, bool]:
    """
    Decrypt and authenticate AES-GCM ciphertext.

    Returns (plaintext, success).
    If authentication fails, returns (b"", False).
    """
    aesgcm = AESGCM(aes_key)
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        return plaintext, True
    except Exception:
        return b"", False


def tamper_ciphertext(ciphertext_with_tag: bytes) -> bytes:
    """
    Tamper with the ciphertext by flipping one byte (index 10).
    Used to demonstrate AES-GCM authentication rejection.
    """
    if len(ciphertext_with_tag) < 11:
        # Just flip first byte if very short
        arr = bytearray(ciphertext_with_tag)
        arr[0] ^= 0xFF
        return bytes(arr)

    arr = bytearray(ciphertext_with_tag)
    arr[10] ^= 0xFF  # flip a bit in the ciphertext body
    return bytes(arr)


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def get_plaintext_preview(image_bytes: bytes, n_bytes: int = 32) -> str:
    """Return first n_bytes of image as hex string."""
    return " ".join(f"{b:02X}" for b in image_bytes[:n_bytes])
