import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import AliceStatePrepVisualizer from './visualizers/AliceStatePrepVisualizer.jsx'
import BlochSphere3D from './visualizers/BlochSphere3D.jsx'

export default function AliceStep({ state, data, onNext }) {
  const { alice_qubits_prepared, state_sample } = data
  const [showBlochSphere, setShowBlochSphere] = useState(true)

  const summary = `${alice_qubits_prepared} qubits prepared and encoded into quantum states.`

  return (
    <StepCard
      state={state}
      number="01"
      title="Alice prepares the quantum states"
      summary={summary}
    >
      <p>
        Alice generates <strong>{alice_qubits_prepared}</strong> random classical bits
        and independently chooses a random measurement basis (Z or X) for each qubit.
        She then encodes each bit as a quantum state.
      </p>

      <div style={{ margin: '20px 0' }}>
        <p className="section-heading">Encoding rules</p>
        <div className="encoding-table">
          <div className="header">Basis</div>
          <div className="header">Bit</div>
          <div className="header">Quantum state</div>

          <div className="cell">Z</div>
          <div className="cell">0</div>
          <div className="cell state">|0⟩</div>

          <div className="cell">Z</div>
          <div className="cell">1</div>
          <div className="cell state">|1⟩</div>

          <div className="cell">X</div>
          <div className="cell">0</div>
          <div className="cell state">|+⟩</div>

          <div className="cell">X</div>
          <div className="cell">1</div>
          <div className="cell state">|−⟩</div>
        </div>
      </div>

      {/* Optical Bench Apparatus & Qubit Stepper */}
      <AliceStatePrepVisualizer stateSample={state_sample} totalQubits={alice_qubits_prepared} />

      {/* 3D WebGL Bloch Sphere Interactive Laboratory */}
      <div style={{ margin: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="section-heading" style={{ margin: 0 }}>
            3D Quantum State Geometry &amp; Bloch Sphere
          </p>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '3px 10px', border: '1px solid var(--border)' }}
            onClick={() => setShowBlochSphere(!showBlochSphere)}
          >
            {showBlochSphere ? '▲ Hide 3D Sphere' : '▼ Open Interactive 3D Sphere'}
          </button>
        </div>

        {showBlochSphere && (
          <BlochSphere3D
            initialTheta={Math.PI / 4}
            initialPhi={0}
            interactive={true}
          />
        )}
      </div>

      {state_sample && state_sample.length > 0 && (
        <div style={{ margin: '20px 0' }}>
          <p className="section-heading">First {state_sample.length} qubits (actual simulation)</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bit</th>
                <th>Basis</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {state_sample.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{row.bit}</td>
                  <td>{row.basis}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 500 }}>{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            Showing first {state_sample.length} of {alice_qubits_prepared} qubits.
            States are encoded using Qiskit gates: X gate for |1⟩, H gate for X-basis states.
          </p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Qubits prepared</div>
          <div className="stat-value">{alice_qubits_prepared.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Z-basis qubits</div>
          <div className="stat-value">~{Math.round(alice_qubits_prepared / 2).toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">X-basis qubits</div>
          <div className="stat-value">~{Math.round(alice_qubits_prepared / 2).toLocaleString()}</div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onNext}>
          Send through quantum channel →
        </button>
      </div>
    </StepCard>
  )
}
