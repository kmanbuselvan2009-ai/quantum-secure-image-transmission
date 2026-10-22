from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.bb84 import run_batch_simulation, NoiseType


class NoiseModelCompRequest(BaseModel):
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_level: float = Field(0.05, ge=0.0, le=0.5)
    eve_enabled: bool = False
    trials: int = Field(15, ge=1, le=100)
    random_seed: Optional[int] = None
    threshold: float = Field(11.0, ge=1.0, le=50.0)


class KeyAcceptanceRequest(BaseModel):
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_level: float = Field(0.08, ge=0.0, le=0.5)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    eve_enabled: bool = False
    trials: int = Field(25, ge=1, le=100)
    threshold: float = Field(11.0, ge=1.0, le=50.0)
    random_seed: Optional[int] = None


class StatisticalReliabilityRequest(BaseModel):
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_level: float = Field(0.05, ge=0.0, le=0.5)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    eve_enabled: bool = False
    trial_counts: list[int] = Field(default=[10, 25, 50, 100])
    threshold: float = Field(11.0, ge=1.0, le=50.0)
    random_seed: Optional[int] = None


def run_noise_model_comparison(req: NoiseModelCompRequest) -> dict:
    models = ["depolarizing", "bit_flip", "phase_flip"]
    results = []
    for m in models:
        sim = run_batch_simulation(
            n_qubits=req.n_qubits,
            noise_level=req.noise_level,
            noise_type=m,  # type: ignore
            eve_enabled=req.eve_enabled,
            trials=req.trials,
            base_seed=req.random_seed,
        )
        # Recalculate acceptance under custom threshold
        accepted_count = sum(1 for tr in sim["trial_records"] if tr["qber"] < req.threshold)
        acceptance_rate = round((accepted_count / req.trials) * 100.0, 1)

        results.append({
            "noise_model": m,
            "mean_qber": sim["mean_qber"],
            "std_qber": sim["std_qber"],
            "min_qber": sim["min_qber"],
            "max_qber": sim["max_qber"],
            "acceptance_rate": acceptance_rate,
            "avg_sifted_key_length": sim["avg_sifted_key_length"],
            "trial_records": sim["trial_records"],
        })
    return {
        "experiment_name": "Noise Model Comparison",
        "parameters": req.model_dump(),
        "models": results,
    }


def run_key_acceptance_analysis(req: KeyAcceptanceRequest) -> dict:
    sim = run_batch_simulation(
        n_qubits=req.n_qubits,
        noise_level=req.noise_level,
        noise_type=req.noise_model,
        eve_enabled=req.eve_enabled,
        trials=req.trials,
        base_seed=req.random_seed,
    )
    records = []
    accepted_count = 0
    for tr in sim["trial_records"]:
        is_acc = tr["qber"] < req.threshold
        if is_acc:
            accepted_count += 1
        records.append({
            "trial": tr["trial"],
            "qber": tr["qber"],
            "errors": tr["errors"],
            "compared": tr["compared"],
            "sifted_length": tr["sifted_length"],
            "accepted": is_acc,
        })

    acceptance_rate = round((accepted_count / req.trials) * 100.0, 1)
    rejection_rate = round(100.0 - acceptance_rate, 1)

    return {
        "experiment_name": "Key Acceptance Analysis",
        "parameters": req.model_dump(),
        "threshold": req.threshold,
        "mean_qber": sim["mean_qber"],
        "std_qber": sim["std_qber"],
        "acceptance_rate": acceptance_rate,
        "rejection_rate": rejection_rate,
        "accepted_trials": accepted_count,
        "total_trials": req.trials,
        "trial_records": records,
    }


def run_statistical_reliability(req: StatisticalReliabilityRequest) -> dict:
    runs = []
    for tc in req.trial_counts:
        sim = run_batch_simulation(
            n_qubits=req.n_qubits,
            noise_level=req.noise_level,
            noise_type=req.noise_model,
            eve_enabled=req.eve_enabled,
            trials=tc,
            base_seed=req.random_seed,
        )
        accepted_count = sum(1 for tr in sim["trial_records"] if tr["qber"] < req.threshold)
        acceptance_rate = round((accepted_count / tc) * 100.0, 1)
        runs.append({
            "trial_count": tc,
            "mean_qber": sim["mean_qber"],
            "std_qber": sim["std_qber"],
            "min_qber": sim["min_qber"],
            "max_qber": sim["max_qber"],
            "qber_range": round(sim["max_qber"] - sim["min_qber"], 2),
            "acceptance_rate": acceptance_rate,
            "trial_records": sim["trial_records"],
        })
    return {
        "experiment_name": "Statistical Reliability Study",
        "parameters": req.model_dump(),
        "runs": runs,
    }
