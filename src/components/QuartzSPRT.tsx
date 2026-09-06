import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface QuartzSPRTProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  label?: string // e.g. "SPRT-In", "SPRT-Sn", etc.
  sheathLength?: number // default 0.48m
}

/**
 * High-Precision Quartz-Sheath Standard Platinum Resistance Thermometer (SPRT)
 * Modeled after the Hart Scientific / Fluke Calibration 5681 Quartz SPRT.
 * Features:
 * - Transparent fused quartz glass sheath with internal platinum sensor coil at tip.
 * - Black ribbed rubber/aluminum handle with laser engraved model markings.
 * - Strain-relief cable boot and exit at top.
 */
export default function QuartzSPRT({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  label = 'MK-1994 SPRT',
  sheathLength = 0.46
}: QuartzSPRTProps) {
  // Translucent quartz glass material
  const quartzMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f8fafc',
        metalness: 0.05,
        roughness: 0.1,
        transmission: 0.85,
        thickness: 0.008,
        transparent: true,
        opacity: 0.82
      }),
    []
  )

  // Platinum wire coil material
  const platinumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.95,
        roughness: 0.15
      }),
    []
  )

  // Ribbed black handle material
  const handleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.2,
        roughness: 0.6
      }),
    []
  )

  // Stainless metal fittings
  const metalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.85,
        roughness: 0.25
      }),
    []
  )

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* ==================================================================== */}
      {/* 1. LOWER QUARTZ SHEATH INSERTED INTO FURNACE WELL                    */}
      {/* ==================================================================== */}
      <group position={[0, -sheathLength / 2, 0]}>
        {/* Main Fused Quartz Sheath Tube (OD: 7.2mm, length: sheathLength) */}
        <mesh material={quartzMaterial}>
          <cylinderGeometry args={[0.0036, 0.0036, sheathLength, 24]} />
        </mesh>

        {/* Sealed Hemispherical Quartz Bottom Tip */}
        <mesh position={[0, -sheathLength / 2, 0]} material={quartzMaterial}>
          <sphereGeometry args={[0.0036, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Delicate Platinum Sensor Coil inside bottom 35mm */}
        <group position={[0, -sheathLength / 2 + 0.02, 0]}>
          {/* Inner silica cross-separator */}
          <mesh material={quartzMaterial}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.035, 12]} />
          </mesh>
          {/* Platinum coil wire rings */}
          {[-0.014, -0.007, 0, 0.007, 0.014].map((cy, cIdx) => (
            <mesh key={`coil-${cIdx}`} position={[0, cy, 0]} material={platinumMaterial}>
              <torusGeometry args={[0.0024, 0.0004, 6, 16]} />
            </mesh>
          ))}
          {/* 4 Fine internal lead wires running up */}
          {[
            [-0.0012, -0.0012],
            [0.0012, -0.0012],
            [-0.0012, 0.0012],
            [0.0012, 0.0012]
          ].map(([wx, wz], wIdx) => (
            <mesh key={`wire-${wIdx}`} position={[wx, 0.05, wz]} material={platinumMaterial}>
              <cylinderGeometry args={[0.0003, 0.0003, 0.07, 6]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 2. LOWER METAL SHEATH COLLAR / TRANSITION BUSHING                    */}
      {/* ==================================================================== */}
      <mesh position={[0, 0.004, 0]} material={metalMaterial}>
        <cylinderGeometry args={[0.0055, 0.004, 0.01, 20]} />
      </mesh>

      {/* ==================================================================== */}
      {/* 3. ERGONOMIC RIBBED BLACK HANDLE (Exactly as in the reference photo) */}
      {/* ==================================================================== */}
      <group position={[0, 0.045, 0]}>
        {/* Main Handle Cylinder (OD: 20mm, Height: 70mm) */}
        <mesh material={handleMaterial} castShadow>
          <cylinderGeometry args={[0.010, 0.010, 0.070, 24]} />
        </mesh>

        {/* Lower rounded end cap */}
        <mesh position={[0, -0.035, 0]} material={handleMaterial}>
          <sphereGeometry args={[0.010, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Circumferential Grip Ribs */}
        {[-0.024, -0.016, -0.008, 0.008, 0.016, 0.024].map((ry, rIdx) => (
          <mesh key={`rib-${rIdx}`} position={[0, ry, 0]} material={handleMaterial}>
            <torusGeometry args={[0.0105, 0.0012, 8, 24]} />
          </mesh>
        ))}

        {/* Laser-Engraved Markings on Handle */}
        <group position={[0, 0, 0.0106]}>
          <Text
            position={[0, 0.008, 0]}
            fontSize={0.0036}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            mchtkrkmz
          </Text>
          <Text
            position={[0, 0, 0]}
            fontSize={0.0032}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {label}
          </Text>
          <Text
            position={[0, -0.008, 0]}
            fontSize={0.0028}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            Pt25 Ro=25.5Ω ITS-90
          </Text>
        </group>

        {/* Upper Tapered Shoulder */}
        <mesh position={[0, 0.037, 0]} material={handleMaterial}>
          <cylinderGeometry args={[0.006, 0.010, 0.008, 20]} />
        </mesh>
      </group>

      {/* ==================================================================== */}
      {/* 4. FLEXIBLE RUBBER STRAIN-RELIEF CABLE BOOT AT TOP                  */}
      {/* ==================================================================== */}
      <group position={[0, 0.095, 0]}>
        {/* Rubber Boot Sleeving */}
        <mesh material={handleMaterial}>
          <cylinderGeometry args={[0.004, 0.0055, 0.025, 16]} />
        </mesh>
        {/* Cable Output Stub */}
        <mesh position={[0, 0.018, 0]}>
          <cylinderGeometry args={[0.0025, 0.0025, 0.015, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
