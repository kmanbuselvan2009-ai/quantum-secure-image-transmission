import React from 'react'
import StepCard from './StepCard.jsx'
import BobMeasurementVisualizer from './visualizers/BobMeasurementVisualizer.jsx'

export default function BobStep({ state, data, onNext }) {
  const { bob_qubits_received, bob_measurements_completed } = data

  const summary = `${bob_measurements_completed} measurements completed.`

  return (
    <StepCard
      state={state}
      number="03"
      title="Bob measures the qubits"
      summary={summary}
    >
      <p>
        Bob does not know which basis Alice used to encode each qubit.
        He independently chooses a random basis (Z or X) for each incoming quantum state
        and measures it. When Bob's basis matches Alice's, measurement gives the correct bit.
        When they differ, the result is random.
      </p>

      <div style={{ margin: '20px 0', padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <p className="section-heading">Bob's measurement rules</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
          If Bob measures in the <strong>Z basis</strong>: he projects onto |0⟩ or |1⟩.<br />
          If Bob measures in the <strong>X basis</strong>: he applies a Hadamard gate before measuring,
          projecting onto |+⟩ or |−⟩.<br />
          Both are implemented using real Qiskit single-qubit circuits in the simulation.
        </p>
      </div>

      {/* Interactive Receiver Apparatus & Detector Clicks */}
      <BobMeasurementVisualizer channelQubits={data.channel_qubits || []} />

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Qubits received</div>
          <div className="stat-value">{bob_qubits_received.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Measurements</div>
          <div className="stat-value">{bob_measurements_completed.toLocaleString()}</div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onNext}>
          Compare bases →
        </button>
      </div>
    </StepCard>
  )
}
