import React, { useState } from 'react'
import StepCard from './StepCard.jsx'
import CryptographicPipelineVisualizer from './visualizers/CryptographicPipelineVisualizer.jsx'
import MatrixPixelScrambler from './visualizers/MatrixPixelScrambler.jsx'

const BYTE_OPTIONS = [32, 64, 128]

export default function EncryptionStep({ state, encryption, imageInfo, imagePreview, keySummary, onNext }) {
  const [showDetail, setShowDetail] = useState(false)
  const [byteCount, setByteCount] = useState(32)

  const getBytesPreview = () => {
    if (byteCount === 32) return imageInfo.first_32_bytes_hex
    if (byteCount === 64) return imageInfo.first_64_bytes_hex
    return imageInfo.first_128_bytes_hex
  }

  const summary = `Image encrypted with AES-GCM (${(encryption.plaintext_size / 1024).toFixed(1)} KB → ${(encryption.ciphertext_size / 1024).toFixed(1)} KB ciphertext).`

  return (
    <StepCard
      state={state}
      number="06"
      title="Encrypt the image"
      summary={summary}
    >
      <p>
        The shared BB84 key material is used to derive a 256-bit AES key via HKDF-SHA256.
        The image is then encrypted using <strong>AES-GCM</strong> — an authenticated
        encryption mode that provides both confidentiality and integrity.
      </p>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <strong>Important distinction:</strong> BB84 establishes shared key material.
        AES-GCM performs the actual bulk image encryption. The image itself is never
        transmitted through the quantum channel.
      </div>

      {/* Encryption pipeline */}
      <p className="section-heading">Encryption pipeline</p>
      <div className="flow-diagram">
        {[
          'Original Image',
          'Image Bytes',
          'BB84 Key Material',
          'HKDF-SHA256 Key Derivation',
          'AES-GCM Encryption',
          'Ciphertext + Nonce + Authentication Tag',
        ].map((label, i, arr) => (
          <React.Fragment key={label}>
            <div className="flow-node">{label}</div>
            {i < arr.length - 1 && (
              <div className="flow-arrow">
                <div className="flow-arrow-line"></div>
                <span>↓</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Interactive Cryptographic Pipeline & AEAD Architecture */}
      <CryptographicPipelineVisualizer
        imageInfo={imageInfo}
        encryption={encryption}
        keySummary={keySummary}
      />

      {/* Real-time Dynamic Matrix Scrambler Visualizer */}
      <div style={{ margin: '24px 0' }}>
        <MatrixPixelScrambler
          imageSrc={imagePreview}
          mode="encrypt"
          ciphertextSizeKB={(encryption.ciphertext_size / 1024).toFixed(1)}
          authTagHex={encryption.tag_hex || 'e4a8b79c201df3'}
        />
      </div>

      {/* AES-GCM stats */}
      <div className="stats-grid" style={{ marginTop: 24 }}>
        <div className="stat-item">
          <div className="stat-label">Plaintext size</div>
          <div className="stat-value">{encryption.plaintext_size.toLocaleString()} B</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Ciphertext size</div>
          <div className="stat-value">{encryption.ciphertext_size.toLocaleString()} B</div>
        </div>
      </div>

      <div style={{ margin: '20px 0' }}>
        <p className="section-heading">Nonce (random, 96-bit)</p>
        <div className="code-block">{encryption.nonce_hex}</div>
        <p className="section-heading" style={{ marginTop: 16 }}>Authentication tag (128-bit)</p>
        <div className="code-block">{encryption.tag_hex}</div>
      </div>

      {/* AES Key (masked) */}
      <div style={{ margin: '20px 0' }}>
        <p className="section-heading">AES key (protected)</p>
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div className="key-dots">{'•'.repeat(32)}</div>
          <div style={{
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: 12,
            background: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success-border)',
            fontWeight: 500,
          }}>Protected</div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8 }}>
          KDF: {keySummary?.kdf} — derived from {keySummary?.sifted_bit_count} sifted bits → {keySummary?.derived_key_bits}-bit key
        </p>
      </div>

      {/* Expandable detail */}
      <button
        className="detail-toggle"
        onClick={() => setShowDetail(s => !s)}
        aria-expanded={showDetail}
      >
        {showDetail ? '▲ Hide' : '▼ Show'} encryption details
      </button>

      {showDetail && (
        <div className="detail-section">
          {/* Original file bytes */}
          <p className="section-heading">Original image → bytes</p>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: '0.875rem' }}>{imageInfo.filename}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 12 }}>
              {imageInfo.file_size_mb} MB · {imageInfo.file_size_bytes.toLocaleString()} bytes
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {BYTE_OPTIONS.map(n => (
              <button
                key={n}
                className={`btn ${byteCount === n ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.8125rem' }}
                onClick={() => setByteCount(n)}
              >
                Show {n} bytes
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            First {byteCount} bytes of original image:
          </p>
          <div className="code-block">{getBytesPreview()}</div>

          <hr className="divider" />

          <p className="section-heading">First 32 bytes of ciphertext</p>
          <div className="code-block">{encryption.first_32_bytes_ciphertext_hex}</div>
          <p className="note">
            The ciphertext should not reveal the original image without the secret key.
            AES-GCM produces pseudorandom output indistinguishable from random bytes.
          </p>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onNext}>
          Transmit classically →
        </button>
      </div>
    </StepCard>
  )
}
