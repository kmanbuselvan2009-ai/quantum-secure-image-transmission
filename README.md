# Quantum Secure Image Transmission & BB84 Research Platform

An educational and research-oriented experimental platform demonstrating **BB84 Quantum Key Distribution**, **QBER Security Analysis**, and **AES-GCM Authenticated Image Encryption**.

Built with **Qiskit/Aer** (quantum circuit simulation), **FastAPI** (Python backend), and **React/Vite** (frontend).

---

## 🔬 Core Research Question

> **"How do quantum-channel noise, eavesdropping, and finite sample size affect QBER and the probability of accepting a shared BB84 key?"**

This project bridges theoretical quantum cryptography and practical symmetric encryption. Rather than treating BB84 as an abstract black box, the platform allows controlled, repeatable experimental studies on channel disturbance and key establishment thresholds.

---

## 1. System Architecture & Scientific Separation

```
                 QUANTUM CHANNEL (KEY ESTABLISHMENT)

Alice (State Preparation)
  │
  │ Single-qubit states (|0⟩, |1⟩, |+⟩, |−⟩)
  ▼
Simulated Quantum Channel (Depolarizing / Bit-Flip / Phase-Flip noise)
  │ (Optional: Eve Intercept-Resend Attack via measurement & replacement)
  ▼
Bob (Independent Random Basis Measurement)
  │
  │ Public classical reconciliation of bases
  ▼
Basis Reconciliation & Sifted Key
  │
  │ Parameter estimation subset comparison
  ▼
QBER Calculation & Security Decision (11% Asymptotic Threshold)
  │
  ▼
Shared BB84 Secret Key Material

═══════════════════════════════════════════════════════════════════

                 CLASSICAL CHANNEL (DATA TRANSMISSION)

Original Image
  │
  ▼
Raw Image Bytes
  │
  ▼
HKDF-SHA256 Key Derivation (from BB84 secret key)
  │
  ▼
AES-GCM Authenticated Encryption (256-bit key, 96-bit nonce)
  │
  ▼
Encrypted Image (Ciphertext + Nonce + Tag)
  │
  ▼
Public Classical Channel (Internet / Network)
  │ (Optional: Tampering demo with 1-byte ciphertext flip)
  ▼
Bob
  │
  ▼
AES-GCM Tag Verification & Decryption
  │
  ▼
Recovered Image Bytes (SHA-256 Bit-for-bit Integrity Verification)
```

**Key Architectural Invariants:**
1. **The image is NEVER transmitted through the quantum channel.** Only quantum states establishing cryptographic keys pass through BB84.
2. **BB84 establishes shared key material; AES-GCM performs bulk image encryption.**
3. **If Eve taps the classical channel, she sees only ciphertext** indistinguishable from pseudorandom noise without the secret key.
4. **Secret key bytes are never sent to the browser or logged in the console.**

---

## 2. Research Lab — Experimental Studies

The platform features a dedicated **Experiment Lab** executing independent Monte Carlo trials on local Qiskit Aer circuits:

### Experiment A — Effect of Channel Noise on QBER
- **Independent Variable**: Channel noise probability (0% to 20%)
- **Models**: Depolarizing noise, Pauli Bit-Flip ($X$), Pauli Phase-Flip ($Z$)
- **Measurements**: Mean QBER, Standard Deviation ($\sigma$), Min/Max Range, and Key Acceptance Rate (%)
- **Visuals**: Noise vs Mean QBER curve with error bars representing empirical standard deviation $\pm 1\sigma$ and an asymptotic 11% security threshold line.

### Experiment B — Eavesdropping Impact (Controlled Study)
- **Comparison**: Eve OFF vs Eve ON under identical parameters (same qubit count, channel noise, and trial count).
- **Physical Mechanism**: Eve measures each qubit in a random basis ($Z$ or $X$), collapsing superpositions and preparing replacement states. This induces ~25% disturbance in matching bases.
- **Interpretation Rule**: *Elevated QBER indicates channel disturbance; it does not uniquely prove Eve's presence without channel characterization.*

### Experiment C — Finite Sample Size Effects on QBER Estimation
- **Evaluated Qubit Counts**: 16, 64, 256, 1024
- **Statistical Observation**: Small sample sizes (e.g., 16 qubits) exhibit substantial statistical fluctuations and large variance in QBER estimates. Larger samples tightly bound estimation variance.
- **Clarification**: *Increasing sample size stabilizes error rate estimation; it does not eliminate underlying channel disturbance.*

### Experiment D — Two-Dimensional Noise × Eve Disturbance Matrix
- **Heatmap Grid**: Evaluates compound noise and eavesdropping across parameter combinations to map key rejection boundaries.

### Reproducibility & Export
- **Random Seed Control**: Optional integer seed for repeatable pseudorandom choices across trials.
- **Data Export**: Complete trial summaries exportable as **CSV** and **JSON** for external analysis in Jupyter/R.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, JavaScript (ES Modules), Custom Academic CSS |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Quantum Simulation** | Qiskit 1.1+, Qiskit Aer 0.14+ (local statevector / density matrix backend) |
| **Cryptography** | Python `cryptography` (PyCA), AES-GCM (256-bit), HKDF-SHA256 |
| **Image Processing** | Pillow (PIL), NumPy |
| **Testing** | Pytest, FastAPI TestClient |

---

## 4. Installation & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## 5. Running the Application

### 1. Start the Backend Server
```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs at: `http://localhost:8000` (Swagger docs at `/docs`)

### 2. Start the Frontend Server
```bash
cd frontend
npm run dev
```
Access the application in your browser at: `http://localhost:5173` (or port indicated in terminal)

### 3. Run Backend Test Suite
```bash
cd backend
.\.venv\Scripts\activate
pytest -v
```

---

## 6. Research Limitations

> **This project is an educational and exploratory simulation of BB84 and does not constitute a formal security proof or production QKD implementation.**

- **Idealized Assumptions**: Single-photon states are assumed. Physical optical fibers, detector dark counts, afterpulsing, and chromatic dispersion are modeled using abstract quantum noise channels.
- **Cascade & Privacy Amplification**: In full QKD implementations, post-processing requires parity-check error correction (Cascade/LDPC) and privacy amplification (2-universal hashing) to compress leaked mutual information.
- **Classical Channel Authentication**: The BB84 basis reconciliation stage assumes an authenticated classical channel to prevent Man-in-the-Middle attacks.
- **Educational Decision Rule**: The 11% QBER threshold is an educational cutoff derived from asymptotic BB84 security limits under collective attacks, not an unconditional finite-key security proof.

---

## 7. Future Research Directions

- **Decoy-State Protocol**: Modeling weak coherent laser pulses to mitigate Photon-Number-Splitting (PNS) attacks.
- **Entanglement-based QKD (E91)**: Establishing EPR pairs and testing Bell inequality violation ($CHSH \le 2$).
- **Post-Processing Pipeline**: Implementation of the Cascade error-correction algorithm and Toeplitz matrix privacy amplification.
- **Multi-node Quantum Networks**: Simulating quantum repeater networks and entanglement routing.

---

## Git Repository

```text
https://github.com/kmanbuselvan2009-ai/quantum-secure-image-transmission.git
```

*Built as a university-level research platform. Not for commercial production deployment.*
