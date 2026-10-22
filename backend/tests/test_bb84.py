import pytest
from app.bb84 import (
    run_bb84_experiment,
    run_batch_simulation,
    sift_key,
    calculate_qber,
    encode_alice_qubits,
    build_noise_model,
)
from app.key_processing import bits_to_bytes, derive_aes_key
from app.encryption import encrypt_image, decrypt_image, tamper_ciphertext, sha256_hex


# ---- Key processing tests ----

def test_bits_to_bytes_empty():
    assert bits_to_bytes([]) == b""


def test_bits_to_bytes_known():
    bits = [1, 0, 1, 1, 0, 1, 0, 0]
    assert bits_to_bytes(bits) == bytes([180])


def test_derive_aes_key_length():
    bits = [1, 0] * 64
    key = derive_aes_key(bits)
    assert len(key) == 32


def test_derive_aes_key_deterministic():
    bits = [1, 0, 1] * 40
    assert derive_aes_key(bits) == derive_aes_key(bits)


# ---- Encryption & Tampering tests ----

def test_encrypt_decrypt_roundtrip():
    bits = [1, 0] * 64
    key = derive_aes_key(bits)
    plaintext = b"Research-grade quantum image encryption payload."
    enc = encrypt_image(plaintext, key)
    recovered, success = decrypt_image(
        enc["ciphertext_with_tag"], enc["nonce_bytes"], key
    )
    assert success
    assert recovered == plaintext


def test_tamper_causes_auth_failure():
    bits = [0, 1] * 64
    key = derive_aes_key(bits)
    plaintext = b"Important laboratory test data" * 20
    enc = encrypt_image(plaintext, key)
    tampered = tamper_ciphertext(enc["ciphertext_with_tag"])
    _, success = decrypt_image(tampered, enc["nonce_bytes"], key)
    assert not success, "Tampered ciphertext must fail AES-GCM authentication"


def test_sha256_consistency():
    data = b"research validation"
    assert sha256_hex(data) == sha256_hex(data)
    assert len(sha256_hex(data)) == 64


# ---- BB84 Protocol & Sifting tests ----

def test_sift_key_matching_bases():
    alice_bits  = [0, 1, 0, 1]
    alice_bases = [0, 0, 1, 1]
    bob_bases   = [0, 1, 1, 0]
    bob_results = [0, 1, 0, 1]
    alice_s, bob_s, match, discard = sift_key(alice_bits, alice_bases, bob_bases, bob_results)
    assert alice_s == [0, 0]
    assert bob_s == [0, 0]
    assert sorted(match) == [0, 2]
    assert sorted(discard) == [1, 3]


def test_calculate_qber_zero_errors():
    bits = [0] * 30
    qber, errors, compared, s_idx, k_idx = calculate_qber(bits, bits)
    assert errors == 0
    assert qber == 0.0
    assert compared > 0


def test_calculate_qber_empty():
    qber, errors, compared, s_idx, k_idx = calculate_qber([], [])
    assert qber == 0.0
    assert errors == 0
    assert compared == 0


# ---- Noise Models ----

def test_noise_models_creation():
    for ntype in ["depolarizing", "bit_flip", "phase_flip"]:
        model = build_noise_model(0.08, noise_type=ntype)
        assert model is not None

    zero_model = build_noise_model(0.0, noise_type="depolarizing")
    assert zero_model is None


# ---- Single Simulation & Trajectories ----

def test_bb84_simulation_trajectories():
    result = run_bb84_experiment(n_qubits=16, noise_level=0.0, eve_enabled=False, seed=42)
    assert result["n_qubits"] == 16
    assert len(result["channel_qubits"]) == 16
    assert len(result["event_log"]) > 0
    assert "_raw_sifted_key" in result
    # Check per-qubit trajectory structure
    q0 = result["channel_qubits"][0]
    assert "alice_bit" in q0
    assert "alice_basis" in q0
    assert "prepared_state" in q0
    assert "bob_basis" in q0
    assert "bob_measurement" in q0


def test_bb84_simulation_with_eve_trajectory():
    result = run_bb84_experiment(n_qubits=16, noise_level=0.0, eve_enabled=True, seed=42)
    assert result["eve_enabled"] is True
    assert result["channel_qubits"][0]["eve_interacted"] is True
    assert result["channel_qubits"][0]["eve_info"] is not None


# ---- Research Batch Simulation tests ----

def test_batch_simulation_noise_sweep_point():
    res = run_batch_simulation(
        n_qubits=64,
        noise_level=0.02,
        noise_type="depolarizing",
        eve_enabled=False,
        trials=5,
        base_seed=100,
    )
    assert res["trials"] == 5
    assert len(res["trial_records"]) == 5
    assert "mean_qber" in res
    assert "std_qber" in res
    assert "acceptance_rate" in res
    assert 0.0 <= res["mean_qber"] <= 100.0


def test_batch_simulation_eve_impact():
    res_no_eve = run_batch_simulation(n_qubits=64, noise_level=0.0, eve_enabled=False, trials=5, base_seed=1)
    res_with_eve = run_batch_simulation(n_qubits=64, noise_level=0.0, eve_enabled=True, trials=5, base_seed=1)
    # Eve should generally induce significant disturbance (~25%)
    assert res_with_eve["mean_qber"] > res_no_eve["mean_qber"]
