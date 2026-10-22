import React, { useState } from 'react'

export default function BobMeasurementVisualizer({ channelQubits = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const sample = channelQubits.length > 0 ? channelQubits.slice(0, 8) : []
  const activeQubit = sample[selectedIdx] || {
    index: 1,
    alice_bit: 0,
    alice_basis: 'Z',
    bob_basis: 'Z',
    bob_measurement: 0,
    basis_matched: true,
    bit_error: false
  }

  const isMatched = activeQubit.basis_matched
  const isBitError = activeQubit.bit_error
  const detectorHit = activeQubit.bob_measurement === 0 ? 'APD-0 (Bit 0)' : 'APD-1 (Bit 1)'

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">QUANTUM RECEIVER APPARATUS</span>
          <h4>Bob's Analyzer Filter &amp; Avalanche Photodiode Detectors</h4>
        </div>
        <div className="vis-controls">
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedIdx((selectedIdx + 1) % sample.length)}
          >
            Next Qubit →
          </button>
        </div>
      </div>

      <div className="vis-body">
        {/* Qubit Selector Pills */}
        <div className="qubit-pills-bar">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Select Received Qubit:
          </span>
          <div className="pills-scroll">
            {sample.map((q, idx) => (
              <button
                key={idx}
                className={`qubit-pill ${selectedIdx === idx ? 'active' : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                #{q.index}: Bob {q.bob_basis} → {q.bob_measurement} {q.basis_matched ? '✓' : '✗'}
              </button>
            ))}
          </div>
        </div>

        {/* Optical Detector Diagram */}
        <div className="apparatus-grid">
          <div className="optical-bench-view">
            <svg viewBox="0 0 340 180" className="bench-svg" style={{ width: '100%', height: 'auto', maxHeight: 180 }}>
              {/* Optical Bench Baseline */}
              <line x1="20" y1="150" x2="320" y2="150" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <text x="25" y="168" fill="#94a3b8" fontSize="9" fontWeight="600">RECEIVER BENCH</text>

              {/* Incoming Photon Wavepacket */}
              <g transform="translate(45, 87.5)">
                <circle cx="0" cy="0" r="14" fill="rgba(37, 99, 235, 0.15)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" className="photon-pulse" />
                <circle cx="0" cy="0" r="4.5" fill="#2563eb" />
                <text x="0" y="-18" fill="#2563eb" fontSize="8.5" textAnchor="middle" fontWeight="bold">INCOMING</text>
              </g>

              {/* Arrow to Bob's Basis Filter */}
              <line x1="62" y1="87.5" x2="105" y2="87.5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />

              {/* Bob's Rotating Polarization Filter */}
              <rect x="105" y="52" width="65" height="70" rx="6" fill="#f8fafc" stroke="#16a34a" strokeWidth="2" />
              <text x="137.5" y="72" fill="#15803d" fontSize="9.5" textAnchor="middle" fontWeight="bold">ANALYZER</text>
              <text x="137.5" y="86" fill="#64748b" fontSize="8" textAnchor="middle">Basis: {activeQubit.bob_basis}</text>
              
              {/* Basis symbol */}
              <circle cx="137.5" cy="104" r="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="1" />
              <text x="137.5" y="108" fill="#15803d" fontSize="11" textAnchor="middle" fontWeight="bold">
                {activeQubit.bob_basis === 'Z' ? '⊞' : '⊠'}
              </text>

              {/* Polarizing Beam Splitter (PBS) */}
              <polygon points="195,65 240,65 240,110 195,110" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />
              <line x1="195" y1="110" x2="240" y2="65" stroke="#94a3b8" strokeWidth="2" />
              <text x="217" y="123" fill="#64748b" fontSize="8" textAnchor="middle">PBS CUBE</text>

              {/* Output Path 0 (Reflected Up to APD-0) */}
              <line x1="217.5" y1="87.5" x2="217.5" y2="35" stroke={activeQubit.bob_measurement === 0 ? '#16a34a' : '#cbd5e1'} strokeWidth={activeQubit.bob_measurement === 0 ? 3 : 1.5} />
              
              {/* APD-0 Detector Box */}
              <rect x="195" y="10" width="45" height="25" rx="4" fill={activeQubit.bob_measurement === 0 ? '#dcfce7' : '#f8fafc'} stroke={activeQubit.bob_measurement === 0 ? '#16a34a' : '#94a3b8'} strokeWidth="1.5" />
              <text x="217.5" y="26" fill={activeQubit.bob_measurement === 0 ? '#15803d' : '#64748b'} fontSize="9" textAnchor="middle" fontWeight="bold">
                APD-0 {activeQubit.bob_measurement === 0 ? '⚡' : ''}
              </text>

              {/* Output Path 1 (Transmitted Straight to APD-1) */}
              <line x1="240" y1="87.5" x2="280" y2="87.5" stroke={activeQubit.bob_measurement === 1 ? '#16a34a' : '#cbd5e1'} strokeWidth={activeQubit.bob_measurement === 1 ? 3 : 1.5} />

              {/* APD-1 Detector Box */}
              <rect x="280" y="75" width="45" height="25" rx="4" fill={activeQubit.bob_measurement === 1 ? '#dcfce7' : '#f8fafc'} stroke={activeQubit.bob_measurement === 1 ? '#16a34a' : '#94a3b8'} strokeWidth="1.5" />
              <text x="302.5" y="91" fill={activeQubit.bob_measurement === 1 ? '#15803d' : '#64748b'} fontSize="9" textAnchor="middle" fontWeight="bold">
                APD-1 {activeQubit.bob_measurement === 1 ? '⚡' : ''}
              </text>
            </svg>
          </div>

          {/* Telemetry and Measurement Results Card */}
          <div className="qubit-telemetry-panel">
            <div className="telem-row">
              <span className="telem-k">Photon Sequence:</span>
              <span className="telem-v">Qubit #{activeQubit.index}</span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Bob Random Basis:</span>
              <span className="telem-v highlight-basis" style={{ color: '#16a34a', borderColor: '#86efac' }}>
                {activeQubit.bob_basis} ({activeQubit.bob_basis === 'Z' ? 'Rectilinear ⊞' : 'Diagonal ⊠'})
              </span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Detector Click:</span>
              <span className="telem-v" style={{ fontWeight: 700, color: '#15803d' }}>
                {detectorHit}
              </span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Measurement Value:</span>
              <span className="telem-v highlight-bit" style={{ color: '#16a34a' }}>
                Bit: {activeQubit.bob_measurement}
              </span>
            </div>

            {/* Basis Match Status Alert */}
            <div style={{
              marginTop: 10,
              padding: '8px 10px',
              borderRadius: 6,
              fontSize: '0.75rem',
              background: isMatched ? '#f0fdf4' : '#fff1f2',
              border: `1px solid ${isMatched ? '#bbf7d0' : '#fecdd3'}`,
              color: isMatched ? '#166534' : '#9f1239'
            }}>
              {isMatched ? (
                <>
                  <strong>✓ Matching Basis:</strong> Bob used the same basis as Alice ({activeQubit.bob_basis}).
                  {isBitError ? ' (A channel error occurred during transit).' : ' Bit will be preserved in sifted key!'}
                </>
              ) : (
                <>
                  <strong>✗ Incompatible Basis:</strong> Alice used {activeQubit.alice_basis} while Bob measured in {activeQubit.bob_basis}.
                  Quantum state projected randomly. This bit will be eliminated during reconciliation.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
