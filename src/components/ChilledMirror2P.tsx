import { useState, memo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export interface ChilledMirror2PProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  currentDewPoint: number
  currentRH: number
  chamberTemp: number
}

function ChilledMirror2P({
  position = [-3.95, 0.0, 4.40],
  rotation = [0, Math.PI / 2 - 0.25, 0],
  currentDewPoint,
  currentRH,
  chamberTemp,
}: ChilledMirror2PProps) {
  const [powerOn, setPowerOn] = useState(true)
  const [opticsTestActive, setOpticsTestActive] = useState(false)
  const [heatedLineActive, setHeatedLineActive] = useState(true)

  // Subtle noise for optical mirror reflectance & real reading
  const displayTd = powerOn ? currentDewPoint.toFixed(2) : '--.--'
  const displayTemp = powerOn ? chamberTemp.toFixed(2) : '--.--'
  const displayRH = powerOn ? currentRH.toFixed(1) : '--.-'

  // Heated sampling tube from mirror rear into Thunder 2900 side test port
  // Mirror instrument sits at y ~ 0.90 on top of the mobile stand
  const tubeGeometry = (() => {
    const p1 = new THREE.Vector3(0.14, 0.98, -0.15) // Mirror rear gas inlet
    const p2 = new THREE.Vector3(0.14, 1.15, -0.35) // Arches up towards 2900
    const p3 = new THREE.Vector3(0.10, 1.22, -0.65) // Enters side port of 2900
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3])
    return new THREE.TubeGeometry(curve, 32, 0.007, 10, false)
  })()

  return (
    <group position={position} rotation={rotation}>
      {/* ========================================================
          1. DEDICATED METROLOGY INSTRUMENT STAND / SIDE TABLE
         ======================================================== */}
      {/* Stand Base & 4 Swivel Rubber Feet */}
      {[
        [-0.24, -0.22],
        [0.24, -0.22],
        [-0.24, 0.22],
        [0.24, 0.22],
      ].map(([sx, sz], i) => (
        <group key={`stand-foot-${i}`} position={[sx, 0.03, sz]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.02, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Stand Tubular Legs (Anthracite steel) */}
      {[
        [-0.22, -0.20],
        [0.22, -0.20],
        [-0.22, 0.20],
        [0.22, 0.20],
      ].map(([lx, lz], i) => (
        <mesh key={`leg-${i}`} position={[lx, 0.44, lz]}>
          <cylinderGeometry args={[0.018, 0.018, 0.80, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Lower Storage Shelf */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.52, 0.02, 0.46]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Top Work Surface (Height y=0.85) */}
      <mesh position={[0, 0.84, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.035, 0.50]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Antistatic ESD Workstation Pad (Teal Blue) */}
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[0.52, 0.005, 0.46]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Stand Front Nameplate Badge */}
      <mesh position={[0, 0.82, 0.251]}>
        <planeGeometry args={[0.42, 0.025]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <Text
        position={[0, 0.82, 0.252]}
        fontSize={0.011}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME 2P REFERANS ÇİY NOKTASI AYNASI
      </Text>

      {/* ========================================================
          2. PRECISION CHILLED MIRROR HYGROMETER (DESKTOP UNIT)
         ======================================================== */}
      <group position={[0, 0.862, 0]}>
        {/* Rubber Feet */}
        {[
          [-0.18, 0.006, -0.14],
          [0.18, 0.006, -0.14],
          [-0.18, 0.006, 0.14],
          [0.18, 0.006, 0.14],
        ].map(([fx, fy, fz], idx) => (
          <mesh key={`mf-${idx}`} position={[fx, fy, fz]}>
            <cylinderGeometry args={[0.012, 0.012, 0.012, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        ))}

        {/* Main Brushed Metal Instrument Enclosure: width=0.42m, height=0.18m, depth=0.34m */}
        <mesh position={[0, 0.10, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.18, 0.34]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Anodized Dark Navy Blue Front Bezel Faceplate */}
        <mesh position={[0, 0.10, 0.171]}>
          <boxGeometry args={[0.43, 0.185, 0.005]} />
          <meshStandardMaterial color="#091829" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Top Header Label on Faceplate */}
        <Text
          position={[-0.19, 0.172, 0.175]}
          fontSize={0.011}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          2P REFERENCE CHILLED MIRROR
        </Text>
        <Text
          position={[0.19, 0.172, 0.175]}
          fontSize={0.009}
          color="#94a3b8"
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          TÜBİTAK UME
        </Text>

        {/* ========================================================
            2A. HIGH-CONTRAST DUAL OLED / VACUUM FLUORESCENT DISPLAY
           ======================================================== */}
        <group position={[-0.06, 0.095, 0.175]}>
          {/* Display Glass Bezel */}
          <mesh>
            <planeGeometry args={[0.26, 0.11]} />
            <meshBasicMaterial color="#020617" />
          </mesh>

          {powerOn ? (
            <group position={[0, 0, 0.002]}>
              {/* PRIMARY VALUE: Measured Dew Point Td */}
              <Text position={[-0.12, 0.038, 0]} fontSize={0.008} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                DEW POINT (Td):
              </Text>
              <Text position={[-0.12, 0.012, 0]} fontSize={0.024} color="#38bdf8" anchorX="left" font="/fonts/arial.ttf">
                {`${displayTd} °C`}
              </Text>

              {/* SECONDARY ROW: Chamber Temp and Calculated %RH */}
              <Text position={[-0.12, -0.018, 0]} fontSize={0.008} color="#64748b" anchorX="left" font="/fonts/arial.ttf">
                CHAMBER T:
              </Text>
              <Text position={[-0.12, -0.035, 0]} fontSize={0.013} color="#4ade80" anchorX="left" font="/fonts/arial.ttf">
                {`${displayTemp} °C`}
              </Text>

              <Text position={[0.02, -0.018, 0]} fontSize={0.008} color="#64748b" anchorX="left" font="/fonts/arial.ttf">
                GENERATED RH:
              </Text>
              <Text position={[0.02, -0.035, 0]} fontSize={0.013} color="#fbbf24" anchorX="left" font="/fonts/arial.ttf">
                {`${displayRH} %`}
              </Text>

              {/* Status Indicator Tag */}
              <Text position={[0.12, 0.040, 0]} fontSize={0.0075} color="#86efac" anchorX="right" font="/fonts/arial.ttf">
                ● DEW LAYER LOCKED
              </Text>
              <Text position={[0.12, 0.025, 0]} fontSize={0.007} color="#cbd5e1" anchorX="right" font="/fonts/arial.ttf">
                REFLECTANCE: 99.7%
              </Text>
            </group>
          ) : (
            <Text position={[0, 0, 0.002]} fontSize={0.014} color="#475569" anchorX="center" font="/fonts/arial.ttf">
              CİHAZ KAPALI
            </Text>
          )}
        </group>

        {/* ========================================================
            2B. CONTROL BUTTONS & OPTICAL DIAGNOSTICS (RIGHT PANEL)
           ======================================================== */}
        <group position={[0.13, 0.095, 0.175]}>
          {/* Optics Test Button */}
          <group
            position={[0, 0.030, 0]}
            onClick={(e) => {
              e.stopPropagation()
              setOpticsTestActive((prev) => !prev)
            }}
          >
            <mesh>
              <planeGeometry args={[0.09, 0.028]} />
              <meshBasicMaterial color={opticsTestActive ? '#0284c7' : '#1e293b'} />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.0075} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
              OPT TEST
            </Text>
          </group>

          {/* Heated Sampling Line Toggle */}
          <group
            position={[0, -0.008, 0]}
            onClick={(e) => {
              e.stopPropagation()
              setHeatedLineActive((prev) => !prev)
            }}
          >
            <mesh>
              <planeGeometry args={[0.09, 0.026]} />
              <meshBasicMaterial color={heatedLineActive ? '#047857' : '#334155'} />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
              {heatedLineActive ? 'LINE: 45°C' : 'LINE: OFF'}
            </Text>
          </group>

          {/* Power Toggle Button */}
          <group
            position={[0, -0.042, 0]}
            onClick={(e) => {
              e.stopPropagation()
              setPowerOn((prev) => !prev)
            }}
          >
            <mesh>
              <planeGeometry args={[0.09, 0.026]} />
              <meshBasicMaterial color={powerOn ? '#059669' : '#b91c1c'} />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.008} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
              {powerOn ? 'PWR ON' : 'STANDBY'}
            </Text>
          </group>
        </group>

        {/* Front Carrying Handles (Aluminum) */}
        {[-0.20, 0.20].map((hx, idx) => (
          <group key={`ch-${idx}`} position={[hx, 0.10, 0.185]}>
            <mesh rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.12, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Rear Swagelok Gas Sampling Inlet */}
        <mesh position={[0.14, 0.10, -0.175]} rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.025, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>
      </group>

      {/* ========================================================
          3. HEATED GAS SAMPLING TUBE (CONNECTING MIRROR TO 2900)
         ======================================================== */}
      <mesh geometry={tubeGeometry} castShadow>
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  )
}

export default memo(ChilledMirror2P)
