import React, { useState } from 'react'

export default function EveAttackVisualizer({ eveEnabled = false, activeQubit = null }) {
  const [activeTab, setActiveTab] = useState('mechanism') // 'mechanism' | 'nocloning' | 'math'

  const eveBasis = activeQubit?.eve_info?.basis || 'X'
  const eveMeasured = activeQubit?.eve_info?.measured_bit !== undefined ? activeQubit.eve_info.measured_bit : 1
  const eveResent = activeQubit?.eve_info?.replacement_state || '|+⟩'
  const aliceBasis = activeQubit?.alice_basis || 'Z'
  const isBasisMatch = eveBasis === aliceBasis

  return (
    <div className="scientific-visualizer-card" style={{ margin: '16px 0', border: '1px solid #fde68a', background: '#fffbeb' }}>
      <div className="vis-header" style={{ borderBottomColor: '#fef3c7' }}>
        <div className="vis-title">
          <span className="vis-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
            ACTIVE EAVESDROPPING MODEL
          </span>
          <h4 style={{ color: '#92400e' }}>Eve's Intercept-Resend Quantum Measurement Disturbance</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeTab === 'mechanism' ? 'active' : ''}`}
            onClick={() => setActiveTab('mechanism')}
            style={activeTab === 'mechanism' ? { background: '#f59e0b', color: '#fff' } : {}}
          >
            Intercept Flow
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'nocloning' ? 'active' : ''}`}
            onClick={() => setActiveTab('nocloning')}
            style={activeTab === 'nocloning' ? { background: '#f59e0b', color: '#fff' } : {}}
          >
            No-Cloning Theorem
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'math' ? 'active' : ''}`}
            onClick={() => setActiveTab('math')}
            style={activeTab === 'math' ? { background: '#f59e0b', color: '#fff' } : {}}
          >
            25% Error Law
          </button>
        </div>
      </div>

      <div className="vis-body">
        {activeTab === 'mechanism' && (
          <div className="eve-mechanism-container">
            {/* Visual SVG Attack Stage */}
            <svg viewBox="0 0 540 160" className="eve-attack-svg" style={{ width: '100%', height: 'auto', maxHeight: 160 }}>
              {/* Alice State Entering */}
              <g transform="translate(40, 80)">
                <circle cx="0" cy="0" r="16" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                <text x="0" y="4" fill="#1e40af" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {activeQubit?.prepared_state || '|0⟩'}
                </text>
                <text x="0" y="28" fill="#64748b" fontSize="8.5" textAnchor="middle">
                  Alice ({aliceBasis})
                </text>
              </g>

              {/* Intercept Arrow */}
              <line x1="60" y1="80" x2="160" y2="80" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
              <polygon points="160,80 152,76 152,84" fill="#f59e0b" />
              <text x="110" y="72" fill="#d97706" fontSize="8.5" textAnchor="middle" fontWeight="600">INTERCEPT</text>

              {/* Eve Station */}
              <g transform="translate(230, 80)">
                <rect x="-55" y="-45" width="110" height="90" rx="8" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
                <text x="0" y="-28" fill="#b45309" fontSize="9" textAnchor="middle" fontWeight="bold">EVE'S APPARATUS</text>
                
                {/* Basis Guess */}
                <rect x="-45" y="-18" width="90" height="24" rx="4" fill="#fef3c7" />
                <text x="0" y="-2" fill="#92400e" fontSize="9" textAnchor="middle">
                  Guess Basis: <strong>{eveBasis}</strong> {isBasisMatch ? '(Match!)' : '(Mismatch!)'}
                </text>

                {/* Measurement result */}
                <text x="0" y="22" fill="#78350f" fontSize="8.5" textAnchor="middle">
                  Measured Bit: <strong>{eveMeasured}</strong>
                </text>
                <text x="0" y="34" fill="#b45309" fontSize="8" textAnchor="middle">
                  Replacement: <strong>{eveResent}</strong>
                </text>
              </g>

              {/* Resend Arrow */}
              <line x1="290" y1="80" x2="390" y2="80" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 2" />
              <polygon points="390,80 382,76 382,84" fill="#dc2626" />
              <text x="340" y="72" fill="#dc2626" fontSize="8.5" textAnchor="middle" fontWeight="600">RESEND</text>

              {/* Bob Receiver */}
              <g transform="translate(460, 80)">
                <circle cx="0" cy="0" r="16" fill={activeQubit?.bit_error ? '#fee2e2' : '#f0fdf4'} stroke={activeQubit?.bit_error ? '#dc2626' : '#16a34a'} strokeWidth="2" />
                <text x="0" y="4" fill={activeQubit?.bit_error ? '#991b1b' : '#15803d'} fontSize="10" textAnchor="middle" fontWeight="bold">
                  {activeQubit?.bob_measurement !== undefined ? activeQubit.bob_measurement : '?'}
                </text>
                <text x="0" y="28" fill="#64748b" fontSize="8.5" textAnchor="middle">
                  Bob ({activeQubit?.bob_basis || 'Z'})
                </text>
              </g>
            </svg>

            <div className="eve-status-box" style={{
              background: isBasisMatch ? '#f0fdf4' : '#fee2e2',
              borderColor: isBasisMatch ? '#bbf7d0' : '#fca5a5',
              color: isBasisMatch ? '#166534' : '#991b1b',
              marginTop: 10,
              padding: 10,
              borderRadius: 6,
              fontSize: '0.8125rem'
            }}>
              <strong>Quantum Measurement Effect: </strong>
              {isBasisMatch ? (
                <span>Eve accidentally chose Alice's basis ({eveBasis}). The quantum state was projected consistently without disturbance on this single qubit.</span>
              ) : (
                <span>Eve chose the WRONG basis ({eveBasis} vs Alice's {aliceBasis}). This forcibly collapsed the state into {eveResent}, introducing irreducible quantum disturbance.</span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nocloning' && (
          <div className="eve-nocloning-box" style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.6 }}>
            <h5 style={{ margin: '0 0 6px 0', color: '#92400e' }}>
              Why Can't Eve Just Copy the Photon? (Wootters-Zurek No-Cloning Theorem, 1982)
            </h5>
            <p>
              In classical computing, an eavesdropper can passively tap a wire and make an exact bit duplicate without altering the original signal.
              In quantum mechanics, <strong>no unitary operator $U$ exists</strong> that can duplicate an unknown arbitrary quantum state $|\psi\rangle$:
            </p>
            <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', border: '1px solid #fde68a', margin: '8px 0', textAlign: 'center' }}>
              U |ψ⟩ |0⟩ ≠ |ψ⟩ |ψ⟩  ∀ |ψ⟩
            </div>
            <p>
              Therefore, Eve is fundamentally forced to <strong>measure</strong> the state. Due to Heisenberg's uncertainty principle, measuring an unknown non-orthogonal state inevitably destroys the original quantum superposition.
            </p>
          </div>
        )}

        {activeTab === 'math' && (
          <div className="eve-math-box" style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.6 }}>
            <h5 style={{ margin: '0 0 6px 0', color: '#92400e' }}>Derivation of the 25% Error Rate Floor</h5>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Alice and Bob select matching bases with probability P(Match) = 1/2.</li>
              <li>Eve independently guesses Alice's basis correctly with probability 1/2, and wrongly with probability 1/2.</li>
              <li>When Eve guesses wrongly, she resends a state orthogonal to the true basis. Bob measuring this replacement in Alice's basis gets the wrong bit with probability |⟨0|+⟩|² = 1/2.</li>
              <li>Total induced error rate: QBER_Eve = P(Eve Wrong) × P(Bob Error) = 1/2 × 1/2 = 25%.</li>
            </ol>
            <div style={{ marginTop: 8, fontWeight: 700, color: '#b45309' }}>
              Since 25% &gt; 11% (asymptotic threshold), an intercept-resend attack always causes key rejection when Eve intercepts all qubits!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
