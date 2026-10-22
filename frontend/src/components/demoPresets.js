// High-quality scientific preset images encoded as SVG data URLs for instant 1-click testing
export const DEMO_PRESETS = [
  {
    id: 'schrodinger-cat',
    title: "Schrödinger's Cat",
    category: 'Quantum Superposition',
    description: 'Iconic quantum thought experiment illustrating coherent superposition |ψ⟩ = (|Alive⟩ + |Dead⟩)/√2.',
    filename: 'schrodinger_cat_quantum.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#12182c"/>
          <stop offset="100%" stop-color="#070b14"/>
        </radialGradient>
        <linearGradient id="quantumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="50%" stop-color="#4facfe"/>
          <stop offset="100%" stop-color="#9b51e0"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <circle cx="200" cy="150" r="110" fill="none" stroke="url(#quantumGlow)" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
      <ellipse cx="200" cy="150" rx="130" ry="40" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity="0.3" transform="rotate(-25 200 150)"/>
      <ellipse cx="200" cy="150" rx="130" ry="40" fill="none" stroke="#9b51e0" stroke-width="1.5" opacity="0.3" transform="rotate(25 200 150)"/>
      
      <!-- Cat Silhouette Left (Solid) -->
      <path d="M 160 170 C 150 140, 160 100, 180 90 L 170 55 L 195 75 C 205 72, 215 72, 225 75 L 250 55 L 240 90 C 260 100, 270 140, 260 170 C 255 185, 230 195, 210 195 C 190 195, 165 185, 160 170 Z" fill="url(#quantumGlow)" opacity="0.9" filter="url(#glow)"/>
      <!-- Eyes -->
      <ellipse cx="190" cy="115" rx="5" ry="9" fill="#070b14"/>
      <ellipse cx="230" cy="115" rx="5" ry="9" fill="#070b14"/>
      <ellipse cx="191" cy="113" rx="2" ry="4" fill="#00f2fe"/>
      <ellipse cx="229" cy="113" rx="2" ry="4" fill="#00f2fe"/>
      <!-- Quantum State Formula -->
      <text x="200" y="245" font-family="'JetBrains Mono', monospace, sans-serif" font-size="14" fill="#00f2fe" text-anchor="middle" font-weight="700">|ψ⟩ = (|Alive⟩ + |Dead⟩)/√2</text>
      <text x="200" y="270" font-family="sans-serif" font-size="11" fill="#8892b0" text-anchor="middle">Quantum State Superposition Test Image</text>
    </svg>`
  },
  {
    id: 'micius-satellite',
    title: 'Quantum Satellite Micius',
    category: 'Space-to-Ground QKD',
    description: 'Relativistic quantum key distribution between low-Earth orbit satellite and ground optical telescopes.',
    filename: 'micius_quantum_satellite.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <radialGradient id="satBg" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stop-color="#0f1936"/>
          <stop offset="100%" stop-color="#050811"/>
        </radialGradient>
        <linearGradient id="laserBeam" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#00f2fe" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#satBg)"/>
      <!-- Earth Horizon -->
      <circle cx="200" cy="480" r="280" fill="#0b2447" stroke="#1d4ed8" stroke-width="2"/>
      <!-- Ground Observatory -->
      <polygon points="190,200 210,200 215,205 185,205" fill="#4facfe"/>
      <circle cx="200" cy="198" r="6" fill="#38bdf8"/>
      <!-- Satellite in Orbit -->
      <g transform="translate(160, 45)">
        <!-- Solar Panels -->
        <rect x="0" y="10" width="25" height="15" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1"/>
        <rect x="55" y="10" width="25" height="15" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1"/>
        <!-- Bus Body -->
        <rect x="27" y="5" width="26" height="25" fill="#cbd5e1" rx="3"/>
        <circle cx="40" cy="18" r="4" fill="#0284c7"/>
      </g>
      <!-- Downlink Laser Beam -->
      <polygon points="200,75 198,198 202,198" fill="url(#laserBeam)"/>
      <circle cx="200" cy="130" r="3" fill="#ffffff"/>
      <!-- Text -->
      <text x="200" y="255" font-family="'JetBrains Mono', monospace, sans-serif" font-size="13" fill="#38bdf8" text-anchor="middle" font-weight="700">SPACE-TO-GROUND QKD</text>
      <text x="200" y="275" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Polarization-Encoded Single-Photon Channel</text>
    </svg>`
  },
  {
    id: 'entangled-pair',
    title: 'Entangled EPR Pair',
    category: 'Quantum Entanglement',
    description: 'Maximally entangled Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2 demonstrating non-local quantum correlations.',
    filename: 'bell_state_entanglement.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <radialGradient id="eprBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#150f28"/>
          <stop offset="100%" stop-color="#07050f"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#eprBg)"/>
      <!-- Entangled Wave Function -->
      <path d="M 60 150 Q 130 90, 200 150 T 340 150" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="4,4" opacity="0.6"/>
      <path d="M 60 150 Q 130 210, 200 150 T 340 150" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,4" opacity="0.6"/>
      <!-- Alice Photon -->
      <circle cx="100" cy="150" r="18" fill="#ec4899" opacity="0.8"/>
      <circle cx="100" cy="150" r="28" fill="none" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="100" y="155" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">A</text>
      <!-- Bob Photon -->
      <circle cx="300" cy="150" r="18" fill="#a855f7" opacity="0.8"/>
      <circle cx="300" cy="150" r="28" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="300" y="155" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">B</text>
      <!-- Center Entanglement Symbol -->
      <circle cx="200" cy="150" r="6" fill="#fbbf24"/>
      <text x="200" y="240" font-family="'JetBrains Mono', monospace, sans-serif" font-size="13" fill="#f472b6" text-anchor="middle" font-weight="700">|Φ+⟩ = (|00⟩ + |11⟩)/√2</text>
      <text x="200" y="265" font-family="sans-serif" font-size="11" fill="#a1a1aa" text-anchor="middle">Non-local Cryptographic Key Verification</text>
    </svg>`
  }
]

// Convert SVG to real PNG-compatible File object
export function createPresetFile(preset) {
  const blob = new Blob([preset.svg], { type: 'image/svg+xml' })
  const file = new File([blob], preset.filename, { type: 'image/svg+xml' })
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preset.svg)}`
  return { file, previewUrl: url }
}
