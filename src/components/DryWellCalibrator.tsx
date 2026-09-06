import { useRef, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface DryWellCalibratorProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  modelName?: string
  subTitle?: string
  minTemp: number
  maxTemp: number
  targetTemp: number
  setTargetTemp: React.Dispatch<React.SetStateAction<number>>
  currentTemp: number
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>
}

export default function DryWellCalibrator({
  position,
  rotation = [0, 0, 0],
  modelName = 'mchtkrkmz MK-9142',
  subTitle = 'METROLOGY TEMPERATURE CALIBRATOR',
  minTemp = -50,
  maxTemp = 200,
  targetTemp,
  setTargetTemp,
  currentTemp,
  setCurrentTemp
}: DryWellCalibratorProps) {
  const wellLightRef = useRef<THREE.PointLight>(null)

  // Smooth realistic thermodynamic heating/cooling simulation
  useFrame((_, delta) => {
    const diff = Math.abs(targetTemp - currentTemp)
    if (diff > 0.005) {
      const isHeating = targetTemp > currentTemp
      // Non-linear realistic response: faster when far, gentle asymptotic approach when close
      const rate = Math.max(12.0, Math.min(65.0, diff * 1.5))
      const step = rate * delta
      const direction = isHeating ? 1 : -1
      setCurrentTemp(t => {
        const next = t + direction * Math.min(diff, step)
        return Math.min(maxTemp, Math.max(minTemp, Math.round(next * 100) / 100))
      })
    }
  })

  // Stability calculation
  const diff = Math.abs(targetTemp - currentTemp)
  const isStable = diff < 0.05
  const isHeating = targetTemp > currentTemp && !isStable

  // Incandescence glow for high temperature (> 250°C)
  const glow = useMemo(() => {
    if (currentTemp < 250) {
      return { color: '#000000', intensity: 0, emissive: 0 }
    }
    if (currentTemp < 500) {
      const n = (currentTemp - 250) / 250
      return { color: '#ff2200', intensity: 0.5 * n, emissive: 1.0 * n }
    }
    if (currentTemp < 800) {
      const n = (currentTemp - 500) / 300
      return { color: '#ff6600', intensity: 0.5 + 1.2 * n, emissive: 1.0 + 1.5 * n }
    }
    const n = Math.min(1, (currentTemp - 800) / 400)
    return { color: '#ffcc33', intensity: 1.7 + 1.5 * n, emissive: 2.5 + 2.0 * n }
  }, [currentTemp])

  // Brushed stainless steel materials
  const stainlessSteelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d6d8db',
        metalness: 0.88,
        roughness: 0.28
      }),
    []
  )

  const darkMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a2d32',
        metalness: 0.8,
        roughness: 0.4
      }),
    []
  )

  return (
    <group position={position} rotation={rotation} userData={{ currentTemp, isCalibrator: true, modelName }}>
      {/* ===== Main Tower Body ===== */}
      <mesh position={[0, 0.17, 0]} receiveShadow castShadow material={stainlessSteelMaterial}>
        <boxGeometry args={[0.26, 0.34, 0.36]} />
      </mesh>

      {/* mchtkrkmz Brand text stamped on side panels */}
      <Text
        position={[-0.131, 0.22, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.024}
        color="#1f2429"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        mchtkrkmz
      </Text>
      <Text
        position={[0.131, 0.22, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.024}
        color="#1f2429"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        mchtkrkmz
      </Text>

      {/* ===== Top Well Insert Block & Probe Test Wells ===== */}
      <group position={[0, 0.34, -0.05]}>
        {/* Raised well collar rim */}
        <mesh position={[0, 0.015, 0]} receiveShadow castShadow material={darkMetalMaterial}>
          <boxGeometry args={[0.16, 0.03, 0.16]} />
        </mesh>
        {/* Well metal insert plate */}
        <mesh position={[0, 0.031, 0]} receiveShadow castShadow material={stainlessSteelMaterial}>
          <boxGeometry args={[0.14, 0.005, 0.14]} />
        </mesh>

        {/* Central calibration well test holes (various probe diameters) */}
        <mesh
          position={[0, 0.033, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ currentTemp, isWellCore: true }}
        >
          <circleGeometry args={[0.018, 24]} />
          <meshStandardMaterial
            color={glow.intensity > 0 ? glow.color : '#111111'}
            emissive={glow.color}
            emissiveIntensity={glow.emissive}
            roughness={0.4}
          />
        </mesh>

        {/* Secondary probe insertion holes around center */}
        {[
          [-0.035, -0.035, 0.01],
          [0.035, -0.035, 0.008],
          [-0.035, 0.035, 0.006],
          [0.035, 0.035, 0.012],
          [0, -0.045, 0.005]
        ].map(([hx, hz, rad], i) => (
          <mesh key={`probe-hole-${i}`} position={[hx, 0.033, hz]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[rad, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
          </mesh>
        ))}

        {/* Thermal radiation point light when hot */}
        {glow.intensity > 0 && (
          <pointLight
            ref={wellLightRef}
            position={[0, 0.08, 0]}
            color={glow.color}
            intensity={glow.intensity}
            distance={1.8}
          />
        )}
      </group>

      {/* ===== Heavy Duty Top Stainless Steel Carry Handle ===== */}
      <group position={[0, 0.37, 0.05]}>
        <mesh position={[-0.10, -0.01, 0]} material={stainlessSteelMaterial}>
          <cylinderGeometry args={[0.007, 0.007, 0.05, 16]} />
        </mesh>
        <mesh position={[0.10, -0.01, 0]} material={stainlessSteelMaterial}>
          <cylinderGeometry args={[0.007, 0.007, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0.015, 0]} rotation={[0, 0, Math.PI / 2]} material={stainlessSteelMaterial}>
          <cylinderGeometry args={[0.01, 0.01, 0.22, 16]} />
        </mesh>
      </group>

      {/* Top Bezel Trim */}
      <mesh position={[0, 0.335, 0.15]} material={stainlessSteelMaterial}>
        <boxGeometry args={[0.25, 0.02, 0.06]} />
      </mesh>

      {/* ==================================================================== */}
      {/* ===== LARGE PROMINENT FRONT DIGITAL LCD SCREEN (USER MARKED AREA) ===== */}
      {/* ==================================================================== */}
      <group position={[0, 0.23, 0.181]}>
        {/* Screen Outer Metallic Bezel */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.23, 0.135]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Screen Inner Display Frame */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.222, 0.127]} />
          <meshBasicMaterial color="#0b1329" />
        </mesh>

        {/* Top Header: Brand "mchtkrkmz" & Model */}
        <mesh position={[0, 0.05, 0.002]}>
          <planeGeometry args={[0.222, 0.018]} />
          <meshBasicMaterial color="#1e3a8a" />
        </mesh>
        {/* Brand Yellow Tag */}
        <mesh position={[-0.078, 0.05, 0.003]}>
          <planeGeometry args={[0.046, 0.012]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <Text
          position={[-0.078, 0.05, 0.004]}
          fontSize={0.0065}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          mchtkrkmz
        </Text>
        <Text
          position={[-0.048, 0.05, 0.004]}
          fontSize={0.0065}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {modelName}
        </Text>
        {subTitle && (
          <Text
            position={[0.102, 0.05, 0.004]}
            fontSize={0.0045}
            color="#93c5fd"
            anchorX="right"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {subTitle}
          </Text>
        )}

        {/* --- ACTUAL / ANLIK CURRENT TEMPERATURE READOUT (LARGE BOLD) --- */}
        <Text
          position={[-0.098, 0.028, 0.003]}
          fontSize={0.0055}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          GERÇEK / ACTUAL TEMP:
        </Text>
        <Text
          position={[0, 0.01, 0.003]}
          fontSize={0.024}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {currentTemp >= 0 ? `+${currentTemp.toFixed(2)}` : currentTemp.toFixed(2)} °C
        </Text>

        {/* Divider bar */}
        <mesh position={[0, -0.006, 0.002]}>
          <planeGeometry args={[0.21, 0.0015]} />
          <meshBasicMaterial color="#334155" />
        </mesh>

        {/* --- SET / HEDEF TARGET TEMPERATURE READOUT --- */}
        <group position={[-0.052, -0.019, 0.003]}>
          <Text
            position={[-0.045, 0, 0]}
            fontSize={0.006}
            color="#94a3b8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            HEDEF / SET:
          </Text>
          <Text
            position={[0.045, 0, 0]}
            fontSize={0.009}
            color="#facc15"
            anchorX="right"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {targetTemp.toFixed(2)} °C
          </Text>
        </group>

        {/* Status Indicator Badge */}
        <Text
          position={[0.055, -0.019, 0.003]}
          fontSize={0.0065}
          color={isStable ? '#4ade80' : isHeating ? '#fb923c' : '#38bdf8'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {isStable ? '● KARARLI' : isHeating ? '▲ ISINIYOR' : '▼ SOĞUYOR'}
        </Text>

        {/* --- Interactive VR / Desktop Quick Buttons Directly on Front Screen --- */}
        <group position={[0, -0.044, 0.003]}>
          {[
            { label: '-10', delta: -10, x: -0.075 },
            { label: '-1', delta: -1, x: -0.025 },
            { label: '+1', delta: 1, x: 0.025 },
            { label: '+10', delta: 10, x: 0.075 }
          ].map((btn, idx) => (
            <group
              key={`front-btn-${idx}`}
              position={[btn.x, 0, 0]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation()
                setTargetTemp(t =>
                  Math.min(maxTemp, Math.max(minTemp, Math.round((t + btn.delta) * 10) / 10))
                )
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <mesh>
                <boxGeometry args={[0.042, 0.016, 0.004]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <Text
                position={[0, 0, 0.003]}
                fontSize={0.007}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                {btn.label}
              </Text>
            </group>
          ))}
        </group>
      </group>

      {/* ===== Lower Front Panel with Air Vents & Test Terminals ===== */}
      <group position={[0, 0.08, 0.181]}>
        {/* Dark Recessed Panel */}
        <mesh>
          <planeGeometry args={[0.22, 0.11]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Vertical Cooling Air Gills / Ventilation Slots */}
        <group position={[0, 0.025, 0.001]}>
          {Array.from({ length: 14 }).map((_, idx) => (
            <mesh key={`vent-${idx}`} position={[-0.08 + idx * 0.012, 0, 0]}>
              <planeGeometry args={[0.004, 0.03]} />
              <meshBasicMaterial color="#0b0f19" />
            </mesh>
          ))}
        </group>

        {/* Lower Terminal Block: Reference Probe Binding Posts */}
        <group position={[0, -0.028, 0.004]}>
          {/* Terminal Plate */}
          <mesh>
            <planeGeometry args={[0.18, 0.038]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>

          {/* Reference PRT / TC Label */}
          <Text
            position={[-0.075, 0.011, 0.002]}
            fontSize={0.0048}
            color="#cbd5e1"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            REF INPUT (mchtkrkmz PRT)
          </Text>

          {/* 4 Banana Plug Terminals: 2 Red, 2 Black */}
          {[-0.045, -0.015, 0.015, 0.045].map((tx, idx) => (
            <group key={`term-${idx}`} position={[tx, -0.004, 0.005]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.0035, 0.0035, 0.007, 16]} />
                <meshStandardMaterial
                  color={idx < 2 ? '#ef4444' : '#1e293b'}
                  metalness={0.4}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
