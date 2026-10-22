"""
FastAPI backend — Quantum Secure Image Transmission & BB84 Research Suite

Endpoints:
  POST /api/experiment    — Run guided BB84 experiment + AES-GCM image encryption
  POST /api/decrypt       — Bob decrypts image using derived AES key
  POST /api/tamper        — Tamper with ciphertext byte to demonstrate AES-GCM rejection
  POST /api/research/sweep — Run noise sweep experiment across multiple noise points with trials
  POST /api/research/eve-study — Controlled Eve ON vs OFF experiment across trials
  POST /api/research/sample-size — Effect of qubit count on QBER estimation & variance
  POST /api/research/matrix2d — 2D Noise x Eve matrix study
  GET  /api/health        — Health check
"""

import base64
import io
import logging
from typing import Optional, Literal
from pydantic import BaseModel, Field

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from app.bb84 import run_bb84_experiment, run_batch_simulation, NoiseType
from app.experiments import run_trials_and_benchmarks
from app.encryption import (
    decrypt_image,
    encrypt_image,
    get_plaintext_preview,
    sha256_hex,
    tamper_ciphertext,
)
from app.key_processing import derive_aes_key, sifted_key_summary

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Quantum Secure Image Transmission & Research Suite",
    description="BB84 QKD, QBER security analysis, AES-GCM image encryption, and Research Lab",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sessions: dict[str, dict] = {}


def _generate_session_id() -> str:
    import secrets
    return secrets.token_urlsafe(24)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/experiment")
