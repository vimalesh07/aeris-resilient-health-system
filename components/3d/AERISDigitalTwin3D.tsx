'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RiskScores } from '@/types/aeris'

interface DigitalTwin3DProps {
  risks: RiskScores
  compact?: boolean
  currentBpm?: number
  currentTemp?: number
  currentSpo2?: number
  baselineHR?: number
  baselineTemp?: number
  mobilityStatus?: string
}

export default function AERISDigitalTwin3D({
  risks,
  compact = false,
  currentBpm = 76,
  currentTemp = 36.5,
  currentSpo2 = 98,
  baselineHR = 64,
  baselineTemp = 36.5,
  mobilityStatus = 'Normal',
}: DigitalTwin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)

  // Direct DOM Overlay Refs for zero-React-re-render 60 FPS badge projections
  const headBadgeRef = useRef<HTMLDivElement>(null)
  const heartBadgeRef = useRef<HTMLDivElement>(null)
  const lungsBadgeRef = useRef<HTMLDivElement>(null)
  const legsBadgeRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mutable Telemetry Ref to completely decouple React state ticks from the WebGL render loop
  const liveTelemetryRef = useRef({
    risks,
    currentBpm,
    currentTemp,
    currentSpo2,
    baselineHR,
    baselineTemp,
    mobilityStatus,
  })

  // Synchronize dynamic telemetry props into mutable ref without re-triggering Three.js canvas setup
  useEffect(() => {
    liveTelemetryRef.current = {
      risks,
      currentBpm,
      currentTemp,
      currentSpo2,
      baselineHR,
      baselineTemp,
      mobilityStatus,
    }
  }, [risks, currentBpm, currentTemp, currentSpo2, baselineHR, baselineTemp, mobilityStatus])

  // Derive risk state flags for HUD styling
  const score = risks?.overall ?? 0
  const isRed = score > 60 || Boolean(risks?.criticalOverride)
  const isOrange = score > 30 && !isRed

  const physiologicalContrib = risks?.contributions?.physiological ?? 0
  const tempContrib = risks?.contributions?.temperature ?? 0
  const heatContrib = risks?.contributions?.heat ?? 0
  const mobilityContrib = risks?.contributions?.mobility ?? 0

  const isChestElevated = physiologicalContrib > 8 || currentBpm > baselineHR + 8
  const isHeadElevated = tempContrib > 6 || Boolean(risks?.tempAnomaly?.detected)
  const isHeatElevated = heatContrib > 6 || (risks?.psi ?? 0) >= 4.0
  const isLegsElevated = mobilityContrib > 6

  // Main Three.js Initialization Effect - Runs ONLY on mount or container dimensions change
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let animationFrameId: number
    let renderer: THREE.WebGLRenderer
    const disposables: { dispose: () => void }[] = []

    try {
      const width = container.clientWidth || (compact ? 300 : 450)
      const height = container.clientHeight || (compact ? 300 : 450)

      // 1. Scene Setup with Dark Cyber Vignette Environment
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x030712, 0.18)

      // 2. Camera Setup
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
      camera.position.set(0, 0.95, 3.1)
      cameraRef.current = camera

      // 3. WebGL Renderer Setup with Pixel Ratio Capping & High Performance
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25

      container.innerHTML = ''
      container.appendChild(renderer.domElement)

      // 4. OrbitControls Setup
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.target.set(0, 0.85, 0)
      controls.minDistance = 1.5
      controls.maxDistance = 5.5
      controls.minPolarAngle = Math.PI * 0.15
      controls.maxPolarAngle = Math.PI * 0.85
      controls.enablePan = false
      controlsRef.current = controls

      // 5. Lighting Setup - Cybernetic Multi-Point & Rim Glows
      const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2)
      scene.add(ambientLight)

      const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0)
      dirLight.position.set(3, 5, 4)
      scene.add(dirLight)

      const backCyanLight = new THREE.DirectionalLight(0x0284c7, 2.5)
      backCyanLight.position.set(-3, 3, -3)
      scene.add(backCyanLight)

      const bottomRimLight = new THREE.PointLight(0x38bdf8, 2.2, 6)
      bottomRimLight.position.set(0, -0.4, 1.5)
      scene.add(bottomRimLight)

      // 6. Holographic Cybernetic Bio-Twin Geometry Construction
      const humanGroup = new THREE.Group()
      scene.add(humanGroup)

      // A. High-Tech Translucent Cyber Material
      const cyberMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0f1f2e,
        emissive: 0x0284c7,
        emissiveIntensity: 0.18,
        roughness: 0.25,
        metalness: 0.85,
        transparent: true,
        opacity: 0.82,
        transmission: 0.1,
        reflectivity: 0.6,
        clearcoat: 0.4,
      })
      disposables.push(cyberMaterial)

      // B. Neon Cyber Wireframe Accent Material
      const wireframeAccentMaterial = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
      })
      disposables.push(wireframeAccentMaterial)

      // C. Internal Cardiac Core Material (Dynamic Emissive Heart)
      const heartMaterial = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.4,
      })
      disposables.push(heartMaterial)

      // D. Internal Lung Respiratory Material
      const lungMaterial = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      })
      disposables.push(lungMaterial)

      // Helper function to attach holographic wireframe edges to body parts
      const addMeshWithWireframe = (geo: THREE.BufferGeometry, mat: THREE.Material, parentGroup: THREE.Group) => {
        disposables.push(geo)
        const mesh = new THREE.Mesh(geo, mat)
        parentGroup.add(mesh)

        const wireframeGeo = new THREE.WireframeGeometry(geo)
        disposables.push(wireframeGeo)
        const wireframeLines = new THREE.LineSegments(wireframeGeo, wireframeAccentMaterial)
        mesh.add(wireframeLines)
        return mesh
      }

      // 1) Head & Brain Core (y: 1.68)
      const headGeo = new THREE.SphereGeometry(0.16, 24, 24)
      headGeo.scale(0.9, 1.1, 0.95)
      const headMesh = addMeshWithWireframe(headGeo, cyberMaterial, humanGroup)
      headMesh.position.set(0, 1.68, 0)

      const brainCoreGeo = new THREE.SphereGeometry(0.09, 16, 16)
      disposables.push(brainCoreGeo)
      const brainCoreMesh = new THREE.Mesh(brainCoreGeo, heartMaterial)
      brainCoreMesh.position.set(0, 1.68, 0.02)
      humanGroup.add(brainCoreMesh)

      // 2) Neck (y: 1.52)
      const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16)
      const neckMesh = addMeshWithWireframe(neckGeo, cyberMaterial, humanGroup)
      neckMesh.position.set(0, 1.52, 0)

      // 3) Torso & Chest Cage (y: 1.18)
      const torsoGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.65, 24)
      torsoGeo.scale(1.1, 1.0, 0.7)
      const torsoMesh = addMeshWithWireframe(torsoGeo, cyberMaterial, humanGroup)
      torsoMesh.position.set(0, 1.18, 0)

      // 4) Cardiac Core Node (Heart Organ - Left Upper Chest)
      const heartGeo = new THREE.DodecahedronGeometry(0.075, 2)
      disposables.push(heartGeo)
      const heartMesh = new THREE.Mesh(heartGeo, heartMaterial)
      heartMesh.position.set(0.05, 1.25, 0.08)
      humanGroup.add(heartMesh)

      // Heart Outer Glow Halo Ring
      const haloGeo = new THREE.RingGeometry(0.085, 0.11, 24)
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
      disposables.push(haloGeo, haloMat)
      const haloMesh = new THREE.Mesh(haloGeo, haloMat)
      haloMesh.position.set(0.05, 1.25, 0.1)
      humanGroup.add(haloMesh)

      // 5) Respiratory Organs (Left & Right Lungs)
      const leftLungGeo = new THREE.CapsuleGeometry(0.065, 0.16, 8, 16)
      disposables.push(leftLungGeo)
      const leftLungMesh = new THREE.Mesh(leftLungGeo, lungMaterial)
      leftLungMesh.position.set(-0.09, 1.26, 0.04)
      humanGroup.add(leftLungMesh)

      const rightLungGeo = new THREE.CapsuleGeometry(0.065, 0.16, 8, 16)
      disposables.push(rightLungGeo)
      const rightLungMesh = new THREE.Mesh(rightLungGeo, lungMaterial)
      rightLungMesh.position.set(0.12, 1.26, 0.04)
      humanGroup.add(rightLungMesh)

      // 6) Spine Column
      for (let i = 0; i < 8; i++) {
        const vertebraGeo = new THREE.BoxGeometry(0.05, 0.04, 0.05)
        disposables.push(vertebraGeo)
        const vertebraMesh = new THREE.Mesh(vertebraGeo, cyberMaterial)
        vertebraMesh.position.set(0, 1.42 - i * 0.06, -0.08)
        humanGroup.add(vertebraMesh)
      }

      // 7) Shoulders & Arms
      const leftShoulderGeo = new THREE.SphereGeometry(0.07, 16, 16)
      const leftShoulder = addMeshWithWireframe(leftShoulderGeo, cyberMaterial, humanGroup)
      leftShoulder.position.set(-0.29, 1.42, 0)

      const leftArmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.55, 16)
      const leftArm = addMeshWithWireframe(leftArmGeo, cyberMaterial, humanGroup)
      leftArm.position.set(-0.33, 1.12, 0)
      leftArm.rotation.z = 0.12

      const rightShoulderGeo = new THREE.SphereGeometry(0.07, 16, 16)
      const rightShoulder = addMeshWithWireframe(rightShoulderGeo, cyberMaterial, humanGroup)
      rightShoulder.position.set(0.29, 1.42, 0)

      const rightArmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.55, 16)
      const rightArm = addMeshWithWireframe(rightArmGeo, cyberMaterial, humanGroup)
      rightArm.position.set(0.33, 1.12, 0)
      rightArm.rotation.z = -0.12

      // 8) Pelvis
      const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.18, 16)
      pelvisGeo.scale(1.1, 1.0, 0.8)
      const pelvisMesh = addMeshWithWireframe(pelvisGeo, cyberMaterial, humanGroup)
      pelvisMesh.position.set(0, 0.82, 0)

      // 9) Legs & Feet
      const leftThighGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.42, 16)
      const leftThigh = addMeshWithWireframe(leftThighGeo, cyberMaterial, humanGroup)
      leftThigh.position.set(-0.11, 0.56, 0)

      const leftKneeGeo = new THREE.SphereGeometry(0.055, 16, 16)
      const leftKnee = addMeshWithWireframe(leftKneeGeo, cyberMaterial, humanGroup)
      leftKnee.position.set(-0.11, 0.33, 0.02)

      const leftCalfGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.4, 16)
      const leftCalf = addMeshWithWireframe(leftCalfGeo, cyberMaterial, humanGroup)
      leftCalf.position.set(-0.11, 0.12, 0)

      const rightThighGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.42, 16)
      const rightThigh = addMeshWithWireframe(rightThighGeo, cyberMaterial, humanGroup)
      rightThigh.position.set(0.11, 0.56, 0)

      const rightKneeGeo = new THREE.SphereGeometry(0.055, 16, 16)
      const rightKnee = addMeshWithWireframe(rightKneeGeo, cyberMaterial, humanGroup)
      rightKnee.position.set(0.11, 0.33, 0.02)

      const rightCalfGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.4, 16)
      const rightCalf = addMeshWithWireframe(rightCalfGeo, cyberMaterial, humanGroup)
      rightCalf.position.set(0.11, 0.12, 0)

      const leftFootGeo = new THREE.BoxGeometry(0.08, 0.04, 0.16)
      const leftFoot = addMeshWithWireframe(leftFootGeo, cyberMaterial, humanGroup)
      leftFoot.position.set(-0.11, -0.09, 0.04)

      const rightFootGeo = new THREE.BoxGeometry(0.08, 0.04, 0.16)
      const rightFoot = addMeshWithWireframe(rightFootGeo, cyberMaterial, humanGroup)
      rightFoot.position.set(0.11, -0.09, 0.04)

      // 10) Modernized Base Radar Floor Grid with Concentric Glowing Rings & Sweeping Line
      const radarGroup = new THREE.Group()
      radarGroup.position.set(0, -0.11, 0)
      scene.add(radarGroup)

      const gridHelper = new THREE.PolarGridHelper(0.95, 16, 6, 64, 0x0284c7, 0x1e293b)
      gridHelper.position.set(0, 0, 0)
      radarGroup.add(gridHelper)

      // Outer Glowing Ring
      const outerRingGeo = new THREE.RingGeometry(0.92, 0.96, 64)
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
      disposables.push(outerRingGeo, outerRingMat)
      const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat)
      outerRingMesh.rotation.x = Math.PI / 2
      radarGroup.add(outerRingMesh)

      // Rotating Cybernetic Radar Sweep Line
      const sweepGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.001, 0),
        new THREE.Vector3(0.94, 0.001, 0),
      ])
      const sweepMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
      disposables.push(sweepGeo, sweepMat)
      const sweepLine = new THREE.Line(sweepGeo, sweepMat)
      radarGroup.add(sweepLine)

      // 3D Spatial Anchors for Hotspot Projections
      const headAnchor = new THREE.Vector3(0, 1.68, 0)
      const heartAnchor = new THREE.Vector3(0.05, 1.25, 0.08)
      const lungAnchor = new THREE.Vector3(-0.09, 1.26, 0.04)
      const legAnchor = new THREE.Vector3(-0.11, 0.33, 0.02)

      const projVec = new THREE.Vector3()

      // High-performance direct DOM projection function
      const updateHotspotBadge = (anchor: THREE.Vector3, element: HTMLDivElement | null, offsetY = 0, offsetX = 0) => {
        if (!element) return
        projVec.copy(anchor).applyMatrix4(humanGroup.matrixWorld)
        projVec.project(camera)

        const x = (projVec.x * 0.5 + 0.5) * width + offsetX
        const y = (-(projVec.y * 0.5) + 0.5) * height + offsetY
        const isVisible = projVec.z < 1.0 && x >= -20 && x <= width + 20 && y >= -20 && y <= height + 20

        if (isVisible) {
          element.style.display = 'block'
          element.style.left = `${x}px`
          element.style.top = `${y}px`
        } else {
          element.style.display = 'none'
        }
      }

      setLoading(false)
      const clock = new THREE.Clock()

      // Locked 60 FPS Render Loop reading from liveTelemetryRef
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        const elapsedTime = clock.getElapsedTime()

        controls.update()

        const currentData = liveTelemetryRef.current
        const bpm = currentData.currentBpm || 72
        const currentRisks = currentData.risks

        const isRiskHigh = (currentRisks?.overall ?? 0) > 60 || Boolean(currentRisks?.criticalOverride)
        const isRiskElevated = (currentRisks?.overall ?? 0) > 30 && !isRiskHigh

        // A. Dynamic Heart Pulse & Emissive Color Shift
        const pulseRate = (bpm / 60) * Math.PI * 2
        const heartPulseScale = 1.0 + 0.12 * Math.sin(elapsedTime * pulseRate)
        heartMesh.scale.set(heartPulseScale, heartPulseScale, heartPulseScale)
        haloMesh.scale.set(heartPulseScale * 1.05, heartPulseScale * 1.05, 1)

        // Shift heart emissive color according to live risk level
        if (isRiskHigh) {
          heartMaterial.color.setHex(0xef4444)
          heartMaterial.emissive.setHex(0xdc2626)
        } else if (isRiskElevated) {
          heartMaterial.color.setHex(0xf59e0b)
          heartMaterial.emissive.setHex(0xd97706)
        } else {
          heartMaterial.color.setHex(0x10b981)
          heartMaterial.emissive.setHex(0x059669)
        }
        heartMaterial.emissiveIntensity = 0.6 + Math.sin(elapsedTime * pulseRate) * 0.4

        // B. Idle Respiratory Expansion (Chest & Lungs 4s sine breathing wave)
        const breathFactor = 1.0 + Math.sin(elapsedTime * 1.5) * 0.03
        leftLungMesh.scale.set(breathFactor, breathFactor, breathFactor)
        rightLungMesh.scale.set(breathFactor, breathFactor, breathFactor)
        torsoMesh.scale.set(1.1 * breathFactor, 1.0, 0.7 * breathFactor)

        // C. Base Radar Sweep Line Rotation
        sweepLine.rotation.y = elapsedTime * 1.2

        // D. Gentle Y-Axis Idle Body Sway
        humanGroup.rotation.y = Math.sin(elapsedTime * 0.25) * 0.12

        // E. Update 3D-to-2D Screen Projections directly on DOM refs (Zero React state overhead)
        humanGroup.updateMatrixWorld()
        updateHotspotBadge(headAnchor, headBadgeRef.current)
        updateHotspotBadge(heartAnchor, heartBadgeRef.current)
        updateHotspotBadge(lungAnchor, lungsBadgeRef.current)
        updateHotspotBadge(legAnchor, legsBadgeRef.current)

        renderer.render(scene, camera)
      }

      animate()

      // Handle Container Resizing
      const handleResize = () => {
        if (!container) return
        const newW = container.clientWidth
        const newH = container.clientHeight
        camera.aspect = newW / newH
        camera.updateProjectionMatrix()
        renderer.setSize(newW, newH)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationFrameId)

        // Thorough Geometry, Material & Renderer Cleanup
        disposables.forEach((item) => item.dispose())
        renderer.dispose()
      }
    } catch (err: any) {
      console.error('Three.js 3D Digital Twin Error:', err)
      setError(err?.message || 'Failed to initialize WebGL 3D canvas')
      setLoading(false)
    }
  }, [compact])

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0.95, 3.1)
      controlsRef.current.target.set(0, 0.85, 0)
      controlsRef.current.update()
    }
  }

  if (error) {
    return (
      <div className="p-5 text-center bg-red-950/40 border border-red-500/50 rounded-xl text-white uppercase text-xs">
        <strong>3D Digital Twin WebGL Error</strong>
        <p className="text-amber-400 text-[11px] my-2">{error}</p>
        <button className="demo-toggle" onClick={() => setError(null)}>Retry 3D Initialization</button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: compact ? 330 : 450,
        userSelect: 'none',
        overflow: 'hidden',
        borderRadius: 12,
        background: 'radial-gradient(circle at 50% 40%, #0D1117 0%, #080B10 100%)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-[#080B10]/90 text-white text-xs font-bold z-20">
          <div className="text-center">
            <span className="sync-dot"><span /></span>
            <p className="mt-2 text-cyan-400 font-mono tracking-wider">AERIS DIGITAL TWIN • Loading Holographic Bio-Twin Mesh...</p>
          </div>
        </div>
      )}

      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'rgba(17, 22, 29, 0.85)',
          border: '1px solid var(--border-focus)',
          color: 'var(--text-primary)',
          padding: '5px 12px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 800,
          fontFamily: 'var(--font-mono), monospace',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 15,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(17, 22, 29, 0.85)')}
      >
        RESET VIEW
      </button>

      {/* Futuristic Glassmorphism HUD Callout Badges */}
      {!compact && !loading && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {/* HOTSPOT 1: Head / Temp */}
          <div
            ref={headBadgeRef}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -100%)',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(3, 7, 18, 0.85)',
                border: `1px solid ${isHeadElevated ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: 8,
                padding: '5px 10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: isHeadElevated ? '#ef4444' : '#10b981',
                    opacity: 0.75,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    borderRadius: '50%',
                    width: 8,
                    height: 8,
                    background: isHeadElevated ? '#ef4444' : '#10b981',
                  }}
                />
              </span>
              <div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  Head / Temp
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, color: isHeadElevated ? '#f87171' : '#34d399' }}>
                  {currentTemp.toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>

          {/* HOTSPOT 2: Heart / Pulse */}
          <div
            ref={heartBadgeRef}
            style={{
              position: 'absolute',
              transform: 'translate(12px, -50%)',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(3, 7, 18, 0.85)',
                border: `1px solid ${isChestElevated ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: 8,
                padding: '5px 10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: isChestElevated ? '#ef4444' : '#10b981',
                    opacity: 0.75,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    borderRadius: '50%',
                    width: 8,
                    height: 8,
                    background: isChestElevated ? '#ef4444' : '#10b981',
                  }}
                />
              </span>
              <div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  Heart / Pulse
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, color: isChestElevated ? '#f87171' : '#34d399' }}>
                  {currentBpm} BPM
                </div>
              </div>
            </div>
          </div>

          {/* HOTSPOT 3: Lungs / SpO2 */}
          <div
            ref={lungsBadgeRef}
            style={{
              position: 'absolute',
              transform: 'translate(-100%, -50%)',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(3, 7, 18, 0.85)',
                border: `1px solid ${currentSpo2 < 95 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: 8,
                padding: '5px 10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: currentSpo2 < 95 ? '#f59e0b' : '#10b981',
                    opacity: 0.75,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    borderRadius: '50%',
                    width: 8,
                    height: 8,
                    background: currentSpo2 < 95 ? '#f59e0b' : '#10b981',
                  }}
                />
              </span>
              <div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  Lungs / SpO₂
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, color: currentSpo2 < 95 ? '#fbbf24' : '#34d399' }}>
                  {currentSpo2}%
                </div>
              </div>
            </div>
          </div>

          {/* HOTSPOT 4: Legs / Mobility */}
          <div
            ref={legsBadgeRef}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, 10px)',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(3, 7, 18, 0.85)',
                border: `1px solid ${isLegsElevated ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.4)'}`,
                borderRadius: 8,
                padding: '5px 10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: isLegsElevated ? '#f59e0b' : '#38bdf8',
                    opacity: 0.75,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    borderRadius: '50%',
                    width: 8,
                    height: 8,
                    background: isLegsElevated ? '#f59e0b' : '#38bdf8',
                  }}
                />
              </span>
              <div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  Legs / Mobility
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, color: isLegsElevated ? '#fbbf24' : '#38bdf8' }}>
                  {mobilityStatus}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
