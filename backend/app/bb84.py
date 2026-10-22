"""
BB84 Quantum Key Distribution Simulation & Research Suite using Qiskit/Aer.

Includes:
  - Noise model builder supporting: Depolarizing, Bit-flip, Phase-flip
  - Alice state preparation (|0>, |1>, |+>, |->)
  - Eve intercept-resend attack with real quantum measurement & state recreation
  - Bob measurement in random bases
  - Basis reconciliation & sifted key generation
  - Parameter estimation subset for faithful QBER estimation
  - Detailed per-qubit trajectory tracing for interactive channel visualization & event log
  - Batch repeated trials runner for Research Lab (Noise sweeps, Eve comparisons, Qubit sample size, 2D studies)
"""

import random
import math
from typing import Optional, Literal
import numpy as np

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import (
    NoiseModel,
    depolarizing_error,
    pauli_error,
    phase_damping_error,
)


NoiseType = Literal["depolarizing", "bit_flip", "phase_flip"]


def build_noise_model(
    noise_level: float,
    noise_type: NoiseType = "depolarizing",
) -> Optional[NoiseModel]:
    """
    Build a Qiskit Aer noise model from noise_level in [0, 1].

    Supports:
      - 'depolarizing': depolarizing error on single-qubit gates
      - 'bit_flip': Pauli X error on single-qubit gates + measurement
      - 'phase_flip': Pauli Z error on single-qubit gates
    """
    if noise_level <= 0.0:
        return None

    noise_model = NoiseModel()
    p = min(max(noise_level, 0.0), 0.99)

    if noise_type == "bit_flip":
        bit_err = pauli_error([("X", p), ("I", 1 - p)])
        noise_model.add_all_qubit_quantum_error(bit_err, ["h", "x", "id"])
        # Measurement error
        meas_p = min(p * 0.5, 0.49)
        meas_err = pauli_error([("X", meas_p), ("I", 1 - meas_p)])
        noise_model.add_all_qubit_quantum_error(meas_err, "measure")

    elif noise_type == "phase_flip":
        phase_err = pauli_error([("Z", p), ("I", 1 - p)])
        noise_model.add_all_qubit_quantum_error(phase_err, ["h", "x", "id"])

    else:  # depolarizing (default)
        depol_err = depolarizing_error(p, 1)
        noise_model.add_all_qubit_quantum_error(depol_err, ["h", "x", "id"])
        meas_p = min(p * 0.5, 0.49)
        bit_flip_err = pauli_error([("X", meas_p), ("I", 1 - meas_p)])
        noise_model.add_all_qubit_quantum_error(bit_flip_err, "measure")

    return noise_model


def encode_alice_qubits(bits: list[int], bases: list[int]) -> list[QuantumCircuit]:
    """
    Alice encodes her bits into quantum states.

    Encoding:
      Z basis (0): |0> for bit 0, |1> for bit 1
      X basis (1): |+> for bit 0, |-> for bit 1
    """
    circuits = []
    for bit, basis in zip(bits, bases):
        qc = QuantumCircuit(1, 1)
        if bit == 1:
            qc.x(0)
        if basis == 1:
            qc.h(0)
        circuits.append(qc)
    return circuits


def eve_intercept_resend(
    circuits: list[QuantumCircuit],
    simulator: AerSimulator,
    noise_model: Optional[NoiseModel],
    rng: Optional[random.Random] = None,
) -> tuple[list[QuantumCircuit], list[int], list[int]]:
    """
    Eve performs an intercept-resend attack.

    For each qubit:
      1. Eve randomly chooses a basis (Z or X)
      2. Measures the incoming qubit
      3. Prepares a replacement qubit in the measured state using her chosen basis
      4. Forwards it to Bob
    """
    r = rng if rng is not None else random
    n = len(circuits)
    eve_bases = [r.randint(0, 1) for _ in range(n)]

    # Build Eve's measurement circuits in a single batch
    meas_circuits = []
    for qc, eve_basis in zip(circuits, eve_bases):
        eve_meas_qc = qc.copy()
        if eve_basis == 1:
            eve_meas_qc.h(0)
        eve_meas_qc.measure(0, 0)
        meas_circuits.append(eve_meas_qc)

    opts = {"shots": 1, "memory": True}
    if noise_model:
        opts["noise_model"] = noise_model

    transpiled_batch = transpile(meas_circuits, simulator)
    job = simulator.run(transpiled_batch, **opts)
    result = job.result()

    eve_measurements = []
    replacement_circuits = []

    for i, eve_basis in enumerate(eve_bases):
        mem = result.get_memory(i)
        eve_bit = int(mem[0])
        eve_measurements.append(eve_bit)

        # Eve prepares replacement qubit
        new_qc = QuantumCircuit(1, 1)
        if eve_bit == 1:
            new_qc.x(0)
        if eve_basis == 1:
            new_qc.h(0)
        replacement_circuits.append(new_qc)

    return replacement_circuits, eve_bases, eve_measurements