async def run_experiment(
    image: UploadFile = File(...),
    n_qubits: int = Form(256),
    noise_level: float = Form(0.05),
    noise_type: str = Form("depolarizing"),
    eve_enabled: bool = Form(False),
    trials: int = Form(1),
    seed: Optional[int] = Form(None),
):
    """
    Run the full guided BB84 experiment and encrypt the uploaded image.
    """
    if n_qubits < 16 or n_qubits > 8192:
        raise HTTPException(status_code=400, detail="n_qubits must be between 16 and 8192")
    if not (0.0 <= noise_level <= 1.0):
        raise HTTPException(status_code=400, detail="noise_level must be in [0.0, 1.0]")
    if noise_type not in ["depolarizing", "bit_flip", "phase_flip"]:
        noise_type = "depolarizing"

    allowed_types = {"image/png", "image/jpeg", "image/jpg"}
    content_type = image.content_type or ""
    if content_type not in allowed_types and not image.filename.lower().endswith(
        (".png", ".jpg", ".jpeg")
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Please upload PNG or JPG.",
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img.verify()
        pil_img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = pil_img.size
        img_format = pil_img.format or "UNKNOWN"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    original_sha256 = sha256_hex(image_bytes)
    file_size_mb = round(len(image_bytes) / (1024 * 1024), 2)

    try:
        bb84_result = run_bb84_experiment(
            n_qubits=n_qubits,
            noise_level=noise_level,
            noise_type=noise_type,  # type: ignore
            eve_enabled=eve_enabled,
            seed=seed,
            trace_qubits_limit=24,
        )
    except Exception as e:
        logger.exception("BB84 simulation error")
        raise HTTPException(status_code=500, detail=f"Quantum simulation error: {str(e)}")

    raw_sifted_key = bb84_result.pop("_raw_sifted_key")
    key_summary = sifted_key_summary(raw_sifted_key)

    encryption_result = None
    session_id = None

    if bb84_result["key_accepted"]:
        try:
            aes_key = derive_aes_key(raw_sifted_key)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Key derivation failed: {str(e)}"
            )

        try:
            enc = encrypt_image(image_bytes, aes_key)
        except Exception as e:
            logger.exception("Encryption error")
            raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")

        session_id = _generate_session_id()
        _sessions[session_id] = {
            "aes_key": aes_key,
            "nonce": enc["nonce_bytes"],
            "ciphertext_with_tag": enc["ciphertext_with_tag"],
            "original_image_bytes": image_bytes,
            "original_sha256": original_sha256,
            "image_filename": image.filename,
            "img_width": img_width,
            "img_height": img_height,
        }

        thumb = pil_img.copy()
        thumb.thumbnail((400, 400))
        thumb_buf = io.BytesIO()
        thumb_format = "PNG" if img_format in ("PNG", "UNKNOWN") else "JPEG"
        thumb.save(thumb_buf, format=thumb_format)
        image_preview_b64 = base64.b64encode(thumb_buf.getvalue()).decode()

        encryption_result = {
            "nonce_hex": enc["nonce_hex"],
            "tag_hex": enc["tag_hex"],
            "plaintext_size": enc["plaintext_size"],
            "ciphertext_size": enc["ciphertext_size"],
            "first_32_bytes_plaintext_hex": enc["first_32_bytes_plaintext_hex"],
            "first_32_bytes_ciphertext_hex": enc["first_32_bytes_ciphertext_hex"],
            "image_preview_b64": image_preview_b64,
            "image_preview_mime": f"image/{thumb_format.lower()}",
        }
    else:
        pil_img_mini = pil_img.copy()
        pil_img_mini.thumbnail((400, 400))
        buf = io.BytesIO()
        fmt = pil_img.format if pil_img.format else "JPEG"
        pil_img_mini.save(buf, format=fmt)
        image_preview_b64 = base64.b64encode(buf.getvalue()).decode()
        encryption_result = None

    # Compute empirical research analysis and comparative graphs for the same guided experiment
    research_data = run_trials_and_benchmarks(
        n_qubits=n_qubits,
        noise_level=noise_level,
        noise_type=noise_type,  # type: ignore
        eve_enabled=eve_enabled,
        trials=trials,
        base_seed=seed,
    )

    response = {
        "session_id": session_id,
        "image_info": {
            "filename": image.filename,
            "file_size_mb": file_size_mb,
            "file_size_bytes": len(image_bytes),
            "width": img_width,
            "height": img_height,
            "format": img_format,
            "sha256": original_sha256,
            "first_32_bytes_hex": get_plaintext_preview(image_bytes, 32),
            "first_64_bytes_hex": get_plaintext_preview(image_bytes, 64),
            "first_128_bytes_hex": get_plaintext_preview(image_bytes, 128),
        },
        "bb84": bb84_result,
        "key_summary": key_summary,
        "encryption": encryption_result,
        "research": research_data,
        "image_preview_b64": image_preview_b64 if not bb84_result["key_accepted"] else encryption_result["image_preview_b64"],
        "image_preview_mime": (
            f"image/{(pil_img.format or 'jpeg').lower()}"
            if not bb84_result["key_accepted"]
            else encryption_result["image_preview_mime"]
        ),
    }

    return JSONResponse(content=response)


@app.post("/api/decrypt")
async def decrypt_endpoint(session_id: str = Form(...)):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    aes_key = session["aes_key"]
    nonce = session["nonce"]
    ciphertext_with_tag = session["ciphertext_with_tag"]
    original_bytes = session["original_image_bytes"]
    original_sha256 = session["original_sha256"]

    recovered, success = decrypt_image(ciphertext_with_tag, nonce, aes_key)

    if not success:
        return JSONResponse(
            content={
                "success": False,
                "auth_success": False,
                "message": "AES-GCM authentication failed. Decryption rejected.",
            }
        )

    recovered_sha256 = sha256_hex(recovered)
    integrity_match = recovered_sha256 == original_sha256

    try:
        rec_img = Image.open(io.BytesIO(recovered))
        rec_img.thumbnail((400, 400))
        buf = io.BytesIO()
        fmt = rec_img.format if rec_img.format else "JPEG"
        rec_img.save(buf, format=fmt)
        recovered_preview_b64 = base64.b64encode(buf.getvalue()).decode()
        recovered_preview_mime = f"image/{fmt.lower()}"
    except Exception:
        recovered_preview_b64 = ""
        recovered_preview_mime = "image/jpeg"

    return JSONResponse(
        content={
            "success": True,
            "auth_success": True,
            "decryption_success": True,
            "recovered_sha256": recovered_sha256,
            "original_sha256": original_sha256,
            "integrity_match": integrity_match,
            "recovered_size_bytes": len(recovered),
            "recovered_preview_b64": recovered_preview_b64,
            "recovered_preview_mime": recovered_preview_mime,
        }
    )


