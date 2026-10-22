import React, { useState, useEffect } from 'react'
import EveAttackVisualizer from './visualizers/EveAttackVisualizer.jsx'

export default function InteractiveQuantumChannel({
  channelQubits = [],
  noiseLevel = 0.05,
  noiseType = 'depolarizing',
  eveEnabled = false,
  eventLog = [],
}) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [transitProgress, setTransitProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0)
  const [showEveDetail, setShowEveDetail] = useState(false)

  const activeQubit = channelQubits[selectedIdx] || null

  // Animation cycle for traveling qubit
  useEffect(() => {
    if (!isPlaying || !activeQubit) return

    let animationFrame
    let start = performance.now()
    const baseDuration = 2400 / speedMultiplier // ms per transit cycle

    const step = (now) => {
      const elapsed = now - start
      const prog = (elapsed % baseDuration) / baseDuration
      setTransitProgress(prog)
      animationFrame = requestAnimationFrame(step)
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [selectedIdx, isPlaying, activeQubit, speedMultiplier])

  if (!channelQubits || channelQubits.length === 0) {
    return null
  }

  // Calculate position along channel: 8% to 92%
  const currentLeftPct = 8 + transitProgress * 84

  return (
    <div className="interactive-channel-stage">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
            Quantum Channel Laboratory
          </span>
          <h4 style={{ margin: '2px 0 0 0', fontSize: '0.9375rem' }}>
            Simulated Qubit Transmission &amp; Trajectory
          </h4>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Speed Selector */}
          <div className="speed-pills" style={{ display: 'flex', gap: 4, marginRight: 6 }}>
            {[0.5, 1.0, 2.0].map(s => (
              <button
                key={s}
                className={`btn btn-ghost ${speedMultiplier === s ? 'active-speed' : ''}`}
                style={{ padding: '2px 7px', fontSize: '0.6875rem' }}
                onClick={() => setSpeedMultiplier(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedIdx((selectedIdx + 1) % channelQubits.length)}
          >
            Next Qubit →
          </button>
        </div>
      </div>

      {/* Actors Header */}
      <div className="channel-actors-row">
        <div className="actor-card alice">
          <div className="actor-avatar">👩‍🔬</div>
          <div className="actor-meta">
            <h4>Alice</h4>
            <span>State Preparer</span>
          </div>
        </div>

        {eveEnabled && (
          <div
            className={`actor-card eve ${showEveDetail ? 'active-eve' : ''}`}
            onClick={() => setShowEveDetail(!showEveDetail)}
            style={{ cursor: 'pointer' }}
            title="Click to toggle Eve attack breakdown"
          >
            <div className="actor-avatar">🕵️‍♀️</div>
            <div className="actor-meta">
              <h4>Eve (Intercept-Resend)</h4>
              <span>Active Eavesdropper {showEveDetail ? '▲' : '▼'}</span>
            </div>
          </div>
        )}

        <div className="actor-card bob">
          <div className="actor-avatar">👨‍🔬</div>
          <div className="actor-meta">
            <h4>Bob</h4>
            <span>Random Basis Receiver</span>
          </div>
        </div>
      </div>

      {/* Optional Expanded Eve Details Visualizer */}
      {eveEnabled && (
        <div style={{ marginBottom: 12 }}>
          <EveAttackVisualizer eveEnabled={eveEnabled} activeQubit={activeQubit} />
        </div>
      )}

      {/* Channel Track with Moving Qubit & Decoherence Zone */}
      <div className="channel-track-container">
        <div className="channel-path-line"></div>

        {/* Decoherence / Noise Field Cloud in Center */}
        {noiseLevel > 0 && (
          <div className="noise-field-zone" title={`Channel Noise (${Math.round(noiseLevel * 100)}% ${noiseType})`}>
            <div className="noise-wave-pulse" />
            <span className="noise-zone-label">
              Decoherence Zone ({Math.round(noiseLevel * 100)}% {noiseType})
            </span>
          </div>
        )}

        {eveEnabled && (
          <div className="eve-tap-point">
            Intercept &amp; Measure Tap
          </div>
        )}

        {/* Traveling Qubit Wavepacket */}
        {activeQubit && (
          <div
            className="traveling-qubit-wrapper"
            style={{ left: `${currentLeftPct}%` }}
          >
            <div
              className={`qubit-particle ${activeQubit.alice_basis === 'Z' ? 'basis-z' : 'basis-x'} ${
                transitProgress > 0.45 && activeQubit.eve_interacted ? 'intercepted' : ''
              } ${transitProgress > 0.75 && activeQubit.bit_error ? 'error-disturbed' : ''}`}
            >
              <span>{activeQubit.prepared_state}</span>
              <span style={{ fontSize: '0.625rem', marginTop: -2 }}>
                {activeQubit.alice_basis}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Channel Conditions Sub-bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 8px' }}>
        <span>State prepared by Alice</span>
        <span>
          Noise: {Math.round(noiseLevel * 100)}% ({noiseType})
          {eveEnabled ? ' · Eve intercept active' : ' · Direct channel'}
        </span>
        <span>Measurement by Bob</span>
      </div>

      {/* Selectable Qubit Ribbon */}
      <div className="qubit-ribbon">
        {channelQubits.map((q, idx) => {
          const isSelected = idx === selectedIdx
          return (
            <button
              key={q.index}
              className={`qubit-pill ${isSelected ? 'active' : ''} ${
                q.basis_matched ? 'matched' : 'discarded'
              }`}
              onClick={() => setSelectedIdx(idx)}
              title={`Qubit #${q.index}: ${q.prepared_state}`}
            >
              <span>#{q.index}</span>
              <strong>{q.prepared_state}</strong>
              <small style={{ color: q.basis_matched ? 'var(--success)' : 'var(--text-muted)' }}>
                {q.basis_matched ? '✓' : '✗'}
              </small>
            </button>
          )
        })}
      </div>

      {/* Selected Qubit Trajectory Inspector */}
      {activeQubit && (
        <div className="qubit-inspector-grid">
          <div className="inspect-box">
            <div className="label">Alice Bit &amp; Basis</div>
            <div className="val">
              {activeQubit.alice_bit} in {activeQubit.alice_basis}
            </div>
          </div>

          <div className="inspect-box">
            <div className="label">Prepared State</div>
            <div className="val" style={{ color: 'var(--accent)' }}>
              {activeQubit.prepared_state}
            </div>
          </div>

          <div className="inspect-box">
            <div className="label">Eve Intercept</div>
            <div className="val" style={{ color: activeQubit.eve_interacted ? '#d97706' : 'var(--text-muted)' }}>
              {activeQubit.eve_info ? (
                <>Measured {activeQubit.eve_info.basis} → {activeQubit.eve_info.replacement_state}</>
              ) : 'None (Direct)'}
            </div>
          </div>

          <div className="inspect-box">
            <div className="label">Bob Basis &amp; Meas</div>
            <div className="val">
              {activeQubit.bob_basis} → {activeQubit.bob_measurement}
            </div>
          </div>

          <div className="inspect-box">
            <div className="label">Basis Reconciliation</div>
            <div className="val" style={{ color: activeQubit.basis_matched ? 'var(--success)' : 'var(--text-muted)' }}>
              {activeQubit.basis_matched ? 'Kept (Sifted)' : 'Discarded'}
            </div>
          </div>

          <div className="inspect-box">
            <div className="label">Bit Agreement</div>
            <div className="val" style={{ color: activeQubit.bit_error ? 'var(--danger)' : 'var(--success)' }}>
              {activeQubit.basis_matched
                ? (activeQubit.bit_error ? 'Bit Error (Mismatch)' : 'Bit Matched')
                : 'N/A (Bases Differ)'}
            </div>
          </div>
        </div>
      )}

      {/* Channel Event Log */}
      {eventLog && eventLog.length > 0 && (
        <div className="channel-event-log">
          <div style={{ color: '#94a3b8', fontSize: '0.6875rem', marginBottom: 4, textTransform: 'uppercase' }}>
            Live Channel Event Log (Actual Simulation Traces)
          </div>
          {eventLog.map((logMsg, i) => (
            <div key={i} className="log-entry">
              <span className="time">[{String(i + 1).padStart(2, '0')}]</span>
              <span>{logMsg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
