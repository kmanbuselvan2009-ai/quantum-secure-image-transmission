import React from 'react'
import StepCard from './StepCard.jsx'
import InteractiveQuantumChannel from './InteractiveQuantumChannel.jsx'

export default function QuantumChannelStep({ state, data, settings, onNext }) {
  const {
    qubits_sent,
    noise_level,
    noise_type = 'depolarizing',
    eve_enabled,
    channel_qubits,
    event_log
  } = data

  const noisePct = Math.round(noise_level * 100)
  const summary = `${qubits_sent} qubits transmitted · Noise: ${noisePct}% (${noise_type}) · Eve: ${eve_enabled ? 'ON' : 'OFF'}`

  return (
    <StepCard
      state={state}
      number="02"
      title="Quantum channel transmission & simulation"
      summary={summary}
    >
      <p>
        Alice transmits each prepared quantum state through the simulated quantum channel.
        During transit, real physical channel noise disturbs the qubits. If Eve is active,
        she performs a real quantum intercept-resend attack on each qubit before forwarding
        a replacement state to Bob.
      </p>

      {/* Visual Interactive Quantum Channel */}
      <InteractiveQuantumChannel
        channelQubits={channel_qubits || []}
        noiseLevel={noise_level}
        noiseType={noise_type}
        eveEnabled={eve_enabled}
        eventLog={event_log || []}
      />

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Qubits sent</div>
          <div className="stat-value">{qubits_sent.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Channel noise model</div>
          <div className="stat-value" style={{ fontSize: '0.9375rem', textTransform: 'capitalize' }}>
            {noise_type} ({noisePct}%)
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Eve intercept-resend</div>
          <div className="stat-value" style={{ color: eve_enabled ? 'var(--warning)' : 'var(--success)' }}>
            {eve_enabled ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>
      </div>

      {eve_enabled && (
        <div className="alert alert-warning">
          <div className="alert-title">Active Intercept-Resend Attack</div>
          Eve randomly picks a measurement basis for each qubit, measures the simulated state,
          and prepares a replacement quantum state. Because she picks the wrong basis ~50%
          of the time, this collapses superpositions and induces statistical disturbance.
        </div>
      )}

      <p className="note">
        In real-world quantum channels, single photons are transmitted across fiber or free-space.
        Here, all transformations and measurements are simulated with local Qiskit Aer circuits.
      </p>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onNext}>
          Bob measures →
        </button>
      </div>
    </StepCard>
  )
}
