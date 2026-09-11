import { useState, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

export interface FrostPointMirrorProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  currentFrostPoint: number
}

function FrostPointMirror({
  position = [-4.0, 0.92, -0.65],
  rotation = [0, 0.35, 0],
  currentFrostPoint = -50.0,
}: FrostPointMirrorProps) {
  const [powerOn, setPowerOn] = useState(true)
  const [opticalCheck, setOpticalCheck] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  // Simulated mirror measurement with micro-fluctuations
  const [measuredTf, setMeasuredTf] = useState(currentFrostPoint)
  const noiseTimerRef = useRef(0)

  useFrame((state, delta) => {
    if (!powerOn) return
    noiseTimerRef.current += delta
    if (noiseTimerRef.current > 0.4) {
      noiseTimerRef.current = 0
      const noise = (Math.sin(state.clock.getElapsedTime() * 3.7) * 0.015)
      setMeasuredTf(Number((currentFrostPoint + noise).toFixed(3)))
    }
  })

  const isFrost = measuredTf <= 0.0

  return (
    <group position={position} rotation={rotation}>
      {/* ========================================================
          0. DEDICATED ESD METROLOGY WORKSTATION MAT & STATION BADGE
         ======================================================== */}
      {/* ESD Workstation Surface Mat */}
      <mesh position={[0, 0.002, 0.04]} receiveShadow>
        <boxGeometry args={[0.60, 0.004, 0.58]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Blue Antistatic Edge Trim */}
      <mesh position={[0, 0.004, 0.04]}>
        <boxGeometry args={[0.61, 0.002, 0.59]} />
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Station Nameplate on Mat Front */}
      <mesh position={[0, 0.006, 0.31]}>
        <planeGeometry args={[0.54, 0.028]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <Text
        position={[0, 0.007, 0.31]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.013}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME 1P DÜŞÜK NEM / KIRAĞI NOKTASI BİRİNCİL İSTASYONU
      </Text>

      {/* ========================================================
          1. CHASSIS ENCLOSURE (19" RACK-COMPATIBLE DESKTOP INSTRUMENT)
         ======================================================== */}
      {/* Rubber Support Feet */}
      {[
        [-0.14, 0.008, -0.16],
        [0.14, 0.008, -0.16],
        [-0.14, 0.008, 0.16],
        [0.14, 0.008, 0.16],
      ].map(([fx, fy, fz], idx) => (
        <mesh key={`foot-${idx}`} position={[fx, fy, fz]}>
          <cylinderGeometry args={[0.015, 0.015, 0.016, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {/* Main Metal Cabinet: width=0.34m, height=0.16m, depth=0.38m */}
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.16, 0.38]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Anodized Aluminum Front Faceplate */}
      <mesh position={[0, 0.09, 0.191]}>
        <boxGeometry args={[0.35, 0.165, 0.006]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Brand Header Line on Front Panel */}
      <Text
        position={[-0.155, 0.155, 0.195]}
        fontSize={0.011}
        color="#38bdf8"
        anchorX="left"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        G1TD CHILLED MIRROR
      </Text>
      <Text
        position={[0.155, 0.155, 0.195]}
        fontSize={0.0085}
        color="#94a3b8"
        anchorX="right"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME
      </Text>

      {/* Decorative Front Horizontal Divider */}
      <mesh position={[0, 0.142, 0.195]}>
        <planeGeometry args={[0.33, 0.002]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* ========================================================
          2. HIGH-CONTRAST DIGITAL DISPLAY (OLED / TFT SCREEN)
         ======================================================== */}
      <group position={[-0.035, 0.082, 0.195]}>
        {/* Bezel */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.24, 0.105]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {powerOn ? (
          <group position={[0, 0, 0.002]}>
            {/* Top Status Bar */}
            <Text
              position={[-0.11, 0.040, 0]}
              fontSize={0.008}
              color="#94a3b8"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              OPTICAL CONDENSATION DETECTOR
            </Text>
            <Text
              position={[0.11, 0.040, 0]}
              fontSize={0.0085}
              color={isFrost ? '#38bdf8' : '#34d399'}
              anchorX="right"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {isFrost ? '❄ FROST / ICE LAYER' : '💧 DEW LAYER'}
            </Text>

            {/* Main Primary Reading: Frost Point Tf */}
            <Text
              position={[-0.11, 0.018, 0]}
              fontSize={0.008}
              color="#cbd5e1"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              FROST POINT (Tf):
            </Text>
            <Text
              position={[0, 0.002, 0]}
              fontSize={0.026}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {`${measuredTf.toFixed(2)} °C`}
            </Text>

            {/* Mirror PRT Sensor Reading & Optical Reflectance */}
            <mesh position={[0, -0.032, 0]}>
              <planeGeometry args={[0.23, 0.028]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <Text
              position={[-0.105, -0.025, 0.002]}
              fontSize={0.0075}
              color="#94a3b8"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {`Mirror PRT: ${measuredTf.toFixed(2)} °C`}
            </Text>
            <Text
              position={[0.01, -0.025, 0.002]}
              fontSize={0.0075}
              color="#34d399"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {opticalCheck ? 'OPTICAL: CHECKING...' : 'Reflectance: 99.4%'}
            </Text>
            <Text
              position={[-0.105, -0.038, 0.002]}
              fontSize={0.007}
              color="#64748b"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              Sample Flow: 2.0 SLPM | Press: 1.013 bar
            </Text>
          </group>
        ) : (
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.016}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            OFF / STANDBY
          </Text>
        )}
      </group>

      {/* ========================================================
          3. FRONT INTERACTIVE BUTTONS & INDICATOR LEDS
         ======================================================== */}
      <group position={[0.125, 0.082, 0.195]}>
        {/* Status LED 1: ICE / FROST (Cyan) */}
        <mesh position={[0, 0.040, 0]}>
          <circleGeometry args={[0.005, 16]} />
          <meshBasicMaterial color={isFrost && powerOn ? '#38bdf8' : '#1e293b'} />
        </mesh>
        <Text
          position={[0.012, 0.040, 0]}
          fontSize={0.0065}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          ICE
        </Text>

        {/* Status LED 2: COOLING (Blue) */}
        <mesh position={[0, 0.024, 0]}>
          <circleGeometry args={[0.005, 16]} />
          <meshBasicMaterial color={powerOn ? '#2563eb' : '#1e293b'} />
        </mesh>
        <Text
          position={[0.012, 0.024, 0]}
          fontSize={0.0065}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          PELTIER
        </Text>

        {/* Optical Test Button */}
        <group
          position={[0.015, -0.005, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setOpticalCheck(true)
            setTimeout(() => setOpticalCheck(false), 1500)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoveredBtn('opt')
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHoveredBtn(null)
          }}
        >
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.055, 0.018]} />
            <meshBasicMaterial
              color={hoveredBtn === 'opt' ? '#0284c7' : '#1e293b'}
            />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.007}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            OPT TEST
          </Text>
        </group>

        {/* Power ON/OFF Toggle Button */}
        <group
          position={[0.015, -0.035, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setPowerOn((p) => !p)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoveredBtn('pwr')
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHoveredBtn(null)
          }}
        >
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.055, 0.022]} />
            <meshBasicMaterial
              color={
                hoveredBtn === 'pwr'
                  ? '#22c55e'
                  : powerOn
                    ? '#16a34a'
                    : '#dc2626'
              }
            />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.008}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {powerOn ? 'PWR ON' : 'STANDBY'}
          </Text>
        </group>
      </group>

      {/* ========================================================
          4. REAR/SIDE SWAGELOK GAS INLET PORT
         ======================================================== */}
      {/* Swagelok Gas Sampling Inlet on Rear Face */}
      <group position={[-0.08, 0.09, -0.192]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.014, 0.014, 0.016, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <cylinderGeometry args={[0.009, 0.009, 0.015, 16]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Rear RS-232 / IEEE-488 Data Interface Connector */}
      <group position={[0.08, 0.09, -0.192]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, 0.006]}>
          <boxGeometry args={[0.035, 0.015, 0.008]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

export default memo(FrostPointMirror)
