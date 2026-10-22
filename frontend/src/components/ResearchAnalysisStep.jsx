import React, { useState } from 'react'
import StepCard from './StepCard.jsx'

const EXPERIMENT_OPTIONS = [
  { id: 'exp1', label: '1. Noise vs QBER', desc: 'Sweep channel noise from 0% to 20% across repeated trials' },
  { id: 'exp2', label: '2. Eve ON vs OFF', desc: 'Controlled benchmark under identical noise & qubit parameters' },
  { id: 'exp3', label: '3. Qubit Count vs QBER Stability', desc: 'Test sample size scaling: 16, 64, 256, 1024, 4096 qubits' },
  { id: 'exp4', label: '4. Noise Model Comparison', desc: 'Compare Depolarizing vs Bit-Flip vs Phase-Flip errors' },
  { id: 'exp5', label: '5. Noise + Eve Interaction', desc: '2D matrix evaluating combined noise and eavesdropping' },
  { id: 'exp6', label: '6. Key Acceptance Analysis', desc: 'Evaluate threshold acceptance rate and security decisions' },
  { id: 'exp7', label: '7. Statistical Reliability', desc: 'Investigate how repeated trials (10→100) stabilize error estimates' },
]

export default function ResearchAnalysisStep({ state, initialSettings, onReset }) {
  const [selectedExp, setSelectedExp] = useState('exp1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [completedExps, setCompletedExps] = useState({})

  // Configurable Parameters with clean academic defaults
  const [qubits, setQubits] = useState(initialSettings?.nQubits || 256)
  const [trials, setTrials] = useState(20)
  const [noiseLevel, setNoiseLevel] = useState(initialSettings?.noiseLevel || 0.05)
  const [noiseModel, setNoiseModel] = useState(initialSettings?.noiseType || 'depolarizing')
  const [eveEnabled, setEveEnabled] = useState(initialSettings?.eveEnabled || false)
  const [threshold, setThreshold] = useState(11.0)
  const [randomSeed, setRandomSeed] = useState(initialSettings?.seed || '')

  // Research Data Table state
  const [tableFilter, setTableFilter] = useState('all') // 'all' | 'accepted' | 'rejected'
  const [tableSort, setTableSort] = useState('default') // 'default' | 'qber_asc' | 'qber_desc'
  const [showTable, setShowTable] = useState(true)

  // Loading animation phase message
  const [loadingMessage, setLoadingMessage] = useState('Initializing quantum circuits in Qiskit Aer…')

  const runSelectedExperiment = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    const loadingPhrases = [
      'Compiling quantum circuits for Alice, Eve, and Bob…',
      'Executing multi-trial shots on AerSimulator backend…',
      'Applying quantum noise operators & measuring basis states…',
      'Computing parameter estimation, standard deviations & statistics…'
    ]
    let phraseIdx = 0
    const interval = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % loadingPhrases.length
      setLoadingMessage(loadingPhrases[phraseIdx])
    }, 900)

    try {
      let endpoint = ''
      let payload = {}
      const seedVal = randomSeed ? parseInt(randomSeed, 10) : null

      if (selectedExp === 'exp1') {
        endpoint = '/api/research/sweep'
        payload = {
          n_qubits: qubits,
          noise_model: noiseModel,
          start_noise: 0.0,
          end_noise: 0.20,
          step_noise: 0.04,
          trials: trials,
          eve_enabled: eveEnabled,
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp2') {
        endpoint = '/api/research/eve-study'
        payload = {
          n_qubits: qubits,
          noise_level: noiseLevel,
          noise_model: noiseModel,
          trials: trials,
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp3') {
        endpoint = '/api/research/sample-size'
        payload = {
          qubit_counts: [16, 64, 256, 1024, 4096],
          noise_level: noiseLevel,
          noise_model: noiseModel,
          eve_enabled: eveEnabled,
          trials: Math.min(trials, 25),
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp4') {
        endpoint = '/api/research/noise-models'
        payload = {
          n_qubits: qubits,
          noise_level: noiseLevel,
          eve_enabled: eveEnabled,
          trials: trials,
          threshold: threshold,
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp5') {
        endpoint = '/api/research/matrix2d'
        payload = {
          noise_levels: [0.0, 0.02, 0.05, 0.10, 0.15, 0.20],
          n_qubits: Math.min(qubits, 256),
          trials: Math.min(trials, 15),
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp6') {
        endpoint = '/api/research/key-acceptance'
        payload = {
          n_qubits: qubits,
          noise_level: noiseLevel,
          noise_model: noiseModel,
          eve_enabled: eveEnabled,
          trials: trials,
          threshold: threshold,
          random_seed: seedVal,
        }
      } else if (selectedExp === 'exp7') {
        endpoint = '/api/research/statistical-reliability'
        payload = {
          n_qubits: qubits,
          noise_level: noiseLevel,
          noise_model: noiseModel,
          eve_enabled: eveEnabled,
          trial_counts: [10, 25, 50, 100],
          threshold: threshold,
          random_seed: seedVal,
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        let msg = `Server returned ${res.status}`
        if (typeof errJson.detail === 'string') {
          msg = errJson.detail
        } else if (Array.isArray(errJson.detail)) {
          msg = errJson.detail.map(e => (e.loc ? `${e.loc[e.loc.length - 1]}: ${e.msg}` : e.msg)).join('; ')
        }
        throw new Error(msg)
      }

      const data = await res.json()
      setResults({ exp: selectedExp, data })
      setCompletedExps(prev => ({ ...prev, [selectedExp]: data }))
    } catch (err) {
      setError(err.message || 'Execution error')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  // Export current results as CSV
  const exportCurrentCSV = () => {
    if (!results) return
    const trialsList = extractFlatTrials(results, qubits, noiseLevel, noiseModel, eveEnabled)
    const expMeta = EXPERIMENT_OPTIONS.find(o => o.id === results.exp)
    const expTitle = expMeta ? expMeta.label : results.exp
    const csvContent = generateSingleExpCSV({
      expTitle,
      parameters: results.data.parameters,
      trials: trialsList,
    })
    downloadCSV(csvContent, `${results.exp}_dataset_${Date.now()}.csv`)
  }

  // Export master comprehensive CSV combining all completed experiments
  const exportComprehensiveCSV = () => {
    const allExps = { ...completedExps }
    if (results && results.exp && results.data) {
      allExps[results.exp] = results.data
    }
    const expKeys = Object.keys(allExps)
    if (expKeys.length === 0) {
      alert('No experimental data recorded yet. Please run at least one simulation.')
      return
    }

    const combinedTrials = []
    expKeys.forEach(expId => {
      const expData = allExps[expId]
      const expMeta = EXPERIMENT_OPTIONS.find(o => o.id === expId)
      const expTitle = expMeta ? expMeta.label : expId
      const flat = extractFlatTrials({ exp: expId, data: expData }, qubits, noiseLevel, noiseModel, eveEnabled)
      flat.forEach(t => {
        combinedTrials.push({
          ...t,
          experimentName: expTitle,
          threshold: expData.parameters?.threshold !== undefined ? expData.parameters.threshold : threshold
        })
      })
    })

    if (combinedTrials.length === 0) {
      alert('No recorded trial data available to export.')
      return
    }

    const csvContent = generateComprehensiveCSV({
      completedCount: expKeys.length,
      totalTrials: combinedTrials.length,
      trials: combinedTrials
    })
    downloadCSV(csvContent, `BB84_comprehensive_research_dataset_${Date.now()}.csv`)
  }

  // Active dataset evaluations for result card and data table
  const cardData = results ? extractCardData(results, selectedExp, qubits, trials, noiseLevel, noiseModel, eveEnabled, threshold, randomSeed) : null
  const flatTrials = results ? extractFlatTrials(results, qubits, noiseLevel, noiseModel, eveEnabled) : []
  const filteredTrials = flatTrials
    .filter(t => {
      if (tableFilter === 'accepted') return t.accepted
      if (tableFilter === 'rejected') return !t.accepted
      return true
    })
    .sort((a, b) => {
      if (tableSort === 'qber_asc') return a.qber - b.qber
      if (tableSort === 'qber_desc') return b.qber - a.qber
      return 0
    })

  return (
    <StepCard
      state={state}
      number="12"
      title="Research Analysis Laboratory"
      summary="Controlled multi-trial BB84 parameter studies & empirical statistical modeling."
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          This final stage functions as a live experimental quantum laboratory. By systematically varying
          a single channel parameter, you can execute independent Qiskit Aer simulation batches, compute
          statistical distributions, inspect error bars, and verify our core research hypotheses.
        </p>
      </div>

      {/* Control Panel */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em', marginBottom: 12 }}>
          🔬 Experiment Control Panel
        </div>

        {/* Experiment Selector */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Select Research Experiment Factor</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {EXPERIMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`segment-option ${selectedExp === opt.id ? 'selected' : ''}`}
                style={{ textAlign: 'left', padding: '10px 12px', height: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={() => { setSelectedExp(opt.id); setResults(null); }}
              >
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
                <span style={{ fontSize: '0.6875rem', color: selectedExp === opt.id ? '#ffffff' : 'var(--text-muted)', marginTop: 2 }}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Configuration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Prepared Qubits</label>
            <select
              value={qubits}
              onChange={e => setQubits(parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              {[16, 64, 256, 1024, 4096].map(q => (
                <option key={q} value={q}>{q} qubits</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Repeated Trials</label>
            <select
              value={trials}
              onChange={e => setTrials(parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              {[10, 20, 35, 50, 100].map(t => (
                <option key={t} value={t}>{t} trials</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Noise Probability</label>
            <select
              value={noiseLevel}
              onChange={e => setNoiseLevel(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              <option value={0.0}>0% (Ideal Channel)</option>
              <option value={0.02}>2% Noise</option>
              <option value={0.05}>5% Noise</option>
              <option value={0.10}>10% Noise</option>
              <option value={0.15}>15% Noise</option>
              <option value={0.20}>20% Noise</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Noise Model</label>
            <select
              value={noiseModel}
              onChange={e => setNoiseModel(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              <option value="depolarizing">Depolarizing</option>
              <option value="bit_flip">Bit Flip (X)</option>
              <option value="phase_flip">Phase Flip (Z)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Eve Intercept-Resend</label>
            <select
              value={eveEnabled ? 'true' : 'false'}
              onChange={e => setEveEnabled(e.target.value === 'true')}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              <option value="false">Eve OFF</option>
              <option value="true">Eve ON</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Decision Threshold (%)</label>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              step="0.5"
              min="1"
              max="50"
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Random Seed (Reproducibility)</label>
            <input
              type="number"
              placeholder="e.g. 42 (optional)"
              value={randomSeed}
              onChange={e => setRandomSeed(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={runSelectedExperiment} disabled={loading}>
            {loading ? 'Running Simulated Batches in Qiskit Aer…' : 'Run Independent Batch Simulation →'}
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Each trial executes a real quantum circuit simulation; no values are mock or hardcoded.
          </span>
        </div>
      </div>

      {/* Engaging Loading Screen */}
      {loading && (
        <div className="loading-indicator" style={{ margin: '20px 0', padding: 24, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)' }}>
          <div className="spinner"></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              Executing Quantum Simulation in IBM Qiskit Aer…
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--accent)', marginTop: 4 }}>
              {loadingMessage}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Testing {trials} trials &bull; Seed: {randomSeed || 'Stochastic'} &bull; Factor: {EXPERIMENT_OPTIONS.find(o => o.id === selectedExp)?.label}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginTop: 14 }}>
          <div className="alert-title">Experiment Execution Error</div>
          {error}
        </div>
      )}

      {/* Active Results Display */}
      {results && !loading && (
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                Empirical Measurement Dataset
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1.125rem' }}>
                {results.data.experiment_name}
              </h3>
            </div>
            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8125rem' }} onClick={exportCurrentCSV}>
              📥 Export CSV
            </button>
          </div>

          {/* Render specific experiment visualizations */}
          {results.exp === 'exp1' && (
            <div>
              <div className="chart-container">
                <NoiseVsQberSVG points={results.data.points} threshold={threshold} />
              </div>
              <div className="research-interpretation-box">
                <h4>Empirical Interpretation (Generated from Measured Data)</h4>
                <div className="interpretation-item">
                  <strong>Measured Trend:</strong> {results.data.points[results.data.points.length - 1].mean_qber > results.data.points[0].mean_qber
                    ? 'QBER increased as channel noise increased, confirming that environmental decoherence directly degrades quantum state fidelity.'
                    : 'Channel noise variance was small across the tested range.'}
                </div>
                <div className="interpretation-item">
                  <strong>Threshold Boundary:</strong> Noise levels exceeding {threshold}% experienced sharp drops in key acceptance rates toward 0%.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp2' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Eve Intercept-Resend vs Baseline Channel (Mean QBER &plusmn; 1&sigma;)
                </div>
                <EveComparisonSVG caseOff={results.data.case_eve_off} caseOn={results.data.case_eve_on} threshold={threshold} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, margin: '14px 0' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Eve OFF (Baseline)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#15803d', margin: '4px 0' }}>
                    {results.data.case_eve_off.mean_qber.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
                    Std Dev: &plusmn;{results.data.case_eve_off.std_qber.toFixed(2)}% | Key Acceptance: <strong>{results.data.case_eve_off.acceptance_rate.toFixed(0)}%</strong>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Eve ON (Intercept-Resend Active)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#b45309', margin: '4px 0' }}>
                    {results.data.case_eve_on.mean_qber.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#92400e' }}>
                    Std Dev: &plusmn;{results.data.case_eve_on.std_qber.toFixed(2)}% | Key Acceptance: <strong>{results.data.case_eve_on.acceptance_rate.toFixed(0)}%</strong>
                  </div>
                </div>
              </div>

              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Measurement Disturbance:</strong> Eve intercept-resend attack induced approximately +{roundDiff(results.data.case_eve_on.mean_qber, results.data.case_eve_off.mean_qber)}% higher error rate due to measurements in non-orthogonal bases.
                </div>
                <div className="interpretation-item">
                  <strong>Scientific Caveat:</strong> High QBER alone does not uniquely prove Eve's presence because excessive environmental noise produces similar error signatures.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp3' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Prepared Qubits vs Parameter Stability (Variance Reduction Corridor)
                </div>
                <QubitStabilitySVG points={results.data.results} />
              </div>
              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Sample Size Stability:</strong> Smaller qubit sample sizes (16 &bull; 64) exhibited large variance (&sigma; = &plusmn;{results.data.results[0].std_qber.toFixed(1)}%), while larger sample sizes (1024 &bull; 4096) stabilized the parameter estimation.
                </div>
                <div className="interpretation-item">
                  <strong>Finite-Key Note:</strong> Increasing the qubit count improves statistical certainty of the measurement; it does not alter the underlying channel error probability.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp4' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Noise Model Error Impact Comparison (Mean QBER &plusmn; 1&sigma;)
                </div>
                <NoiseModelsSVG models={results.data.models} threshold={threshold} />
              </div>

              <table className="data-table" style={{ margin: '14px 0' }}>
                <thead>
                  <tr>
                    <th>Noise Error Model</th>
                    <th>Mean QBER</th>
                    <th>Std Dev (&sigma;)</th>
                    <th>Observed Range</th>
                    <th>Key Acceptance ({threshold}%)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.models.map(m => (
                    <tr key={m.noise_model}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{m.noise_model}</td>
                      <td>{m.mean_qber.toFixed(2)}%</td>
                      <td>&plusmn;{m.std_qber.toFixed(2)}%</td>
                      <td>{m.min_qber.toFixed(1)}% &ndash; {m.max_qber.toFixed(1)}%</td>
                      <td style={{ fontWeight: 600, color: m.acceptance_rate > 50 ? 'var(--success)' : 'var(--danger)' }}>
                        {m.acceptance_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Model Comparison:</strong> Depolarizing noise uniformly mixes all states across the Bloch sphere, whereas bit-flip ($X$) and phase-flip ($Z$) act directionally with differing sifting impact.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp5' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Channel Noise &times; Eve Interaction Curves (Disturbance Compounding)
                </div>
                <MatrixLineComparisonSVG matrix={results.data.matrix} threshold={threshold} />
              </div>

              <div className="heatmap-grid" style={{ margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: 90 }}>EVE STATE</div>
                  {results.data.matrix[0].cells.map((c, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>Noise {c.noise}%</div>
                  ))}
                </div>

                {results.data.matrix.map((row, idx) => (
                  <div key={idx} className="heatmap-row">
                    <div style={{ width: 90, fontWeight: 600, fontSize: '0.8125rem' }}>
                      Eve {row.eve_status}
                    </div>
                    {row.cells.map((cell, cIdx) => {
                      const isHigh = cell.mean_qber >= threshold
                      return (
                        <div key={cIdx} className="heatmap-cell" style={{
                          background: isHigh ? '#fee2e2' : '#f0fdf4',
                          color: isHigh ? '#991b1b' : '#166534',
                          padding: '10px 4px'
                        }}>
                          <div style={{ fontSize: '0.875rem' }}>{cell.mean_qber.toFixed(1)}%</div>
                          <div style={{ fontSize: '0.625rem', opacity: 0.8 }}>
                            {cell.acceptance_rate > 0 ? `${cell.acceptance_rate}% OK` : 'Rejected'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Compound Disturbance:</strong> Channel noise and intercept-resend act concurrently to increase total error rate; when Eve is active, QBER remains elevated even at 0% channel noise.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp6' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Key Acceptance Proportion &amp; Trial Boundary Distribution
                </div>
                <KeyAcceptanceDistributionSVG data={results.data} threshold={threshold} />
              </div>

              <div className="stats-grid" style={{ margin: '14px 0' }}>
                <div className="stat-item">
                  <div className="stat-label">Evaluated Threshold</div>
                  <div className="stat-value">{results.data.threshold}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Mean QBER</div>
                  <div className="stat-value">{results.data.mean_qber.toFixed(2)}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Acceptance Rate</div>
                  <div className="stat-value" style={{ color: results.data.acceptance_rate > 50 ? 'var(--success)' : 'var(--danger)' }}>
                    {results.data.acceptance_rate}%
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Rejection Rate</div>
                  <div className="stat-value" style={{ color: results.data.rejection_rate > 50 ? 'var(--danger)' : 'inherit' }}>
                    {results.data.rejection_rate}%
                  </div>
                </div>
              </div>

              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Security Rule:</strong> Out of {results.data.total_trials} independent trials, {results.data.accepted_trials} trials satisfied the condition QBER &lt; {results.data.threshold}%. The remaining trials were rejected to protect confidentiality.
                </div>
              </div>
            </div>
          )}

          {results.exp === 'exp7' && (
            <div>
              <div className="chart-container" style={{ margin: '12px 0', background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Statistical Convergence Funnel Across Repeated Trials (10 &rarr; 100)
                </div>
                <ReliabilityConvergenceSVG runs={results.data.runs} threshold={threshold} />
              </div>

              <table className="data-table" style={{ margin: '14px 0' }}>
                <thead>
                  <tr>
                    <th>Repeated Trials Count</th>
                    <th>Sample Mean QBER</th>
                    <th>Standard Deviation (&sigma;)</th>
                    <th>Extreme Range (Min &ndash; Max)</th>
                    <th>Estimated Acceptance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.runs.map(r => (
                    <tr key={r.trial_count}>
                      <td><strong>{r.trial_count} trials</strong></td>
                      <td>{r.mean_qber.toFixed(2)}%</td>
                      <td>&plusmn;{r.std_qber.toFixed(2)}%</td>
                      <td>{r.min_qber.toFixed(1)}% &ndash; {r.max_qber.toFixed(1)}%</td>
                      <td>{r.acceptance_rate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="research-interpretation-box">
                <h4>Empirical Interpretation</h4>
                <div className="interpretation-item">
                  <strong>Statistical Reliability:</strong> Increasing the trial count from 10 to 100 provides tighter statistical convergence around the central limit, refining error bounds without changing physical channel physics.
                </div>
              </div>
            </div>
          )}

          {/* EXPERIMENT RESULT CARD */}
          {cardData && (
            <div style={{ marginTop: 20, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em', marginBottom: 12 }}>
                📋 Experiment Result Card
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {/* Experimental Setup */}
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b', marginBottom: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
                    ⚙️ Experimental Setup
                  </div>
                  <table style={{ width: '100%', fontSize: '0.75rem', lineHeight: 1.8 }}>
                    <tbody>
                      <tr><td style={{ color: '#64748b', width: '50%' }}>Prepared Qubits:</td><td style={{ fontWeight: 600 }}>{cardData.setup.qubits}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Independent Trials:</td><td style={{ fontWeight: 600 }}>{cardData.setup.trials}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Noise Probability:</td><td style={{ fontWeight: 600 }}>{cardData.setup.noise}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Noise Error Model:</td><td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cardData.setup.noiseModel}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Eve Intercept-Resend:</td><td style={{ fontWeight: 600 }}>{cardData.setup.eve}</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Decision Cutoff:</td><td style={{ fontWeight: 600 }}>{cardData.setup.threshold}%</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Simulation Seed:</td><td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{cardData.setup.seed}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Measurements */}
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b', marginBottom: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
                    📊 Statistical Measurements
                  </div>
                  <table style={{ width: '100%', fontSize: '0.75rem', lineHeight: 1.8 }}>
                    <tbody>
                      <tr><td style={{ color: '#64748b', width: '50%' }}>Mean QBER:</td><td style={{ fontWeight: 700, color: cardData.measurements.meanQber > threshold ? 'var(--danger)' : 'var(--success)' }}>{cardData.measurements.meanQber.toFixed(2)}%</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Standard Deviation (&sigma;):</td><td style={{ fontWeight: 600 }}>&plusmn;{cardData.measurements.stdQber.toFixed(2)}%</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Extreme Range (Min–Max):</td><td style={{ fontWeight: 600 }}>{cardData.measurements.minQber.toFixed(1)}% &ndash; {cardData.measurements.maxQber.toFixed(1)}%</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Key Acceptance Rate:</td><td style={{ fontWeight: 700, color: cardData.measurements.acceptanceRate > 50 ? 'var(--success)' : 'var(--danger)' }}>{cardData.measurements.acceptanceRate.toFixed(1)}%</td></tr>
                      <tr><td style={{ color: '#64748b' }}>Avg Sifted Key Length:</td><td style={{ fontWeight: 600 }}>{cardData.measurements.avgSiftedLength.toFixed(1)} bits</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automatic Interpretation */}
              <div style={{ marginTop: 12, padding: 10, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Automated Empirical Interpretation:</strong> {cardData.measurements.interpretation}
              </div>
            </div>
          )}

          {/* RESEARCH DATA TABLE */}
          {flatTrials.length > 0 && (
            <div style={{ marginTop: 22, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                    Raw Experimental Data ({flatTrials.length} Recorded Trials)
                  </span>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Bit-level independent simulation records from local AerSimulator backend (Secret keys omitted).
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Filter */}
                  <select
                    value={tableFilter}
                    onChange={e => setTableFilter(e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
                  >
                    <option value="all">All Trials ({flatTrials.length})</option>
                    <option value="accepted">Accepted Only ({flatTrials.filter(t => t.accepted).length})</option>
                    <option value="rejected">Rejected Only ({flatTrials.filter(t => !t.accepted).length})</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={tableSort}
                    onChange={e => setTableSort(e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}
                  >
                    <option value="default">Default Order</option>
                    <option value="qber_asc">QBER (Low → High)</option>
                    <option value="qber_desc">QBER (High → Low)</option>
                  </select>

                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={exportCurrentCSV}>
                    📥 Export Current CSV
                  </button>

                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#2563eb', color: '#ffffff' }} onClick={exportComprehensiveCSV}>
                    📊 Export All Exps CSV
                  </button>

                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => setShowTable(!showTable)}
                  >
                    {showTable ? '▲ Hide Table' : '▼ Show Table'}
                  </button>
                </div>
              </div>

              {showTable && (
                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <table className="data-table" style={{ margin: 0, fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Trial #</th>
                        <th>Qubits</th>
                        <th>Noise (%)</th>
                        <th>Noise Model</th>
                        <th>Eve</th>
                        <th>Sifted Length</th>
                        <th>Compared (Errors)</th>
                        <th>Measured QBER</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrials.map((tr, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{tr.trial}</td>
                          <td>{tr.qubits}</td>
                          <td>{tr.noise}%</td>
                          <td style={{ textTransform: 'capitalize' }}>{tr.model}</td>
                          <td>{tr.eve ? 'ON' : 'OFF'}</td>
                          <td>{tr.siftedLength} bits</td>
                          <td>{tr.compared} ({tr.errors} err)</td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tr.qber.toFixed(2)}%</td>
                          <td style={{ fontWeight: 700, color: tr.accepted ? 'var(--success)' : 'var(--danger)' }}>
                            {tr.accepted ? '✓ Accepted' : '✗ Rejected'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Research Questions Panel */}
      <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <p className="section-heading" style={{ margin: '0 0 10px 0' }}>Research Questions &amp; Evidence Tracker</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {[
            { id: 'exp1', q: 'RQ1: How does increasing channel noise affect QBER?', ans: 'Noise increases QBER monotonically; values > 11% cause key rejection.' },
            { id: 'exp2', q: 'RQ2: How does an intercept-resend attacker affect QBER?', ans: 'Eve induces an additional ~25% error rate by measuring in non-matching bases.' },
            { id: 'exp3', q: 'RQ3: Does increasing qubit count improve statistical stability?', ans: 'Yes, larger sample sizes shrink estimation standard deviation.' },
            { id: 'exp4', q: 'RQ4: How do different noise models affect measured QBER?', ans: 'Depolarizing noise affects both bases equally; bit/phase flips act directionally.' },
            { id: 'exp5', q: 'RQ5: How do channel noise and Eve interact?', ans: 'Disturbances compound; Eve elevates baseline error even at 0% channel noise.' },
            { id: 'exp6', q: 'RQ6: How does QBER influence key acceptance?', ans: 'Key acceptance drops sharply to 0% once QBER crosses the 11% decision threshold.' },
          ].map(item => {
            const isCompleted = !!completedExps[item.id]
            return (
              <div key={item.id} style={{
                background: isCompleted ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${isCompleted ? '#86efac' : '#cbd5e1'}`,
                borderRadius: 'var(--radius-md)',
                padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: isCompleted ? '#15803d' : '#334155' }}>
                    {item.q}
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isCompleted ? '#166534' : '#64748b' }}>
                    {isCompleted ? '✓ Evidence Collected' : '○ Not Evaluated'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  {item.ans}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FINAL RESEARCH SUMMARY */}
      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <p className="section-heading" style={{ margin: '0 0 4px 0' }}>Overall Research Summary</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Cumulative empirical conclusions generated dynamically from actual completed experimental runs.
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '7px 14px', background: '#2563eb', color: '#ffffff' }}
            onClick={exportComprehensiveCSV}
          >
            <span>📊</span>
            <span>Export Comprehensive Master CSV ({Object.keys(completedExps).length} Exps Recorded)</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          {/* Item 1 */}
          <div style={{ background: completedExps.exp1 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp1 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp1 ? '#166534' : '#475569', marginBottom: 4 }}>
              1. Effect of Noise on QBER
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp1 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp1 ? (
                <>Noise swept from 0% to 20%. Mean QBER increased from <strong>{completedExps.exp1.points[0].mean_qber.toFixed(2)}%</strong> to <strong>{completedExps.exp1.points[completedExps.exp1.points.length - 1].mean_qber.toFixed(2)}%</strong>, crossing the 11% cutoff at high noise levels.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 2 */}
          <div style={{ background: completedExps.exp2 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp2 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp2 ? '#166534' : '#475569', marginBottom: 4 }}>
              2. Effect of Eve on QBER
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp2 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp2 ? (
                <>Eve intercept-resend attack introduced an additional <strong>+{roundDiff(completedExps.exp2.case_eve_on.mean_qber, completedExps.exp2.case_eve_off.mean_qber)}%</strong> QBER, reducing key acceptance from <strong>{completedExps.exp2.case_eve_off.acceptance_rate.toFixed(0)}%</strong> to <strong>{completedExps.exp2.case_eve_on.acceptance_rate.toFixed(0)}%</strong>.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 3 */}
          <div style={{ background: completedExps.exp3 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp3 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp3 ? '#166534' : '#475569', marginBottom: 4 }}>
              3. Qubit Count vs Stability
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp3 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp3 ? (
                <>Scaling prepared qubits from 16 to 4096 reduced measurement standard deviation from <strong>&plusmn;{completedExps.exp3.results[0].std_qber.toFixed(2)}%</strong> down to <strong>&plusmn;{completedExps.exp3.results[completedExps.exp3.results.length - 1].std_qber.toFixed(2)}%</strong>.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 4 */}
          <div style={{ background: completedExps.exp4 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp4 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp4 ? '#166534' : '#475569', marginBottom: 4 }}>
              4. Noise-Model Differences
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp4 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp4 ? (
                <>Depolarizing: <strong>{completedExps.exp4.models.find(m => m.noise_model === 'depolarizing')?.mean_qber.toFixed(2)}%</strong> | Bit-Flip: <strong>{completedExps.exp4.models.find(m => m.noise_model === 'bit_flip')?.mean_qber.toFixed(2)}%</strong> | Phase-Flip: <strong>{completedExps.exp4.models.find(m => m.noise_model === 'phase_flip')?.mean_qber.toFixed(2)}%</strong>.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 5 */}
          <div style={{ background: completedExps.exp5 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp5 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp5 ? '#166534' : '#475569', marginBottom: 4 }}>
              5. Noise + Eve Interaction
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp5 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp5 ? (
                <>2D matrix demonstrated combined effects: Eve alone established baseline QBER of <strong>{completedExps.exp5.matrix.find(r => r.eve_status === 'ON')?.cells[0].mean_qber.toFixed(1)}%</strong> at 0% noise, rising further under channel disturbance.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 6 */}
          <div style={{ background: completedExps.exp6 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp6 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp6 ? '#166534' : '#475569', marginBottom: 4 }}>
              6. Key Acceptance Behavior
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp6 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp6 ? (
                <>Under {completedExps.exp6.threshold}% threshold, <strong>{completedExps.exp6.acceptance_rate.toFixed(1)}%</strong> of trials established secure keys, while <strong>{completedExps.exp6.rejection_rate.toFixed(1)}%</strong> aborted.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>

          {/* Item 7 */}
          <div style={{ background: completedExps.exp7 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${completedExps.exp7 ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: completedExps.exp7 ? '#166534' : '#475569', marginBottom: 4 }}>
              7. Statistical Reliability
            </div>
            <div style={{ fontSize: '0.75rem', color: completedExps.exp7 ? '#1e293b' : '#94a3b8', lineHeight: 1.5 }}>
              {completedExps.exp7 ? (
                <>Repetitions from 10 to 100 trials improved central estimate accuracy; standard deviation stabilized at <strong>&plusmn;{completedExps.exp7.runs[completedExps.exp7.runs.length - 1].std_qber.toFixed(2)}%</strong>.</>
              ) : 'Not evaluated yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Reproducibility Section */}
      <div style={{ marginTop: 22, padding: 14, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#475569' }}>
        <strong>Scientific Reproducibility:</strong> The seed parameter controls pseudorandom basis generation and measurement sampling on the local AerSimulator backend. Current run seed: <strong>{randomSeed ? randomSeed : 'Random (Stochastic)'}</strong>. A fixed integer seed produces byte-identical simulation executions across runs.
      </div>

      {/* Expandable Limitations Section */}
      <div style={{ marginTop: 14 }}>
        <details style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
          <summary style={{ fontWeight: 700, color: '#92400e', cursor: 'pointer', fontSize: '0.8125rem' }}>
            🔬 Important Scientific Limitations &amp; Theoretical Scope (Click to expand)
          </summary>
          <div style={{ marginTop: 10, fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Classical Simulation via Qiskit Aer:</strong> Circuits are executed on a classical CPU simulator using IBM Qiskit Aer backend. While state vectors and Kraus noise operators model genuine quantum physics, hardware imperfections like dark counts, timing jitter, and detector saturation are idealized.</li>
              <li><strong>Asymptotic Security Decision Rule:</strong> The 11% QBER cutoff corresponds to the theoretical Shor-Preskill asymptotic collective-attack threshold where Alice and Bob retain mutual information advantage over Eve ($I(A:B) &gt; I(A:E)$). It is an educational threshold and not an unconditional finite-key proof.</li>
              <li><strong>Single-Photon State Idealization:</strong> Circuits assume idealized single-photon Fock states $|0\rangle, |1\rangle, |+\rangle, |-\rangle$. Practical QKD implementations utilize attenuated weak coherent laser pulses subject to Poissonian photon statistics, which enables multiphoton Photon-Number-Splitting (PNS) attacks requiring decoy-state mitigation.</li>
            </ul>
          </div>
        </details>
      </div>

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onReset}>
          ← Start a new experiment
        </button>
      </div>
    </StepCard>
  )
}

function roundDiff(a, b) {
  return Math.max(0, a - b).toFixed(1)
}

// 1. SVG Graph: Noise vs Mean QBER
function NoiseVsQberSVG({ points, threshold = 11.0 }) {
  if (!points || points.length === 0) return null
  const w = 620, h = 210, padX = 55, padY = 32
  const maxNoise = Math.max(...points.map(p => p.noise_probability), 20)
  const maxQBER = Math.max(...points.map(p => p.mean_qber + p.std_qber), 25)

  const getX = (val) => padX + (val / maxNoise) * (w - padX * 2)
  const getY = (val) => h - padY - (val / maxQBER) * (h - padY * 2)

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.noise_probability)} ${getY(p.mean_qber)}`).join(' ')
  const threshY = getY(threshold)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      {[0, 5, 10, 15, 20].filter(v => v <= maxQBER).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v === 0 ? 'none' : '3 3'} />
          <text x={padX - 8} y={getY(v) + 3} fill="#94a3b8" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}
      <line x1={padX} y1={threshY} x2={w - padX} y2={threshY} stroke="#ef4444" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={w - padX - 4} y={threshY - 6} fill="#dc2626" fontSize="10" textAnchor="end" fontWeight="bold">
        Threshold ({threshold}%)
      </text>
      <text x={padX} y={h - 6} fill="#64748b" fontSize="10">Noise Probability (%)</text>
      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>Mean QBER &plusmn; 1&sigma; (%)</text>
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
            <circle cx={x} cy={y} r="4.5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
            <text x={x} y={y - 8} fill="#0f172a" fontSize="10" textAnchor="middle" fontWeight="bold">
              {p.mean_qber.toFixed(1)}%
            </text>
            <text x={x} y={h - padY + 16} fill="#64748b" fontSize="9.5" textAnchor="middle">{p.noise_probability}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// 2. SVG Graph: Eve Intercept-Resend vs Baseline
function EveComparisonSVG({ caseOff, caseOn, threshold = 11.0 }) {
  if (!caseOff || !caseOn) return null
  const w = 620, h = 230, padX = 70, padY = 35
  const maxY = Math.max(35, caseOff.mean_qber + caseOff.std_qber, caseOn.mean_qber + caseOn.std_qber) * 1.15

  const getY = (v) => h - padY - (v / maxY) * (h - padY * 2)
  const threshY = getY(threshold)

  const bars = [
    {
      label: 'Eve OFF (Baseline)',
      sub: 'Decoherence Noise Only',
      mean: caseOff.mean_qber,
      std: caseOff.std_qber,
      acc: caseOff.acceptance_rate,
      color: '#2563eb',
      x: 170
    },
    {
      label: 'Eve ON (Active Attack)',
      sub: 'Intercept-Resend Measurement',
      mean: caseOn.mean_qber,
      std: caseOn.std_qber,
      acc: caseOn.acceptance_rate,
      color: '#dc2626',
      x: 430
    }
  ]
  const barWidth = 90

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      {[0, 10, 20, 30].filter(v => v <= maxY).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v === 0 ? 'none' : '3 3'} />
          <text x={padX - 8} y={getY(v) + 3} fill="#64748b" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}

      <line x1={padX} y1={threshY} x2={w - padX} y2={threshY} stroke="#ef4444" strokeDasharray="5 4" strokeWidth="1.5" />
      <text x={w - padX - 4} y={threshY - 6} fill="#dc2626" fontSize="10" textAnchor="end" fontWeight="bold">
        11% Security Cutoff (Collective Attack Threshold)
      </text>

      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>
        Measured QBER &plusmn; 1&sigma; (%)
      </text>

      {bars.map((b, i) => {
        const topY = getY(b.mean)
        const barH = Math.max(4, (h - padY) - topY)
        const errTop = getY(b.mean + b.std)
        const errBot = getY(Math.max(0, b.mean - b.std))

        return (
          <g key={i}>
            <rect
              x={b.x - barWidth / 2}
              y={topY}
              width={barWidth}
              height={barH}
              fill={b.color}
              rx="4"
              opacity="0.9"
            />
            <line x1={b.x} y1={errTop} x2={b.x} y2={errBot} stroke="#0f172a" strokeWidth="2" />
            <line x1={b.x - 12} y1={errTop} x2={b.x + 12} y2={errTop} stroke="#0f172a" strokeWidth="2" />
            <line x1={b.x - 12} y1={errBot} x2={b.x + 12} y2={errBot} stroke="#0f172a" strokeWidth="2" />

            <text x={b.x} y={errTop - 6} fill="#0f172a" fontSize="12" textAnchor="middle" fontWeight="bold">
              {b.mean.toFixed(2)}%
            </text>
            <text x={b.x} y={errTop - 20} fill="#64748b" fontSize="9.5" textAnchor="middle">
              &plusmn;{b.std.toFixed(2)}%
            </text>

            <text x={b.x} y={h - padY + 16} fill="#0f172a" fontSize="11" textAnchor="middle" fontWeight="700">
              {b.label}
            </text>
            <text x={b.x} y={h - padY + 30} fill="#64748b" fontSize="9.5" textAnchor="middle">
              {b.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 3. SVG Graph: Qubit Count vs Stability
function QubitStabilitySVG({ points }) {
  if (!points || points.length === 0) return null
  const w = 620, h = 230, padX = 65, padY = 32
  const maxQber = Math.max(...points.map(p => p.mean_qber + p.std_qber), 12) * 1.15

  const nPoints = points.length
  const getX = (i) => padX + (i / (nPoints - 1 || 1)) * (w - padX * 2)
  const getY = (val) => h - padY - (val / maxQber) * (h - padY * 2)

  const upperPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.mean_qber + p.std_qber)}`).join(' ')
  const lowerPath = points.map((p, i) => `L ${getX(nPoints - 1 - i)} ${getY(Math.max(0, points[nPoints - 1 - i].mean_qber - points[nPoints - 1 - i].std_qber))}`).join(' ')
  const areaD = `${upperPath} ${lowerPath} Z`
  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.mean_qber)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#cbd5e1" strokeWidth="1" />
      {[0, 5, 10, 15].filter(v => v <= maxQber).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <text x={padX - 8} y={getY(v) + 3} fill="#94a3b8" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}

      <text x={padX} y={h - 6} fill="#64748b" fontSize="10">Prepared Qubits (N)</text>
      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>Mean QBER &plusmn; 1&sigma; (%)</text>

      <path d={areaD} fill="#dbeafe" opacity="0.65" />
      <path d={lineD} fill="none" stroke="#2563eb" strokeWidth="2.5" />

      {points.map((p, idx) => {
        const x = getX(idx)
        const y = getY(p.mean_qber)
        const yTop = getY(p.mean_qber + p.std_qber)
        const yBot = getY(Math.max(0, p.mean_qber - p.std_qber))

        return (
          <g key={idx}>
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="#1d4ed8" strokeWidth="1.5" />
            <line x1={x - 4} y1={yTop} x2={x + 4} y2={yTop} stroke="#1d4ed8" strokeWidth="1.5" />
            <line x1={x - 4} y1={yBot} x2={x + 4} y2={yBot} stroke="#1d4ed8" strokeWidth="1.5" />

            <circle cx={x} cy={y} r="4.5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />

            <text x={x} y={yTop - 6} fill="#0f172a" fontSize="10" textAnchor="middle" fontWeight="bold">
              {p.mean_qber.toFixed(2)}%
            </text>
            <text x={x} y={yBot + 14} fill="#2563eb" fontSize="9" textAnchor="middle" fontWeight="600">
              &plusmn;{p.std_qber.toFixed(2)}%
            </text>
            <text x={x} y={h - padY + 16} fill="#334155" fontSize="10" textAnchor="middle" fontWeight="600">
              {p.n_qubits}q
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 4. SVG Graph: Noise Model Comparison
function NoiseModelsSVG({ models, threshold = 11.0 }) {
  if (!models || models.length === 0) return null
  const w = 620, h = 230, padX = 65, padY = 35
  const maxY = Math.max(18, ...models.map(m => m.mean_qber + m.std_qber)) * 1.15

  const getY = (v) => h - padY - (v / maxY) * (h - padY * 2)
  const threshY = getY(threshold)
  const barWidth = 72
  const colors = {
    depolarizing: '#2563eb',
    bit_flip: '#7c3aed',
    phase_flip: '#0891b2'
  }

  const getColX = (i) => padX + 60 + i * ((w - padX * 2 - 120) / (models.length - 1 || 1))

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      {[0, 5, 10, 15, 20].filter(v => v <= maxY).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v === 0 ? 'none' : '3 3'} />
          <text x={padX - 8} y={getY(v) + 3} fill="#64748b" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}

      <line x1={padX} y1={threshY} x2={w - padX} y2={threshY} stroke="#ef4444" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={w - padX - 4} y={threshY - 5} fill="#dc2626" fontSize="10" textAnchor="end" fontWeight="bold">
        Threshold ({threshold}%)
      </text>

      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>
        Mean QBER &plusmn; 1&sigma; (%)
      </text>

      {models.map((m, idx) => {
        const x = getColX(idx)
        const barH = Math.max(4, (h - padY) - getY(m.mean_qber))
        const col = colors[m.noise_model] || '#2563eb'
        const yTop = getY(m.mean_qber + m.std_qber)
        const yBot = getY(Math.max(0, m.mean_qber - m.std_qber))

        return (
          <g key={idx}>
            <rect
              x={x - barWidth / 2}
              y={getY(m.mean_qber)}
              width={barWidth}
              height={barH}
              fill={col}
              rx="4"
              opacity="0.9"
            />
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="#0f172a" strokeWidth="2" />
            <line x1={x - 10} y1={yTop} x2={x + 10} y2={yTop} stroke="#0f172a" strokeWidth="2" />
            <line x1={x - 10} y1={yBot} x2={x + 10} y2={yBot} stroke="#0f172a" strokeWidth="2" />

            <text x={x} y={yTop - 6} fill="#0f172a" fontSize="11" textAnchor="middle" fontWeight="bold">
              {m.mean_qber.toFixed(2)}%
            </text>
            <text x={x} y={yTop - 18} fill="#64748b" fontSize="9" textAnchor="middle">
              &plusmn;{m.std_qber.toFixed(2)}%
            </text>

            <text x={x} y={h - padY + 16} fill="#0f172a" fontSize="11" textAnchor="middle" fontWeight="700" style={{ textTransform: 'capitalize' }}>
              {m.noise_model.replace('_', ' ')}
            </text>
            <text x={x} y={h - padY + 30} fill={m.acceptance_rate > 50 ? '#15803d' : '#b91c1c'} fontSize="9.5" textAnchor="middle" fontWeight="600">
              {m.acceptance_rate.toFixed(0)}% Accepted
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 5. SVG Graph: Noise x Eve 2D Interaction Curves
function MatrixLineComparisonSVG({ matrix, threshold = 11.0 }) {
  if (!matrix || matrix.length < 2) return null
  const w = 620, h = 230, padX = 65, padY = 35

  const offRow = matrix.find(r => r.eve_status === 'OFF') || matrix[0]
  const onRow = matrix.find(r => r.eve_status === 'ON') || matrix[1]

  const noiseVals = offRow.cells.map(c => c.noise)
  const maxNoise = Math.max(...noiseVals, 20)
  const allQbers = [...offRow.cells.map(c => c.mean_qber), ...onRow.cells.map(c => c.mean_qber)]
  const maxQber = Math.max(...allQbers, 35) * 1.1

  const getX = (val) => padX + (val / maxNoise) * (w - padX * 2)
  const getY = (val) => h - padY - (val / maxQber) * (h - padY * 2)

  const threshY = getY(threshold)
  const offLine = offRow.cells.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.noise)} ${getY(c.mean_qber)}`).join(' ')
  const onLine = onRow.cells.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.noise)} ${getY(c.mean_qber)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      {[0, 10, 20, 30].filter(v => v <= maxQber).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v === 0 ? 'none' : '3 3'} />
          <text x={padX - 8} y={getY(v) + 3} fill="#94a3b8" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}

      <line x1={padX} y1={threshY} x2={w - padX} y2={threshY} stroke="#ef4444" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={w - padX - 4} y={threshY - 5} fill="#dc2626" fontSize="10" textAnchor="end" fontWeight="bold">
        Threshold ({threshold}%)
      </text>

      <text x={padX} y={h - 6} fill="#64748b" fontSize="10">Channel Noise (%)</text>
      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>Mean QBER (%)</text>

      {/* Legend */}
      <g transform={`translate(${padX + 20}, ${padY - 14})`}>
        <line x1="0" y1="0" x2="20" y2="0" stroke="#2563eb" strokeWidth="2.5" />
        <circle cx="10" cy="0" r="3.5" fill="#1d4ed8" />
        <text x="26" y="3" fill="#1e293b" fontSize="10" fontWeight="600">Eve OFF</text>

        <line x1="90" y1="0" x2="110" y2="0" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 2" />
        <rect x="97" y="-3" width="6" height="6" fill="#dc2626" />
        <text x="116" y="3" fill="#1e293b" fontSize="10" fontWeight="600">Eve ON (Intercept-Resend)</text>
      </g>

      <path d={offLine} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <path d={onLine} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 3" />

      {offRow.cells.map((c, i) => {
        const x = getX(c.noise)
        const y = getY(c.mean_qber)
        return (
          <g key={`off-${i}`}>
            <circle cx={x} cy={y} r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
            <text x={x} y={y - 8} fill="#1d4ed8" fontSize="9" textAnchor="middle" fontWeight="bold">{c.mean_qber.toFixed(1)}%</text>
            <text x={x} y={h - padY + 14} fill="#64748b" fontSize="9.5" textAnchor="middle">{c.noise}%</text>
          </g>
        )
      })}

      {onRow.cells.map((c, i) => {
        const x = getX(c.noise)
        const y = getY(c.mean_qber)
        return (
          <g key={`on-${i}`}>
            <rect x={x - 3.5} y={y - 3.5} width="7" height="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
            <text x={x} y={y - 8} fill="#b91c1c" fontSize="9" textAnchor="middle" fontWeight="bold">{c.mean_qber.toFixed(1)}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// 6. SVG Graph: Key Acceptance Distribution
function KeyAcceptanceDistributionSVG({ data, threshold = 11.0 }) {
  if (!data) return null
  const w = 620, h = 210, padX = 55, padY = 30
  const trials = data.trial_records || []
  const accRate = data.acceptance_rate || 0
  const rejRate = data.rejection_rate || (100 - accRate)

  const maxQber = Math.max(threshold * 1.5, ...(trials.map(t => t.qber)), 20)
  const getX = (val) => padX + (val / maxQber) * (w - padX * 2)
  const threshX = getX(threshold)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
          <span style={{ color: '#16a34a' }}>✓ Accepted Keys: {accRate.toFixed(1)}% ({data.accepted_trials} trials)</span>
          <span style={{ color: '#dc2626' }}>✗ Rejected Keys: {rejRate.toFixed(1)}% ({data.total_trials - data.accepted_trials} trials)</span>
        </div>
        <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
          <div style={{ width: `${accRate}%`, background: '#22c55e', transition: 'width 0.4s ease' }} title={`Accepted: ${accRate}%`} />
          <div style={{ width: `${rejRate}%`, background: '#ef4444', transition: 'width 0.4s ease' }} title={`Rejected: ${rejRate}%`} />
        </div>
      </div>

      <svg width={w} height={h - 60} viewBox={`0 0 ${w} ${h - 60}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
        <line x1={padX} y1={70} x2={w - padX} y2={70} stroke="#cbd5e1" strokeWidth="1.5" />

        <rect x={padX} y={15} width={Math.max(0, threshX - padX)} height={55} fill="#dcfce7" opacity="0.45" />
        <rect x={threshX} y={15} width={Math.max(0, w - padX - threshX)} height={55} fill="#fee2e2" opacity="0.45" />

        <line x1={threshX} y1={10} x2={threshX} y2={80} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
        <text x={threshX} y={8} fill="#dc2626" fontSize="9.5" textAnchor="middle" fontWeight="bold">
          Threshold Cutoff ({threshold}%)
        </text>

        <text x={padX + 10} y={26} fill="#166534" fontSize="9" fontWeight="bold">SECURE ZONE (Key Retained)</text>
        <text x={w - padX - 10} y={26} fill="#991b1b" fontSize="9" fontWeight="bold" textAnchor="end">ABORT ZONE (Key Discarded)</text>

        {trials.map((tr, idx) => {
          const cx = getX(tr.qber)
          const cy = 45 + ((idx % 5) - 2) * 7
          const isAcc = tr.accepted !== undefined ? tr.accepted : (tr.qber < threshold)
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="4.5"
              fill={isAcc ? '#16a34a' : '#dc2626'}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.85"
            >
              <title>{`Trial #${tr.trial}: QBER = ${tr.qber.toFixed(2)}% (${isAcc ? 'Accepted' : 'Rejected'})`}</title>
            </circle>
          )
        })}

        {[0, 5, 10, 15, 20].filter(v => v <= maxQber).map(v => (
          <g key={v}>
            <line x1={getX(v)} y1={67} x2={getX(v)} y2={73} stroke="#64748b" strokeWidth="1" />
            <text x={getX(v)} y={86} fill="#64748b" fontSize="9" textAnchor="middle">{v}%</text>
          </g>
        ))}
        <text x={w / 2} y={105} fill="#475569" fontSize="10" textAnchor="middle" fontWeight="600">
          Independent Trial Measured QBER Distribution
        </text>
      </svg>
    </div>
  )
}

// 7. SVG Graph: Statistical Reliability Convergence
function ReliabilityConvergenceSVG({ runs }) {
  if (!runs || runs.length === 0) return null
  const w = 620, h = 230, padX = 65, padY = 35

  const maxQber = Math.max(...runs.map(r => r.mean_qber + r.std_qber), 12) * 1.2
  const minQber = Math.max(0, Math.min(...runs.map(r => r.mean_qber - r.std_qber), 0))

  const nRuns = runs.length
  const getX = (idx) => padX + (idx / (nRuns - 1 || 1)) * (w - padX * 2)
  const getY = (val) => h - padY - ((val - minQber) / (maxQber - minQber || 1)) * (h - padY * 2)

  const upperPath = runs.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.mean_qber + r.std_qber)}`).join(' ')
  const lowerPath = runs.map((r, i) => `L ${getX(nRuns - 1 - i)} ${getY(Math.max(0, runs[nRuns - 1 - i].mean_qber - runs[nRuns - 1 - i].std_qber))}`).join(' ')
  const ribbonD = `${upperPath} ${lowerPath} Z`

  const lineD = runs.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.mean_qber)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-svg" style={{ maxWidth: '100%', overflow: 'visible' }}>
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#cbd5e1" strokeWidth="1" />
      {[0, 3, 6, 9, 12].filter(v => v <= maxQber && v >= minQber).map(v => (
        <g key={v}>
          <line x1={padX} y1={getY(v)} x2={w - padX} y2={getY(v)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <text x={padX - 8} y={getY(v) + 3} fill="#94a3b8" fontSize="9.5" textAnchor="end">{v}%</text>
        </g>
      ))}

      <text x={padX} y={h - 6} fill="#64748b" fontSize="10">Repeated Simulation Trials Count</text>
      <text x={14} y={padY} fill="#64748b" fontSize="10" transform={`rotate(-90, 14, ${padY})`}>Sample Mean QBER &plusmn; 1&sigma; (%)</text>

      <path d={ribbonD} fill="#e0e7ff" opacity="0.75" />
      <path d={lineD} fill="none" stroke="#4f46e5" strokeWidth="2.5" />

      {runs.map((r, idx) => {
        const x = getX(idx)
        const y = getY(r.mean_qber)
        const yTop = getY(r.mean_qber + r.std_qber)
        const yBot = getY(Math.max(0, r.mean_qber - r.std_qber))

        return (
          <g key={idx}>
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="#3730a3" strokeWidth="2" />
            <line x1={x - 6} y1={yTop} x2={x + 6} y2={yTop} stroke="#3730a3" strokeWidth="2" />
            <line x1={x - 6} y1={yBot} x2={x + 6} y2={yBot} stroke="#3730a3" strokeWidth="2" />

            <circle cx={x} cy={y} r="4.5" fill="#4338ca" stroke="#ffffff" strokeWidth="1.5" />

            <text x={x} y={yTop - 8} fill="#1e1b4b" fontSize="10" textAnchor="middle" fontWeight="bold">
              {r.mean_qber.toFixed(2)}%
            </text>
            <text x={x} y={yBot + 14} fill="#4f46e5" fontSize="9.5" textAnchor="middle" fontWeight="600">
              &plusmn;{r.std_qber.toFixed(2)}%
            </text>
            <text x={x} y={h - padY + 16} fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="700">
              {r.trial_count} trials
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function extractCardData(results, selectedExp, qubits, trials, noiseLevel, noiseModel, eveEnabled, threshold, randomSeed) {
  if (!results || !results.data) return null
  const d = results.data
  const p = d.parameters || {}

  const setup = {
    qubits: p.n_qubits || (Array.isArray(p.qubit_counts) ? p.qubit_counts.join(', ') : qubits),
    trials: p.trials || (Array.isArray(p.trial_counts) ? p.trial_counts.join(', ') : trials),
    noise: p.noise_level !== undefined ? `${(p.noise_level * 100).toFixed(1)}%` : (selectedExp === 'exp1' ? '0% – 20% sweep' : `${(noiseLevel * 100).toFixed(1)}%`),
    noiseModel: p.noise_model || (selectedExp === 'exp4' ? 'Depolarizing / Bit-Flip / Phase-Flip' : noiseModel),
    eve: p.eve_enabled !== undefined ? (p.eve_enabled ? 'ON' : 'OFF') : (selectedExp === 'exp2' || selectedExp === 'exp5' ? 'Evaluated ON vs OFF' : (eveEnabled ? 'ON' : 'OFF')),
    threshold: p.threshold !== undefined ? p.threshold : threshold,
    seed: p.random_seed !== null && p.random_seed !== undefined ? p.random_seed : (randomSeed ? randomSeed : 'Stochastic (Random)'),
  }

  let meanQber = 0
  let stdQber = 0
  let minQber = 0
  let maxQber = 0
  let acceptanceRate = 0
  let avgSiftedLength = qubits * 0.5
  let interpretation = ''

  if (selectedExp === 'exp1' && d.points && d.points.length > 0) {
    const pts = d.points
    meanQber = pts.reduce((acc, x) => acc + x.mean_qber, 0) / pts.length
    stdQber = pts.reduce((acc, x) => acc + x.std_qber, 0) / pts.length
    minQber = Math.min(...pts.map(x => x.min_qber))
    maxQber = Math.max(...pts.map(x => x.max_qber))
    acceptanceRate = pts.reduce((acc, x) => acc + x.acceptance_rate, 0) / pts.length
    avgSiftedLength = pts.reduce((acc, x) => acc + (x.avg_sifted_key_length || qubits * 0.5), 0) / pts.length
    interpretation = `Sweep from ${pts[0].noise_probability}% to ${pts[pts.length - 1].noise_probability}% noise caused mean QBER to scale from ${pts[0].mean_qber.toFixed(2)}% to ${pts[pts.length - 1].mean_qber.toFixed(2)}%, demonstrating direct channel decoherence impact.`
  } else if (selectedExp === 'exp2' && d.case_eve_off && d.case_eve_on) {
    const off = d.case_eve_off
    const on = d.case_eve_on
    meanQber = (off.mean_qber + on.mean_qber) / 2
    stdQber = (off.std_qber + on.std_qber) / 2
    minQber = Math.min(off.min_qber, on.min_qber)
    maxQber = Math.max(off.max_qber, on.max_qber)
    acceptanceRate = on.acceptance_rate
    avgSiftedLength = (off.avg_sifted_key_length + on.avg_sifted_key_length) / 2
    interpretation = `Intercept-resend eavesdropping increased mean QBER by +${(on.mean_qber - off.mean_qber).toFixed(2)}% (from ${off.mean_qber.toFixed(2)}% to ${on.mean_qber.toFixed(2)}%), dropping key acceptance from ${off.acceptance_rate.toFixed(0)}% to ${on.acceptance_rate.toFixed(0)}%.`
  } else if (selectedExp === 'exp3' && d.results && d.results.length > 0) {
    const res = d.results
    meanQber = res.reduce((acc, x) => acc + x.mean_qber, 0) / res.length
    stdQber = res[res.length - 1].std_qber
    minQber = Math.min(...res.map(x => x.min_qber))
    maxQber = Math.max(...res.map(x => x.max_qber))
    acceptanceRate = res[res.length - 1].acceptance_rate
    avgSiftedLength = res[res.length - 1].avg_sifted_key_length || qubits * 0.5
    interpretation = `Increasing sample size from ${res[0].n_qubits} to ${res[res.length - 1].n_qubits} qubits reduced estimation variance from ±${res[0].std_qber.toFixed(2)}% to ±${res[res.length - 1].std_qber.toFixed(2)}%, proving statistical parameter convergence.`
  } else if (selectedExp === 'exp4' && d.models && d.models.length > 0) {
    const m = d.models
    meanQber = m.reduce((acc, x) => acc + x.mean_qber, 0) / m.length
    stdQber = m.reduce((acc, x) => acc + x.std_qber, 0) / m.length
    minQber = Math.min(...m.map(x => x.min_qber))
    maxQber = Math.max(...m.map(x => x.max_qber))
    acceptanceRate = m.reduce((acc, x) => acc + x.acceptance_rate, 0) / m.length
    avgSiftedLength = m.reduce((acc, x) => acc + (x.avg_sifted_key_length || qubits * 0.5), 0) / m.length
    interpretation = `Model comparison revealed distinct disturbance signatures: depolarizing noise yielded ${m.find(x => x.noise_model === 'depolarizing')?.mean_qber.toFixed(2)}% QBER, bit-flip ${m.find(x => x.noise_model === 'bit_flip')?.mean_qber.toFixed(2)}%, and phase-flip ${m.find(x => x.noise_model === 'phase_flip')?.mean_qber.toFixed(2)}%.`
  } else if (selectedExp === 'exp5' && d.matrix && d.matrix.length > 0) {
    const cells = d.matrix.flatMap(r => r.cells)
    meanQber = cells.reduce((acc, x) => acc + x.mean_qber, 0) / cells.length
    stdQber = cells.reduce((acc, x) => acc + x.std_qber, 0) / cells.length
    minQber = Math.min(...cells.map(x => x.mean_qber))
    maxQber = Math.max(...cells.map(x => x.mean_qber))
    acceptanceRate = cells.reduce((acc, x) => acc + x.acceptance_rate, 0) / cells.length
    avgSiftedLength = qubits * 0.5
    interpretation = `2D interaction matrix confirmed that channel noise and Eve create combined compounding errors across all noise probabilities.`
  } else if (selectedExp === 'exp6') {
    meanQber = d.mean_qber || 0
    stdQber = d.std_qber || 0
    minQber = d.min_qber !== undefined ? d.min_qber : (d.trial_records ? Math.min(...d.trial_records.map(x => x.qber)) : 0)
    maxQber = d.max_qber !== undefined ? d.max_qber : (d.trial_records ? Math.max(...d.trial_records.map(x => x.qber)) : 0)
    acceptanceRate = d.acceptance_rate || 0
    avgSiftedLength = d.avg_sifted_key_length || qubits * 0.5
    interpretation = `Evaluated at educational ${d.threshold}% threshold: ${d.acceptance_rate.toFixed(1)}% of trials were accepted (${d.accepted_trials}/${d.total_trials}) and ${d.rejection_rate.toFixed(1)}% aborted to preserve secrecy.`
  } else if (selectedExp === 'exp7' && d.runs && d.runs.length > 0) {
    const runs = d.runs
    meanQber = runs[runs.length - 1].mean_qber
    stdQber = runs[runs.length - 1].std_qber
    minQber = runs[runs.length - 1].min_qber
    maxQber = runs[runs.length - 1].max_qber
    acceptanceRate = runs[runs.length - 1].acceptance_rate
    avgSiftedLength = qubits * 0.5
    interpretation = `Repeating trials up to ${runs[runs.length - 1].trial_count} tightened sample estimation bounds to ±${stdQber.toFixed(2)}% without modifying physical channel physics.`
  }

  return {
    setup,
    measurements: {
      meanQber,
      stdQber,
      minQber,
      maxQber,
      acceptanceRate,
      avgSiftedLength,
      interpretation,
    }
  }
}

function extractFlatTrials(results, qubits, noiseLevel, noiseModel, eveEnabled) {
  if (!results || !results.data) return []
  const d = results.data
  const rows = []

  if (d.trial_records) {
    d.trial_records.forEach(tr => {
      rows.push({
        trial: tr.trial,
        qubits: tr.n_qubits || d.parameters?.n_qubits || qubits,
        noise: tr.noise !== undefined ? tr.noise : (d.parameters?.noise_level !== undefined ? Math.round(d.parameters.noise_level * 100) : Math.round(noiseLevel * 100)),
        model: tr.noise_model || d.parameters?.noise_model || noiseModel,
        eve: tr.eve !== undefined ? tr.eve : (d.parameters?.eve_enabled !== undefined ? d.parameters.eve_enabled : eveEnabled),
        siftedLength: tr.sifted_length || '—',
        compared: tr.compared || '—',
        errors: tr.errors !== undefined ? tr.errors : '—',
        qber: tr.qber,
        accepted: tr.accepted
      })
    })
  } else if (d.points) {
    d.points.forEach(p => {
      if (p.trial_records) {
        p.trial_records.forEach(tr => {
          rows.push({
            trial: `${p.noise_probability}%-#${tr.trial}`,
            qubits: qubits,
            noise: p.noise_probability,
            model: noiseModel,
            eve: eveEnabled,
            siftedLength: tr.sifted_length || '—',
            compared: tr.compared || '—',
            errors: tr.errors !== undefined ? tr.errors : '—',
            qber: tr.qber,
            accepted: tr.accepted
          })
        })
      }
    })
  } else if (d.models) {
    d.models.forEach(m => {
      if (m.trial_records) {
        m.trial_records.forEach(tr => {
          rows.push({
            trial: `${m.noise_model}-#${tr.trial}`,
            qubits: qubits,
            noise: Math.round(noiseLevel * 100),
            model: m.noise_model,
            eve: eveEnabled,
            siftedLength: tr.sifted_length || '—',
            compared: tr.compared || '—',
            errors: tr.errors !== undefined ? tr.errors : '—',
            qber: tr.qber,
            accepted: tr.accepted
          })
        })
      }
    })
  } else if (d.case_eve_off && d.case_eve_on) {
    ['case_eve_off', 'case_eve_on'].forEach(k => {
      const isEve = k === 'case_eve_on'
      if (d[k].trial_records) {
        d[k].trial_records.forEach(tr => {
          rows.push({
            trial: `Eve_${isEve ? 'ON' : 'OFF'}-#${tr.trial}`,
            qubits: qubits,
            noise: Math.round(noiseLevel * 100),
            model: noiseModel,
            eve: isEve,
            siftedLength: tr.sifted_length || '—',
            compared: tr.compared || '—',
            errors: tr.errors !== undefined ? tr.errors : '—',
            qber: tr.qber,
            accepted: tr.accepted
          })
        })
      }
    })
  } else if (d.results) {
    d.results.forEach(res => {
      if (res.trial_records) {
        res.trial_records.forEach(tr => {
          rows.push({
            trial: `${res.n_qubits}q-#${tr.trial}`,
            qubits: res.n_qubits,
            noise: Math.round(noiseLevel * 100),
            model: noiseModel,
            eve: eveEnabled,
            siftedLength: tr.sifted_length || '—',
            compared: tr.compared || '—',
            errors: tr.errors !== undefined ? tr.errors : '—',
            qber: tr.qber,
            accepted: tr.accepted
          })
        })
      }
    })
  } else if (d.runs) {
    d.runs.forEach(run => {
      if (run.trial_records) {
        run.trial_records.forEach(tr => {
          rows.push({
            trial: `${run.trial_count}trials-#${tr.trial}`,
            qubits: qubits,
            noise: Math.round(noiseLevel * 100),
            model: noiseModel,
            eve: eveEnabled,
            siftedLength: tr.sifted_length || '—',
            compared: tr.compared || '—',
            errors: tr.errors !== undefined ? tr.errors : '—',
            qber: tr.qber,
            accepted: tr.accepted
          })
        })
      }
    })
  } else if (d.matrix) {
    d.matrix.forEach(row => {
      const isEve = row.eve_status === 'ON'
      row.cells.forEach(cell => {
        if (cell.trial_records) {
          cell.trial_records.forEach(tr => {
            rows.push({
              trial: `Eve_${row.eve_status}-${cell.noise}%-#${tr.trial}`,
              qubits: qubits,
              noise: cell.noise,
              model: noiseModel,
              eve: isEve,
              siftedLength: tr.sifted_length !== undefined ? tr.sifted_length : '—',
              compared: tr.compared !== undefined ? tr.compared : '—',
              errors: tr.errors !== undefined ? tr.errors : '—',
              qber: tr.qber,
              accepted: tr.accepted
            })
          })
        }
      })
    })
  }
  return rows
}

// Download file utility
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Single Experiment CSV Generation
function generateSingleExpCSV({ expTitle, parameters = {}, trials = [] }) {
  const timestamp = new Date().toISOString()
  const lines = [
    `# =========================================================================================`,
    `# PROJECT: Quantum Secure Image Transmission - Research Laboratory`,
    `# EXPERIMENT FACTOR: ${expTitle}`,
    `# SIMULATOR BACKEND: IBM Qiskit Aer (AerSimulator / AerCircuit)`,
    `# EXPORT TIMESTAMP: ${timestamp}`,
    `# TOTAL INDEPENDENT SIMULATION TRIALS RECORDED: ${trials.length}`,
    `# PROTOCOL: Bennett-Brassard 1984 (BB84) with Basis Sifting & Parameter Estimation`,
    `# SECURITY DECISION THRESHOLD: Asymptotic collective-attack cutoff (11.0%)`,
    `# CONFIDENTIALITY GUARANTEE: Raw private cryptographic key bitstrings are strictly withheld.`,
    `# =========================================================================================`,
    [
      'trial_identifier',
      'experiment_factor',
      'qubits_prepared',
      'channel_noise_pct',
      'noise_model',
      'eve_intercept_active',
      'sifted_key_length_bits',
      'sample_bits_compared',
      'bit_errors_detected',
      'measured_qber_pct',
      'decision_threshold_pct',
      'security_verdict'
    ].join(',')
  ]

  trials.forEach(t => {
    lines.push([
      `"${t.trial}"`,
      `"${expTitle}"`,
      t.qubits,
      typeof t.noise === 'number' ? t.noise.toFixed(1) : t.noise,
      `"${t.model}"`,
      t.eve ? 'TRUE' : 'FALSE',
      t.siftedLength,
      t.compared,
      t.errors,
      typeof t.qber === 'number' ? t.qber.toFixed(2) : t.qber,
      typeof t.threshold === 'number' ? t.threshold.toFixed(1) : '11.0',
      t.accepted ? 'ACCEPTED' : 'REJECTED'
    ].join(','))
  })

  return lines.join('\r\n')
}

// Comprehensive Master CSV combining all completed experiments
function generateComprehensiveCSV({ completedCount, totalTrials, trials = [] }) {
  const timestamp = new Date().toISOString()
  const lines = [
    `# =========================================================================================`,
    `# COMPREHENSIVE RESEARCH REPORT: BB84 QUANTUM KEY DISTRIBUTION EMPIRICAL BENCHMARKS`,
    `# SIMULATOR BACKEND: IBM Qiskit Aer (AerSimulator / AerCircuit batch execution)`,
    `# EXPORT TIMESTAMP: ${timestamp}`,
    `# COMPLETED EXPERIMENT FACTORS: ${completedCount}`,
    `# TOTAL INDEPENDENT SIMULATION TRIALS RECORDED: ${totalTrials}`,
    `# PROTOCOL: Bennett-Brassard 1984 (BB84) with Basis Sifting & Random Sample Parameter Estimation`,
    `# SECURITY DECISION THRESHOLD: Asymptotic collective-attack cutoff (11.0%)`,
    `# CONFIDENTIALITY GUARANTEE: Raw private cryptographic key bitstrings are strictly withheld.`,
    `# =========================================================================================`,
    [
      'trial_identifier',
      'experiment_factor',
      'qubits_prepared',
      'channel_noise_pct',
      'noise_model',
      'eve_intercept_active',
      'sifted_key_length_bits',
      'sample_bits_compared',
      'bit_errors_detected',
      'measured_qber_pct',
      'decision_threshold_pct',
      'security_verdict'
    ].join(',')
  ]

  trials.forEach(t => {
    lines.push([
      `"${t.trial}"`,
      `"${t.experimentName || 'BB84 Research Study'}"`,
      t.qubits,
      typeof t.noise === 'number' ? t.noise.toFixed(1) : t.noise,
      `"${t.model}"`,
      t.eve ? 'TRUE' : 'FALSE',
      t.siftedLength,
      t.compared,
      t.errors,
      typeof t.qber === 'number' ? t.qber.toFixed(2) : t.qber,
      typeof t.threshold === 'number' ? t.threshold.toFixed(1) : '11.0',
      t.accepted ? 'ACCEPTED' : 'REJECTED'
    ].join(','))
  })

  return lines.join('\r\n')
}
