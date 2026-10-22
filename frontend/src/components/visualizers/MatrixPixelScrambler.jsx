import React, { useRef, useEffect, useState, useCallback } from 'react'

/**
 * Real-Time Canvas Matrix Pixel Scrambler & Laser Scanline Decryption Visualizer
 * Accurately simulates AES-GCM byte diffusion, visual entropy scramble,
 * and authenticated decryption recovery vs cryptographic integrity failure.
 */
export default function MatrixPixelScrambler({
  imageSrc,
  mode = 'encrypt', // 'encrypt' | 'decrypt'
  success = true,
  ciphertextSizeKB = null,
  authTagHex = 'e4a8b79c201df3',
}) {
  const canvasRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(mode === 'encrypt' ? 1.0 : 1.0)
  const animFrameRef = useRef(null)
  const imageObjRef = useRef(null)

  // Load Image once
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      imageObjRef.current = img
      triggerAnimation()
    }
  }, [imageSrc, mode])

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true)
    const duration = 1800 // ms
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const p = Math.min(1.0, elapsed / duration)
      setProgress(p)

      renderFrame(p)

      if (p < 1.0) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        setIsAnimating(false)
      }
    }

    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(step)
  }, [mode, success])

  const renderFrame = (p) => {
    const canvas = canvasRef.current
    const img = imageObjRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    if (mode === 'encrypt') {
      // Draw original image with progressive pixelated blocks dissolving into noise
      ctx.drawImage(img, 0, 0, w, h)

      if (p > 0.05) {
        const blockSize = Math.max(4, Math.floor(16 * (1 - p) + 6))
        const scrambleCols = Math.floor(w * p)

        // Scramble region from left to right as p advances
        const imgData = ctx.getImageData(0, 0, scrambleCols, h)
        const data = imgData.data

        // Pseudo-random noise substitution to simulate high entropy ciphertext
        for (let y = 0; y < h; y += blockSize) {
          for (let x = 0; x < scrambleCols; x += blockSize) {
            // High entropy pseudo-noise color
            const r = Math.floor(Math.sin(x * 12.9898 + y * 78.233 + p * 100) * 127 + 128)
            const g = Math.floor(Math.sin(x * 39.346 + y * 11.135 + p * 50) * 127 + 128)
            const b = Math.floor(Math.cos(x * 73.156 + y * 52.235) * 127 + 128)

            for (let by = 0; by < blockSize && y + by < h; by++) {
              for (let bx = 0; bx < blockSize && x + bx < scrambleCols; bx++) {
                const idx = ((y + by) * scrambleCols + (x + bx)) * 4
                data[idx] = r
                data[idx + 1] = g
                data[idx + 2] = b
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0)

        // Encryption Laser Sweep Line
        ctx.strokeStyle = '#00f2fe'
        ctx.lineWidth = 3
        ctx.shadowColor = '#00f2fe'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(scrambleCols, 0)
        ctx.lineTo(scrambleCols, h)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    } else {
      // DECRYPT MODE
      if (success) {
        // Successful decryption: ciphertext noise progressively replaced by restored image
        // First fill canvas with pseudo-ciphertext noise
        const noiseData = ctx.createImageData(w, h)
        for (let i = 0; i < noiseData.data.length; i += 4) {
          const val = (i * 137) % 256
          noiseData.data[i] = val
          noiseData.data[i + 1] = (val + 60) % 256
          noiseData.data[i + 2] = (val * 3) % 256
          noiseData.data[i + 3] = 255
        }
        ctx.putImageData(noiseData, 0, 0)

        // Draw restored image up to sweep boundary
        const sweepX = Math.floor(w * p)
        if (sweepX > 0) {
          ctx.drawImage(img, 0, 0, sweepX, h, 0, 0, sweepX, h)

          // Decryption Laser Sweep Line
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.shadowColor = '#10b981'
          ctx.shadowBlur = 12
          ctx.beginPath()
          ctx.moveTo(sweepX, 0)
          ctx.lineTo(sweepX, h)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      } else {
        // FAILED DECRYPTION (QBER high or corrupt auth tag): Glitch effect
        const sweepX = Math.floor(w * Math.min(0.45, p))
        ctx.drawImage(img, 0, 0, sweepX, h, 0, 0, sweepX, h)

        // Glitch bars
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'
        for (let i = 0; i < 8; i++) {
          const gy = (i * 30 + p * 200) % h
          ctx.fillRect(0, gy, w, 4)
        }

        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 3
        ctx.shadowColor = '#ef4444'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.moveTo(sweepX, 0)
        ctx.lineTo(sweepX, h)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }
  }

  return (
    <div className="matrix-scrambler-box" style={{
      background: 'rgba(8, 13, 26, 0.95)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${mode === 'encrypt' ? 'rgba(0, 242, 254, 0.3)' : success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
      padding: '16px 18px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: mode === 'encrypt' ? '#00f2fe' : success ? '#10b981' : '#ef4444',
          }}>
            {mode === 'encrypt' ? '⚡ AES-GCM Ciphertext Diffusion' : '🔓 AES-GCM Authenticated Decryption'}
          </span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.72rem', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={triggerAnimation}
          disabled={isAnimating}
        >
          {isAnimating ? 'Processing...' : '🔄 Replay Animation'}
        </button>
      </div>

      {/* Real-time HTML5 Canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', background: '#020617', borderRadius: 8, padding: 8, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={280}
          height={200}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{
        marginTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: '0.75rem',
        color: '#94a3b8',
      }}>
        <span>
          {mode === 'encrypt'
            ? `Ciphertext: ${ciphertextSizeKB ? ciphertextSizeKB + ' KB' : 'High Entropy Stream'}`
            : success
            ? 'Status: Authentication Tag Verified'
            : 'Status: Decryption Aborted (Tag Mismatch)'}
        </span>
        <span style={{ fontFamily: 'monospace', color: mode === 'encrypt' ? '#00f2fe' : success ? '#10b981' : '#ef4444' }}>
          TAG: {authTagHex.substring(0, 16)}...
        </span>
      </div>
    </div>
  )
}
