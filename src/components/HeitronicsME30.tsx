import { useState, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export interface HeitronicsME30Props {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp: number
  setTargetTemp: React.Dispatch<React.SetStateAction<number>>
  currentTemp: number
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>
}

function HeitronicsME30({
  position = [0.55, 0.90, -3.8],
  rotation = [0, 0, 0],
  targetTemp,
  setTargetTemp,
  currentTemp,
  setCurrentTemp,
}: HeitronicsME30Props) {
  const [powerOn, setPowerOn] = useState(true)
  const [pumpOn, setPumpOn] = useState(true)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const minTemp = -30.0
  const maxTemp = 350.0

  // Real-time thermal physics simulation
  useFrame((_, delta) => {
    if (!powerOn) return

    if (Math.abs(currentTemp - targetTemp) > 0.05) {
      const isHeating = targetTemp > currentTemp
      const diff = Math.abs(targetTemp - currentTemp)
      // Realistic heating/cooling rate: faster when far, gentle approach
      const rate = Math.max(16.0, Math.min(diff * 1.2, 45.0))
      const step = rate * delta
      const direction = isHeating ? 1 : -1

      setCurrentTemp((prev) => {
        const next = prev + direction * Math.min(diff, step)
        return Number(Math.max(minTemp, Math.min(maxTemp, next)).toFixed(1))
      })
    }
  })

  // Thermal incandescence color inside the cavity (room temp & below is pitch black, >220°C faint cherry red glow)
  const cavityGlow = (() => {
    if (currentTemp < 220) return '#050505'
    const factor = Math.min((currentTemp - 220) / 130.0, 1.0)
    const r = Math.floor(180 * factor + 20)
    const g = Math.floor(25 * factor)
    const b = Math.floor(15 * factor)
    return `rgb(${r}, ${g}, ${b})`
  })()

  const glowIntensity = currentTemp > 240 ? Math.min((currentTemp - 240) / 110, 1.0) * 0.8 : 0

  return (
    <group position={position} rotation={rotation} userData={{ isBlackBody: true, temperature: currentTemp, currentTemp, sourceName: 'HEITRONICS ME30' }}>
      {/* ========================================================
          1. MODULAR EXTRUDED ALUMINUM CHASSIS (ITEM-PROFILE T-SLOT)
         ======================================================== */}
      {/* 4 Adjustable Leveling Feet with Threaded Studs */}
      {[
        [-0.12, -0.16],
        [0.12, -0.16],
        [-0.12, 0.16],
        [0.12, 0.16],
      ].map(([fx, fz], idx) => (
        <group key={`foot-${idx}`} position={[fx, 0.02, fz]}>
          {/* Black Rubber Foot Base */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.022, 0.026, 0.02, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          {/* Stainless Threaded Stud & Hex Nut */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.024, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.006, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.010, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* 4 Vertical Extruded Aluminum Corner Columns (30x30mm T-slot profiles) */}
      {[
        [-0.13, -0.18],
        [0.13, -0.18],
        [-0.13, 0.18],
        [0.13, 0.18],
      ].map(([cx, cz], idx) => (
        <mesh key={`col-${idx}`} position={[cx, 0.24, cz]}>
          <boxGeometry args={[0.032, 0.42, 0.032]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.2} />
        </mesh>
      ))}

      {/* Horizontal Structural Extrusion Rails (Top & Bottom perimeter) */}
      {[0.04, 0.44].map((ry, yi) => (
        <group key={`rails-y-${yi}`}>
          {/* Front & Back Rails */}
          {[-0.18, 0.18].map((rz, zi) => (
            <mesh key={`rail-fb-${zi}`} position={[0, ry, rz]}>
              <boxGeometry args={[0.26, 0.028, 0.028]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Left & Right Rails */}
          {[-0.13, 0.13].map((rx, xi) => (
            <mesh key={`rail-lr-${xi}`} position={[rx, ry, 0]}>
              <boxGeometry args={[0.028, 0.028, 0.36]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Center Horizontal Divider Rail on Front Face */}
      <mesh position={[0, 0.23, 0.18]}>
        <boxGeometry args={[0.26, 0.024, 0.024]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Enclosure Body Panels (Brushed Anodized Aluminum) */}
      {/* Right Side Panel */}
      <mesh position={[0.135, 0.24, 0]} receiveShadow>
        <boxGeometry args={[0.006, 0.38, 0.34]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Left Side Panel */}
      <mesh position={[-0.135, 0.24, 0]} receiveShadow>
        <boxGeometry args={[0.006, 0.38, 0.34]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Top Cover Panel */}
      <mesh position={[0, 0.455, 0]} receiveShadow>
        <boxGeometry args={[0.26, 0.006, 0.36]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Rear Panel */}
      <mesh position={[0, 0.24, -0.185]}>
        <boxGeometry args={[0.26, 0.38, 0.006]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ========================================================
          2. FRONT PANEL UPPER: INSTRUMENTATION & EUROTHERM PID
         ======================================================== */}
      {/* Upper Control Panel Faceplate */}
      <mesh position={[0, 0.335, 0.181]}>
        <planeGeometry args={[0.25, 0.18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Model Name & Technical Label Header */}
      <mesh position={[-0.05, 0.405, 0.182]}>
        <planeGeometry args={[0.13, 0.025]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <Text
        position={[-0.05, 0.405, 0.183]}
        fontSize={0.010}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TUBİTAK UME G1RS
      </Text>
      <Text
        position={[0.055, 0.405, 0.182]}
        fontSize={0.0065}
        color="#475569"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        -30 °C / +350 °C Blackbody
      </Text>

      {/* Red 7-Segment Digital Temperature Display (Left) */}
      <group position={[-0.065, 0.36, 0.182]}>
        {/* Red Display Bezel Frame */}
        <mesh>
          <planeGeometry args={[0.09, 0.038]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.084, 0.032]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
        {/* Red 7-Segment Value */}
        <Text
          position={[0.036, 0, 0.002]}
          fontSize={0.020}
          color={powerOn ? '#ef4444' : '#450a0a'}
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {powerOn ? `${currentTemp.toFixed(1)}°` : 'OFF'}
        </Text>
      </group>

      {/* Eurotherm Digital Dual PID Controller (Right) */}
      <group position={[0.055, 0.345, 0.182]}>
        {/* Teal / Dark Blue Eurotherm Housing */}
        <mesh>
          <planeGeometry args={[0.095, 0.095]} />
          <meshStandardMaterial color="#0f3b4c" roughness={0.6} />
        </mesh>
        {/* Display Screen */}
        <mesh position={[0, 0.015, 0.001]}>
          <planeGeometry args={[0.082, 0.052]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* Upper Display (PV: Process Value / Actual Temp - Green) */}
        <Text
          position={[0.036, 0.028, 0.003]}
          fontSize={0.017}
          color={powerOn ? '#4ade80' : '#14532d'}
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {powerOn ? `${currentTemp.toFixed(1)}` : '----'}
        </Text>
        <Text
          position={[-0.036, 0.028, 0.003]}
          fontSize={0.006}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          PV
        </Text>

        {/* Lower Display (SV: Setpoint Value - Emerald Green) */}
        <Text
          position={[0.036, 0.006, 0.003]}
          fontSize={0.015}
          color={powerOn ? '#22c55e' : '#14532d'}
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {powerOn ? `${targetTemp.toFixed(1)}` : '----'}
        </Text>
        <Text
          position={[-0.036, 0.006, 0.003]}
          fontSize={0.006}
          color="#64748b"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          SV
        </Text>

        {/* Eurotherm Controller Adjustment Buttons (-10, -1, +1, +10 °C) */}
        <group position={[-0.033, -0.026, 0.002]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setTargetTemp((t) => Math.max(minTemp, Number((t - 10.0).toFixed(1))))
            }}
          >
            <planeGeometry args={[0.019, 0.016]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <Text position={[0, 0, 0.001]} fontSize={0.0065} color="#f87171" anchorX="center" font="/fonts/arial.ttf" fontWeight="bold">
            -10
          </Text>
        </group>
        <group position={[-0.011, -0.026, 0.002]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setTargetTemp((t) => Math.max(minTemp, Number((t - 1.0).toFixed(1))))
            }}
          >
            <planeGeometry args={[0.019, 0.016]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
          <Text position={[0, 0, 0.001]} fontSize={0.007} color="#ffffff" anchorX="center" font="/fonts/arial.ttf" fontWeight="bold">
            -1
          </Text>
        </group>
        <group position={[0.011, -0.026, 0.002]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setTargetTemp((t) => Math.min(maxTemp, Number((t + 1.0).toFixed(1))))
            }}
          >
            <planeGeometry args={[0.019, 0.016]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <Text position={[0, 0, 0.001]} fontSize={0.007} color="#ffffff" anchorX="center" font="/fonts/arial.ttf" fontWeight="bold">
            +1
          </Text>
        </group>
        <group position={[0.033, -0.026, 0.002]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setTargetTemp((t) => Math.min(maxTemp, Number((t + 10.0).toFixed(1))))
            }}
          >
            <planeGeometry args={[0.019, 0.016]} />
            <meshBasicMaterial color="#0369a1" />
          </mesh>
          <Text position={[0, 0, 0.001]} fontSize={0.0065} color="#38bdf8" anchorX="center" font="/fonts/arial.ttf" fontWeight="bold">
            +10
          </Text>
        </group>
      </group>

      {/* 4 Rotary Selector Switches / Toggle Knobs (Bottom Left) */}
      {[
        { id: 'pump', label: 'PUMP', x: -0.08, y: 0.29, active: pumpOn, toggle: () => setPumpOn((p) => !p) },
        { id: 'heat', label: 'HEAT', x: -0.03, y: 0.29, active: powerOn, toggle: () => setPowerOn((p) => !p) },
        { id: 'mode', label: 'MODE', x: -0.08, y: 0.25, active: true, toggle: () => { } },
        { id: 'pwr', label: 'POWER', x: -0.03, y: 0.25, active: powerOn, toggle: () => setPowerOn((p) => !p) },
      ].map((sw) => (
        <group key={sw.id} position={[sw.x, sw.y, 0.183]} onClick={(e) => { e.stopPropagation(); sw.toggle() }}>
          {/* Knob Dial Base */}
          <mesh>
            <cylinderGeometry args={[0.012, 0.012, 0.004, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Knob Pointer Lever */}
          <mesh position={[0, 0.004, 0]} rotation={[0, sw.active ? 0.6 : -0.6, 0]}>
            <boxGeometry args={[0.004, 0.012, 0.016]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <Text position={[0, -0.016, 0]} fontSize={0.0055} color="#475569" anchorX="center" font="/fonts/arial.ttf">
            {sw.label}
          </Text>
        </group>
      ))}

      {/* HEITRONICS Infrarot Messtechnik Brand Logo (Below Eurotherm) */}
      <mesh position={[0.055, 0.27, 0.182]}>
        <planeGeometry args={[0.085, 0.016]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <Text
        position={[0.055, 0.27, 0.183]}
        fontSize={0.007}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TUBITAK UME
      </Text>

      {/* ========================================================
          3. FRONT PANEL LOWER: BLACKBODY CAVITY APERTURE
         ======================================================== */}
      {/* Square Lower Aperture Faceplate */}
      <mesh position={[0, 0.135, 0.181]}>
        <planeGeometry args={[0.25, 0.16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} metalness={0.6} />
      </mesh>

      {/* Recessed Square Aluminum Cavity Flange */}
      <group position={[0, 0.135, 0.182]}>
        <mesh>
          <planeGeometry args={[0.18, 0.14]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* 6 Stainless Socket Screws around Aperture Flange */}
        {[
          [-0.075, -0.055],
          [0.075, -0.055],
          [-0.075, 0.055],
          [0.075, 0.055],
          [-0.075, 0],
          [0.075, 0],
        ].map(([bx, by], bi) => (
          <mesh key={`flange-bolt-${bi}`} position={[bx, by, 0.002]}>
            <cylinderGeometry args={[0.004, 0.004, 0.004, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} />
          </mesh>
        ))}

        {/* Yellow Caution Hot Triangle Warning Icon */}
        <group position={[-0.065, 0.045, 0.003]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.012, 0.018, 3]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <Text position={[0, -0.002, 0.002]} fontSize={0.008} color="#000000" anchorX="center" font="/fonts/arial.ttf">
            ▲
          </Text>
        </group>

        {/* Aperture Collar Bevel Ring */}
        <mesh position={[0, 0, 0.004]}>
          <ringGeometry args={[0.042, 0.058, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Cylindrical Cavity Opening (Deep Blackbody Radiation Target) */}
        {/* Raycast Target Mesh for Radiation Thermometers / Pyrometers */}
        <mesh
          position={[0, 0, 0.002]}
          userData={{
            isBlackBody: true,
            isApertureCenter: true,
            currentTemp: currentTemp,
            temperature: currentTemp,
            emissivity: 0.999,
            sourceName: 'HEITRONICS ME30',
            name: 'HEITRONICS ME30 Blackbody Radiation Standard',
          }}
        >
          <circleGeometry args={[0.075, 32]} />
          <meshBasicMaterial color={cavityGlow} side={THREE.DoubleSide} />
        </mesh>

        {/* Deep Internal Cavity Cylinder Tube */}
        <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.040, 0.040, 0.12, 24, 1, true]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.95} />
        </mesh>

        {/* Faint Thermal Radiant Point Light at high temperatures */}
        {glowIntensity > 0 && (
          <pointLight position={[0, 0, 0.02]} color="#ef4444" intensity={glowIntensity} distance={0.6} />
        )}
      </group>

      {/* ========================================================
          4. INTERACTIVE SETPOINT QUICK ADJUSTMENT PANEL (RIGHT SIDE)
         ======================================================== */}
      <group position={[0.138, 0.24, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Side Control Plate */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.30, 0.16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>

        <Text position={[0, 0.060, 0.003]} fontSize={0.010} color="#38bdf8" anchorX="center" font="/fonts/arial.ttf">
          ME30 SICAKLIK AYARLARI
        </Text>

        {/* Step Buttons: -10°C, -1°C, +1°C, +10°C */}
        <group position={[0, 0.025, 0.003]}>
          {[-10, -1, 1, 10].map((step, si) => {
            const btnKey = `me30-step-${step}`
            const isHov = hoveredBtn === btnKey
            const bx = -0.09 + si * 0.06
            return (
              <group
                key={btnKey}
                position={[bx, 0, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetTemp((t) => Number(Math.max(minTemp, Math.min(maxTemp, t + step)).toFixed(1)))
                }}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredBtn(btnKey) }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredBtn(null) }}
              >
                <mesh>
                  <planeGeometry args={[0.052, 0.024]} />
                  <meshBasicMaterial color={isHov ? '#0284c7' : '#334155'} />
                </mesh>
                <Text position={[0, 0, 0.001]} fontSize={0.009} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                  {step > 0 ? `+${step}°` : `${step}°`}
                </Text>
              </group>
            )
          })}
        </group>

        {/* Quick Presets: -30°C, 0°C, 50°C, 100°C, 200°C, 350°C */}
        <group position={[0, -0.020, 0.003]}>
          {[-30, 0, 50, 100, 200, 350].map((preset, pi) => {
            const btnKey = `me30-preset-${preset}`
            const isHov = hoveredBtn === btnKey
            const isCur = Math.abs(targetTemp - preset) < 0.1
            const col = pi % 3
            const row = Math.floor(pi / 3)
            const px = -0.08 + col * 0.08
            const py = 0.012 - row * 0.030
            return (
              <group
                key={btnKey}
                position={[px, py, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetTemp(preset)
                }}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredBtn(btnKey) }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredBtn(null) }}
              >
                <mesh>
                  <planeGeometry args={[0.070, 0.022]} />
                  <meshBasicMaterial color={isCur ? '#059669' : isHov ? '#0284c7' : '#0f172a'} />
                </mesh>
                <Text position={[0, 0, 0.001]} fontSize={0.0085} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                  {`${preset} °C`}
                </Text>
              </group>
            )
          })}
        </group>

        <Text position={[0, -0.065, 0.003]} fontSize={0.007} color="#94a3b8" anchorX="center" font="/fonts/arial.ttf">
          {`Aralık: ${minTemp} °C ila +${maxTemp} °C | ε = 0.999`}
        </Text>
      </group>
    </group>
  )
}

export default memo(HeitronicsME30)