@app.post("/api/tamper")
async def tamper_endpoint(session_id: str = Form(...)):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    aes_key = session["aes_key"]
    nonce = session["nonce"]
    original_ct = session["ciphertext_with_tag"]

    tampered_ct = tamper_ciphertext(original_ct)
    _, success = decrypt_image(tampered_ct, nonce, aes_key)

    return JSONResponse(
        content={
            "tampered": True,
            "auth_success": success,
            "message": (
                "Authentication succeeded (unexpected — possible bug)."
                if success
                else "Authentication failed. AES-GCM correctly rejected the tampered ciphertext."
            ),
        }
    )


# ============================================================
# RESEARCH LAB EXPERIMENT ENDPOINTS
# ============================================================

class NoiseSweepRequest(BaseModel):
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    start_noise: float = Field(0.0, ge=0.0, le=0.5)
    end_noise: float = Field(0.20, ge=0.0, le=0.5)
    step_noise: float = Field(0.04, ge=0.005, le=0.2)
    trials: int = Field(20, ge=1, le=150)
    eve_enabled: bool = False
    random_seed: Optional[int] = None


@app.post("/api/research/sweep")
def research_noise_sweep(req: NoiseSweepRequest):
    """
    Experiment A: Effect of Channel Noise on QBER
    Performs real Qiskit repeated trials across a range of noise values.
    """
    points = []
    curr = req.start_noise
    # Generate noise steps
    noise_values = []
    while curr <= (req.end_noise + 1e-5):
        noise_values.append(round(curr, 4))
        curr += req.step_noise

    for noise_val in noise_values:
        res = run_batch_simulation(
            n_qubits=req.n_qubits,
            noise_level=noise_val,
            noise_type=req.noise_model,
            eve_enabled=req.eve_enabled,
            trials=req.trials,
            base_seed=req.random_seed,
        )
        points.append({
            "noise_probability": round(noise_val * 100, 2),
            "mean_qber": res["mean_qber"],
            "std_qber": res["std_qber"],
            "min_qber": res["min_qber"],
            "max_qber": res["max_qber"],
            "acceptance_rate": res["acceptance_rate"],
            "avg_sifted_key_length": res["avg_sifted_key_length"],
            "trial_records": res["trial_records"],
        })

    return {
        "experiment_name": "Channel Noise vs QBER",
        "parameters": req.model_dump(),
        "points": points,
        "security_threshold": 11.0,
    }


class EveStudyRequest(BaseModel):
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_level: float = Field(0.05, ge=0.0, le=0.5)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    trials: int = Field(20, ge=1, le=150)
    random_seed: Optional[int] = None


@app.post("/api/research/eve-study")
def research_eve_study(req: EveStudyRequest):
    """
    Experiment B: Effect of Intercept-Resend Eavesdropping on QBER
    Controlled comparison: Eve OFF vs Eve ON with identical parameters.
    """
    case_off = run_batch_simulation(
        n_qubits=req.n_qubits,
        noise_level=req.noise_level,
        noise_type=req.noise_model,
        eve_enabled=False,
        trials=req.trials,
        base_seed=req.random_seed,
    )
    case_on = run_batch_simulation(
        n_qubits=req.n_qubits,
        noise_level=req.noise_level,
        noise_type=req.noise_model,
        eve_enabled=True,
        trials=req.trials,
        base_seed=(req.random_seed + 1000) if req.random_seed else None,
    )

    return {
        "experiment_name": "Eavesdropping Impact on QBER",
        "parameters": req.model_dump(),
        "case_eve_off": case_off,
        "case_eve_on": case_on,
        "security_threshold": 11.0,
    }


