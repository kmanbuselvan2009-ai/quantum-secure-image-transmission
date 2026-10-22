"""
Quantum Channel Noise models for BB84 Qiskit simulation.

Supports:
- Depolarizing noise
- Pauli bit-flip noise (X)
- Pauli phase-flip noise (Z)
"""

from typing import Optional, Literal
from qiskit_aer.noise import (
    NoiseModel,
    depolarizing_error,
    pauli_error,
)

NoiseType = Literal["depolarizing", "bit_flip", "phase_flip"]


def build_noise_model(
    noise_level: float,
    noise_type: NoiseType = "depolarizing",
) -> Optional[NoiseModel]:
    """
    Build a Qiskit Aer noise model from noise_level in [0, 1].

    Parameters:
      noise_level: float in [0.0, 1.0] representing channel disturbance probability.
      noise_type: 'depolarizing', 'bit_flip', or 'phase_flip'.

    Returns None if noise_level is 0.0 (ideal channel).
    """
    if noise_level <= 0.0:
        return None

    noise_model = NoiseModel()
    p = min(max(noise_level, 0.0), 0.99)

    if noise_type == "bit_flip":
        bit_err = pauli_error([("X", p), ("I", 1 - p)])
        noise_model.add_all_qubit_quantum_error(bit_err, ["h", "x", "id"])
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
