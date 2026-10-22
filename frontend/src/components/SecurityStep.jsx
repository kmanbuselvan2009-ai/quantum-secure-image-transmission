import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import QBEREstimationVisualizer from './visualizers/QBEREstimationVisualizer.jsx'
import AnalogQBERGauge from './visualizers/AnalogQBERGauge.jsx'

const THRESHOLD = 11.0

export default function SecurityStep({ state, data, keyAccepted, keySummary, onNext, onAdvanceToResearch, onReset }) {
  const { qber, qber_errors, qber_compared, sifted_key_length, n_qubits } = data
  const [showAnalysis, setShowAnalysis] = useState(false)

  const qberDisplay = qber.toFixed(2)
  const pct = Math.min(qber / 20.0, 1.0) * 100   // scale to 20% max for bar
  const thresholdPct = (THRESHOLD / 20.0) * 100

  const barColor = keyAccepted ? 'var(--success)' : 'var(--danger)'

  const summary = keyAccepted
    ? `QBER: ${qberDisplay}% — Key accepted (threshold: ${THRESHOLD}%)`
    : `QBER: ${qberDisplay}% — Key rejected (threshold: ${THRESHOLD}%)`

  return (
    <StepCard
      state={state}
      number="05"
      title="Is the quantum channel trustworthy?"
      summary={summary}
    >
      <p>
        To verify channel integrity, Alice and Bob compare a random sample of their sifted
        key bits. If Alice and Bob used the same basis, their bits should normally agree.
        A high disagreement rate — called the Quantum Bit Error Rate (QBER) — suggests
        excessive noise or possible eavesdropping.
      </p>

      <div style={{ margin: '20px 0', padding: '0 12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          QBER = (bit errors / compared bits) × 100
        </div>
      </div>

      {/* Scientific Radial Gauge & Decision Boundary */}
      <QBEREstimationVisualizer
        qber={qber}
        errors={qber_errors}
        compared={qber_compared}
        siftedLength={sifted_key_length}
        threshold={THRESHOLD}
        keyAccepted={keyAccepted}
      />

      {/* High-Precision Analog Gauge & Interactive Eve Sandbox */}
      <div style={{ margin: '24px 0' }}>
        <AnalogQBERGauge
          qber={qber / 100.0}
          threshold={0.11}
          channelNoise={qber / 100.0}
          eveActive={!keyAccepted}
          interactiveSandbox={true}
        />
      </div>

      {/* QBER Display */}
      <div className="qber-display">
        <div
          className="qber-value"
          style={{ color: keyAccepted ? 'var(--success)' : 'var(--danger)' }}
        >
          {qberDisplay}%
        </div>
        <div className="qber-label">Observed QBER</div>

        <div className="qber-bar-container">
          <div className="qber-bar-track">
            <div
              className="qber-bar-fill"
              style={{ width: `${pct}%`, background: barColor }}
            />
            <div
              className="qber-threshold-marker"
              style={{ left: `${thresholdPct}%` }}
            >
              <div className="qber-threshold-label">{THRESHOLD}% threshold</div>
            </div>
          </div>
          <div className="qber-bar-labels">
            <span>0%</span>
            <span>10%</span>
            <span>20%</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Sifted key bits</div>
          <div className="stat-value">{sifted_key_length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Sample compared</div>
          <div className="stat-value">{qber_compared}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Bit errors</div>
          <div className="stat-value" style={{ color: qber_errors > 0 ? 'var(--warning)' : 'inherit' }}>
            {qber_errors}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Threshold</div>
          <div className="stat-value">{THRESHOLD}%</div>
        </div>
      </div>

      {/* Decision */}
      {keyAccepted ? (
        <>
          <div className="alert alert-success">
            <div className="alert-title">✓ Channel disturbance is below threshold</div>
            Channel error rate is {qberDisplay}%, which is below the {THRESHOLD}% security limit.
            Key material is accepted.
          </div>

          <div style={{ margin: '20px 0' }}>
            <p className="section-heading">Shared key material established</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              A 256-bit AES encryption key will be derived from the remaining sifted bits using HKDF-SHA256.
              The secret key is never displayed or transmitted.
            </p>
            <div className="key-dots">
              <span className="masked-key">
                ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              </span>
              <div style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                KDF: {keySummary?.kdf} → {keySummary?.derived_key_bits}-bit AES key
              </div>
            </div>
          </div>

          {onNext && (
            <div className="btn-row">
              <button className="btn btn-primary" onClick={onNext}>
                Encrypt the image →
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="alert alert-danger">
            <div className="alert-title">Channel disturbance is too high — Key Rejected</div>
            The observed QBER ({qberDisplay}%) exceeds the educational threshold of {THRESHOLD}%.
            The shared key is rejected. Image encryption and transmission cannot proceed with compromised key material.
          </div>

          <div className="alert alert-warning" style={{ marginTop: 12 }}>
            <div className="alert-title">Disturbance Attribution Note</div>
            Possible causes include channel noise or eavesdropping. This single measurement does not
            conclusively distinguish between the two without systematic parameter analysis.
          </div>

          {/* Deep Security Rejection Analysis */}
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              {showAnalysis ? 'Hide Detailed Disturbance Analysis ▲' : 'Show Detailed Disturbance Analysis ▼'}
            </button>
          </div>

          {showAnalysis && (
            <div style={{
              marginTop: 14,
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: '#334155',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>
                Scientific Breakdown: Why Key Establishment Failed
              </div>
              <ul style={{ paddingLeft: 20, margin: '6px 0' }}>
                <li>
                  <strong>Bit Disagreement Rate:</strong> Out of {qber_compared} compared sample bits, {qber_errors} bit errors were observed ({qberDisplay}% QBER).
                </li>
                <li>
                  <strong>Information-Theoretic Bound:</strong> Under collective attacks, if QBER &ge; 11%, an eavesdropper's mutual information $I(A:E)$ can exceed the legal parties' mutual information $I(A:B)$, rendering classical privacy amplification impossible.
                </li>
                <li>
                  <strong>Security Enforcement:</strong> Because unconditional security cannot be guaranteed, the key material has been purged to prevent insecure image transmission.
                </li>
              </ul>
              <div style={{ marginTop: 10, fontSize: '0.8125rem', color: '#64748b' }}>
                <em>Tip: You can investigate how noise and Eve affected this threshold by proceeding directly to the Research Analysis lab.</em>
              </div>
            </div>
          )}

          <p className="note" style={{ marginTop: 14 }}>
            The 11% threshold is an educational decision rule based on asymptotic BB84 security
            limits and is not a complete formal security proof.
            {n_qubits <= 64 && (
              <> With a small number of compared bits, QBER can vary significantly due to statistical fluctuations.</>
            )}
          </p>

          <div className="btn-row" style={{ marginTop: 16 }}>
            {onAdvanceToResearch && (
              <button className="btn btn-primary" onClick={onAdvanceToResearch}>
                Proceed to Research Analysis Lab →
              </button>
            )}
            {onReset && (
              <button className="btn btn-secondary" onClick={onReset}>
                ← Start a new experiment
              </button>
            )}
          </div>
        </>
      )}
    </StepCard>
  )
}
