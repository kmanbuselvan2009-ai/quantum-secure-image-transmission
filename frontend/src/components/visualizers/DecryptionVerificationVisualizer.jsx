import React, { useState, useEffect } from 'react'

export default function DecryptionVerificationVisualizer({ decryptData = null, triggered = false }) {
  const [activeStage, setActiveStage] = useState('tag-check') // 'tag-check' | 'reconstruction'

  const isSuccess = decryptData?.success
  const isAuthSuccess = decryptData?.auth_success !== false
  const recoveredBytes = decryptData?.recovered_size_bytes || 0

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">CRYPTOGRAPHIC AUTHENTICATION</span>
          <h4>Two-Stage AEAD Integrity Verification &amp; Image Reconstruction</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeStage === 'tag-check' ? 'active' : ''}`}
            onClick={() => setActiveStage('tag-check')}
          >
            Stage 1: GHASH Tag Check
          </button>
          <button
            className={`vis-tab-btn ${activeStage === 'reconstruction' ? 'active' : ''}`}
            onClick={() => setActiveStage('reconstruction')}
          >
            Stage 2: Pixel Scanline Reveal
          </button>
        </div>
      </div>

      <div className="vis-body">
        {activeStage === 'tag-check' && (
          <div className="tag-check-container">
            <div className="tag-comparison-grid">
              <div className="tag-node">
                <span className="t-label">Received Authentication Tag (T)</span>
                <div className="t-box">{decryptData ? 'Computed over payload in transit' : 'Awaiting payload arrival…'}</div>
              </div>

              <div className="tag-comparator-symbol">
                {decryptData ? (isSuccess ? '==' : '≠') : '≟'}
              </div>

              <div className="tag-node">
                <span className="t-label">Bob Calculated Local GMAC (T')</span>
                <div className="t-box">{decryptData ? (isSuccess ? 'Matches Received Tag' : 'Integrity Mismatch!') : 'Awaiting AES evaluation…'}</div>
              </div>
            </div>

            {decryptData && (
              <div className={`auth-verdict-banner ${isSuccess ? 'auth-ok' : 'auth-failed'}`}>
                {isSuccess ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>✓ AES-GCM Tag Match Verified</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                      Authentication succeeded. No tampering occurred on the classical channel, and Bob holds the exact identical BB84 key as Alice.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>✗ Cryptographic Authentication Failed!</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                      {decryptData.message || 'Ciphertext or tag was modified in transit. Decryption rejected to prevent plaintext compromise.'}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeStage === 'reconstruction' && (
          <div className="reconstruction-view">
            {isSuccess ? (
              <div className="reconstruction-success">
                <div className="scanline-demo-box">
                  <div className="scanline-beam" />
                  <div className="reconstructed-grid">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className="recon-tile"
                        style={{
                          animationDelay: `${(i % 12) * 60}ms`,
                          backgroundColor: `hsl(${(i * 19) % 360}, 65%, 55%)`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="reconstruction-stats">
                  <div><strong>Byte Recovery:</strong> {recoveredBytes.toLocaleString()} bytes restored</div>
                  <div><strong>Spatial Loss:</strong> 0.00% (Lossless Decryption)</div>
                  <div><strong>Keystream Inverse:</strong> XOR parity restored</div>
                </div>
              </div>
            ) : (
              <div className="reconstruction-locked">
                <div className="lock-icon">🔒</div>
                <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.875rem' }}>
                  Decryption Engine Locked
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Plaintext reconstruction will not initiate until valid tag authentication is established.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
