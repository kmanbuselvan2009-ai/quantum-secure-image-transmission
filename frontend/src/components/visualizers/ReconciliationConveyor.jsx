import React, { useState, useEffect } from 'react'

export default function ReconciliationConveyor({ reconciliationSample = [], siftedLength = 0, totalQubits = 256 }) {
  const [animStep, setAnimStep] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  const sample = reconciliationSample.length > 0 ? reconciliationSample : []

  useEffect(() => {
    if (!isAutoPlay || sample.length === 0) return
    const interval = setInterval(() => {
      setAnimStep(prev => (prev + 1) % sample.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [isAutoPlay, sample.length])

  // Form accumulated sifted key from sample matches
  const currentSiftedBits = sample
    .slice(0, animStep + 1)
    .filter(row => row.result === 'Keep')

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">CLASSICAL BASIS SIFTING</span>
          <h4>Public Basis Alignment Conveyor &amp; Sifted Key Extraction</h4>
        </div>
        <div className="vis-controls">
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setIsAutoPlay(!isAutoPlay)}
          >
            {isAutoPlay ? '⏸ Pause' : '▶ Animate Sifting'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setAnimStep((animStep + 1) % sample.length)}
          >
            Step Position →
          </button>
        </div>
      </div>

      <div className="vis-body">
        {/* Conveyor Track of Sample Qubits */}
        <div className="reconciliation-conveyor-wrapper">
          <div className="conveyor-header-labels">
            <span>Alice Basis ($B_A$)</span>
            <span>Public Comparison Protocol</span>
            <span>Bob Basis ($B_B$)</span>
          </div>

          <div className="conveyor-slots-row">
            {sample.map((row, idx) => {
              const isMatch = row.result === 'Keep'
              const isActive = idx === animStep

              return (
                <div
                  key={idx}
                  className={`conveyor-slot ${isActive ? 'active-slot' : ''} ${isMatch ? 'match-slot' : 'discard-slot'}`}
                  onClick={() => { setAnimStep(idx); setIsAutoPlay(false); }}
                >
                  <div className="slot-idx">#{row.position}</div>

                  {/* Alice Basis */}
                  <div className="slot-basis alice-b">
                    {row.alice_basis}
                  </div>

                  {/* Comparison Comparator Line */}
                  <div className="comparator-status">
                    {isMatch ? '==' : '≠'}
                  </div>

                  {/* Bob Basis */}
                  <div className="slot-basis bob-b">
                    {row.bob_basis}
                  </div>

                  {/* Sifting Result Badge */}
                  <div className={`slot-verdict ${isMatch ? 'verdict-keep' : 'verdict-drop'}`}>
                    {isMatch ? 'KEEP' : 'DISCARD'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Sifted Key Accumulation Array */}
        <div className="sifted-key-accumulator">
          <div className="acc-title-row">
            <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#166534' }}>
              ✓ Sifted Raw Key Register (Matched Basis Positions)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Sifted: <strong>{siftedLength} bits</strong> ({((siftedLength / (totalQubits || 256)) * 100).toFixed(1)}% Yield)
            </span>
          </div>

          <div className="key-bits-stream">
            {currentSiftedBits.length > 0 ? (
              currentSiftedBits.map((row, i) => (
                <div key={i} className="sifted-bit-chip">
                  <span className="bit-pos">pos {row.position}</span>
                  <span className="bit-char">★</span>
                  <span className="bit-basis">{row.alice_basis}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '6px 0' }}>
                Awaiting matching basis positions…
              </div>
            )}
          </div>
          <p className="vis-caption" style={{ marginTop: 8 }}>
            ★ <em>Bit confidentiality guarantee:</em> Alice and Bob announced only the measurement bases ($Z$ or $X$), not the secret bit values. An eavesdropper listening on this classical exchange cannot deduce whether a matching state was 0 or 1.
          </p>
        </div>
      </div>
    </div>
  )
}
