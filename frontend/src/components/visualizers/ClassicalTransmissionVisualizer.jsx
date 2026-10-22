import React, { useState, useEffect } from 'react'

export default function ClassicalTransmissionVisualizer({
  encryption = {},
  eveEnabled = false,
  tamperData = null,
  onTamper = null,
}) {
  const [packetProgress, setPacketProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Animated packet transmission across classical link
  useEffect(() => {
    if (isPaused) return
    let animId
    let start = performance.now()
    const duration = 3000 // 3 seconds per transit cycle

    const step = (now) => {
      const elapsed = now - start
      const prog = (elapsed % duration) / duration
      setPacketProgress(prog)
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [isPaused])

  const cSizeKB = encryption?.ciphertext_size ? (encryption.ciphertext_size / 1024).toFixed(1) : '—'
  const isTampered = !!tamperData

  return (
    <div className="scientific-visualizer-card" style={{ margin: '20px 0' }}>
      <div className="vis-header">
        <div className="vis-title">
          <span className="vis-badge">CLASSICAL TELECOMMUNICATION LINK</span>
          <h4>Encrypted Image Packet Transmission &amp; Transit Security</h4>
        </div>
        <div className="vis-controls">
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      <div className="vis-body">
        {/* Classical Transmission Route Animation */}
        <div className="classical-channel-track">
          <div className="channel-endpoint alice-end">
            <div className="endpoint-icon">👩‍🔬</div>
            <div className="endpoint-label">Alice (Sender)</div>
            <div className="endpoint-sub">Encrypted Image Origin</div>
          </div>

          {/* Network Path */}
          <div className="classical-wire-container">
            <div className="classical-wire-line" />
            <div className="packet-wave-stream" />

            {/* In-Transit Data Packet */}
            <div
              className={`classical-packet-capsule ${isTampered ? 'packet-corrupted' : ''}`}
              style={{ left: `${8 + packetProgress * 76}%` }}
            >
              <div className="packet-header-badge">
                {isTampered ? '⚠️ TAMPERED PACKET' : '🔒 AES-GCM CIPHERTEXT'}
              </div>
              <div className="packet-components">
                <span className="p-part nonce">IV (96b)</span>
                <span className="p-part payload">{cSizeKB} KB</span>
                <span className="p-part tag">Tag (128b)</span>
              </div>
            </div>

            {/* Classical Channel Intermediary Tap / Router */}
            <div className="router-node">
              <span className="router-icon">🌐</span>
              <span className="router-text">Public Internet Route</span>
            </div>
          </div>

          <div className="channel-endpoint bob-end">
            <div className="endpoint-icon">👨‍🔬</div>
            <div className="endpoint-label">Bob (Receiver)</div>
            <div className="endpoint-sub">Awaiting Payload</div>
          </div>
        </div>

        {/* Channel Distinction Banner */}
        <div className="channel-distinction-grid">
          <div className="dist-box quantum">
            <div className="dist-title">🔬 Quantum Channel (Step 02)</div>
            <ul className="dist-list">
              <li>Transmitted: Individual polarized single photons</li>
              <li>Payload: Random basis &amp; bit choices (BB84 raw key)</li>
              <li>Eavesdropping Result: Collapses wavefunctions, introduces detectable QBER</li>
            </ul>
          </div>

          <div className="dist-box classical">
            <div className="dist-title">📡 Classical Channel (Step 07)</div>
            <ul className="dist-list">
              <li>Transmitted: Standard TCP/IP network packets</li>
              <li>Payload: Bulk image ciphertext encrypted with AES-GCM</li>
              <li>Eavesdropping Result: Eve sees only random white noise; cannot decrypt without quantum key</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
