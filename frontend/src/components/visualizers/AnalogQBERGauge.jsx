import React, { useState, useEffect } from 'react'

/**
 * High-Precision Analog QBER Gauge & Eavesdropper Threat Radar
 * Renders a circular instrument gauge with physical damping, safety zones,
 * BB84 11% Shor-Preskill critical threshold, and an interactive "Play as Eve" sandbox.
 */
export default function AnalogQBERGauge({
  qber = 0.05,
  threshold = 0.11,
  channelNoise = 0.05,
  eveActive = false,
  interactiveSandbox = true,
}) {
  const [eveInterceptRate, setEveInterceptRate] = useState(eveActive ? 1.0 : 0.0)
  const [sandboxMode, setSandboxMode] = useState(false)

  // In sandbox mode, predict QBER based on theoretical BB84 formula:
  // QBER = channelNoise * (1 - eveIntercept) + (channelNoise + 0.25 * eveIntercept)
  // Simplified realistic model: channelNoise + 0.25 * eveInterceptRate * (1 - channelNoise)
  const effectiveQBER = sandboxMode
    ? Math.min(0.50, channelNoise + 0.25 * eveInterceptRate * (1 - channelNoise))
    : qber

  // Needle angle calculation (Arc from -120deg to +120deg, total span 240deg representing 0% to 50% QBER)
  const maxQBER = 0.50
  const clampedQBER = Math.max(0, Math.min(maxQBER, effectiveQBER))
  const targetAngle = -120 + (clampedQBER / maxQBER) * 240
  const thresholdAngle = -120 + (threshold / maxQBER) * 240

  const [currentAngle, setCurrentAngle] = useState(targetAngle)

  // Smooth needle inertia animation
  useEffect(() => {
    let animId
    const step = () => {
      setCurrentAngle((prev) => {
        const diff = targetAngle - prev
        if (Math.abs(diff) < 0.2) return targetAngle
        return prev + diff * 0.12 // Spring factor
      })
      animId = requestAnimationFrame(step)
    }
    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [targetAngle])

  const isAborted = effectiveQBER > threshold
  const isHighNoise = effectiveQBER >= 0.05 && effectiveQBER <= threshold

  // Status colors & texts
  const statusColor = isAborted ? '#ef4444' : isHighNoise ? '#f59e0b' : '#10b981'
  const statusLabel = isAborted
    ? 'SECURITY BREACH DETECTED (QBER > 11%)'
    : isHighNoise
    ? 'ACCEPTABLE NOISE (QBER ≤ 11%)'
    : 'OPTIMAL QUANTUM CHANNEL'

  return (
    <div className="analog-gauge-card" style={{
      background: 'radial-gradient(circle at 50% 30%, #0d1527 0%, #060913 100%)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${isAborted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 242, 254, 0.25)'}`,
      boxShadow: isAborted
        ? '0 0 25px rgba(239, 68, 68, 0.25), inset 0 0 15px rgba(239, 68, 68, 0.1)'
        : '0 8px 32px rgba(0, 0, 0, 0.4)',
      padding: '20px 22px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: statusColor, fontWeight: 700 }}>
            Precision Telemetry Gauge
          </span>
          <h4 style={{ margin: '2px 0 0 0', fontSize: '0.98rem', fontWeight: 700 }}>
            Quantum Bit Error Rate (QBER)
          </h4>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px 10px',
          borderRadius: 20,
          border: `1px solid ${statusColor}`,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* SVG Analog Gauge Meter */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <svg viewBox="0 0 320 200" width="100%" style={{ maxWidth: 320 }}>
          <defs>
            {/* Safe arc gradient */}
            <linearGradient id="safeArc" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="60%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#ef4444" />
            </linearGradient>
            {/* Gauge center shadow */}
            <radialGradient id="centerPin" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="70%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#020617" />
            </radialGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 50 160 A 115 115 0 1 1 270 160"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <path
            d="M 50 160 A 115 115 0 1 1 270 160"
            fill="none"
            stroke="url(#safeArc)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* 11% Critical Abort Threshold Tick (At ~22% of arc) */}
          {/* Angle at 11% is -120 + (0.11/0.50)*240 = -67.2 deg */}
          <line
            x1="160"
            y1="45"
            x2="160"
            y2="30"
            stroke="#ef4444"
            strokeWidth="3.5"
            transform={`rotate(${thresholdAngle} 160 160)`}
          />
          {/* Threshold label */}
          <text
            x="160"
            y="22"
            textAnchor="middle"
            fill="#ef4444"
            fontSize="9"
            fontWeight="700"
            transform={`rotate(${thresholdAngle} 160 160)`}
          >
            11% ABORT
          </text>

          {/* Gauge Major Ticks & Percentages */}
          {[
            { val: '0%', deg: -120 },
            { val: '10%', deg: -72 },
            { val: '20%', deg: -24 },
            { val: '30%', deg: 24 },
            { val: '40%', deg: 72 },
            { val: '50%', deg: 120 },
          ].map((t) => (
            <g key={t.deg} transform={`rotate(${t.deg} 160 160)`}>
              <line x1="160" y1="50" x2="160" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <text x="160" y="32" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                {t.val}
              </text>
            </g>
          ))}

          {/* Needle */}
          <g transform={`rotate(${currentAngle} 160 160)`}>
            {/* Needle spine */}
            <polygon
              points="157,160 163,160 160.8,50 159.2,50"
              fill={isAborted ? '#ef4444' : '#00f2fe'}
              filter="drop-shadow(0px 0px 4px rgba(0, 242, 254, 0.8))"
            />
            {/* Needle tip glow */}
            <circle cx="160" cy="50" r="2.5" fill="#fff" />
          </g>

          {/* Center Pin Pivot Cap */}
          <circle cx="160" cy="160" r="16" fill="url(#centerPin)" stroke="#00f2fe" strokeWidth="2" />
          <circle cx="160" cy="160" r="6" fill="#fff" />

          {/* Large Digital Readout */}
          <text
            x="160"
            y="125"
            textAnchor="middle"
            fill={statusColor}
            fontSize="24"
            fontWeight="800"
            fontFamily="'JetBrains Mono', monospace"
            filter={`drop-shadow(0px 0px 6px ${statusColor})`}
          >
            {(effectiveQBER * 100).toFixed(2)}%
          </text>
          <text x="160" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9" letterSpacing="0.05em">
            MEASURED QBER
          </text>
        </svg>
      </div>

      {/* Threshold Explanation Banner */}
      <div style={{
        marginTop: 6,
        padding: '8px 12px',
        borderRadius: 6,
        background: isAborted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 242, 254, 0.08)',
        border: `1px solid ${isAborted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 242, 254, 0.2)'}`,
        fontSize: '0.78rem',
        lineHeight: 1.45,
      }}>
        {isAborted ? (
          <div>
            <strong style={{ color: '#ef4444' }}>⚠️ Shor-Preskill Security Bound Violated:</strong> QBER exceeds the{' '}
            <strong>11.0%</strong> information-theoretic threshold. Information reconciliation and privacy
            amplification cannot guarantee a secret key against an optimal eavesdropper. Transmission rejected.
          </div>
        ) : (
          <div>
            <strong style={{ color: '#10b981' }}>✓ Security Condition Satisfied:</strong> QBER is below{' '}
            <strong>11.0%</strong>. The mutual information $I(A:B) &gt; I(A:E)$, allowing error correction
            and privacy amplification to distill a cryptographically secure key.
          </div>
        )}
      </div>

      {/* Interactive "Play as Eve" Sandbox Toggle */}
      {interactiveSandbox && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
              🕵️ Interactive Eve Intercept-Resend Sandbox
            </span>
            <button
              className="btn btn-ghost"
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                background: sandboxMode ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
              }}
              onClick={() => setSandboxMode(!sandboxMode)}
            >
              {sandboxMode ? 'Active (Live Slider)' : 'Enable Sandbox Mode'}
            </button>
          </div>

          {sandboxMode && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.06)',
              padding: '12px 14px',
              borderRadius: 6,
              border: '1px dashed rgba(245, 158, 11, 0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                <span>Eve Interception Rate:</span>
                <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>
                  {(eveInterceptRate * 100).toFixed(0)}% of transmitted photons
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={eveInterceptRate}
                onChange={(e) => setEveInterceptRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                <span>0% (Eve Inactive)</span>
                <span>50% (Partial Tap)</span>
                <span>100% (Full Interception)</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                💡 <em>Quantum Physics Law:</em> When Eve measures in the wrong basis (50% probability), she collapses
                the photon state. Bob measuring in Alice's basis has a 50% chance of an error on those photons,
                injecting $25\%$ error rate overall!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
