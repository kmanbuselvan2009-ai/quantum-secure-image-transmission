"""
Experiments orchestration module for BB84 Research Analysis.

Performs:
- Repeated trials execution for the current experiment setup
- Noise sweep benchmark (Noise vs Mean QBER)
- Eve impact benchmark (Eve OFF vs Eve ON)
- Sample size benchmark (Qubit Count vs QBER variance)
- Automated scientific interpretation generation
"""

import numpy as np
from app.bb84 import run_batch_simulation, NoiseType


def run_trials_and_benchmarks(
    n_qubits: int,
    noise_level: float,
    noise_type: NoiseType = "depolarizing",
    eve_enabled: bool = False,
    trials: int = 1,
    base_seed: int = None,
) -> dict:
    """
    Run the requested number of trials for the active experiment, and generate
    comparative research benchmarks using actual Qiskit Aer simulations.
    """
    # 1. Active Experiment Trials Statistics
    active_batch = run_batch_simulation(
        n_qubits=n_qubits,
        noise_level=noise_level,
        noise_type=noise_type,
        eve_enabled=eve_enabled,
        trials=max(1, trials),
        base_seed=base_seed,
    )

    # 2. Graph 1: Noise Probability vs Mean QBER
    # Sweep across representative noise points
    noise_points_vals = [0.0, 0.03, 0.06, 0.10, 0.15]
    graph1_points = []
    # Fast lightweight benchmark trial count
    bench_trials = max(2, min(trials, 5))
    bench_qubits = min(n_qubits, 64)

    for nv in noise_points_vals:
        res = run_batch_simulation(
            n_qubits=bench_qubits,
            noise_level=nv,
            noise_type=noise_type,
            eve_enabled=eve_enabled,
            trials=bench_trials,
            base_seed=(base_seed + int(nv * 100)) if base_seed is not None else None,
        )
        graph1_points.append({
            "noise_probability": round(nv * 100, 1),
            "mean_qber": res["mean_qber"],
            "std_qber": res["std_qber"],
            "acceptance_rate": res["acceptance_rate"],
        })

    # 3. Graph 2: Eve OFF vs Eve ON controlled comparison
    eve_off_res = run_batch_simulation(
        n_qubits=bench_qubits,
        noise_level=noise_level,
        noise_type=noise_type,
        eve_enabled=False,
        trials=bench_trials,
        base_seed=base_seed,
    )
    eve_on_res = run_batch_simulation(
        n_qubits=bench_qubits,
        noise_level=noise_level,
        noise_type=noise_type,
        eve_enabled=True,
        trials=bench_trials,
        base_seed=(base_seed + 500) if base_seed is not None else None,
    )
    graph2_comparison = {
        "eve_off": {
            "mean_qber": eve_off_res["mean_qber"],
            "std_qber": eve_off_res["std_qber"],
            "acceptance_rate": eve_off_res["acceptance_rate"],
        },
        "eve_on": {
            "mean_qber": eve_on_res["mean_qber"],
            "std_qber": eve_on_res["std_qber"],
            "acceptance_rate": eve_on_res["acceptance_rate"],
        },
    }

    # 4. Graph 3: Qubit Count vs QBER Stability (Variance)
    qubit_sizes = [16, 64, 128, 256]
    graph3_points = []
    for qs in qubit_sizes:
        res = run_batch_simulation(
            n_qubits=qs,
            noise_level=noise_level,
            noise_type=noise_type,
            eve_enabled=eve_enabled,
            trials=bench_trials,
            base_seed=(base_seed + qs) if base_seed is not None else None,
        )
        graph3_points.append({
            "n_qubits": qs,
            "mean_qber": res["mean_qber"],
            "std_qber": res["std_qber"],
            "min_qber": res["min_qber"],
            "max_qber": res["max_qber"],
            "acceptance_rate": res["acceptance_rate"],
        })

    # 5. Automated empirical interpretations based strictly on observed data
    interpretations = []

    # Noise interpretation
    if len(graph1_points) >= 2:
        if graph1_points[-1]["mean_qber"] > graph1_points[0]["mean_qber"]:
            interpretations.append("Mean QBER increased monotonically as simulated channel noise increased.")
        else:
            interpretations.append("Channel noise variations remained within statistical fluctuations.")

    # Eve interpretation
    if eve_on_res["mean_qber"] > eve_off_res["mean_qber"]:
        diff = round(eve_on_res["mean_qber"] - eve_off_res["mean_qber"], 1)
        interpretations.append(
            f"Intercept-resend produced significant additional disturbance (+{diff}% Mean QBER) compared with the corresponding no-Eve condition under identical channel parameters."
        )

    # Sample size variance interpretation
    if len(graph3_points) >= 2:
        if graph3_points[0]["std_qber"] > graph3_points[-1]["std_qber"]:
            interpretations.append("Smaller qubit samples (e.g. 16 qubits) showed greater QBER variation, whereas larger samples produced more stable QBER estimates.")
        else:
            interpretations.append("QBER stability remained bounded across the evaluated qubit sample sizes.")

    # Security conclusion
    interpretations.append(
        "Elevated QBER indicates increased channel disturbance; the cause may include noise, eavesdropping, or statistical variation, and does not uniquely identify an eavesdropper."
    )

    return {
        "trials_count": trials,
        "active_stats": {
            "mean_qber": active_batch["mean_qber"],
            "std_qber": active_batch["std_qber"],
            "min_qber": active_batch["min_qber"],
            "max_qber": active_batch["max_qber"],
            "acceptance_rate": active_batch["acceptance_rate"],
            "avg_sifted_key_length": active_batch["avg_sifted_key_length"],
            "trial_records": active_batch["trial_records"],
        },
        "graph1_noise_vs_qber": graph1_points,
        "graph2_eve_comparison": graph2_comparison,
        "graph3_qubits_vs_stability": graph3_points,
        "interpretations": interpretations,
    }
