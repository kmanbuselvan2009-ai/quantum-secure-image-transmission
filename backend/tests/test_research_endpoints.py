import pytest
from app.research_experiments import (
    NoiseModelCompRequest,
    KeyAcceptanceRequest,
    StatisticalReliabilityRequest,
    run_noise_model_comparison,
    run_key_acceptance_analysis,
    run_statistical_reliability,
)

def test_run_noise_model_comparison():
    req = NoiseModelCompRequest(
        n_qubits=32,
        noise_level=0.05,
        eve_enabled=False,
        trials=3,
        threshold=11.0,
        random_seed=42,
    )
    res = run_noise_model_comparison(req)
    assert res["experiment_name"] == "Noise Model Comparison"
    assert len(res["models"]) == 3
    model_names = [m["noise_model"] for m in res["models"]]
    assert "depolarizing" in model_names
    assert "bit_flip" in model_names
    assert "phase_flip" in model_names
    for m in res["models"]:
        assert "mean_qber" in m
        assert "std_qber" in m
        assert "acceptance_rate" in m
        assert len(m["trial_records"]) == 3

def test_run_key_acceptance_analysis():
    req = KeyAcceptanceRequest(
        n_qubits=32,
        noise_level=0.18,
        noise_model="depolarizing",
        eve_enabled=True,
        trials=5,
        threshold=11.0,
        random_seed=42,
    )
    res = run_key_acceptance_analysis(req)
    assert res["experiment_name"] == "Key Acceptance Analysis"
    assert res["threshold"] == 11.0
    assert res["total_trials"] == 5
    assert res["acceptance_rate"] + res["rejection_rate"] == 100.0
    assert len(res["trial_records"]) == 5

def test_run_statistical_reliability():
    req = StatisticalReliabilityRequest(
        n_qubits=32,
        noise_level=0.04,
        noise_model="depolarizing",
        eve_enabled=False,
        trial_counts=[2, 4],
        threshold=11.0,
        random_seed=42,
    )
    res = run_statistical_reliability(req)
    assert res["experiment_name"] == "Statistical Reliability Study"
    assert len(res["runs"]) == 2
    assert res["runs"][0]["trial_count"] == 2
    assert res["runs"][1]["trial_count"] == 4
    for r in res["runs"]:
        assert "mean_qber" in r
        assert "std_qber" in r
        assert "qber_range" in r
