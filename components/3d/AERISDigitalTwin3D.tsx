'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import type { RiskScores } from '@/types/aeris'

export type ZoneLevel = 'normal' | 'monitor' | 'critical'

export interface BodyZone {
  id: 'head' | 'heart' | 'lungs' | 'legs'
  number: number
  reading: string
  where: string
  value: string
  status: string
  level: ZoneLevel
}

/** Turns live readings into plain-language status for each body zone. */
export function computeZones(d: {
  risks: RiskScores
  currentBpm: number
  currentTemp: number
  currentSpo2: number
  baselineHR: number
  baselineTemp: number
  mobilityStatus: string
}): BodyZone[] {
  const tempDelta = d.currentTemp - d.baselineTemp
  const head: ZoneLevel = d.currentTemp >= 38 ? 'critical' : tempDelta > 0.5 || d.risks?.tempAnomaly?.detected ? 'monitor' : 'normal'
  const hrDelta = d.currentBpm - d.baselineHR
  const heart: ZoneLevel = hrDelta > 25 || d.currentBpm < 45 ? 'critical' : hrDelta > 10 ? 'monitor' : 'normal'
  const lungs: ZoneLevel = d.currentSpo2 < 90 ? 'critical' : d.currentSpo2 < 95 ? 'monitor' : 'normal'
  const fall = /fall/i.test(d.mobilityStatus)
  const legs: ZoneLevel = fall ? 'critical' : (d.risks?.contributions?.mobility ?? 0) > 6 ? 'monitor' : 'normal'
  return [
    { id: 'head', number: 1, reading: 'Temperature', where: 'Head', value: `${d.currentTemp.toFixed(1)}°C`, level: head, status: head === 'normal' ? 'Normal' : head === 'critical' ? 'Fever' : 'Above normal' },
    { id: 'heart', number: 2, reading: 'Heart rate', where: 'Chest', value: `${d.currentBpm} BPM`, level: heart, status: heart === 'normal' ? 'Normal' : d.currentBpm < 45 ? 'Very low' : heart === 'critical' ? 'Very high' : 'Above normal' },
    { id: 'lungs', number: 3, reading: 'Blood oxygen', where: 'Lungs', value: `${d.currentSpo2}%`, level: lungs, status: lungs === 'normal' ? 'Normal' : lungs === 'critical' ? 'Very low' : 'Low' },
    { id: 'legs', number: 4, reading: 'Movement', where: 'Legs', value: fall ? 'Fall' : d.mobilityStatus, level: legs, status: legs === 'normal' ? 'Normal' : fall ? 'Fall detected' : 'Unsteady' },
  ]
}

