import React, { useState } from 'react'

export default function QBEREstimationVisualizer({
  qber = 0,
  errors = 0,
  compared = 0,
  siftedLength = 0,
  threshold = 11.0,
  keyAccepted = true,
}) {
  const [activeTab, setActiveTab] = useState('gauge') // 'gauge' | 'sampling' | 'proof'

  const qberPct = qber
  // Angle for radial gauge: from -90 deg (0%) to +90 deg (20%)
  const maxScale = 20.0
  const needleAngle = Math.min(90, Math.max(-90, -90 + (Math.min(qberPct, maxScale) / maxScale) * 180))
  const threshAngle = -90 + (threshold / maxScale) * 180

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">PARAMETER ESTIMATION</span>
          <h4>Quantum Bit Error Rate (QBER) Gauge &amp; Decision Boundary</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeTab === 'gauge' ? 'active' : ''}`}
            onClick={() => setActiveTab('gauge')}
          >
            QBER Radial Gauge
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'sampling' ? 'active' : ''}`}
            onClick={() => setActiveTab('sampling')}
          >
            Sample Decomposition
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'proof' ? 'active' : ''}`}
            onClick={() => setActiveTab('proof')}
          >
            11% Security Proof
          </button>
        </div>
      </div>

      <div className="vis-body">
        {activeTab === 'gauge' && (
          <div className="qber-gauge-layout">
            {/* SVG Arc Gauge */}
            <div className="gauge-svg-wrapper">
              <svg viewBox="0 0 240 140" className="gauge-svg" style={{ width: '100%', height: 'auto', maxHeight: 150 }}>
                {/* Arc Track Background */}
                <path d="M 30 120 A 90 90 0 0 1 210 120" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />

                {/* Safe Zone (0% to 11%) */}
                <path
                  d="M 30 120 A 90 90 0 0 1 129 30"
                  fill="none"
                  stroke="#86efac"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Threat Zone (11% to 20%) */}
                <path
                  d="M 129 30 A 90 90 0 0 1 210 120"
                  fill="none"
                  stroke="#fca5a5"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Threshold Cutoff Notch (11%) */}
                <line
                  x1={120 + 78 * Math.cos((threshAngle * Math.PI) / 180)}
                  y1={120 + 78 * Math.sin((threshAngle * Math.PI) / 180)}
                  x2={120 + 102 * Math.cos((threshAngle * Math.PI) / 180)}
                  y2={120 + 102 * Math.sin((threshAngle * Math.PI) / 180)}
                  stroke="#dc2626"
                  strokeWidth="3"
                />
                <text
                  x={120 + 115 * Math.cos((threshAngle * Math.PI) / 180)}
                  y={120 + 115 * Math.sin((threshAngle * Math.PI) / 180) + 4}
                  fill="#dc2626"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  11%
                </text>

                {/* Needle */}
                <g transform={`rotate(${needleAngle}, 120, 120)`}>
                  <line x1="120" y1="120" x2="120" y2="40" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="120" cy="120" r="7" fill="#0f172a" />
                  <circle cx="120" cy="120" r="3" fill="#ffffff" />
                </g>

                {/* Scale Labels */}
                <text x="30" y="136" fill="#64748b" fontSize="9" textAnchor="middle">0%</text>
                <text x="120" y="22" fill="#64748b" fontSize="9" textAnchor="middle">10%</text>
                <text x="210" y="136" fill="#64748b" fontSize="9" textAnchor="middle">20%</text>
              </svg>

              <div className="gauge-readout">
                <div className="readout-val" style={{ color: keyAccepted ? 'var(--success)' : 'var(--danger)' }}>
                  {qberPct.toFixed(2)}%
                </div>
                <div className="readout-sub">Measured Error Rate</div>
              </div>
            </div>

            {/* Decision Status Matrix */}
            <div className="gauge-status-matrix">
              <div className="matrix-decision-box" style={{
                background: keyAccepted ? '#f0fdf4' : '#fee2e2',
                border: `1px solid ${keyAccepted ? '#86efac' : '#fca5a5'}`
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: keyAccepted ? '#15803d' : '#b91c1c' }}>
                  {keyAccepted ? '✓ CHANNEL SECURE: KEY ACCEPTED' : '✗ THREAT DETECTED: PROTOCOL ABORTED'}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: 4, color: keyAccepted ? '#166534' : '#991b1b', lineHeight: 1.5 }}>
                  {keyAccepted ? (
                    <>Observed error rate ({qberPct.toFixed(2)}%) is below the 11.0% bound. Alice &amp; Bob hold more mutual information than any potential eavesdropper. Privacy amplification can eliminate Eve's partial correlation.</>
                  ) : (
                    <>Observed error rate ({qberPct.toFixed(2)}%) violates the 11.0% bound. Eve may possess excessive mutual information. Sifted key is discarded to safeguard image secrecy.</>
                  )}
                </div>
              </div>

              <div className="error-math-summary">
                <div className="math-row">
                  <span>Sacrificed Sample Bits:</span>
                  <strong>{compared} bits</strong>
                </div>
                <div className="math-row">
                  <span>Detected Bit Errors:</span>
                  <strong style={{ color: errors > 0 ? '#b45309' : 'inherit' }}>{errors} bits</strong>
                </div>
                <div className="math-row">
                  <span>Asymptotic Security Threshold:</span>
                  <strong>{threshold.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sampling' && (
          <div className="sampling-decomposition-view">
            <div className="sampling-bar-split">
              <div className="split-portion test-portion" style={{ width: '35%' }}>
                <span>Parameter Estimation Sample (~35%)</span>
                <strong>{compared} bits (Publicly Compared &amp; Sacrificed)</strong>
              </div>
              <div className="split-portion secret-portion" style={{ width: '65%' }}>
                <span>Secret Key Reserve (~65%)</span>
                <strong>{Math.max(0, siftedLength - compared)} bits (Retained for AES-GCM)</strong>
              </div>
            </div>
            <p className="vis-caption" style={{ marginTop: 12 }}>
              To test the quantum channel without compromising the final key, Alice and Bob choose a random subset of their sifted positions and reveal them publicly. Once revealed, those sample bits are permanently discarded.
            </p>
          </div>
        )}

        {activeTab === 'proof' && (
          <div className="proof-explanation-box" style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.6 }}>
            <h5 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>
              Why is 11% the Fundamental Boundary? (Shor-Preskill Theorem, 2000)
            </h5>
            <p>
              Under quantum information theory, the asymptotic secret key rate $R$ against arbitrary collective eavesdropping attacks is given by the Devetak-Winter formula:
            </p>
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', border: '1px solid #cbd5e1', margin: '8px 0', textAlign: 'center' }}>
              R ≥ 1 - 2 · H₂(QBER) &gt; 0
            </div>
            <p>
              where $H_2(p) = -p\log_2(p) - (1-p)\log_2(1-p)$ is the binary Shannon entropy function.
              Solving $1 - 2H_2(e) = 0$ yields the critical threshold:
            </p>
            <div style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', border: '1px solid #bfdbfe', margin: '6px 0', textAlign: 'center', color: '#1e40af', fontWeight: 'bold' }}>
              e_threshold ≈ 11.0028%
            </div>
            <p style={{ margin: 0 }}>
              Whenever QBER &lt; 11%, Alice and Bob's mutual information $I(A:B)$ exceeds Eve's mutual information $I(A:E)$, enabling classical error-correction and privacy amplification algorithms to extract an unconditionally secure cryptographic key.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
