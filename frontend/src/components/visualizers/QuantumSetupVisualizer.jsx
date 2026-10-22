import React, { useState } from 'react'

export default function QuantumSetupVisualizer({ nQubits, noiseLevel, noiseType, eveEnabled }) {
  const [activeBasis, setActiveBasis] = useState('both') // 'both' | 'Z' | 'X'

  // Theoretical expectations based on quantum physics
  const expectedSifted = Math.round(nQubits * 0.5)
  const baseNoisePct = noiseLevel * 100
  
  // Theoretical QBER expectation
  let expectedQber = 0
  if (noiseType === 'depolarizing') {
    expectedQber += baseNoisePct * 0.5
  } else if (noiseType === 'bit_flip') {
    expectedQber += baseNoisePct * 0.5
  } else if (noiseType === 'phase_flip') {
    expectedQber += baseNoisePct * 0.5
  }
  if (eveEnabled) {
    // Intercept-resend introduces 25% error floor under matching bases
    expectedQber += 25.0 * (1 - expectedQber / 100)
  }
  const expectedQberRounded = Math.min(100, Math.max(0, expectedQber)).toFixed(1)
  const willPassThreshold = expectedQber < 11.0

  return (
    <div className="scientific-visualizer-card" style={{ marginTop: 24 }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">QUANTUM STATE SPACE</span>
          <h4>BB84 Hilbert Space &amp; Theoretical Channel Projection</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeBasis === 'both' ? 'active' : ''}`}
            onClick={() => setActiveBasis('both')}
          >
            All 4 States
          </button>
          <button
            className={`vis-tab-btn ${activeBasis === 'Z' ? 'active' : ''}`}
            onClick={() => setActiveBasis('Z')}
          >
            Z Basis {'{|0⟩, |1⟩}'}
          </button>
          <button
            className={`vis-tab-btn ${activeBasis === 'X' ? 'active' : ''}`}
            onClick={() => setActiveBasis('X')}
          >
            X Basis {'{|+⟩, |−⟩}'}
          </button>
        </div>
      </div>

      <div className="vis-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Interactive Vector Coordinate Diagram */}
        <div className="bloch-diagram-container">
          <svg viewBox="0 0 260 220" className="bloch-svg" style={{ width: '100%', height: 'auto', maxHeight: 220 }}>
            {/* Sphere outline */}
            <circle cx="130" cy="110" r="75" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
            <ellipse cx="130" cy="110" rx="75" ry="24" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />

            {/* Axes */}
            {/* Z axis (Vertical) */}
            <line x1="130" y1="20" x2="130" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <text x="138" y="24" fill="#475569" fontSize="11" fontWeight="700">|0⟩ (+Z)</text>
            <text x="138" y="202" fill="#475569" fontSize="11" fontWeight="700">|1⟩ (−Z)</text>

            {/* X axis (Equator) */}
            <line x1="45" y1="110" x2="215" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="218" y="114" fill="#475569" fontSize="11" fontWeight="700">|+⟩ (+X)</text>
            <text x="12" y="114" fill="#475569" fontSize="11" fontWeight="700">|−⟩ (−X)</text>

            {/* Center origin */}
            <circle cx="130" cy="110" r="3" fill="#64748b" />

            {/* Vectors & States */}
            {(activeBasis === 'both' || activeBasis === 'Z') && (
              <g>
                {/* |0> Vector */}
                <line x1="130" y1="110" x2="130" y2="35" stroke="#2563eb" strokeWidth="3" />
                <circle cx="130" cy="35" r="5" fill="#2563eb" />
                
                {/* |1> Vector */}
                <line x1="130" y1="110" x2="130" y2="185" stroke="#2563eb" strokeWidth="3" />
                <circle cx="130" cy="185" r="5" fill="#2563eb" />
              </g>
            )}

            {(activeBasis === 'both' || activeBasis === 'X') && (
              <g>
                {/* |+> Vector */}
                <line x1="130" y1="110" x2="205" y2="110" stroke="#7c3aed" strokeWidth="3" />
                <circle cx="205" cy="110" r="5" fill="#7c3aed" />

                {/* |-> Vector */}
                <line x1="130" y1="110" x2="55" y2="110" stroke="#7c3aed" strokeWidth="3" />
                <circle cx="55" cy="110" r="5" fill="#7c3aed" />
              </g>
            )}

            {/* Angle Indicator (45 deg non-orthogonal relation) */}
            {activeBasis === 'both' && (
              <path d="M 130 85 A 25 25 0 0 1 150 95" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="2 2" />
            )}
          </svg>
          <div className="vis-caption" style={{ textAlign: 'center', marginTop: 4 }}>
            <strong>Conjugate Bases:</strong> The Z and X bases are mutually unbiased (|⟨z|x⟩|² = 1/2). Measuring an X state in Z yields a completely random bit.
          </div>
        </div>

        {/* Theoretical Projection Dashboard */}
        <div className="theoretical-hud-container">
          <div className="hud-title">Theoretical Expectation HUD</div>
          
          <div className="hud-metric-row">
            <div className="hud-metric">
              <span className="hud-label">Expected Sifted Key</span>
              <span className="hud-value">~{expectedSifted} bits</span>
              <span className="hud-sub">Sifting efficiency: ~50%</span>
            </div>
            <div className="hud-metric">
              <span className="hud-label">Projected QBER</span>
              <span className="hud-value" style={{ color: willPassThreshold ? 'var(--success)' : 'var(--danger)' }}>
                ~{expectedQberRounded}%
              </span>
              <span className="hud-sub">Limit: 11.0%</span>
            </div>
          </div>

          <div className="hud-status-banner" style={{
            background: willPassThreshold ? 'var(--success-bg)' : 'var(--danger-bg)',
            borderColor: willPassThreshold ? 'var(--success-border)' : 'var(--danger-border)',
            color: willPassThreshold ? 'var(--success)' : 'var(--danger)'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              {willPassThreshold ? '✓ Theoretical Forecast: KEY ACCEPTANCE' : '⚠ Theoretical Forecast: KEY REJECTION'}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: 2, opacity: 0.9 }}>
              {willPassThreshold
                ? 'Channel disturbance is expected to remain under the asymptotic 11% collective bound.'
                : 'Disturbance exceeds the 11% threshold; simulation will abort key generation to guarantee privacy.'}
            </div>
          </div>

          <div className="hud-breakdown">
            <div className="breakdown-item">
              <span>Channel Noise Contribution:</span>
              <strong>+{(baseNoisePct * 0.5).toFixed(1)}% QBER</strong>
            </div>
            <div className="breakdown-item">
              <span>Eve Intercept-Resend Contribution:</span>
              <strong style={{ color: eveEnabled ? 'var(--warning)' : 'inherit' }}>
                {eveEnabled ? '+25.0% QBER' : '0.0% (Inactive)'}
              </strong>
            </div>
            <div className="breakdown-item">
              <span>Noise Model Characteristic:</span>
              <strong style={{ textTransform: 'capitalize' }}>{noiseType.replace('_', ' ')}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
