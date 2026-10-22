import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import ClassicalTransmissionVisualizer from './visualizers/ClassicalTransmissionVisualizer.jsx'

export default function TransmissionStep({ state, encryption, eveEnabled, onNext, onTamper, tamperData }) {
  const [tamperLoading, setTamperLoading] = useState(false)

  const handleTamper = async () => {
    setTamperLoading(true)
    await onTamper()
    setTamperLoading(false)
  }

  const summary = `Encrypted image (${(encryption.ciphertext_size / 1024).toFixed(1)} KB) sent through classical channel.`

  return (
    <StepCard
      state={state}
      number="07"
      title="Send the encrypted image"
      summary={summary}
    >
      <p>
        The quantum key has already been established. The image is now transmitted
        as AES-GCM ciphertext through a normal classical channel (e.g. internet, TCP/IP).
        Only encrypted data travels this path — not the original image, and not the key.
      </p>

      <div className="flow-diagram" style={{ margin: '24px 0' }}>
        <div className="flow-node alice">Alice</div>
        <div className="flow-arrow">
          <div className="flow-arrow-line"></div>
          <div className="flow-arrow-label">encrypted image</div>
          <span>↓</span>
        </div>
        <div className="flow-node" style={{ color: 'var(--text-secondary)' }}>Classical Channel</div>
        <div className="flow-arrow">
          <div className="flow-arrow-line"></div>
          <span>↓</span>
        </div>
        <div className="flow-node bob">Bob</div>
      </div>

      {/* Classical In-Flight Packet Visualizer */}
      <ClassicalTransmissionVisualizer
        encryption={encryption}
        eveEnabled={eveEnabled}
        tamperData={tamperData}
        onTamper={handleTamper}
      />

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Ciphertext size</div>
          <div className="stat-value">{encryption.ciphertext_size.toLocaleString()} B</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Nonce</div>
          <div className="stat-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
            {encryption.nonce_hex.slice(0, 12)}…
          </div>
        </div>
      </div>

      {eveEnabled && (
        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <div className="alert-title">Eve on the classical channel</div>
          If Eve intercepts this transmission, she receives <em>ciphertext</em> — not the
          original image. Without the AES key (which was established through the quantum
          channel), the data is cryptographically opaque.
        </div>
      )}

      {/* Tampering demo */}
      <hr className="divider" />
      <p className="section-heading">Optional: Ciphertext tampering demo</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 12 }}>
        Simulate what happens when one byte of the ciphertext is modified in transit.
        AES-GCM's authentication tag should detect this and reject decryption.
      </p>

      {!tamperData && (
        <button
          className="btn btn-secondary"
          onClick={handleTamper}
          disabled={tamperLoading}
        >
          {tamperLoading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              Testing…
            </>
          ) : 'Simulate ciphertext tampering'}
        </button>
      )}

      {tamperData && (
        <div className={`alert ${tamperData.auth_success ? 'alert-warning' : 'alert-danger'}`}>
          <div className="alert-title">
            {tamperData.auth_success
              ? '⚠ Unexpected: authentication succeeded'
              : '⚠ Authentication failed'}
          </div>
          {tamperData.message}
          {!tamperData.auth_success && (
            <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
              The encrypted data was modified. AES-GCM correctly detected the tampering
              and rejected decryption. The ciphertext integrity guarantee is working as expected.
            </div>
          )}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onNext}>
          Bob decrypts →
        </button>
      </div>
    </StepCard>
  )
}
