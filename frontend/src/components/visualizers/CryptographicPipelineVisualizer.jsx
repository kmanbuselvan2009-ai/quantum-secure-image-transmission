import React, { useState } from 'react'

export default function CryptographicPipelineVisualizer({
  imageInfo = {},
  encryption = {},
  keySummary = {}
}) {
  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' | 'aesgcm' | 'entropy'

  const pSize = encryption?.plaintext_size || imageInfo?.file_size_bytes || 0
  const cSize = encryption?.ciphertext_size || pSize
  const nonce = encryption?.nonce_hex || '96-bit random initialization vector'
  const tag = encryption?.tag_hex || '128-bit Galois authentication tag'

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">AUTHENTICATED ENCRYPTION</span>
          <h4>BB84 Key Derivation &amp; AES-256-GCM Cryptographic Engine</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            Encryption Architecture
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'aesgcm' ? 'active' : ''}`}
            onClick={() => setActiveTab('aesgcm')}
          >
            CTR + GHASH Math
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'entropy' ? 'active' : ''}`}
            onClick={() => setActiveTab('entropy')}
          >
            Pixel Entropy Scrambler
          </button>
        </div>
      </div>

      <div className="vis-body">
        {activeTab === 'pipeline' && (
          <div className="crypto-pipeline-diagram">
            <div className="crypto-stage-row">
              {/* Stage 1: BB84 Key Material */}
              <div className="crypto-box">
                <div className="c-box-header">1. Quantum Key Material</div>
                <div className="c-box-body">
                  <div className="c-box-val">{keySummary?.usable_key_length || 128} bits</div>
                  <div className="c-box-sub">Shared BB84 Sifted Key</div>
                </div>
              </div>

              <div className="crypto-flow-arrow">
                <span>HKDF</span>
                <div className="arrow-line">→</div>
              </div>

              {/* Stage 2: 256-bit AES Key */}
              <div className="crypto-box highlight-box">
                <div className="c-box-header">2. AES-256 Symmetric Key</div>
                <div className="c-box-body">
                  <div className="c-box-val masked-key">•••• •••• •••• ••••</div>
                  <div className="c-box-sub">256-bit Master Key (Confidential)</div>
                </div>
              </div>

              <div className="crypto-flow-arrow">
                <span>AES-GCM</span>
                <div className="arrow-line">→</div>
              </div>

              {/* Stage 3: Image Plaintext */}
              <div className="crypto-box">
                <div className="c-box-header">3. Bulk Image Input</div>
                <div className="c-box-body">
                  <div className="c-box-val">{(pSize / 1024).toFixed(1)} KB</div>
                  <div className="c-box-sub">{imageInfo?.width}×{imageInfo?.height} px ({imageInfo?.format})</div>
                </div>
              </div>

              <div className="crypto-flow-arrow">
                <span>Output</span>
                <div className="arrow-line">→</div>
              </div>

              {/* Stage 4: Authenticated Payload */}
              <div className="crypto-box success-box">
                <div className="c-box-header">4. Classical Payload</div>
                <div className="c-box-body">
                  <div className="c-box-val">{(cSize / 1024).toFixed(1)} KB</div>
                  <div className="c-box-sub">Ciphertext + Nonce + 128-bit Tag</div>
                </div>
              </div>
            </div>

            <div className="crypto-params-grid">
              <div className="param-item">
                <span className="param-label">96-bit Nonce (IV):</span>
                <code className="param-code">{nonce}</code>
              </div>
              <div className="param-item">
                <span className="param-label">128-bit Authentication Tag (GMAC):</span>
                <code className="param-code">{tag}</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aesgcm' && (
          <div className="aesgcm-math-explanation" style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.6 }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
              Why AES-GCM (Galois/Counter Mode)? Authenticated Encryption with Associated Data (AEAD)
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#2563eb' }}>1. Confidentiality (CTR Mode):</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  A counter string (IV ‖ counter) is encrypted using AES-256 to generate a pseudo-random keystream, which is XORed with the image byte stream:
                </p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: '#fff', padding: 4, margin: '6px 0', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                  C_i = P_i ⊕ AES_K(IV ‖ counter_i)
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#15803d' }}>2. Integrity &amp; Authenticity (GHASH):</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  The ciphertext blocks are evaluated in the Galois field GF(2¹²⁸) with polynomial multiplication to produce a tamper-evident authentication tag T:
                </p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: '#fff', padding: 4, margin: '6px 0', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                  Tag = GHASH_H(C_1, C_2, …) ⊕ AES_K(IV ‖ 1)
                </div>
              </div>
            </div>
            <p className="vis-caption" style={{ marginTop: 10 }}>
              If an attacker modifies even a single bit of the ciphertext during classical transmission, the authentication tag verification will fail, preventing malicious injection attacks.
            </p>
          </div>
        )}

        {activeTab === 'entropy' && (
          <div className="entropy-scrambler-view">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Original Image Plaintext (Low Entropy)
                </span>
                <div className="entropy-preview-box plain-bg">
                  <div className="mock-pixel-structure">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="plain-sq" style={{ opacity: 0.4 + (i % 6) * 0.1 }} />
                    ))}
                  </div>
                  <span className="entropy-badge low">Entropy: Low (Structured Pixels)</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                  AES-GCM Ciphertext (Maximum Entropy)
                </span>
                <div className="entropy-preview-box cipher-bg">
                  <div className="mock-pixel-structure">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="cipher-sq" style={{ opacity: ((i * 37) % 100) / 100 }} />
                    ))}
                  </div>
                  <span className="entropy-badge max">Entropy: ~7.999 bits/byte (White Noise)</span>
                </div>
              </div>
            </div>
            <p className="vis-caption" style={{ marginTop: 10 }}>
              The encrypted image produces a flat, uniformly distributed byte frequency distribution with zero statistical leakage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
