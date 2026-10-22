import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import ResultAnalysisVisualizer from './visualizers/ResultAnalysisVisualizer.jsx'

export default function ResultStep({
  state,
  decryptData,
  imageInfo,
  imagePreview,
  previewB64,
  previewMime,
  bb84,
  research,
  settings,
  onReset,
  onNext,
}) {
  if (!decryptData || !decryptData.success) return null

  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'graphs' | 'data'

  const originalSrc = imagePreview
  const recoveredSrc = decryptData.recovered_preview_b64
    ? `data:${decryptData.recovered_preview_mime};base64,${decryptData.recovered_preview_b64}`
    : null

  const integrityMatch = decryptData.integrity_match
  const activeStats = research?.active_stats || null
  const trialsCount = research?.trials_count || settings?.trials || 1

  // CSV Export utility
  const exportCSV = () => {
    if (!activeStats?.trial_records) return
    let csv = 'experiment_id,trial,qubit_count,noise_model,noise_probability,eve_enabled,sifted_key_length,compared_bits,error_count,qber,accepted\n'
    const expId = `EXP-${Date.now().toString().slice(-6)}`
    activeStats.trial_records.forEach(tr => {
      csv += `${expId},${tr.trial},${settings?.nQubits || 256},${settings?.noiseType || 'depolarizing'},${settings?.noiseLevel || 0.05},${settings?.eveEnabled ? 'true' : 'false'},${tr.sifted_length},${tr.compared},${tr.errors},${tr.qber},${tr.accepted ? 'true' : 'false'}\n`
    })
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csv}`)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `bb84_experiment_trials_${expId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <StepCard
      state={state}
      number="11"
      title="Final Results & Research Analysis"
      summary={integrityMatch ? 'Image recovered with 100% integrity match. Research statistics recorded.' : 'Integrity check failed.'}
    >
      {/* Tab Navigation in Result Card */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 14px', fontSize: '0.8125rem' }}
          onClick={() => setActiveTab('summary')}
        >
          📷 Image &amp; Protocol Verification
        </button>
        <button
          className={`btn ${activeTab === 'graphs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 14px', fontSize: '0.8125rem' }}
          onClick={() => setActiveTab('graphs')}
        >
          📈 Scientific Research Graphs
        </button>
        <button
          className={`btn ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 14px', fontSize: '0.8125rem' }}
          onClick={() => setActiveTab('data')}
        >
          📊 Trials Data ({trialsCount} {trialsCount === 1 ? 'trial' : 'trials'})
        </button>
      </div>

      {/* TAB 1: Image & Protocol Summary */}
      {activeTab === 'summary' && (
        <div>
          {/* Side by side image comparison */}
          <div className="image-comparison">
            <div className="image-panel">
              <div className="image-panel-label">Original Transmitted Image</div>
              {originalSrc && (
                <img src={originalSrc} alt="Original uploaded image" />
              )}
            </div>
            <div className="image-panel">
              <div className="image-panel-label">Decrypted Recovered Image</div>
              {recoveredSrc && (
                <img src={recoveredSrc} alt="Recovered decrypted image" />
              )}
            </div>
          </div>

          {/* Interactive Split-Wipe & Scientific Fidelity Telemetry */}
          <ResultAnalysisVisualizer
            originalSrc={originalSrc}
            recoveredSrc={recoveredSrc}
            imageInfo={imageInfo}
            integrityMatch={integrityMatch}
            bb84={bb84}
          />

          {/* Verdict Alert */}
          {integrityMatch ? (
            <div className="alert alert-success" style={{ marginTop: 20 }}>
              <div className="alert-title">✓ Bit-for-Bit Integrity Confirmed</div>
              Decryption succeeded and verified via SHA-256 cryptographic hash matching. The image data is identical to the original file.
            </div>
          ) : (
            <div className="alert alert-danger" style={{ marginTop: 20 }}>
              <div className="alert-title">Integrity Verification Failed</div>
              The SHA-256 hashes do not match. The decrypted payload differs from the original file.
            </div>
          )}

          {/* SHA-256 Verification Table */}
          <div style={{ margin: '20px 0' }}>
            <p className="section-heading">Cryptographic Hash Verification</p>
            <table className="data-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)', width: 140 }}>Original SHA-256</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {decryptData.original_sha256}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Recovered SHA-256</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {decryptData.recovered_sha256}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Integrity Status</td>
                  <td style={{ fontWeight: 600, color: integrityMatch ? 'var(--success)' : 'var(--danger)' }}>
                    {integrityMatch ? '✓ EXACT MATCH (100% BITWISE IDENTITY)' : '✗ MISMATCH DETECTED'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Image File</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, wordBreak: 'break-all' }}>
                {imageInfo.filename}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Payload Size</div>
              <div className="stat-value">{imageInfo.file_size_mb} MB</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Observed QBER</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {bb84?.qber?.toFixed(2)}%
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Sifted Key Length</div>
              <div className="stat-value">{bb84?.sifted_key_length} bits</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Research Graphs & Empirical Analysis */}
      {activeTab === 'graphs' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <p className="section-heading" style={{ margin: 0 }}>Scientific Experimental Visualizations</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
              The following graphs were generated directly from actual Qiskit Aer quantum circuit simulations executed during this experiment.
            </p>
          </div>

          {/* GRAPH 1: Noise vs Mean QBER */}
          {research?.graph1_noise_vs_qber && (
            <div className="chart-container" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-primary)' }}>
                Graph 1: Channel Noise Probability vs Mean QBER (%)
              </div>
              <NoiseVsQberSVG points={research.graph1_noise_vs_qber} threshold={11.0} />
            </div>
          )}

          {/* GRAPH 2: Eve OFF vs Eve ON Controlled Comparison */}
          {research?.graph2_eve_comparison && (
            <div className="chart-container" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-primary)' }}>
                Graph 2: Controlled Comparison — Eve OFF vs Eve ON
              </div>
              <EveComparisonSVG comparison={research.graph2_eve_comparison} />
            </div>
          )}

          {/* GRAPH 3: Qubit Sample Size vs QBER Variance */}
          {research?.graph3_qubits_vs_stability && (
            <div className="chart-container" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-primary)' }}>
                Graph 3: Qubit Sample Size vs QBER Stability (Variance &sigma;)
              </div>
              <QubitStabilitySVG points={research.graph3_qubits_vs_stability} />
            </div>
          )}

          {/* Data-Driven Scientific Interpretation */}
          {research?.interpretations && (
            <div className="research-interpretation-box">
              <h4>Empirical Observations &amp; Scientific Interpretation</h4>
              {research.interpretations.map((interp, idx) => (
                <div key={idx} className="interpretation-item">
                  <strong>• Observation {idx + 1}:</strong> {interp}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Repeated Trials & Data Export */}
      {activeTab === 'data' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p className="section-heading" style={{ margin: 0 }}>Experimental Trials Record</p>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {trialsCount} independent simulation {trialsCount === 1 ? 'trial' : 'trials'} with {settings?.nQubits} qubits, {Math.round((settings?.noiseLevel || 0.05) * 100)}% noise ({settings?.noiseType || 'depolarizing'}), Eve: {settings?.eveEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            {activeStats?.trial_records && (
              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8125rem' }} onClick={exportCSV}>
                📥 Export CSV
              </button>
            )}
          </div>

          {activeStats && (
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              <div className="stat-item">
                <div className="stat-label">Trials Executed</div>
                <div className="stat-value">{trialsCount}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Mean QBER</div>
                <div className="stat-value">{activeStats.mean_qber.toFixed(2)}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Std Deviation (&sigma;)</div>
                <div className="stat-value">&plusmn;{activeStats.std_qber.toFixed(2)}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Key Acceptance</div>
                <div className="stat-value" style={{ color: activeStats.acceptance_rate > 50 ? 'var(--success)' : 'var(--danger)' }}>
                  {activeStats.acceptance_rate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {activeStats?.trial_records && activeStats.trial_records.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trial #</th>
                  <th>Observed QBER</th>
                  <th>Bit Errors</th>
                  <th>Compared Bits</th>
                  <th>Sifted Key Length</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {activeStats.trial_records.map(tr => (
                  <tr key={tr.trial}>
                    <td>#{tr.trial}</td>
                    <td style={{ fontWeight: 600, color: tr.qber < 11.0 ? 'var(--success)' : 'var(--danger)' }}>
                      {tr.qber.toFixed(2)}%
                    </td>
                    <td>{tr.errors}</td>
                    <td>{tr.compared}</td>
                    <td>{tr.sifted_length} bits</td>
                    <td style={{ color: tr.accepted ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {tr.accepted ? '✓ Accepted' : '✗ Rejected'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Future Research Highlight: Photon-Number-Splitting (PNS) Attack ONLY */}
      <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Future Research Direction: Photon-Number-Splitting (PNS) Attack
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 6, marginBottom: 8, lineHeight: 1.6 }}>
          Practical QKD implementations typically employ attenuated weak coherent laser pulses instead of ideal single-photon emitters.
          Because of Poisson photon-number statistics, some pulses contain <strong>multiple photons</strong>. An advanced adversary (Eve)
          can mount a <em>Photon-Number-Splitting (PNS)</em> attack: selectively splitting and storing one photon in quantum memory while forwarding
          the remainder to Bob. After public basis reconciliation, Eve measures her stored photon in the revealed basis without introducing detectable error.
        </p>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#334155' }}>
          Current BB84 Simulator &rarr; Multiphoton Pulse Model &rarr; PNS Attack Simulation &rarr; Decoy-State Mitigation
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        {onNext && (
          <button className="btn btn-primary" onClick={onNext}>
            Proceed to Research Analysis Lab →
          </button>
        )}
        <button className="btn btn-secondary" onClick={onReset}>
          ← Start Another Experiment
        </button>
      </div>

      <p className="note" style={{ marginTop: 20 }}>
        This project is an educational simulation of BB84 and does not constitute a formal security proof or a production QKD implementation.
        Simulations are executed via Qiskit Aer. Secret key material is never exposed to the client interface.
      </p>
    </StepCard>
  )
}

// Chart 1: Noise vs Mean QBER
function NoiseVsQberSVG({ points, threshold = 11.0 }) {
  if (!points || points.length === 0) return null
  const w = 620, h = 200, padX = 45, padY = 30
  const maxNoise = Math.max(...points.map(p => p.noise_probability), 16)
  const maxQBER = Math.max(...points.map(p => p.mean_qber + p.std_qber), 20)

  const getX = (val) => padX + (val / maxNoise) * (w - padX * 2)
  const getY = (val) => h - padY - (val / maxQBER) * (h - padY * 2)

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.noise_probability)} ${getY(p.mean_qber)}`).join(' ')
  const threshY = getY(threshold)

  return (
    <svg width={w} height={h} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      <line x1={padX} y1={getY(0)} x2={w - padX} y2={getY(0)} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={padX} y1={threshY} x2={w - padX} y2={threshY} stroke="#f87171" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={w - padX - 4} y={threshY - 6} fill="#dc2626" fontSize="10" textAnchor="end" fontWeight="bold">
        Threshold ({threshold}%)
      </text>
      <text x={padX} y={h - 8} fill="#64748b" fontSize="10">Noise Probability (%)</text>
      <text x={12} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 12, ${padY})`}>Mean QBER (%)</text>
      <path d={lineD} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      {points.map((p, idx) => {
        const x = getX(p.noise_probability)
        const y = getY(p.mean_qber)
        const yTop = getY(p.mean_qber + p.std_qber)
        const yBot = getY(Math.max(0, p.mean_qber - p.std_qber))
        return (
          <g key={idx}>
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="#93c5fd" strokeWidth="2" />
            <line x1={x - 3} y1={yTop} x2={x + 3} y2={yTop} stroke="#93c5fd" strokeWidth="2" />
            <line x1={x - 3} y1={yBot} x2={x + 3} y2={yBot} stroke="#93c5fd" strokeWidth="2" />
            <circle cx={x} cy={y} r="4" fill="#1d4ed8" />
            <text x={x} y={y - 8} fill="#1e293b" fontSize="9" textAnchor="middle" fontWeight="bold">
              {p.mean_qber.toFixed(1)}%
            </text>
            <text x={x} y={h - 14} fill="#64748b" fontSize="9" textAnchor="middle">{p.noise_probability}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// Chart 2: Eve OFF vs Eve ON
function EveComparisonSVG({ comparison }) {
  const off = comparison.eve_off
  const on = comparison.eve_on
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Eve OFF (Baseline)</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#15803d', margin: '4px 0' }}>
          {off.mean_qber.toFixed(2)}%
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
          Std Dev: &plusmn;{off.std_qber.toFixed(2)}% | Key Acceptance: <strong>{off.acceptance_rate.toFixed(0)}%</strong>
        </div>
      </div>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Eve ON (Intercept-Resend)</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#b45309', margin: '4px 0' }}>
          {on.mean_qber.toFixed(2)}%
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#92400e' }}>
          Std Dev: &plusmn;{on.std_qber.toFixed(2)}% | Key Acceptance: <strong>{on.acceptance_rate.toFixed(0)}%</strong>
        </div>
      </div>
    </div>
  )
}

// Chart 3: Qubit Sample Size vs Variance
function QubitStabilitySVG({ points }) {
  const maxStd = Math.max(...points.map(p => p.std_qber), 4) * 1.3
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 130, paddingTop: 20 }}>
      {points.map((p, i) => {
        const barH = Math.max(10, (p.std_qber / maxStd) * 80)
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              &plusmn;{p.std_qber.toFixed(2)}%
            </div>
            <div style={{ height: barH, background: '#3b82f6', borderRadius: '4px 4px 0 0', margin: '0 auto', width: '70%' }}></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
              {p.n_qubits} qubits
            </div>
          </div>
        )
      })}
    </div>
  )
}
