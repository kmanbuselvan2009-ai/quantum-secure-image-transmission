import React, { useState, useEffect } from 'react'

export default function AliceStatePrepVisualizer({ stateSample = [], totalQubits = 256 }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const activeQubit = stateSample[selectedIdx] || { bit: 0, basis: 'Z', state: '|0⟩' }

  // Auto-play cycling through Alice's qubits
  useEffect(() => {
    if (!isPlaying || stateSample.length === 0) return
    const interval = setInterval(() => {
      setSelectedIdx(prev => (prev + 1) % stateSample.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [isPlaying, stateSample.length])

  // Polarization angle in degrees
  let angleDeg = 90
  let gateDesc = 'I (Identity)'
  if (activeQubit.basis === 'Z') {
    if (activeQubit.bit === 0) {
      angleDeg = 90
      gateDesc = '|0⟩: Ground State (Identity I)'
    } else {
      angleDeg = 0
      gateDesc = '|1⟩: Pauli-X gate applied to |0⟩'
    }
  } else {
    if (activeQubit.bit === 0) {
      angleDeg = 45
      gateDesc = '|+⟩: Hadamard gate H applied to |0⟩'
    } else {
      angleDeg = 135
      gateDesc = '|−⟩: Pauli-X then Hadamard H applied to |0⟩'
    }
  }

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">STATE PREPARATION APPARATUS</span>
          <h4>Alice's Single-Photon Polarization Modulator</h4>
        </div>
        <div className="vis-controls">
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedIdx((selectedIdx + 1) % stateSample.length)}
          >
            Next Qubit →
          </button>
        </div>
      </div>

      <div className="vis-body">
        {/* Interactive Stepper Navigation Bar */}
        <div className="qubit-pills-bar">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Inspect Prepared Qubit:
          </span>
          <div className="pills-scroll">
            {stateSample.map((q, idx) => (
              <button
                key={idx}
                className={`qubit-pill ${selectedIdx === idx ? 'active' : ''}`}
                onClick={() => { setSelectedIdx(idx); setIsPlaying(false); }}
              >
                #{idx + 1}: {q.state} ({q.basis})
              </button>
            ))}
          </div>
        </div>

        {/* Visual Hardware Apparatus Canvas / SVG */}
        <div className="apparatus-grid">
          <div className="optical-bench-view">
            <svg viewBox="0 0 340 180" className="bench-svg" style={{ width: '100%', height: 'auto', maxHeight: 180 }}>
              {/* Optical Bench Baseline */}
              <line x1="20" y1="150" x2="320" y2="150" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <text x="25" y="168" fill="#94a3b8" fontSize="9" fontWeight="600">OPTICAL RAIL BENCH</text>

              {/* Laser Diode / Photon Source */}
              <rect x="25" y="60" width="55" height="55" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
              <text x="52" y="85" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">PULSED</text>
              <text x="52" y="99" fill="#94a3b8" fontSize="8" textAnchor="middle">LASER</text>
              <circle cx="80" cy="87.5" r="4" fill="#ef4444" className="laser-pulse" />

              {/* Modulator Unit */}
              <rect x="130" y="50" width="75" height="75" rx="6" fill="#f8fafc" stroke="#2563eb" strokeWidth="2" />
              <text x="167" y="74" fill="#1d4ed8" fontSize="10" textAnchor="middle" fontWeight="bold">POLARIZER</text>
              <text x="167" y="88" fill="#64748b" fontSize="8.5" textAnchor="middle">Basis: {activeQubit.basis}</text>
              
              {/* Rotating Polarization Slit Indicator */}
              <circle cx="167.5" cy="108" r="12" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
              <line
                x1={167.5 - 10 * Math.cos((angleDeg * Math.PI) / 180)}
                y1={108 - 10 * Math.sin((angleDeg * Math.PI) / 180)}
                x2={167.5 + 10 * Math.cos((angleDeg * Math.PI) / 180)}
                y2={108 + 10 * Math.sin((angleDeg * Math.PI) / 180)}
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Connecting Laser Beams */}
              <line x1="84" y1="87.5" x2="130" y2="87.5" stroke="#f87171" strokeWidth="2" strokeDasharray="3 2" />
              
              {/* Emitted Polarized State Vector Photon */}
              <g transform="translate(250, 87.5)">
                {/* Photon Wavepacket Ring */}
                <circle cx="0" cy="0" r="18" fill="rgba(37, 99, 235, 0.12)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" className="photon-pulse" />
                {/* Photon Core */}
                <circle cx="0" cy="0" r="5" fill="#2563eb" />
                {/* Polarization Vector Needle */}
                <line
                  x1={-14 * Math.cos((angleDeg * Math.PI) / 180)}
                  y1={-14 * Math.sin((angleDeg * Math.PI) / 180)}
                  x2={14 * Math.cos((angleDeg * Math.PI) / 180)}
                  y2={14 * Math.sin((angleDeg * Math.PI) / 180)}
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Arrow toward Quantum Channel */}
              <path d="M 285 87.5 L 315 87.5 M 310 82.5 L 315 87.5 L 310 92.5" stroke="#2563eb" strokeWidth="2" fill="none" />
              <text x="300" y="78" fill="#2563eb" fontSize="8.5" textAnchor="middle" fontWeight="bold">TO CHANNEL</text>
            </svg>
          </div>

          {/* Active Qubit Telemetry Card */}
          <div className="qubit-telemetry-panel">
            <div className="telem-row">
              <span className="telem-k">Qubit Sequence:</span>
              <span className="telem-v">#{selectedIdx + 1} of {totalQubits}</span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Alice Classical Bit:</span>
              <span className="telem-v highlight-bit">{activeQubit.bit}</span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Alice Basis Choice:</span>
              <span className="telem-v highlight-basis">{activeQubit.basis} ({activeQubit.basis === 'Z' ? 'Computational ⊞' : 'Diagonal ⊠'})</span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Prepared Quantum State:</span>
              <span className="telem-v state-badge">{activeQubit.state}</span>
            </div>
            <div className="telem-row">
              <span className="telem-k">Polarization Vector:</span>
              <span className="telem-v">{angleDeg}° ({activeQubit.state === '|0⟩' ? 'Vertical' : activeQubit.state === '|1⟩' ? 'Horizontal' : activeQubit.state === '|+⟩' ? '+45° Diagonal' : '−45° Anti-diagonal'})</span>
            </div>
            <div className="qiskit-circuit-box">
              <div className="qiskit-label">Qiskit Circuit Compilation:</div>
              <code>{gateDesc}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
