"""
Eve eavesdropping attacks on BB84 quantum states.

Implements real quantum circuit measurement and replacement state creation:
  1. Intercept incoming qubit
  2. Choose random basis (Z or X)
  3. Measure quantum state
  4. Prepare replacement quantum state in measured basis
  5. Forward replacement state to Bob
"""

import random
from typing import Optional
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel


def eve_intercept_resend(
    circuits: list[QuantumCircuit],
    simulator: AerSimulator,
    noise_model: Optional[NoiseModel],
    rng: Optional[random.Random] = None,
) -> tuple[list[QuantumCircuit], list[int], list[int]]:
    """
    Execute real quantum intercept-resend attack.

    Returns:
      (replacement_circuits, eve_bases, eve_measured_bits)
    """
    r = rng if rng is not None else random
    n = len(circuits)
    eve_bases = [r.randint(0, 1) for _ in range(n)]
    eve_measurements = []
    replacement_circuits = []

    for qc, eve_basis in zip(circuits, eve_bases):
        # Build Eve's measurement circuit
        eve_meas_qc = qc.copy()
        if eve_basis == 1:
            eve_meas_qc.h(0)
        eve_meas_qc.measure(0, 0)

        opts = {"shots": 1, "memory": True}
        if noise_model:
            opts["noise_model"] = noise_model

        transpiled = transpile(eve_meas_qc, simulator)
        job = simulator.run(transpiled, **opts)
        res = job.result()
        eve_bit = int(res.get_memory()[0])
        eve_measurements.append(eve_bit)

        # Eve prepares new replacement state
        new_qc = QuantumCircuit(1, 1)
        if eve_bit == 1:
            new_qc.x(0)
        if eve_basis == 1:
            new_qc.h(0)
        replacement_circuits.append(new_qc)

    return replacement_circuits, eve_bases, eve_measurements