const ZONE_HEX: Record<ZoneLevel, number> = { normal: 0x0284c7, monitor: 0xf59e0b, critical: 0xef4444 }
const ZONE_CSS: Record<ZoneLevel, string> = { normal: '#22C55E', monitor: '#F59E0B', critical: '#EF4444' }

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

  // Pins are positioned straight on the DOM each frame (no React re-render)
  const headBadgeRef = useRef<HTMLDivElement>(null)
  const heartBadgeRef = useRef<HTMLDivElement>(null)
  const lungsBadgeRef = useRef<HTMLDivElement>(null)
  const legsBadgeRef = useRef<HTMLDivElement>(null)
  const pinRefs = { head: headBadgeRef, heart: heartBadgeRef, lungs: lungsBadgeRef, legs: legsBadgeRef }

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

  const zones = computeZones({ risks, currentBpm, currentTemp, currentSpo2, baselineHR, baselineTemp, mobilityStatus })

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

    let animationFrameId = 0
    let renderer: THREE.WebGLRenderer
    const disposables: { dispose: () => void }[] = []

    try {
      const width = container.clientWidth || (compact ? 300 : 450)
      const height = container.clientHeight || (compact ? 300 : 450)

      // 1. Scene Setup with Clean Light Environment
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0xf8fafc, 0.04)

      // 2. Camera Setup
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
      camera.position.set(0, 0.95, 3.1)
      cameraRef.current = camera

      // 3. WebGL Renderer Setup with Pixel Ratio Capping & High Performance
      const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
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

      // Separate materials per zone: the area with a problem glows amber/red.
      const headMat = cyberMaterial.clone()
      const chestMat = cyberMaterial.clone()
      const legsMat = cyberMaterial.clone()
      disposables.push(headMat, chestMat, legsMat)

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
      const headMesh = addMeshWithWireframe(headGeo, headMat, humanGroup)
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
      const torsoMesh = addMeshWithWireframe(torsoGeo, chestMat, humanGroup)
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
      const leftThigh = addMeshWithWireframe(leftThighGeo, legsMat, humanGroup)
      leftThigh.position.set(-0.11, 0.56, 0)

      const leftKneeGeo = new THREE.SphereGeometry(0.055, 16, 16)
      const leftKnee = addMeshWithWireframe(leftKneeGeo, legsMat, humanGroup)
      leftKnee.position.set(-0.11, 0.33, 0.02)

      const leftCalfGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.4, 16)
      const leftCalf = addMeshWithWireframe(leftCalfGeo, legsMat, humanGroup)
      leftCalf.position.set(-0.11, 0.12, 0)

      const rightThighGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.42, 16)
      const rightThigh = addMeshWithWireframe(rightThighGeo, legsMat, humanGroup)
      rightThigh.position.set(0.11, 0.56, 0)

      const rightKneeGeo = new THREE.SphereGeometry(0.055, 16, 16)
      const rightKnee = addMeshWithWireframe(rightKneeGeo, legsMat, humanGroup)
      rightKnee.position.set(0.11, 0.33, 0.02)

      const rightCalfGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.4, 16)
      const rightCalf = addMeshWithWireframe(rightCalfGeo, legsMat, humanGroup)
      rightCalf.position.set(0.11, 0.12, 0)

      const leftFootGeo = new THREE.BoxGeometry(0.08, 0.04, 0.16)
      const leftFoot = addMeshWithWireframe(leftFootGeo, legsMat, humanGroup)
      leftFoot.position.set(-0.11, -0.09, 0.04)

      const rightFootGeo = new THREE.BoxGeometry(0.08, 0.04, 0.16)
      const rightFoot = addMeshWithWireframe(rightFootGeo, legsMat, humanGroup)
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
      sweepLine.visible = false
      radarGroup.add(sweepLine)

      // 3D Spatial Anchors for Hotspot Projections
      const headAnchor = new THREE.Vector3(0, 1.68, 0)
      const heartAnchor = new THREE.Vector3(0.09, 1.2, 0.1)
      const lungAnchor = new THREE.Vector3(-0.15, 1.32, 0.06)
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

      let composer: EffectComposer | null = null
      const canBloom = !isMobile && window.devicePixelRatio <= 2 && (navigator.hardwareConcurrency ?? 0) >= 8
      if (canBloom) {
        // Bloom needs an opaque frame; use the stage colour so the edges stay seamless.
        scene.background = new THREE.Color(0x07090d)
        composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.6, 0.4, 0.85))
        composer.addPass(new OutputPass())
        disposables.push(composer)
      }

      // Adaptive quality: if frames stay slower than ~45fps for 3 seconds,
      // drop to 30fps and switch bloom off.
      let slowSince = 0
      let lowQuality = false
      let lastFrameAt = performance.now()
      let skipNext = false

      setLoading(false)
      const clock = new THREE.Clock()
      const tierColors = { safe: new THREE.Color(0x22c55e), monitor: new THREE.Color(0xf59e0b), critical: new THREE.Color(0xef4444) }
      let smoothedBpm = liveTelemetryRef.current.currentBpm || 72
      let beatPhase = 0
      const entryStart = performance.now()

      // Render loop reading from liveTelemetryRef. Paused when off-screen or the tab is hidden.
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        const now = performance.now()
        const frameMs = now - lastFrameAt
        lastFrameAt = now
        if (!lowQuality) {
          if (frameMs > 22) {
            slowSince ||= now
            if (now - slowSince > 3000) {
              lowQuality = true
              if (composer) {
                composer.dispose()
                composer = null
                scene.background = null
              }
            }
          } else {
            slowSince = 0
          }
        } else {
          // 30fps: render every other frame
          skipNext = !skipNext
          if (skipNext) return
        }
        const dt = Math.min(clock.getDelta(), 0.1)
        const elapsedTime = clock.elapsedTime

        // Entry: camera dollies in and settles over 1.2s (easeOutExpo)
        const entryT = Math.min(1, (performance.now() - entryStart) / 1200)
        if (!reduceMotion && entryT < 1) {
          const k = 1 - Math.pow(2, -10 * entryT)
          camera.position.z = 4.2 + (3.1 - 4.2) * k
        }

        controls.update()

        const currentData = liveTelemetryRef.current
        const bpm = currentData.currentBpm || 72
        const currentRisks = currentData.risks

        const isRiskHigh = (currentRisks?.overall ?? 0) > 60 || Boolean(currentRisks?.criticalOverride)
        const isRiskElevated = (currentRisks?.overall ?? 0) > 30 && !isRiskHigh
        const tierColor = isRiskHigh ? tierColors.critical : isRiskElevated ? tierColors.monitor : tierColors.safe

        // Rim light drifts to the tier colour (frame-rate independent)
        const lerpK = 1 - Math.pow(0.001, dt / 0.8)
        bottomRimLight.color.lerp(tierColor, lerpK)
        backCyanLight.color.lerp(tierColor, lerpK * 0.5)

        // A. Heartbeat at the real BPM: a short systole spike once per beat.
        // BPM changes are smoothed over ~2s so the rhythm never jumps.
        smoothedBpm += (bpm - smoothedBpm) * Math.min(1, dt / 2)
        beatPhase = (beatPhase + dt / (60 / Math.max(30, smoothedBpm))) % 1
        const pulse = reduceMotion ? 0 : beatPhase < 0.15 ? Math.sin((beatPhase / 0.15) * Math.PI) : 0
        const heartPulseScale = 1 + pulse * 0.08
        heartMesh.scale.setScalar(heartPulseScale)
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
        heartMaterial.emissiveIntensity = 0.4 + pulse * 1.2

        // B. Idle Respiratory Expansion (Chest & Lungs 4s sine breathing wave)
        const breathFactor = reduceMotion ? 1 : 1.0 + Math.sin(elapsedTime * 1.5) * 0.03
        leftLungMesh.scale.set(breathFactor, breathFactor, breathFactor)
        rightLungMesh.scale.set(breathFactor, breathFactor, breathFactor)
        torsoMesh.scale.set(1.1 * breathFactor, 1.0, 0.7 * breathFactor)

        // C. Base Radar Sweep Line Rotation
        // Zone colours: calm blue when normal, amber/red where a reading is off.
        // Critical zones breathe slowly (0.5Hz) so they read as "look here".
        const zones = computeZones(currentData)
        const zoneLevel = (id: BodyZone['id']) => zones.find((z) => z.id === id)!.level
        const paint = (mat: THREE.MeshPhysicalMaterial, level: ZoneLevel) => {
          mat.emissive.lerp(new THREE.Color(ZONE_HEX[level]), lerpK)
          const breathe = level === 'critical' && !reduceMotion ? 0.25 + 0.2 * Math.sin(elapsedTime * Math.PI) : 0
          mat.emissiveIntensity = level === 'normal' ? 0.18 : 0.55 + breathe
        }
        paint(headMat, zoneLevel('head'))
        const chestLevel = [zoneLevel('heart'), zoneLevel('lungs')].includes('critical') ? 'critical' : [zoneLevel('heart'), zoneLevel('lungs')].includes('monitor') ? 'monitor' : 'normal'
        paint(chestMat, chestLevel)
        paint(legsMat, zoneLevel('legs'))

        // D. Gentle Y-Axis Idle Body Sway
        // ±4° idle sway at 0.05Hz
        if (!reduceMotion) humanGroup.rotation.y = Math.sin(elapsedTime * Math.PI * 2 * 0.05) * 0.07

        // E. Update 3D-to-2D Screen Projections directly on DOM refs (Zero React state overhead)
        humanGroup.updateMatrixWorld()
        updateHotspotBadge(headAnchor, headBadgeRef.current)
        updateHotspotBadge(heartAnchor, heartBadgeRef.current)
        updateHotspotBadge(lungAnchor, lungsBadgeRef.current)
        updateHotspotBadge(legAnchor, legsBadgeRef.current)

        if (composer) composer.render()
        else renderer.render(scene, camera)
      }

      // Run only while visible on screen and the tab is in the foreground
      let onScreen = true
      const start = () => {
        if (animationFrameId) return
        clock.getDelta()
        animate()
      }
      const stop = () => {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = 0
      }
      const sync = () => (onScreen && document.visibilityState === 'visible' ? start() : stop())
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      }, { threshold: 0.05 })
      visibilityObserver.observe(container)
      document.addEventListener('visibilitychange', sync)
      start()

      // Handle Container Resizing
      const handleResize = () => {
        if (!container) return
        const newW = container.clientWidth
        const newH = container.clientHeight
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH
          camera.updateProjectionMatrix()
          renderer.setSize(newW, newH)
          composer?.setSize(newW, newH)
        }
      }

      window.addEventListener('resize', handleResize)
      let resizeObserver: ResizeObserver | null = null
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => handleResize())
        resizeObserver.observe(container)
      }

      return () => {
        window.removeEventListener('resize', handleResize)
        if (resizeObserver) resizeObserver.disconnect()
        visibilityObserver.disconnect()
        document.removeEventListener('visibilitychange', sync)
        stop()
        controls.dispose()

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
    <>
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: compact ? 260 : '100%',
        minHeight: compact ? 260 : 340,
        maxHeight: compact ? 280 : 400,
        userSelect: 'none',
        overflow: 'hidden',
        borderRadius: 12,
        background: 'radial-gradient(circle at 50% 40%, #0D1117 0%, #050608 100%)',
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
            <span className="mx-auto block size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="mt-2 text-white/70">Loading body view…</p>
          </div>
        </div>
      )}

      {/* Reset view */}
      <button
        type="button"
        onClick={handleResetView}
        aria-label="Reset 3D view"
        className="absolute top-3 right-3 z-[15] inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
      >
        <RotateCcw className="size-3.5" aria-hidden /> Reset
      </button>

      {/* Numbered pins on the body (matched to the key below) */}
      {!loading && (
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          {zones.map((z) => (
            <div key={z.id} ref={pinRefs[z.id]} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ display: 'none' }}>
              <span
                className="grid size-6 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                style={{ background: ZONE_CSS[z.level] }}
              >
                {z.number}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Key: what each pin means, in plain words */}
    <ul className="mt-3 grid grid-cols-1 gap-1.5" aria-label="Body readings">
      {zones.map((z) => (
        <li key={z.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: ZONE_CSS[z.level] }} aria-hidden>
            {z.number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-fg">
              {z.reading} <span className="font-normal text-fg-muted">· {z.where}</span>
            </span>
            <span className="block truncate font-mono text-xs text-fg-2">{z.value}</span>
          </span>
          <span
            className={
              z.level === 'normal'
                ? 'shrink-0 rounded-full bg-safe-bg px-2 py-0.5 text-[11px] font-semibold text-safe'
                : z.level === 'monitor'
                ? 'shrink-0 rounded-full bg-monitor-bg px-2 py-0.5 text-[11px] font-semibold text-monitor'
                : 'shrink-0 rounded-full bg-critical-bg px-2 py-0.5 text-[11px] font-semibold text-critical'
            }
          >
            {z.level === 'critical' && <TriangleAlert className="mr-0.5 inline size-3" aria-hidden />}
            {z.status}
          </span>
        </li>
      ))}
    </ul>
    {!compact && <p className="mt-2 px-1 pb-1 text-[11px] text-fg-muted">Normal areas stay blue. An area glows amber or red when its reading is outside your usual range.</p>}
    </>
  )
}
