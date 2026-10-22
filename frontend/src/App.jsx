import React, { useState, useCallback } from 'react'
import UploadStep from './components/UploadStep.jsx'
import SettingsStep from './components/SettingsStep.jsx'
import ExperimentView from './components/ExperimentView.jsx'

const STEP_UPLOAD = 'upload'
const STEP_SETTINGS = 'settings'
const STEP_EXPERIMENT = 'experiment'

export default function App() {
  const [appStep, setAppStep] = useState(STEP_UPLOAD)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [settings, setSettings] = useState({
    nQubits: 256,
    noiseLevel: 0.05,
    noiseType: 'depolarizing',
    eveEnabled: false,
    trials: 1,
    seed: null,
  })

  const handleFileSelected = useCallback((file) => {
    setUploadedFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }, [])

  const handleUploadContinue = useCallback(() => {
    setAppStep(STEP_SETTINGS)
  }, [])

  const handleSettingsContinue = useCallback((newSettings) => {
    setSettings(newSettings)
    setAppStep(STEP_EXPERIMENT)
  }, [])

  const handleReset = useCallback(() => {
    setAppStep(STEP_UPLOAD)
    setUploadedFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }, [imagePreview])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Quantum Secure Image Transmission</h1>
        <p className="subtitle">
          BB84 Quantum Key Distribution &amp; AES-GCM Secure Image Transfer —{' '}
          <span>University Experimental Research Platform</span>
        </p>
      </header>

      {/* Core Research Question Banner */}
      <div className="research-question-box">
        <div className="research-question-title">Core Research Question</div>
        <p className="research-question-text">
          &ldquo;How do quantum-channel noise, eavesdropping, and finite qubit sample size affect QBER, statistical stability, and BB84 key acceptance?&rdquo;
        </p>
      </div>

      {/* Single Continuous Guided Experiment */}
      {appStep === STEP_UPLOAD && (
        <UploadStep
          onFileSelected={handleFileSelected}
          selectedFile={uploadedFile}
          imagePreview={imagePreview}
          onContinue={handleUploadContinue}
        />
      )}

      {appStep === STEP_SETTINGS && (
        <SettingsStep
          settings={settings}
          onContinue={handleSettingsContinue}
          onBack={() => setAppStep(STEP_UPLOAD)}
        />
      )}

      {appStep === STEP_EXPERIMENT && (
        <ExperimentView
          file={uploadedFile}
          imagePreview={imagePreview}
          settings={settings}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
