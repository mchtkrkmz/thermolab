import { useState, useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface ResistanceBridgeProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  ch1Temp: number // SPRT 1 in Dry-Well 1
  ch2Temp: number // PRT 1 in Dry-Well 1
  ch3Temp: number // SPRT 2 in Dry-Well 2
  ch4Temp: number // PRT 2 in Dry-Well 2
}

function ResistanceBridge({
  position,
  rotation = [0, 0, 0],
  ch1Temp,
  ch2Temp,
  ch3Temp,
  ch4Temp
}: ResistanceBridgeProps) {
  const [activeChannel, setActiveChannel] = useState<1 | 2 | 3 | 4>(1)


  // Materials
  const chassisMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.35,
        roughness: 0.4
      }),
    []
  )

  const sideBumperMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.7
      }),
    []
  )

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#eab308',
        metalness: 0.95,
        roughness: 0.15
      }),
    []
  )

  return (
    <group position={position} rotation={rotation} userData={{ isResistanceBridge: true, name: 'Direnç Köprüsü' }}>
      {/* ===== Main Instrument Enclosure (Fluke 1594A Super-Thermometer Form Factor) ===== */}
      {/* Width: 0.44m, Height: 0.16m, Depth: 0.32m */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow material={chassisMaterial}>
        <boxGeometry args={[0.44, 0.15, 0.32]} />
      </mesh>

      {/* Side Rugged Protective Bumpers & Feet */}
      {[-0.222, 0.222].map((bx, i) => (
        <group key={`bumper-${i}`} position={[bx, 0.08, 0]}>
          <mesh material={sideBumperMaterial} castShadow>
            <boxGeometry args={[0.015, 0.155, 0.325]} />
          </mesh>
          {/* Handle recess */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.016, 0.06, 0.14]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Bottom rubber stand feet */}
      {[
        [-0.18, -0.12],
        [0.18, -0.12],
        [-0.18, 0.12],
        [0.18, 0.12]
      ].map(([fx, fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, 0.005, fz]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* ===== Front Face Bezel ===== */}
      <group position={[0, 0.08, 0.161]}>
        {/* Front Metal Bezel Face */}
        <mesh>
          <planeGeometry args={[0.43, 0.145]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>

        {/* Top Dark Banner with mchtkrkmz Logo & Model */}
        <mesh position={[0, 0.063, 0.001]}>
          <planeGeometry args={[0.43, 0.018]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        {/* mchtkrkmz Yellow Badge */}
        <mesh position={[-0.182, 0.063, 0.002]}>
          <planeGeometry args={[0.046, 0.012]} />
          <meshBasicMaterial color="#08b5ea" />
        </mesh>
        <Text
          position={[-0.182, 0.063, 0.003]}
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
          position={[-0.152, 0.063, 0.003]}
          fontSize={0.0068}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          DIRENÇ KÖPRÜSÜ
        </Text>
        <Text
          position={[0.195, 0.063, 0.003]}
          fontSize={0.0055}
          color="#cbd5e1"
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          TEMPERATURE RESISTANCE BRIDGE
        </Text>

        {/* ==================================================================== */}
        {/* LEFT SECTION: 4 Input Channels with 5-Way Gold-Plated Binding Posts */}
        {/* ==================================================================== */}
        <group position={[-0.12, -0.005, 0.001]}>
          {/* Panel background for binding posts */}
          <mesh>
            <planeGeometry args={[0.17, 0.11]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>

          {/* 4 Channel Columns (CH1, CH2, CH3, CH4) */}
          {[-0.06, -0.02, 0.02, 0.06].map((colX, chIdx) => {
            const chNum = chIdx + 1
            const isCurrentActive = activeChannel === chNum
            return (
              <group key={`ch-col-${chIdx}`} position={[colX, 0, 0]}>
                {/* Column Channel Header */}
                <Text
                  position={[0, 0.046, 0.002]}
                  fontSize={0.0065}
                  color={isCurrentActive ? '#0284c7' : '#475569'}
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  CH {chNum}
                </Text>

                {/* 5 Binding Posts per channel: I+, V+, V-, I-, GUARD */}
                {[
                  { label: 'I+', y: 0.03, color: '#dc2626' }, // Red
                  { label: 'V+', y: 0.015, color: '#dc2626' }, // Red
                  { label: 'V-', y: 0.0, color: '#1e293b' }, // Black
                  { label: 'I-', y: -0.015, color: '#1e293b' }, // Black
                  { label: 'GND', y: -0.03, color: '#16a34a' } // Green
                ].map((post, pIdx) => (
                  <group key={`post-${pIdx}`} position={[0, post.y, 0.003]}>
                    {/* Gold-plated hexagonal base collar */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
                      <cylinderGeometry args={[0.0055, 0.0055, 0.004, 8]} />
                    </mesh>
                    {/* Colored binding post screw cap */}
                    <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.0045, 0.0045, 0.007, 16]} />
                      <meshStandardMaterial color={post.color} metalness={0.4} roughness={0.3} />
                    </mesh>
                    {/* Tiny gold tip */}
                    <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
                      <cylinderGeometry args={[0.002, 0.002, 0.002, 16]} />
                    </mesh>
                  </group>
                ))}
              </group>
            )
          })}
        </group>

        {/* ==================================================================== */}
        {/* CENTER SECTION: 4-Channel Simultaneous Multi-Display LCD Screen     */}
        {/* ==================================================================== */}
        <group position={[0.045, -0.005, 0.001]}>
          {/* Screen Outer Bezel */}
          <mesh>
            <planeGeometry args={[0.155, 0.11]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          {/* LCD Screen Display Area */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.15, 0.104]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>

          {/* Top Info Bar inside screen */}
          <mesh position={[0, 0.044, 0.002]}>
            <planeGeometry args={[0.146, 0.012]} />
            <meshBasicMaterial color="#1e3a8a" />
          </mesh>
          <Text
            position={[-0.07, 0.044, 0.003]}
            fontSize={0.0055}
            color="#38bdf8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            4-KANAL EŞZAMANLI GÖSTERGE
          </Text>
          <Text
            position={[0.07, 0.044, 0.003]}
            fontSize={0.0048}
            color="#93c5fd"
            anchorX="right"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            PRECISION RATIO BRIDGE
          </Text>

          {/* 4 SIMULTANEOUS CHANNEL ROWS (ONE FOR EACH OF THE 4 THERMOMETERS) */}
          {[
            {
              ch: 1,
              label: 'CH1 [SPRT-1 | DW-1]',
              temp: ch1Temp,
              res: 25.0 * (1 + 0.003926 * ch1Temp),
              delta: null,
              y: 0.026,
              tagColor: '#38bdf8',
              isRef: true
            },
            {
              ch: 2,
              label: 'CH2 [PRT-1  | DW-1]',
              temp: ch2Temp + 0.0021,
              res: 100.0 * (1 + 0.003851 * ch2Temp),
              delta: 0.0021,
              y: 0.005,
              tagColor: '#facc15',
              isRef: false
            },
            {
              ch: 3,
              label: 'CH3 [SPRT-2 | DW-2]',
              temp: ch3Temp,
              res: 25.0 * (1 + 0.003926 * ch3Temp),
              delta: null,
              y: -0.016,
              tagColor: '#38bdf8',
              isRef: true
            },
            {
              ch: 4,
              label: 'CH4 [PRT-2  | DW-2]',
              temp: ch4Temp + 0.0028,
              res: 100.0 * (1 + 0.003851 * ch4Temp),
              delta: 0.0028,
              y: -0.037,
              tagColor: '#facc15',
              isRef: false
            }
          ].map((row) => (
            <group key={`screen-ch-${row.ch}`} position={[0, row.y, 0.002]}>
              {/* Row container background */}
              <mesh>
                <planeGeometry args={[0.146, 0.018]} />
                <meshBasicMaterial color={activeChannel === row.ch ? '#1e3a8a' : '#0f172a'} />
              </mesh>

              {/* Channel & Sensor Tag */}
              <Text
                position={[-0.071, 0, 0.001]}
                fontSize={0.0048}
                color={row.tagColor}
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                {row.label}
              </Text>

              {/* High-Precision Live Temperature (4-5 Decimals) */}
              <Text
                position={[0.005, 0, 0.001]}
                fontSize={0.0068}
                color="#4ade80"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                {row.temp >= 0 ? `+${row.temp.toFixed(4)}` : row.temp.toFixed(4)} °C
              </Text>

              {/* Resistance Rt and Error Delta */}
              <Text
                position={[0.071, 0, 0.001]}
                fontSize={0.0045}
                color={row.delta !== null ? '#f43f5e' : '#fbbf24'}
                anchorX="right"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {row.delta !== null
                  ? `ΔT:+${row.delta.toFixed(3)}°C`
                  : `Rt:${row.res.toFixed(3)}Ω`}
              </Text>
            </group>
          ))}
        </group>

        {/* ==================================================================== */}
        {/* RIGHT SECTION: Interactive Channel Selectors & Numeric Keypad */}
        {/* ==================================================================== */}
        <group position={[0.165, -0.005, 0.001]}>
          <mesh>
            <planeGeometry args={[0.075, 0.11]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>

          {/* Quick Channel Selection Buttons (CH1, CH2, CH3, CH4) */}
          <Text
            position={[0, 0.044, 0.002]}
            fontSize={0.0055}
            color="#334155"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            SELECT CHANNEL
          </Text>

          {[1, 2, 3, 4].map((ch) => {
            const isSelected = activeChannel === ch
            const btnX = (ch % 2 === 1 ? -0.018 : 0.018)
            const btnY = ch <= 2 ? 0.027 : 0.01
            return (
              <group
                key={`ch-btn-${ch}`}
                position={[btnX, btnY, 0.003]}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  setActiveChannel(ch as 1 | 2 | 3 | 4)
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
                  <boxGeometry args={[0.03, 0.013, 0.004]} />
                  <meshStandardMaterial
                    color={isSelected ? '#0284c7' : '#e2e8f0'}
                    roughness={0.4}
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.003]}
                  fontSize={0.006}
                  color={isSelected ? '#ffffff' : '#1e293b'}
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  CH {ch}
                </Text>
              </group>
            )
          })}

          {/* Numeric Mini Keypad Grid */}
          <group position={[0, -0.018, 0.003]}>
            {[
              ['7', '8', '9'],
              ['4', '5', '6'],
              ['1', '2', '3']
            ].map((row, rIdx) =>
              row.map((digit, cIdx) => (
                <mesh
                  key={`num-${digit}`}
                  position={[-0.02 + cIdx * 0.02, 0.01 - rIdx * 0.014, 0]}
                >
                  <boxGeometry args={[0.015, 0.01, 0.003]} />
                  <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
                </mesh>
              ))
            )}
          </group>

          {/* Power Button */}
          <group position={[0.022, -0.045, 0.003]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.003, 16]} />
              <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

export default memo(ResistanceBridge)
