import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import DecryptionVerificationVisualizer from './visualizers/DecryptionVerificationVisualizer.jsx'
import MatrixPixelScrambler from './visualizers/MatrixPixelScrambler.jsx'

export default function DecryptionStep({ state, onDecrypt, decryptData, imagePreview, onNext }) {
  const [loading, setLoading] = useState(false)
  const [triggered, setTriggered] = useState(false)

  const handleDecrypt = async () => {
    setLoading(true)
    setTriggered(true)
    await onDecrypt()
    setLoading(false)
  }

  const summary = decryptData?.success
    ? 'Decryption successful. SHA-256 integrity verified.'
    : triggered ? 'Decryption attempted.' : 'Decryption pending.'

  return (
    <StepCard
      state={state}
      number="08"
      title="Bob decrypts the image"
      summary={summary}
    >
      <p>
        Bob receives the encrypted payload and uses his copy of the BB84-derived AES key
        to authenticate and decrypt the ciphertext. AES-GCM first verifies the authentication
        tag — if the tag is invalid, decryption is rejected entirely.
      </p>

      {/* Pipeline */}
      <div className="flow-diagram" style={{ margin: '20px 0' }}>
        {[
          'Encrypted payload',
          'Nonce + Ciphertext + Tag',
          'Shared BB84-derived key',
          'AES-GCM authentication',
          'Decryption',
          'Original image bytes',
        ].map((label, i, arr) => (
          <React.Fragment key={label}>
            <div className="flow-node"
              style={label === 'AES-GCM authentication' ? { borderColor: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
            >{label}</div>
            {i < arr.length - 1 && (
              <div className="flow-arrow">
                <div className="flow-arrow-line"></div>
                <span>↓</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Two-Stage AEAD Verification & Progressive Scanline Visualizer */}
      <DecryptionVerificationVisualizer decryptData={decryptData} triggered={triggered} />

      {/* Real-time Dynamic Laser Decryption Visualizer */}
      {triggered && decryptData && (
        <div style={{ margin: '20px 0' }}>
          <MatrixPixelScrambler
            imageSrc={imagePreview}
            mode="decrypt"
            success={decryptData.success}
            authTagHex={decryptData.auth_tag || 'e4a8b79c201df3'}
          />
        </div>
      )}

      {!triggered && (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleDecrypt}>
            Decrypt image
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-indicator" style={{ padding: '16px 0' }}>
          <div className="spinner"></div>
          Decrypting…
        </div>
      )}

      {decryptData && !loading && (
        <>
          {decryptData.success ? (
            <div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Authentication</div>
                  <div className="stat-value" style={{ color: 'var(--success)', fontSize: '0.9375rem' }}>✓ Valid</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Decryption</div>
                  <div className="stat-value" style={{ color: 'var(--success)', fontSize: '0.9375rem' }}>✓ Successful</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Recovered bytes</div>
                  <div className="stat-value">{decryptData.recovered_size_bytes?.toLocaleString()}</div>
                </div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={onNext}>
                  View result →
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-danger">
              <div className="alert-title">Decryption failed</div>
              {decryptData.message || 'AES-GCM authentication failed. The key or ciphertext may be corrupted.'}
            </div>
          )}
        </>
      )}
    </StepCard>
  )
}
