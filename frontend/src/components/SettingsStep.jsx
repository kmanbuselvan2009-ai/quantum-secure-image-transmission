import React, { useState } from 'react'
import QuantumSetupVisualizer from './visualizers/QuantumSetupVisualizer.jsx'

const QUBIT_OPTIONS = [16, 64, 256, 1024, 4096]
const NOISE_MODELS = [
  { id: 'depolarizing', label: 'Depolarizing Noise' },
  { id: 'bit_flip', label: 'Bit-Flip Noise' },
  { id: 'phase_flip', label: 'Phase-Flip Noise' },
]

export default function SettingsStep({ settings, onContinue, onBack }) {
  const [nQubits, setNQubits] = useState(settings.nQubits)
  const [noiseLevel, setNoiseLevel] = useState(settings.noiseLevel)
  const [noiseType, setNoiseType] = useState(settings.noiseType || 'depolarizing')
  const [eveEnabled, setEveEnabled] = useState(settings.eveEnabled)
  const [trials, setTrials] = useState(settings.trials || 1)
  const [randomSeed, setRandomSeed] = useState(settings.seed || '')

  const handleContinue = () => {
    onContinue({
      nQubits,
      noiseLevel,
      noiseType,
      eveEnabled,
      trials,
      seed: randomSeed ? parseInt(randomSeed, 10) : null,
    })
  }

  const noisePct = Math.round(noiseLevel * 100)

  return (
    <div>
      <p className="section-heading" style={{ marginBottom: 24 }}>Experiment Settings</p>

      {/* Qubit count */}
      <div className="form-group">
        <label className="form-label">Qubit Count</label>
        <div className="segment-group" role="group" aria-label="Number of qubits">
          {QUBIT_OPTIONS.map(n => (
            <button
              key={n}
              className={`segment-option${nQubits === n ? ' selected' : ''}`}
              onClick={() => setNQubits(n)}
              aria-pressed={nQubits === n}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
        <p className="form-hint">
          Total BB84 quantum states Alice will prepare. Sifting retains ~50% under matching bases.
          {nQubits === 16 && (
            <> <strong>Note:</strong> 16 qubits demonstrate finite-sample statistical fluctuations in QBER estimation.</>
          )}
          {nQubits === 4096 && (
            <> <strong>Note:</strong> 4096 qubits may take 20–40 s to simulate in Qiskit Aer.</>
          )}
        </p>
      </div>

      {/* Noise Model Selection */}
      <div className="form-group">
        <label className="form-label">Quantum Channel Noise Model</label>
        <div className="segment-group" role="group" aria-label="Noise Model">
          {NOISE_MODELS.map(m => (
            <button
              key={m.id}
              className={`segment-option${noiseType === m.id ? ' selected' : ''}`}
              onClick={() => setNoiseType(m.id)}
              aria-pressed={noiseType === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="form-hint">
          Choose which quantum error operator Qiskit Aer injects into the channel circuits.
        </p>
      </div>

      {/* Noise slider */}
      <div className="form-group">
        <label className="form-label" htmlFor="noise-slider">
          Channel Noise Probability: <strong>{noisePct}%</strong>
        </label>
        <div className="slider-container">
          <input
            id="noise-slider"
            type="range"
            className="slider"
            min={0}
            max={20}
            step={1}
            value={noisePct}
            onChange={e => setNoiseLevel(Number(e.target.value) / 100)}
            aria-valuetext={`${noisePct}%`}
          />
          <div className="slider-labels">
            <span>0% (Ideal)</span>
            <span>10%</span>
            <span>20% (High Disturbance)</span>
          </div>
          <div className="slider-value">{noisePct}%</div>
        </div>
        <p className="form-hint">
          This exact noise parameter is forwarded to Qiskit Aer quantum error models. Noise &gt; 11% typically exceeds the asymptotic security threshold.
        </p>
      </div>

      {/* Eve toggle */}
      <div className="form-group">
        <label className="form-label">Eavesdropper (Eve)</label>
        <div className="toggle-row">
          <label className="toggle-switch" aria-label="Enable Eve eavesdropper">
            <input
              type="checkbox"
              checked={eveEnabled}
              onChange={e => setEveEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">{eveEnabled ? 'ON (Intercept-Resend)' : 'OFF (None)'}</span>
        </div>
        <p className="form-hint" style={{ marginTop: 8 }}>
          When active, Eve intercepts incoming qubits, measures them in a randomly chosen basis using real quantum circuits, and prepares replacement states to forward to Bob.
        </p>
      </div>

      {/* Repeated trials for scientific research */}
      <div className="form-group">
        <label className="form-label">Repeated Independent Trials</label>
        <div className="segment-group" role="group" aria-label="Repeated trials">
          {[1, 10, 20, 50, 100].map(t => (
            <button
              key={t}
              className={`segment-option${trials === t ? ' selected' : ''}`}
              onClick={() => setTrials(t)}
              aria-pressed={trials === t}
            >
              {t} {t === 1 ? 'trial' : 'trials'}
            </button>
          ))}
        </div>
        <p className="form-hint">
          Every trial executes an independent simulation of Alice, Bob, quantum channel noise, and Eve (if enabled). Multi-trial statistical analysis (Mean QBER, &sigma;, error bars, and acceptance rate) will be reported in the Results step.
        </p>
      </div>

      {/* Reproducible Seed */}
      <div className="form-group" style={{ maxWidth: 320 }}>
        <label className="form-label" htmlFor="seed-input">Random Seed (Optional)</label>
        <input
          id="seed-input"
          type="number"
          placeholder="e.g. 42 (leave blank for random)"
          value={randomSeed}
          onChange={e => setRandomSeed(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            background: 'var(--surface)',
          }}
        />
        <p className="form-hint">Set a deterministic seed to make simulation outcomes repeatable.</p>
      </div>

      {/* Interactive Bloch Sphere & Theoretical Expectation HUD */}
      <QuantumSetupVisualizer
        nQubits={nQubits}
        noiseLevel={noiseLevel}
        noiseType={noiseType}
        eveEnabled={eveEnabled}
      />

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Run Experiment →
        </button>
      </div>
    </div>
  )
}
