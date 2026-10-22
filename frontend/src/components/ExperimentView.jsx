import React, { useState, useEffect, useCallback } from 'react'
import ProgressBar from './ProgressBar.jsx'
import AliceStep from './AliceStep.jsx'
import QuantumChannelStep from './QuantumChannelStep.jsx'
import BobStep from './BobStep.jsx'
import ReconciliationStep from './ReconciliationStep.jsx'
import SecurityStep from './SecurityStep.jsx'
import EncryptionStep from './EncryptionStep.jsx'
import TransmissionStep from './TransmissionStep.jsx'
import DecryptionStep from './DecryptionStep.jsx'
import ResultStep from './ResultStep.jsx'
import ResearchAnalysisStep from './ResearchAnalysisStep.jsx'

const STEPS = [
  { id: 'alice',       label: 'Alice',     number: '01' },
  { id: 'channel',     label: 'Channel',   number: '02' },
  { id: 'bob',         label: 'Bob',       number: '03' },
  { id: 'reconcile',   label: 'Reconcile', number: '04' },
  { id: 'security',    label: 'Security',  number: '05' },
  { id: 'encrypt',     label: 'Encrypt',   number: '06' },
  { id: 'transmit',    label: 'Transmit',  number: '07' },
  { id: 'decrypt',     label: 'Decrypt',   number: '08' },
  { id: 'result',      label: 'Result',    number: '11' },
  { id: 'research',    label: 'Research',  number: '12' },
]

