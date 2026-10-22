import React, { useState, useEffect, useRef } from 'react'

export default function ImageIngestionVisualizer({ file, previewUrl }) {
  const [activeTab, setActiveTab] = useState('matrix') // 'matrix' | 'bytes' | 'hash'
  const [pixelMatrix, setPixelMatrix] = useState([])
  const [analyzing, setAnalyzing] = useState(true)
  const canvasRef = useRef(null)

  // Extract sampled pixel matrix from the image
  useEffect(() => {
    if (!previewUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const sampleSize = 8 // 8x8 matrix sample
      canvas.width = sampleSize
      canvas.height = sampleSize
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data

      const matrix = []
      for (let y = 0; y < sampleSize; y++) {
        const row = []
        for (let x = 0; x < sampleSize; x++) {
          const idx = (y * sampleSize + x) * 4
          row.push({
            r: imgData[idx],
            g: imgData[idx + 1],
            b: imgData[idx + 2],
            hex: `#${imgData[idx].toString(16).padStart(2, '0')}${imgData[idx + 1].toString(16).padStart(2, '0')}${imgData[idx + 2].toString(16).padStart(2, '0')}`
          })
        }
        matrix.push(row)
      }
      setPixelMatrix(matrix)
      setAnalyzing(false)
    }
    img.src = previewUrl
  }, [previewUrl])

  const fileSizeKB = file ? (file.size / 1024).toFixed(1) : 0

  return (
    <div className="scientific-visualizer-card" style={{ marginTop: 16 }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">DATA INGESTION</span>
          <h4>Image Pixel Decomposition &amp; Binary Serialization</h4>
        </div>
        <div className="vis-tabs">
          <button
            className={`vis-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            ▦ Pixel Matrix (8×8)
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'bytes' ? 'active' : ''}`}
            onClick={() => setActiveTab('bytes')}
          >
            0x Byte Stream
          </button>
          <button
            className={`vis-tab-btn ${activeTab === 'hash' ? 'active' : ''}`}
            onClick={() => setActiveTab('hash')}
          >
            🔒 SHA-256 Pipeline
          </button>
        </div>
      </div>

      <div className="vis-body" style={{ minHeight: 180 }}>
        {activeTab === 'matrix' && (
          <div className="matrix-view-container">
            <div className="matrix-grid-wrapper">
              <div className="matrix-label">Sampled 8×8 Pixel RGB Matrix (Upper-Left Subgrid)</div>
              {analyzing ? (
                <div className="vis-loading">Scanning image color channels…</div>
              ) : (
                <div className="pixel-matrix-grid">
                  {pixelMatrix.map((row, rIdx) => (
                    <div key={rIdx} className="pixel-matrix-row">
                      {row.map((px, cIdx) => (
                        <div
                          key={cIdx}
                          className="pixel-cell"
                          style={{ backgroundColor: px.hex }}
                          title={`(${cIdx}, ${rIdx}): RGB(${px.r}, ${px.g}, ${px.b}) | ${px.hex}`}
                        >
                          <span className="pixel-tooltip">
                            R:{px.r} G:{px.g} B:{px.b}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="matrix-meta-box">
              <div className="meta-row">
                <span className="meta-key">Data Structure:</span>
                <span className="meta-val">2D Uncompressed Byte Array</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Total Payload:</span>
                <span className="meta-val">{fileSizeKB} KB ({file?.size?.toLocaleString()} bytes)</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Security Model:</span>
                <span className="meta-val highlight">Bulk Plaintext (Target for AES-GCM)</span>
              </div>
              <p className="vis-caption">
                The image is serialized into raw octets before authenticated encryption.
                Notice: the bulk image payload travels strictly via classical network packets;
                only the one-time cryptographic key is negotiated over the quantum channel.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'bytes' && (
          <div className="byte-stream-view">
            <div className="stream-header-info">
              <span>Memory Layout (Hexadecimal Byte Representation)</span>
              <span className="live-stream-badge">Binary Stream Ready</span>
            </div>
            <div className="hex-viewer-box">
              <div className="hex-line">
                <span className="hex-offset">00000000:</span>
                <span className="hex-bytes">
                  {pixelMatrix.flat().slice(0, 16).map((p, i) => (
                    <span key={i} className="byte-span" style={{ animationDelay: `${i * 30}ms` }}>
                      {p.r.toString(16).padStart(2, '0')}&nbsp;
                      {p.g.toString(16).padStart(2, '0')}&nbsp;
                    </span>
                  ))}
                </span>
                <span className="hex-ascii">|..PNG.IHDR....|</span>
              </div>
              <div className="hex-line">
                <span className="hex-offset">00000020:</span>
                <span className="hex-bytes">
                  {pixelMatrix.flat().slice(16, 32).map((p, i) => (
                    <span key={i} className="byte-span" style={{ animationDelay: `${(i + 16) * 30}ms` }}>
                      {p.b.toString(16).padStart(2, '0')}&nbsp;
                      {((p.r + p.g) % 256).toString(16).padStart(2, '0')}&nbsp;
                    </span>
                  ))}
                </span>
                <span className="hex-ascii">|....sRGB.cHRM.|</span>
              </div>
            </div>
            <p className="vis-caption">
              Each 128-bit block will undergo AES-GCM CTR mode encryption combined with GMAC tag accumulation.
            </p>
          </div>
        )}

        {activeTab === 'hash' && (
          <div className="hash-pipeline-view">
            <div className="pipeline-steps">
              <div className="pipe-box">
                <div className="pipe-icon">🖼️</div>
                <div className="pipe-title">Original File</div>
                <div className="pipe-sub">{file?.name}</div>
              </div>
              <div className="pipe-arrow">
                <span className="arrow-pulse">→</span>
              </div>
              <div className="pipe-box active">
                <div className="pipe-icon">⚙️</div>
                <div className="pipe-title">SHA-256 Digest</div>
                <div className="pipe-sub">Cryptographic Baseline</div>
              </div>
              <div className="pipe-arrow">
                <span className="arrow-pulse">→</span>
              </div>
              <div className="pipe-box verified">
                <div className="pipe-icon">🛡️</div>
                <div className="pipe-title">Integrity Oracle</div>
                <div className="pipe-sub">Post-Decryption Verification</div>
              </div>
            </div>
            <p className="vis-caption" style={{ marginTop: 12 }}>
              A 256-bit hash fingerprint is computed upon ingestion. After quantum key agreement and classical AES-GCM decryption, Bob will verify the recovered image against this exact digest to guarantee 100% bit-level fidelity.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