def bob_measure_qubits(
    circuits: list[QuantumCircuit],
    bob_bases: list[int],
    simulator: AerSimulator,
    noise_model: Optional[NoiseModel],
) -> list[int]:
    """
    Bob measures each qubit using his randomly chosen basis in a high-speed batch.
    """
    meas_circuits = []
    for qc, bob_basis in zip(circuits, bob_bases):
        meas_qc = qc.copy()
        if bob_basis == 1:
            meas_qc.h(0)
        meas_qc.measure(0, 0)
        meas_circuits.append(meas_qc)

    opts = {"shots": 1, "memory": True}
    if noise_model:
        opts["noise_model"] = noise_model

    transpiled_batch = transpile(meas_circuits, simulator)
    job = simulator.run(transpiled_batch, **opts)
    result = job.result()

    bob_results = []
    for i in range(len(circuits)):
        mem = result.get_memory(i)
        bob_results.append(int(mem[0]))

    return bob_results


def sift_key(
    alice_bits: list[int],
    alice_bases: list[int],
    bob_bases: list[int],
    bob_results: list[int],
) -> tuple[list[int], list[int], list[int], list[int]]:
    """
    Keep only positions where Alice's and Bob's bases match.
    """
    alice_sifted = []
    bob_sifted = []
    matching_indices = []
    discarded_indices = []

    for i, (ab, bb) in enumerate(zip(alice_bases, bob_bases)):
        if ab == bb:
            alice_sifted.append(alice_bits[i])
            bob_sifted.append(bob_results[i])
            matching_indices.append(i)
        else:
            discarded_indices.append(i)

    return alice_sifted, bob_sifted, matching_indices, discarded_indices