class SampleSizeRequest(BaseModel):
    qubit_counts: list[int] = Field(default=[16, 64, 256, 1024, 4096])
    noise_level: float = Field(0.05, ge=0.0, le=0.5)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    eve_enabled: bool = False
    trials: int = Field(15, ge=1, le=100)
    random_seed: Optional[int] = None


@app.post("/api/research/sample-size")
def research_sample_size(req: SampleSizeRequest):
    """
    Experiment C: Effect of Sample Size on QBER Estimation and Variance
    Evaluates how standard deviation of QBER decreases with larger sample sizes.
    """
    results = []
    for q_count in req.qubit_counts:
        sim_res = run_batch_simulation(
            n_qubits=q_count,
            noise_level=req.noise_level,
            noise_type=req.noise_model,
            eve_enabled=req.eve_enabled,
            trials=req.trials,
            base_seed=req.random_seed,
        )
        results.append({
            "n_qubits": q_count,
            "mean_qber": sim_res["mean_qber"],
            "std_qber": sim_res["std_qber"],
            "min_qber": sim_res["min_qber"],
            "max_qber": sim_res["max_qber"],
            "qber_range": round(sim_res["max_qber"] - sim_res["min_qber"], 3),
            "acceptance_rate": sim_res["acceptance_rate"],
            "avg_sifted_key_length": sim_res["avg_sifted_key_length"],
            "trial_records": sim_res["trial_records"],
        })

    return {
        "experiment_name": "Sample Size vs QBER Variance",
        "parameters": req.model_dump(),
        "results": results,
    }


class Matrix2DRequest(BaseModel):
    noise_levels: list[float] = Field(default=[0.0, 0.02, 0.05, 0.10, 0.15, 0.20])
    n_qubits: int = Field(256, ge=16, le=8192)
    noise_model: Literal["depolarizing", "bit_flip", "phase_flip"] = "depolarizing"
    trials: int = Field(15, ge=1, le=50)
    random_seed: Optional[int] = None


@app.post("/api/research/matrix2d")
def research_matrix2d(req: Matrix2DRequest):
    """
    Experiment D: 2D Noise x Eve Matrix Study
    Generates a 2D grid of Mean QBER values across noise levels and Eve status.
    """
    matrix = []
    for eve_stat in [False, True]:
        row = []
        for noise_val in req.noise_levels:
            res = run_batch_simulation(
                n_qubits=req.n_qubits,
                noise_level=noise_val,
                noise_type=req.noise_model,
                eve_enabled=eve_stat,
                trials=req.trials,
                base_seed=req.random_seed,
            )
            row.append({
                "noise": round(noise_val * 100, 1),
                "eve": "ON" if eve_stat else "OFF",
                "mean_qber": res["mean_qber"],
                "std_qber": res["std_qber"],
                "acceptance_rate": res["acceptance_rate"],
                "trial_records": res["trial_records"],
            })
        matrix.append({
            "eve_status": "ON" if eve_stat else "OFF",
            "cells": row
        })

    return {
        "experiment_name": "Noise x Eve 2D Study",
        "parameters": req.model_dump(),
        "matrix": matrix,
    }


from app.research_experiments import (
    NoiseModelCompRequest,
    KeyAcceptanceRequest,
    StatisticalReliabilityRequest,
    run_noise_model_comparison,
    run_key_acceptance_analysis,
    run_statistical_reliability,
)


@app.post("/api/research/noise-models")
def api_noise_model_comparison(req: NoiseModelCompRequest):
    return run_noise_model_comparison(req)


@app.post("/api/research/key-acceptance")
def api_key_acceptance(req: KeyAcceptanceRequest):
    return run_key_acceptance_analysis(req)


@app.post("/api/research/statistical-reliability")
def api_statistical_reliability(req: StatisticalReliabilityRequest):
    return run_statistical_reliability(req)