export default function ExperimentView({ file, imagePreview, settings, onReset }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [decryptData, setDecryptData] = useState(null)
  const [tamperData, setTamperData] = useState(null)

  // Run experiment on mount
  useEffect(() => {
    runExperiment()
  }, [])

  const runExperiment = useCallback(async () => {
    setLoading(true)
    setError(null)
    setData(null)
    setCurrentStep(0)
    setDecryptData(null)
    setTamperData(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('n_qubits', String(settings.nQubits))
      formData.append('noise_level', String(settings.noiseLevel))
      formData.append('noise_type', settings.noiseType || 'depolarizing')
      formData.append('eve_enabled', settings.eveEnabled ? 'true' : 'false')
      formData.append('trials', String(settings.trials || 1))
      if (settings.seed !== null && settings.seed !== undefined && settings.seed !== '') {
        formData.append('seed', String(settings.seed))
      }

      const res = await fetch('/api/experiment', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        let msg = `Server error (${res.status})`
        try { const j = await res.json(); msg = j.detail || msg } catch (_) {}
        throw new Error(msg)
      }

      const json = await res.json()
      setData(json)
      setCurrentStep(0)
    } catch (err) {
      setError(err.message || 'Unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }, [file, settings])

  const advanceStep = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1))
  }, [])

  const handleDecrypt = useCallback(async () => {
    if (!data?.session_id) return
    try {
      const fd = new FormData()
      fd.append('session_id', data.session_id)
      const res = await fetch('/api/decrypt', { method: 'POST', body: fd })
      const json = await res.json()
      setDecryptData(json)
      // Auto-advance to result
      const resultIdx = STEPS.findIndex(s => s.id === 'result')
      setCurrentStep(resultIdx >= 0 ? resultIdx : 8)
    } catch (err) {
      setDecryptData({ success: false, message: err.message })
    }
  }, [data])

  const handleTamper = useCallback(async () => {
    if (!data?.session_id) return
    try {
      const fd = new FormData()
      fd.append('session_id', data.session_id)
      const res = await fetch('/api/tamper', { method: 'POST', body: fd })
      const json = await res.json()
      setTamperData(json)
    } catch (err) {
      setTamperData({ tampered: true, auth_success: false, message: err.message })
    }
  }, [data])

  if (loading) {
    return (
      <div>
        <ProgressBar steps={STEPS} currentStepIndex={-1} />
        <div className="loading-indicator">
          <div className="spinner" aria-hidden="true"></div>
          <div>
            <strong>Running BB84 simulation…</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {settings.nQubits} qubits · {Math.round(settings.noiseLevel * 100)}% noise
              {settings.eveEnabled ? ' · Eve ON' : ''}
            </div>
            {settings.nQubits >= 1024 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 4 }}>
                Large qubit counts may take up to a minute.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-danger">
          <div className="alert-title">Experiment failed</div>
          {error}
        </div>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={runExperiment}>Retry</button>
          <button className="btn btn-ghost" onClick={onReset}>← Start over</button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const bb84 = data.bb84
  const enc = data.encryption
  const keyAccepted = bb84.key_accepted

  // Step state helpers
  const stepState = (idx) => {
    if (idx < currentStep) return 'done'
    if (idx === currentStep) return 'active'
    return 'future'
  }

  return (
    <div>
      <ProgressBar steps={STEPS} currentStepIndex={currentStep} />

      {/* Step 0: Alice */}
      <AliceStep
        state={stepState(0)}
        data={bb84}
        onNext={advanceStep}
      />

      {/* Step 1: Quantum Channel */}
      {currentStep >= 1 && (
        <QuantumChannelStep
          state={stepState(1)}
          data={bb84}
          settings={settings}
          onNext={advanceStep}
        />
      )}

      {/* Step 2: Bob measures */}
      {currentStep >= 2 && (
        <BobStep
          state={stepState(2)}
          data={bb84}
          onNext={advanceStep}
        />
      )}

      {/* Step 3: Reconciliation */}
      {currentStep >= 3 && (
        <ReconciliationStep
          state={stepState(3)}
          data={bb84}
          onNext={advanceStep}
        />
      )}

      {/* Step 4: Security / QBER */}
      {currentStep >= 4 && (
        <SecurityStep
          state={stepState(4)}
          data={bb84}
          keyAccepted={keyAccepted}
          keySummary={data.key_summary}
          onNext={keyAccepted ? advanceStep : null}
          onAdvanceToResearch={() => {
            const resIdx = STEPS.findIndex(s => s.id === 'research')
            setCurrentStep(resIdx >= 0 ? resIdx : 9)
          }}
          onReset={onReset}
        />
      )}

      {/* Step 5: Encryption (only if key accepted) */}
      {currentStep >= 5 && keyAccepted && (
        <EncryptionStep
          state={stepState(5)}
          encryption={enc}
          imageInfo={data.image_info}
          imagePreview={imagePreview}
          keySummary={data.key_summary}
          onNext={advanceStep}
        />
      )}

      {/* Step 6: Classical Transmission */}
      {currentStep >= 6 && keyAccepted && (
        <TransmissionStep
          state={stepState(6)}
          encryption={enc}
          eveEnabled={settings.eveEnabled}
          onNext={advanceStep}
          onTamper={handleTamper}
          tamperData={tamperData}
        />
      )}

      {/* Step 7: Decryption */}
      {currentStep >= 7 && keyAccepted && (
        <DecryptionStep
          state={stepState(7)}
          onDecrypt={handleDecrypt}
          decryptData={decryptData}
          onNext={advanceStep}
        />
      )}

      {/* Step 8: Result */}
      {currentStep >= 8 && keyAccepted && (
        <ResultStep
          state={stepState(8)}
          decryptData={decryptData}
          imageInfo={data.image_info}
          imagePreview={imagePreview}
          previewB64={data.image_preview_b64}
          previewMime={data.image_preview_mime}
          bb84={data.bb84}
          research={data.research}
          settings={settings}
          onReset={onReset}
          onNext={advanceStep}
        />
      )}

      {/* Step 9: Research Analysis Laboratory */}
      {currentStep >= 9 && (
        <ResearchAnalysisStep
          state={stepState(9)}
          initialSettings={settings}
          onReset={onReset}
        />
      )}

      {/* Reset button at bottom */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
        <button className="btn btn-ghost" onClick={onReset}>← Start a new experiment</button>
      </div>
    </div>
  )
}