def calculate_qber(
    alice_sifted: list[int],
    bob_sifted: list[int],
    rng: Optional[np.random.Generator] = None,
) -> tuple[float, int, int, list[int], list[int]]:
    """
    Calculate QBER on a parameter estimation sample.
    The sample bits are disclosed/compared; the remaining form the secret key.
    Returns: (qber_percent, errors, compared_count, sample_indices, key_indices)
    """
    n = len(alice_sifted)
    if n == 0:
        return 0.0, 0, 0, [], []

    # Faithful protocol: parameter estimation subset
    # Uses up to min(50, n // 2), at least 1 if n >= 1
    compare_n = max(1, min(50, n // 2))

    g = rng if rng is not None else np.random.default_rng(seed=42)
    sample_indices = g.choice(n, size=compare_n, replace=False).tolist()
    sample_set = set(sample_indices)
    key_indices = [i for i in range(n) if i not in sample_set]

    errors = sum(1 for i in sample_indices if alice_sifted[i] != bob_sifted[i])
    qber = (errors / compare_n) * 100.0

    return qber, errors, compare_n, sample_indices, key_indices


from collections import defaultdict

_shared_simulator: Optional[AerSimulator] = None
_transpiled_templates: dict[tuple[int, int, int], QuantumCircuit] = {}
_noise_model_cache: dict[tuple[float, str], Optional[NoiseModel]] = {}


def get_shared_simulator() -> AerSimulator:
    global _shared_simulator
    if _shared_simulator is None:
        _shared_simulator = AerSimulator()
    return _shared_simulator


def get_transpiled_templates() -> dict[tuple[int, int, int], QuantumCircuit]:
    global _transpiled_templates
    if not _transpiled_templates:
        sim = get_shared_simulator()
        for bit in [0, 1]:
            for p_b in [0, 1]:
                for m_b in [0, 1]:
                    qc = QuantumCircuit(1, 1)
                    if bit == 1:
                        qc.x(0)
                    if p_b == 1:
                        qc.h(0)
                    if m_b == 1:
                        qc.h(0)
                    qc.measure(0, 0)
                    _transpiled_templates[(bit, p_b, m_b)] = transpile(qc, sim)
    return _transpiled_templates


def get_cached_noise_model(noise_level: float, noise_type: NoiseType) -> Optional[NoiseModel]:
    if noise_level <= 0.0:
        return None
    key = (round(noise_level, 4), str(noise_type))
    if key not in _noise_model_cache:
        _noise_model_cache[key] = build_noise_model(noise_level, noise_type)
    return _noise_model_cache[key]


def simulate_channel_and_measurements(
    alice_bits: list[int],
    alice_bases: list[int],
    bob_bases: list[int],
    eve_enabled: bool,
    noise_model: Optional[NoiseModel],
    rng: random.Random,
) -> tuple[list[int], Optional[list[int]], Optional[list[int]]]:
    """
    High-performance Qiskit Aer vectorized simulation using template quantum circuits.
    Executes actual Aer quantum simulation with shots grouped by basis configuration.
    Returns: (bob_results, eve_bases, eve_measurements)
    """
    sim = get_shared_simulator()
    templates = get_transpiled_templates()
    n = len(alice_bits)

    if eve_enabled:
        eve_bases = [rng.randint(0, 1) for _ in range(n)]
        eve_groups = defaultdict(list)
        for i in range(n):
            eve_groups[(alice_bits[i], alice_bases[i], eve_bases[i])].append(i)

        eve_measurements = [0] * n
        for key, idxs in eve_groups.items():
            job = sim.run(templates[key], shots=len(idxs), memory=True, noise_model=noise_model)
            mem = job.result().get_memory()
            for i, bit_str in zip(idxs, mem):
                eve_measurements[i] = int(bit_str)

        # Stage 2: Eve to Bob
        bob_groups = defaultdict(list)
        for i in range(n):
            bob_groups[(eve_measurements[i], eve_bases[i], bob_bases[i])].append(i)

        bob_results = [0] * n
        for key, idxs in bob_groups.items():
            job = sim.run(templates[key], shots=len(idxs), memory=True, noise_model=noise_model)
            mem = job.result().get_memory()
            for i, bit_str in zip(idxs, mem):
                bob_results[i] = int(bit_str)

        return bob_results, eve_bases, eve_measurements
    else:
        bob_groups = defaultdict(list)
        for i in range(n):
            bob_groups[(alice_bits[i], alice_bases[i], bob_bases[i])].append(i)

        bob_results = [0] * n
        for key, idxs in bob_groups.items():
            job = sim.run(templates[key], shots=len(idxs), memory=True, noise_model=noise_model)
            mem = job.result().get_memory()
            for i, bit_str in zip(idxs, mem):
                bob_results[i] = int(bit_str)

        return bob_results, None, None


def run_bb84_experiment(
    n_qubits: int,
    noise_level: float = 0.05,
    noise_type: NoiseType = "depolarizing",
    eve_enabled: bool = False,
    seed: Optional[int] = None,
    trace_qubits_limit: int = 16,
) -> dict:
    """
    Run a full single BB84 experiment with trajectory details for interactive UI.
    """
    py_rng = random.Random(seed) if seed is not None else random.Random()
    np_rng = np.random.default_rng(seed) if seed is not None else np.random.default_rng()

    alice_bits = [py_rng.randint(0, 1) for _ in range(n_qubits)]
    alice_bases = [py_rng.randint(0, 1) for _ in range(n_qubits)]
    bob_bases = [py_rng.randint(0, 1) for _ in range(n_qubits)]

    noise_model = get_cached_noise_model(noise_level, noise_type)

    bob_results, eve_bases, eve_measurements = simulate_channel_and_measurements(
        alice_bits, alice_bases, bob_bases, eve_enabled, noise_model, py_rng
    )

    alice_sifted, bob_sifted, matching_indices, discarded_indices = sift_key(
        alice_bits, alice_bases, bob_bases, bob_results
    )
    sifted_key_length = len(alice_sifted)

    qber, errors, compared_count, sample_indices, key_indices = calculate_qber(
        alice_sifted, bob_sifted, rng=np_rng
    )

    QBER_THRESHOLD = 11.0
    key_accepted = (qber < QBER_THRESHOLD) and (sifted_key_length > 0)

    # Per-qubit trajectories for interactive animated channel (up to trace_qubits_limit)
    matching_set = set(matching_indices)
    sample_matching_indices = set(matching_indices[i] for i in sample_indices) if sample_indices else set()

    channel_qubits = []
    limit = min(n_qubits, trace_qubits_limit)
    for i in range(limit):
        a_bit = alice_bits[i]
        a_basis = "Z" if alice_bases[i] == 0 else "X"
        state_label = ("|0⟩" if a_bit == 0 else "|1⟩") if a_basis == "Z" else ("|+⟩" if a_bit == 0 else "|−⟩")
        
        b_basis = "Z" if bob_bases[i] == 0 else "X"
        b_res = bob_results[i]
        is_match = i in matching_set

        eve_info = None
        if eve_enabled and eve_bases is not None:
            e_basis = "Z" if eve_bases[i] == 0 else "X"
            e_meas = eve_measurements[i]
            e_state = ("|0⟩" if e_meas == 0 else "|1⟩") if e_basis == "Z" else ("|+⟩" if e_meas == 0 else "|−⟩")
            eve_info = {
                "basis": e_basis,
                "measured_bit": e_meas,
                "replacement_state": e_state,
            }

        channel_qubits.append({
            "index": i + 1,
            "alice_bit": a_bit,
            "alice_basis": a_basis,
            "prepared_state": state_label,
            "eve_interacted": eve_enabled,
            "eve_info": eve_info,
            "bob_basis": b_basis,
            "bob_measurement": b_res,
            "basis_matched": is_match,
            "in_qber_sample": i in sample_matching_indices,
            "bit_error": (is_match and a_bit != b_res),
        })

    # Event log for educational trace
    event_log = []
    for q in channel_qubits[:8]:
        idx = q["index"]
        event_log.append(f"Qubit {idx:02d}: Alice prepared {q['prepared_state']} ({q['alice_basis']} basis)")
        if eve_enabled and q["eve_info"]:
            event_log.append(f"Qubit {idx:02d}: Eve intercepted and measured with {q['eve_info']['basis']} basis → resent {q['eve_info']['replacement_state']}")
        else:
            event_log.append(f"Qubit {idx:02d}: Passed through {noise_type} channel (noise: {round(noise_level * 100)}%)")
        event_log.append(f"Qubit {idx:02d}: Bob measured in {q['bob_basis']} basis → result {q['bob_measurement']}")
        if q["basis_matched"]:
            err_str = " [Bit error detected]" if q["bit_error"] else " [Matched]"
            event_log.append(f"Qubit {idx:02d}: Basis matched ({q['alice_basis']}) → Sifted{err_str}")
        else:
            event_log.append(f"Qubit {idx:02d}: Basis mismatch ({q['alice_basis']} vs {q['bob_basis']}) → Discarded")

    # Reconciliation sample table
    sample_size = min(8, len(matching_indices))
    discard_size = min(4, len(discarded_indices))
    reconciliation_sample = []
    for idx in matching_indices[:sample_size]:
        reconciliation_sample.append({
            "position": idx + 1,
            "alice_basis": "Z" if alice_bases[idx] == 0 else "X",
            "bob_basis": "Z" if bob_bases[idx] == 0 else "X",
            "result": "Keep",
        })
    for idx in discarded_indices[:discard_size]:
        reconciliation_sample.append({
            "position": idx + 1,
            "alice_basis": "Z" if alice_bases[idx] == 0 else "X",
            "bob_basis": "Z" if bob_bases[idx] == 0 else "X",
            "result": "Discard",
        })
    reconciliation_sample.sort(key=lambda x: x["position"])

    state_sample = []
    for i in range(min(8, n_qubits)):
        b = alice_bits[i]
        basis = alice_bases[i]
        state = ("|0⟩" if b == 0 else "|1⟩") if basis == 0 else ("|+⟩" if b == 0 else "|−⟩")
        state_sample.append({
            "bit": b,
            "basis": "Z" if basis == 0 else "X",
            "state": state,
        })

    # The secret key for AES: use key_indices or all sifted if sample empty
    secret_key_bits = [alice_sifted[i] for i in key_indices] if key_indices else alice_sifted

    return {
        "n_qubits": n_qubits,
        "noise_level": noise_level,
        "noise_type": noise_type,
        "eve_enabled": eve_enabled,
        "seed": seed,
        "alice_qubits_prepared": n_qubits,
        "state_sample": state_sample,
        "qubits_sent": n_qubits,
        "bob_qubits_received": n_qubits,
        "bob_measurements_completed": n_qubits,
        "matching_bases_count": len(matching_indices),
        "discarded_count": len(discarded_indices),
        "sifted_key_length": sifted_key_length,
        "reconciliation_sample": reconciliation_sample,
        "channel_qubits": channel_qubits,
        "event_log": event_log,
        "qber": round(qber, 4),
        "qber_errors": errors,
        "qber_compared": compared_count,
        "qber_threshold": QBER_THRESHOLD,
        "key_accepted": key_accepted,
        "_raw_sifted_key": secret_key_bits,
    }


def run_batch_simulation(
    n_qubits: int,
    noise_level: float,
    noise_type: NoiseType = "depolarizing",
    eve_enabled: bool = False,
    trials: int = 10,
    base_seed: Optional[int] = None,
) -> dict:
    """
    Run multiple independent BB84 trials for statistical research analysis.
    Computes mean QBER, std deviation, min, max, acceptance rate, and sifted lengths.
    """
    qbers = []
    sifted_lengths = []
    errors_list = []
    compared_list = []
    accepted_count = 0
    trial_records = []

    for t in range(trials):
        seed_val = (base_seed + t) if base_seed is not None else None
        res = run_bb84_experiment(
            n_qubits=n_qubits,
            noise_level=noise_level,
            noise_type=noise_type,
            eve_enabled=eve_enabled,
            seed=seed_val,
            trace_qubits_limit=0,  # avoid unnecessary trace overhead in batch
        )
        q = res["qber"]
        qbers.append(q)
        sifted_lengths.append(res["sifted_key_length"])
        errors_list.append(res["qber_errors"])
        compared_list.append(res["qber_compared"])
        if res["key_accepted"]:
            accepted_count += 1

        trial_records.append({
            "trial": t + 1,
            "qber": q,
            "errors": res["qber_errors"],
            "compared": res["qber_compared"],
            "sifted_length": res["sifted_key_length"],
            "accepted": res["key_accepted"],
        })

    qbers_arr = np.array(qbers)
    mean_qber = float(np.mean(qbers_arr))
    std_qber = float(np.std(qbers_arr))
    min_qber = float(np.min(qbers_arr))
    max_qber = float(np.max(qbers_arr))
    acceptance_rate = (accepted_count / trials) * 100.0
    avg_sifted = float(np.mean(sifted_lengths))

    return {
        "trials": trials,
        "n_qubits": n_qubits,
        "noise_level": noise_level,
        "noise_type": noise_type,
        "eve_enabled": eve_enabled,
        "mean_qber": round(mean_qber, 3),
        "std_qber": round(std_qber, 3),
        "min_qber": round(min_qber, 3),
        "max_qber": round(max_qber, 3),
        "accepted_count": accepted_count,
        "acceptance_rate": round(acceptance_rate, 2),
        "avg_sifted_key_length": round(avg_sifted, 1),
        "qber_values": qbers,
        "trial_records": trial_records,
    }
