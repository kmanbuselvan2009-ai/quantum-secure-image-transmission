import React from 'react'
import StepCard from './StepCard.jsx'
import ReconciliationConveyor from './visualizers/ReconciliationConveyor.jsx'

export default function ReconciliationStep({ state, data, onNext }) {
  const {
    bob_qubits_received,
    matching_bases_count,
    discarded_count,
    sifted_key_length,
    reconciliation_sample,
  } = data

  const summary = `Sifted key: ${sifted_key_length} bits (${matching_bases_count} matching / ${bob_qubits_received} total)`

  return (
    <StepCard
      state={state}
      number="04"
      title="Basis reconciliation"
      summary={summary}
    >
      <p>
        Alice and Bob now publicly compare their basis choices over a classical channel.
        They keep only positions where they used the <strong>same basis</strong>.
        The actual bit values are never revealed — only the basis labels are shared.
      </p>

      {/* Interactive Sifting Conveyor & Sifted Key Register */}
      <ReconciliationConveyor
        reconciliationSample={reconciliation_sample}
        siftedLength={sifted_key_length}
        totalQubits={bob_qubits_received}
      />

      {reconciliation_sample && reconciliation_sample.length > 0 && (
        <div style={{ margin: '20px 0', overflowX: 'auto' }}>
          <p className="section-heading">Basis comparison sample (actual data)</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Alice basis</th>
                <th>Bob basis</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation_sample.map((row, i) => (
                <tr key={i}>
                  <td>{row.position}</td>
                  <td>{row.alice_basis}</td>
                  <td>{row.bob_basis}</td>
                  <td className={row.result === 'Keep' ? 'keep' : 'discard'}>
                    {row.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Qubits total</div>
          <div className="stat-value">{bob_qubits_received.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Matching bases</div>
          <div className="stat-value">{matching_bases_count.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Discarded</div>
          <div className="stat-value">{discarded_count.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Sifted key</div>
          <div className="stat-value">{sifted_key_length.toLocaleString()} bits</div>
        </div>
      </div>

      <p className="note">
        On average, roughly half the qubits will have matching bases. The sifted key
        is approximately n/2 bits where n is the total number of prepared qubits.
      </p>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onNext}>
          Check security →
        </button>
      </div>
    </StepCard>
  )
}
