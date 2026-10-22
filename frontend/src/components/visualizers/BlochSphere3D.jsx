import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

/**
 * High-Level 3D WebGL Bloch Sphere Visualizer
 * Accurately models arbitrary single-qubit states |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
 * with 3D coordinate axes, basis poles, interactive orbit rotation, and projective measurement collapse.
 */
export default function BlochSphere3D({
  initialTheta = Math.PI / 4,
  initialPhi = 0,
  basis = '+',
  bit = 0,
  interactive = true,
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const arrowRef = useRef(null)
  const pulseRef = useRef(null)
  const animationFrameRef = useRef(null)

  const [theta, setTheta] = useState(initialTheta)
  const [phi, setPhi] = useState(initialPhi)
  const [isPrecessing, setIsPrecessing] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [measurementResult, setMeasurementResult] = useState(null)

  // Synchronize when parent basis/bit props change
  useEffect(() => {
    if (basis === '+') {
      if (bit === 0) { setTheta(0); setPhi(0) }
      else { setTheta(Math.PI); setPhi(0) }
    } else if (basis === 'x') {
      if (bit === 0) { setTheta(Math.PI / 2); setPhi(0) }
      else { setTheta(Math.PI / 2); setPhi(Math.PI) }
    }
  }, [basis, bit])

  // Born rule probabilities
  const prob0 = Math.cos(theta / 2) ** 2
  const prob1 = Math.sin(theta / 2) ** 2

  // Three.js scene setup
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 360
    const height = 340

    // Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(2.8, 1.8, 3.2)
    camera.lookAt(0, 0, 0)

    // Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00f2fe, 2.5, 50)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const violetLight = new THREE.PointLight(0x9b51e0, 2, 50)
    violetLight.position.set(-5, -4, -5)
    scene.add(violetLight)

    // Main Sphere Wireframe & Semi-transparent Surface
    const radius = 1.0
    const sphereGeo = new THREE.SphereGeometry(radius, 32, 24)
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0a192f,
      transparent: true,
      opacity: 0.28,
      shininess: 70,
      wireframe: false,
    })
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphereMesh)

    // Glowing Wireframe Overlay
    const wireGeo = new THREE.WireframeGeometry(sphereGeo)
    const wireMat = new THREE.LineBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.35 })
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat)
    scene.add(wireMesh)

    // Equator ring (XY plane in standard physics, XZ in Three.js where Y is up)
    const ringGeo = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 64)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    const equator = new THREE.Mesh(ringGeo, ringMat)
    equator.rotation.x = Math.PI / 2
    scene.add(equator)

    // Prime meridian ring
    const meridianMat = new THREE.MeshBasicMaterial({ color: 0x9b51e0, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
    const meridian = new THREE.Mesh(ringGeo, meridianMat)
    scene.add(meridian)

    // Coordinate Axes (Y = North/South (|0⟩ / |1⟩), X = |+⟩ / |-⟩, Z = |+i⟩ / |-i⟩)
    const axisGroup = new THREE.Group()

    const makeAxisLine = (start, end, color) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end])
      const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.85 })
      return new THREE.Line(lineGeo, lineMat)
    }

    // Z-axis in physics (Y in Three.js)
    axisGroup.add(makeAxisLine(new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(0, 1.35, 0), 0x38bdf8))
    // X-axis (|+⟩ / |-⟩)
    axisGroup.add(makeAxisLine(new THREE.Vector3(-1.35, 0, 0), new THREE.Vector3(1.35, 0, 0), 0xa855f7))
    // Y-axis in physics (Z in Three.js)
    axisGroup.add(makeAxisLine(new THREE.Vector3(0, 0, -1.35), new THREE.Vector3(0, 0, 1.35), 0x10b981))
    scene.add(axisGroup)

    // Pole Marker Spheres
    const poleGeo = new THREE.SphereGeometry(0.045, 16, 16)
    const addPole = (x, y, z, color) => {
      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(poleGeo, mat)
      mesh.position.set(x, y, z)
      scene.add(mesh)
    }

    addPole(0, 1.0, 0, 0x38bdf8)   // |0⟩
    addPole(0, -1.0, 0, 0x38bdf8)  // |1⟩
    addPole(1.0, 0, 0, 0xa855f7)   // |+⟩
    addPole(-1.0, 0, 0, 0xa855f7)  // |-⟩
    addPole(0, 0, 1.0, 0x10b981)   // |+i⟩
    addPole(0, 0, -1.0, 0x10b981)  // |-i⟩

    // 3D State Vector Arrow
    const arrowGroup = new THREE.Group()
    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.92, 16)
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    })
    const shaft = new THREE.Mesh(shaftGeo, arrowMat)
    shaft.position.y = 0.46
    arrowGroup.add(shaft)

    const coneGeo = new THREE.ConeGeometry(0.065, 0.16, 16)
    const cone = new THREE.Mesh(coneGeo, arrowMat)
    cone.position.y = 0.92
    arrowGroup.add(cone)

    scene.add(arrowGroup)
    arrowRef.current = arrowGroup

    // Energy pulse ring for measurement collapse
    const pulseRingGeo = new THREE.RingGeometry(0.1, 0.18, 32)
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
    const pulseMesh = new THREE.Mesh(pulseRingGeo, pulseRingMat)
    pulseMesh.rotation.x = Math.PI / 2
    scene.add(pulseMesh)
    pulseRef.current = pulseMesh

    // Orbit Controls via Dragging
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let spherical = { radius: 4.4, theta: Math.PI / 4, phi: Math.PI / 3 }

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
      camera.position.y = spherical.radius * Math.cos(spherical.phi)
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      camera.lookAt(0, 0, 0)
    }
    updateCamera()

    const onMouseDown = (e) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouseX
      const dy = e.clientY - prevMouseY
      spherical.theta -= dx * 0.008
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.008))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
      updateCamera()
    }

    const onMouseUp = () => { isDragging = false }

    const domEl = renderer.domElement
    domEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Touch support for mobile
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevMouseX = e.touches[0].clientX
        prevMouseY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - prevMouseX
      const dy = e.touches[0].clientY - prevMouseY
      spherical.theta -= dx * 0.008
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.008))
      prevMouseX = e.touches[0].clientX
      prevMouseY = e.touches[0].clientY
      updateCamera()
    }
    const onTouchEnd = () => { isDragging = false }

    domEl.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // Animation Loop
    let clock = new THREE.Clock()
    const animate = () => {
      const delta = clock.getDelta()

      // Slight floating rotation
      sphereMesh.rotation.y += 0.002
      wireMesh.rotation.y += 0.002

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current) return
      const newW = container.clientWidth
      camera.aspect = newW / height
      camera.updateProjectionMatrix()
      rendererRef.current.setSize(newW, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', handleResize)
      domEl.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      domEl.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Update State Vector orientation when theta/phi changes
  useEffect(() => {
    if (!arrowRef.current) return

    // Physics spherical coordinate transformation:
    // Z is polar axis in physics, which corresponds to Y in Three.js
    // X = sin(theta)*cos(phi), Y_physics = sin(theta)*sin(phi), Z_physics = cos(theta)
    const targetDir = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi)
    ).normalize()

    // Align the arrow (default initial direction along +Y) to targetDir
    const defaultDir = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, targetDir)
    arrowRef.current.setRotationFromQuaternion(quaternion)
  }, [theta, phi])

  // Precession animation loop
  useEffect(() => {
    if (!isPrecessing) return
    let animId
    const step = () => {
      setPhi((p) => (p + 0.035) % (2 * Math.PI))
      animId = requestAnimationFrame(step)
    }
    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [isPrecessing])

  // Quantum Measurement Collapse Simulation (Born's rule)
  const handleMeasureCollapse = useCallback(() => {
    if (isCollapsing) return
    setIsCollapsing(true)
    setIsPrecessing(false)

    // Generate random outcome according to Born rule P(0) = cos^2(theta/2)
    const outcome = Math.random() < prob0 ? 0 : 1
    const targetTheta = outcome === 0 ? 0 : Math.PI

    let progress = 0
    const startTheta = theta
    const duration = 600 // ms
    const startTime = performance.now()

    const collapseStep = (now) => {
      progress = Math.min(1, (now - startTime) / duration)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      setTheta(startTheta + (targetTheta - startTheta) * ease)

      // Pulse ring animation
      if (pulseRef.current) {
        pulseRef.current.material.opacity = Math.sin(progress * Math.PI) * 0.9
        pulseRef.current.scale.setScalar(1 + progress * 2.5)
      }

      if (progress < 1) {
        requestAnimationFrame(collapseStep)
      } else {
        setIsCollapsing(false)
        setMeasurementResult(outcome)
      }
    }
    requestAnimationFrame(collapseStep)
  }, [isCollapsing, prob0, theta])

  return (
    <div className="bloch-sphere-card" style={{
      background: 'radial-gradient(ellipse at top, #111a36 0%, #080d1a 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(0, 242, 254, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      padding: '18px 20px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#00f2fe',
            boxShadow: '0 0 10px #00f2fe',
          }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em', color: '#e2e8f0' }}>
            3D Quantum State Bloch Sphere
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          Drag with mouse or touch to rotate 3D view
        </span>
      </div>

      {/* 3D WebGL Mount */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: 340,
          cursor: 'grab',
          borderRadius: 'var(--radius-md)',
          background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.7) 0%, rgba(2, 6, 23, 0.95) 100%)',
          position: 'relative',
        }}
      />

      {/* Pole Legend Badges Overlay */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        flexWrap: 'wrap',
        fontSize: '0.75rem',
      }}>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>● +Z: |0⟩ / -Z: |1⟩ (Comp. Basis)</span>
        <span style={{ color: '#a855f7', fontWeight: 600 }}>● +X: |+⟩ / -X: |-⟩ (Hadamard)</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>● +Y: |+i⟩ / -Y: |-i⟩ (Circular)</span>
      </div>

      {/* Interactive Controls & Quantum State Mathematical Readout */}
      {interactive && (
        <div style={{ marginTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 14 }}>
          {/* Quick Basis States Buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Quick Presets:
            </span>
            {[
              { label: '|0⟩ (+Z)', t: 0, p: 0 },
              { label: '|1⟩ (-Z)', t: Math.PI, p: 0 },
              { label: '|+⟩ (+X)', t: Math.PI / 2, p: 0 },
              { label: '|-⟩ (-X)', t: Math.PI / 2, p: Math.PI },
              { label: '|+i⟩ (+Y)', t: Math.PI / 2, p: Math.PI / 2 },
            ].map((st) => (
              <button
                key={st.label}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)',
                }}
                onClick={() => { setTheta(st.t); setPhi(st.p); setMeasurementResult(null) }}
              >
                {st.label}
              </button>
            ))}

            <button
              className="btn btn-ghost"
              style={{
                fontSize: '0.72rem',
                padding: '3px 9px',
                border: '1px solid #00f2fe',
                color: isPrecessing ? '#00f2fe' : '#e2e8f0',
                background: isPrecessing ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                borderRadius: 4,
                marginLeft: 'auto',
              }}
              onClick={() => setIsPrecessing(!isPrecessing)}
            >
              {isPrecessing ? '⏸ Pause Precession' : '▶ Animate Precession (φ)'}
            </button>
          </div>

          {/* Interactive Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                <span>Polar Angle θ: <strong>{(theta * 180 / Math.PI).toFixed(0)}°</strong></span>
                <span>[0 to 180°]</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI}
                step="0.02"
                value={theta}
                onChange={(e) => { setTheta(parseFloat(e.target.value)); setMeasurementResult(null) }}
                style={{ width: '100%', accentColor: '#00f2fe' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                <span>Phase φ: <strong>{(phi * 180 / Math.PI).toFixed(0)}°</strong></span>
                <span>[0 to 360°]</span>
              </div>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.02"
                value={phi}
                onChange={(e) => { setPhi(parseFloat(e.target.value)); setMeasurementResult(null) }}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>
          </div>

          {/* Born Rule Probabilities & Collapse Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>P(|0⟩): </span>
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{(prob0 * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>P(|1⟩): </span>
                <strong style={{ color: '#f43f5e', fontFamily: 'monospace' }}>{(prob1 * 100).toFixed(1)}%</strong>
              </div>
              {measurementResult !== null && (
                <div style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: measurementResult === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(244, 63, 94, 0.25)',
                  border: `1px solid ${measurementResult === 0 ? '#38bdf8' : '#f43f5e'}`,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  Collapsed State: |{measurementResult}⟩
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              disabled={isCollapsing}
              onClick={handleMeasureCollapse}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#070b14',
                fontWeight: 700,
                border: 'none',
              }}
            >
              {isCollapsing ? 'Collapsing...' : '💥 Measure & Collapse State'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
