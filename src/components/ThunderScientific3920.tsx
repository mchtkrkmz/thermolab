import { useState, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

export interface ThunderScientific3920Props {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetFrostPoint: number
  setTargetFrostPoint: (temp: number) => void
  currentFrostPoint: number
  setCurrentFrostPoint: (temp: number) => void
}

/**
 * Audio feedback helper for tactile industrial control buttons
 */
function playBeep(freq = 1100, duration = 0.035) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Ignore audio context errors in non-user gesture contexts
  }
}

/**
 * Thunder Scientific Model 3920 Two-Pressure Low Frost Point Humidity Generator
 * Primer Nem ve Donma Noktası Metrolojisi Referans Sistemi (-80 °C ila +10 °C FP)
 */
function ThunderScientific3920({
  position = [-3.85, 0, -2.15],
  rotation = [0, Math.PI / 2, 0],
  targetFrostPoint = -50.0,
  setTargetFrostPoint,
  currentFrostPoint = -50.0,
  setCurrentFrostPoint,
}: ThunderScientific3920Props) {
  const [powerOn, setPowerOn] = useState(true)
  const [purgeMode, setPurgeMode] = useState(false)
  const [holdMode, setHoldMode] = useState(false)
  const [gasFlow, setGasFlow] = useState(2.0)
  const [knobAngle, setKnobAngle] = useState(0)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [activeBtn, setActiveBtn] = useState<string | null>(null)

  // Thermodynamic Simulation values (ITS-90 Formulation)
  const saturatorTemp = currentFrostPoint + 7.8
  const chamberPress = 48.0 + Math.abs(currentFrostPoint) * 0.48
  const expansionRatio = (14.696 / chamberPress).toFixed(4)

  // Physics update: approach target frost point dynamically
  const currentRef = useRef(currentFrostPoint)
  currentRef.current = currentFrostPoint

  useFrame((_, delta) => {
    if (!powerOn || holdMode) return
    const diff = targetFrostPoint - currentRef.current
    if (Math.abs(diff) > 0.005) {
      // Approach target at ~1.8 °C per second (faster during purge)
      const speed = purgeMode ? 3.5 : 1.8
      const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * delta)
      const next = currentRef.current + step
      setCurrentFrostPoint(Number(next.toFixed(3)))
    }
  })

  // Button Action Handlers
  const handlePreset = (val: number) => {
    playBeep(1200)
    setTargetFrostPoint(val)
  }

  const handleAdjust = (deltaVal: number) => {
    playBeep(deltaVal > 0 ? 1400 : 950)
    const next = Math.max(-80.0, Math.min(10.0, targetFrostPoint + deltaVal))
    setTargetFrostPoint(Number(next.toFixed(1)))
    setKnobAngle((prev) => prev + (deltaVal > 0 ? 0.35 : -0.35))
  }

  const handleFlowAdjust = (deltaFlow: number) => {
    playBeep(1100)
    setGasFlow((prev) => {
      const next = Math.max(0.5, Math.min(5.0, Number((prev + deltaFlow).toFixed(1))))
      return next
    })
  }

  const togglePower = () => {
    playBeep(powerOn ? 600 : 1300, 0.08)
    setPowerOn((p) => !p)
  }

  const togglePurge = () => {
    playBeep(1500)
    setPurgeMode((p) => !p)
  }

  const toggleHold = () => {
    playBeep(1000)
    setHoldMode((h) => !h)
  }

  const handleEmergencyStop = () => {
    playBeep(450, 0.2)
    setPowerOn(false)
    setPurgeMode(false)
    setHoldMode(false)
  }

  const isStable = Math.abs(currentFrostPoint - targetFrostPoint) < 0.02

  return (
    <group position={position} rotation={rotation}>
      {/* ========================================================
          1. 4 INDUSTRIAL CASTER WHEELS (BOTTOM)
         ======================================================== */}
      {[
        [-0.26, 0.04, -0.32],
        [0.26, 0.04, -0.32],
        [-0.26, 0.04, 0.32],
        [0.26, 0.04, 0.32],
      ].map(([wx, wy, wz], i) => (
        <group key={`wheel-${i}`} position={[wx, wy, wz]}>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.07, 0.04, 0.07]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.015, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.038, 0.035, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ========================================================
          2. MAIN LOWER CABINET BODY (LIGHT POWDER-COATED STEEL)
         ======================================================== */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.74, 0.76]} />
        <meshStandardMaterial color="#d8dde3" roughness={0.35} metalness={0.3} />
      </mesh>

      {/* Front Service Door (Recessed Panel with Edge Border) */}
      <mesh position={[0, 0.40, 0.382]}>
        <boxGeometry args={[0.54, 0.60, 0.008]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.25} />
      </mesh>

      {/* 4 Corner Quarter-Turn Screws on Service Door */}
      {[
        [-0.24, 0.66],
        [0.24, 0.66],
        [-0.24, 0.14],
        [0.24, 0.14],
      ].map(([sx, sy], idx) => (
        <mesh key={`screw-${idx}`} position={[sx, sy, 0.388]} rotation={[0, 0, idx * 0.7]}>
          <cylinderGeometry args={[0.007, 0.007, 0.004, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Side Louvers / Ventilation Grills (Left & Right) */}
      {[-0.322, 0.322].map((gx, side) => (
        <group key={`side-grill-${side}`} position={[gx, 0.30, -0.15]}>
          {Array.from({ length: 8 }).map((_, li) => (
            <mesh key={`louver-${li}`} position={[0, li * 0.025, 0]}>
              <boxGeometry args={[0.004, 0.012, 0.18]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Top Rear Exhaust / Vent Grill */}
      {[-0.322, 0.322].map((gx, side) => (
        <group key={`top-grill-${side}`} position={[gx, 0.68, -0.18]}>
          {Array.from({ length: 4 }).map((_, li) => (
            <mesh key={`tlou-${li}`} position={[0, li * 0.02, 0.12]}>
              <boxGeometry args={[0.004, 0.008, 0.14]} />
              <meshBasicMaterial color="#334155" />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========================================================
          3. SLANTED UPPER CONSOLE & INTERACTIVE CONTROL PANEL
         ======================================================== */}
      <group position={[0, 0.81, 0.12]}>
        {/* Slanted Face Chamfer: Tilted ~25 degrees backward for optimal operator viewing */}
        <group position={[0, 0.06, 0.16]} rotation={[-0.44, 0, 0]}>
          {/* Main Slanted Housing Enclosure */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.63, 0.28, 0.26]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.25} />
          </mesh>

          {/* ----------------------------------------------------
              FRONT CONSOLE SURFACE (Local z = +0.131)
              All controls, display and buttons reside precisely here!
             ---------------------------------------------------- */}
          <group position={[0, 0, 0.131]}>
            {/* Front Panel Background Base Layer */}
            <mesh position={[0, 0, 0.0005]}>
              <planeGeometry args={[0.622, 0.272]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.15} />
            </mesh>

            {/* Top Cyan / Blue Brand Stripe */}
            <mesh position={[0, 0.122, 0.001]}>
              <planeGeometry args={[0.61, 0.007]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>

            {/* Bottom Navy Accent Line */}
            <mesh position={[0, -0.124, 0.001]}>
              <planeGeometry args={[0.61, 0.005]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>

            {/* Header: TÜBİTAK UME Corporate Brand Title */}
            <mesh position={[-0.24, 0.106, 0.0015]}>
              <planeGeometry args={[0.012, 0.012]} />
              <meshBasicMaterial color="#e11d48" />
            </mesh>
            <Text
              position={[-0.228, 0.106, 0.002]}
              fontSize={0.013}
              color="#0f172a"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              TUBİTAK UME
            </Text>
            <Text
              position={[0.03, 0.106, 0.002]}
              fontSize={0.009}
              color="#0284c7"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              TUBİTAK UME FROST POINT GENERATOR
            </Text>
            {/* Calibration Metrology Badge */}
            <Text
              position={[0.29, 0.106, 0.002]}
              fontSize={0.0075}
              color={powerOn ? (isStable ? '#16a34a' : '#ea580c') : '#64748b'}
              anchorX="right"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {powerOn ? (isStable ? '● STABLE' : '⟳ RAMPING') : '○ OFF'}
            </Text>

            {/* ========================================================
                TOUCHSCREEN DISPLAY (LEFT HALF: x = -0.14)
               ======================================================== */}
            <group position={[-0.145, -0.012, 0.002]}>
              {/* Outer Bezel Frame */}
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[0.29, 0.19]} />
                <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
              </mesh>
              {/* Inner Screen Surface */}
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[0.28, 0.18]} />
                <meshBasicMaterial color="#020617" />
              </mesh>

              {powerOn ? (
                <group position={[0, 0, 0.003]}>
                  {/* Top Header Bar inside screen */}
                  <mesh position={[0, 0.076, 0]}>
                    <planeGeometry args={[0.276, 0.018]} />
                    <meshBasicMaterial color="#1e293b" />
                  </mesh>
                  <Text
                    position={[-0.13, 0.076, 0.001]}
                    fontSize={0.008}
                    color="#38bdf8"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    1P CHAMBER
                  </Text>
                  <Text
                    position={[0.13, 0.076, 0.001]}
                    fontSize={0.008}
                    color={purgeMode ? '#f59e0b' : holdMode ? '#a855f7' : '#22c55e'}
                    anchorX="right"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {purgeMode ? '⚡ PURGE FLUSH' : holdMode ? '⏸ HOLD VALUE' : '▶ RUNNING'}
                  </Text>

                  {/* Primary Frost Point Readout Box */}
                  <mesh position={[-0.068, 0.038, 0]}>
                    <planeGeometry args={[0.132, 0.046]} />
                    <meshBasicMaterial color="#090d16" />
                  </mesh>
                  <Text
                    position={[-0.13, 0.052, 0.001]}
                    fontSize={0.007}
                    color="#94a3b8"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    GENERATED FROST POINT:
                  </Text>
                  <Text
                    position={[-0.068, 0.032, 0.001]}
                    fontSize={0.018}
                    color="#38bdf8"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`${currentFrostPoint.toFixed(2)} °C`}
                  </Text>

                  {/* Target Setpoint Box */}
                  <mesh position={[0.068, 0.038, 0]}>
                    <planeGeometry args={[0.132, 0.046]} />
                    <meshBasicMaterial color="#090d16" />
                  </mesh>
                  <Text
                    position={[0.006, 0.052, 0.001]}
                    fontSize={0.007}
                    color="#94a3b8"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    TARGET SETPOINT:
                  </Text>
                  <Text
                    position={[0.068, 0.032, 0.001]}
                    fontSize={0.018}
                    color="#f59e0b"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`${targetFrostPoint.toFixed(1)} °C`}
                  </Text>

                  {/* Thermodynamic Data Matrix Table */}
                  <mesh position={[0, -0.014, 0]}>
                    <planeGeometry args={[0.272, 0.048]} />
                    <meshBasicMaterial color="#09101d" />
                  </mesh>
                  <Text
                    position={[-0.13, 0.002, 0.001]}
                    fontSize={0.0072}
                    color="#cbd5e1"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`T_sat: ${saturatorTemp.toFixed(2)} °C | P_sat: ${chamberPress.toFixed(1)} psia`}
                  </Text>
                  <Text
                    position={[-0.13, -0.012, 0.001]}
                    fontSize={0.0072}
                    color="#cbd5e1"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`P_test: 14.70 psia | Ratio P2/P1: ${expansionRatio}`}
                  </Text>
                  <Text
                    position={[-0.13, -0.026, 0.001]}
                    fontSize={0.0072}
                    color="#38bdf8"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`MFC Flow: ${gasFlow.toFixed(1)} SLPM | N2 Carrier: 99.999%`}
                  </Text>

                  {/* Dynamic Stability Bar */}
                  <mesh position={[0, -0.058, 0]}>
                    <planeGeometry args={[0.272, 0.026]} />
                    <meshBasicMaterial color="#090d16" />
                  </mesh>
                  <Text
                    position={[-0.13, -0.058, 0.001]}
                    fontSize={0.007}
                    color="#94a3b8"
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {`STABILITY [±0.015°C]: ${isStable ? 'STABILIZED (±0.006 °C)' : 'EQUILIBRATING...'}`}
                  </Text>
                  <mesh position={[0.075, -0.058, 0.001]}>
                    <planeGeometry args={[0.09, 0.008]} />
                    <meshBasicMaterial color={isStable ? '#16a34a' : '#ea580c'} />
                  </mesh>
                </group>
              ) : (
                <group position={[0, 0, 0.003]}>
                  <Text
                    position={[0, 0.01, 0]}
                    fontSize={0.016}
                    color="#ef4444"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    SYSTEM STANDBY / OFF
                  </Text>
                  <Text
                    position={[0, -0.02, 0]}
                    fontSize={0.009}
                    color="#64748b"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    Press [PWR] button on right panel to initialize
                  </Text>
                </group>
              )}
            </group>

            {/* ========================================================
                CONTROL BUTTONS & KEYPAD (RIGHT HALF: x = +0.155)
               ======================================================== */}
            <group position={[0.155, -0.012, 0.002]}>
              {/* Keypad Base Panel Plate */}
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[0.29, 0.19]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
              </mesh>

              {/* ------------------------------------------------------
                  ROW 1: SYSTEM CONTROLS (PWR, PURGE, HOLD)
                 ------------------------------------------------------ */}
              {[
                {
                  id: 'btn-pwr',
                  label: powerOn ? 'PWR ON' : 'PWR OFF',
                  color: powerOn ? '#15803d' : '#991b1b',
                  hoverColor: powerOn ? '#22c55e' : '#ef4444',
                  px: -0.09,
                  py: 0.068,
                  w: 0.078,
                  h: 0.024,
                  onClick: togglePower,
                },
                {
                  id: 'btn-purge',
                  label: purgeMode ? 'PURGE ON' : 'PURGE',
                  color: purgeMode ? '#d97706' : '#334155',
                  hoverColor: '#f59e0b',
                  px: 0,
                  py: 0.068,
                  w: 0.078,
                  h: 0.024,
                  onClick: togglePurge,
                },
                {
                  id: 'btn-hold',
                  label: holdMode ? 'HOLD ON' : 'HOLD',
                  color: holdMode ? '#7e22ce' : '#334155',
                  hoverColor: '#a855f7',
                  px: 0.09,
                  py: 0.068,
                  w: 0.078,
                  h: 0.024,
                  onClick: toggleHold,
                },
              ].map((btn) => {
                const isHovered = hoveredBtn === btn.id
                const isPressed = activeBtn === btn.id
                return (
                  <group
                    key={btn.id}
                    position={[btn.px, btn.py, isPressed ? 0.003 : 0.006]}
                    onClick={(e) => {
                      e.stopPropagation()
                      btn.onClick()
                    }}
                    onPointerDown={() => setActiveBtn(btn.id)}
                    onPointerUp={() => setActiveBtn(null)}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(btn.id)
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(null)
                      setActiveBtn(null)
                      document.body.style.cursor = 'auto'
                    }}
                  >
                    {/* 3D Button Cap */}
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[btn.w, btn.h, 0.006]} />
                      <meshStandardMaterial
                        color={isHovered ? btn.hoverColor : btn.color}
                        roughness={0.3}
                        metalness={0.2}
                      />
                    </mesh>
                    <Text
                      position={[0, 0, 0.004]}
                      fontSize={0.0078}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                    >
                      {btn.label}
                    </Text>
                  </group>
                )
              })}

              {/* Section Subtitle: CALIBRATION PRESETS */}
              <Text
                position={[-0.13, 0.046, 0.003]}
                fontSize={0.0065}
                color="#64748b"
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                STANDARD METROLOGY PRESETS:
              </Text>

              {/* ------------------------------------------------------
                  ROW 2: PRESET BUTTONS (-75, -50, -30, -10, 0, +5)
                 ------------------------------------------------------ */}
              {[
                { label: '-75 °C', val: -75.0, px: -0.09, py: 0.028 },
                { label: '-50 °C', val: -50.0, px: -0.036, py: 0.028 },
                { label: '-30 °C', val: -30.0, px: 0.018, py: 0.028 },
                { label: '-10 °C', val: -10.0, px: 0.072, py: 0.028 },
                { label: '0.0 °C', val: 0.0, px: -0.09, py: 0.002 },
                { label: '+5.0 °C', val: 5.0, px: -0.036, py: 0.002 },
              ].map((p, idx) => {
                const btnId = `preset-${idx}`
                const isHovered = hoveredBtn === btnId
                const isSelected = targetFrostPoint === p.val
                const isPressed = activeBtn === btnId
                return (
                  <group
                    key={btnId}
                    position={[p.px, p.py, isPressed ? 0.002 : 0.005]}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreset(p.val)
                    }}
                    onPointerDown={() => setActiveBtn(btnId)}
                    onPointerUp={() => setActiveBtn(null)}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(btnId)
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(null)
                      setActiveBtn(null)
                      document.body.style.cursor = 'auto'
                    }}
                  >
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[0.048, 0.020, 0.005]} />
                      <meshStandardMaterial
                        color={isSelected ? '#0284c7' : isHovered ? '#38bdf8' : '#1e293b'}
                        roughness={0.4}
                        metalness={0.3}
                      />
                    </mesh>
                    <Text
                      position={[0, 0, 0.003]}
                      fontSize={0.0072}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                    >
                      {p.label}
                    </Text>
                  </group>
                )
              })}

              {/* Section Subtitle: FINE STEP CONTROLS */}
              <Text
                position={[-0.13, -0.016, 0.003]}
                fontSize={0.0065}
                color="#64748b"
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                STEP INCREMENTS / DECREMENTS:
              </Text>

              {/* ------------------------------------------------------
                  ROW 3: STEPPING BUTTONS (-10, -1, -0.1, +0.1, +1, +10)
                 ------------------------------------------------------ */}
              {[
                { label: '<< -10', delta: -10, px: -0.105, py: -0.034 },
                { label: '< -1', delta: -1, px: -0.063, py: -0.034 },
                { label: '-0.1', delta: -0.1, px: -0.021, py: -0.034 },
                { label: '+0.1', delta: 0.1, px: 0.021, py: -0.034 },
                { label: '+1 >', delta: 1, px: 0.063, py: -0.034 },
                { label: '+10 >>', delta: 10, px: 0.105, py: -0.034 },
              ].map((s, sidx) => {
                const stepId = `step-${sidx}`
                const isHovered = hoveredBtn === stepId
                const isPressed = activeBtn === stepId
                return (
                  <group
                    key={stepId}
                    position={[s.px, s.py, isPressed ? 0.002 : 0.005]}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdjust(s.delta)
                    }}
                    onPointerDown={() => setActiveBtn(stepId)}
                    onPointerUp={() => setActiveBtn(null)}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(stepId)
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={(e) => {
                      e.stopPropagation()
                      setHoveredBtn(null)
                      setActiveBtn(null)
                      document.body.style.cursor = 'auto'
                    }}
                  >
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[0.038, 0.019, 0.005]} />
                      <meshStandardMaterial
                        color={isHovered ? '#0ea5e9' : '#334155'}
                        roughness={0.4}
                        metalness={0.2}
                      />
                    </mesh>
                    <Text
                      position={[0, 0, 0.003]}
                      fontSize={0.0068}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                    >
                      {s.label}
                    </Text>
                  </group>
                )
              })}

              {/* ------------------------------------------------------
                  ROW 4: MASS FLOW CONTROLLER (FLOW - / FLOW +)
                 ------------------------------------------------------ */}
              <group position={[-0.03, -0.064, 0.005]}>
                <Text
                  position={[-0.10, 0, 0]}
                  fontSize={0.007}
                  color="#94a3b8"
                  anchorX="left"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  MFC FLOW:
                </Text>

                {/* Flow - Button */}
                <group
                  position={[-0.015, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFlowAdjust(-0.2)
                  }}
                  onPointerOver={() => setHoveredBtn('flow-dn')}
                  onPointerOut={() => setHoveredBtn(null)}
                >
                  <mesh>
                    <boxGeometry args={[0.028, 0.018, 0.005]} />
                    <meshStandardMaterial
                      color={hoveredBtn === 'flow-dn' ? '#38bdf8' : '#1e293b'}
                    />
                  </mesh>
                  <Text position={[0, 0, 0.003]} fontSize={0.008} color="#fff">
                    -
                  </Text>
                </group>

                {/* Flow Readout */}
                <mesh position={[0.024, 0, 0]}>
                  <boxGeometry args={[0.042, 0.018, 0.004]} />
                  <meshBasicMaterial color="#020617" />
                </mesh>
                <Text
                  position={[0.024, 0, 0.003]}
                  fontSize={0.0075}
                  color="#38bdf8"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`${gasFlow.toFixed(1)} SLPM`}
                </Text>

                {/* Flow + Button */}
                <group
                  position={[0.062, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFlowAdjust(+0.2)
                  }}
                  onPointerOver={() => setHoveredBtn('flow-up')}
                  onPointerOut={() => setHoveredBtn(null)}
                >
                  <mesh>
                    <boxGeometry args={[0.028, 0.018, 0.005]} />
                    <meshStandardMaterial
                      color={hoveredBtn === 'flow-up' ? '#38bdf8' : '#1e293b'}
                    />
                  </mesh>
                  <Text position={[0, 0, 0.003]} fontSize={0.008} color="#fff">
                    +
                  </Text>
                </group>
              </group>

              {/* ------------------------------------------------------
                  TACTILE ROTARY OPTICAL ENCODER KNOB (AYAR DÜĞMESİ)
                 ------------------------------------------------------ */}
              <group position={[0.108, 0.012, 0.005]}>
                <Text
                  position={[0, 0.022, 0]}
                  fontSize={0.006}
                  color="#94a3b8"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  ROTARY DIAL
                </Text>
                {/* Dial Base Ring */}
                <mesh position={[0, 0, 0.002]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.003, 24]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Knurled Turning Knob with rotation angle */}
                <group
                  position={[0, 0, 0.012]}
                  rotation={[0, 0, knobAngle]}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdjust(0.5)
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    setHoveredBtn('knob')
                    document.body.style.cursor = 'pointer'
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation()
                    setHoveredBtn(null)
                    document.body.style.cursor = 'auto'
                  }}
                >
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.014, 0.014, 0.014, 20]} />
                    <meshStandardMaterial
                      color={hoveredBtn === 'knob' ? '#0ea5e9' : '#cbd5e1'}
                      metalness={0.9}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Indicator Dot on Knob Face */}
                  <mesh position={[0, 0.009, 0.008]}>
                    <circleGeometry args={[0.002, 12]} />
                    <meshBasicMaterial color="#0284c7" />
                  </mesh>
                </group>
                <Text
                  position={[0, -0.016, 0]}
                  fontSize={0.0055}
                  color="#64748b"
                  anchorX="center"
                  anchorY="middle"
                >
                  (Click ±0.5°C)
                </Text>
              </group>

              {/* ------------------------------------------------------
                  EMERGENCY STOP SAFETY SWITCH (MUSHROOM BUTTON)
                 ------------------------------------------------------ */}
              <group
                position={[0.108, -0.062, 0.005]}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEmergencyStop()
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoveredBtn('estop')
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoveredBtn(null)
                  document.body.style.cursor = 'auto'
                }}
              >
                {/* Yellow Safety Ring Collar */}
                <mesh position={[0, 0, 0.002]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.003, 20]} />
                  <meshStandardMaterial color="#eab308" />
                </mesh>
                {/* Red Mushroom Cap */}
                <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.011, 0.008, 0.008, 18]} />
                  <meshStandardMaterial
                    color={hoveredBtn === 'estop' ? '#ef4444' : '#b91c1c'}
                    roughness={0.3}
                  />
                </mesh>
                <Text
                  position={[0, -0.015, 0]}
                  fontSize={0.005}
                  color="#ef4444"
                  anchorX="center"
                  anchorY="middle"
                >
                  E-STOP
                </Text>
              </group>
            </group>
          </group>
        </group>

        {/* Side USB & Diagnostic Interface Port on Console Housing */}
        <mesh position={[-0.323, 0.05, 0.16]}>
          <boxGeometry args={[0.004, 0.018, 0.014]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* ========================================================
          4. TOP ENCLOSURE & SWAGELOK GAS OUTLET FITTING
         ======================================================== */}
      <mesh position={[0, 0.815, -0.15]} receiveShadow>
        <boxGeometry args={[0.63, 0.015, 0.44]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Stainless Steel Swagelok 1/4" Gas Output Port (Top Right) */}
      <group position={[0.22, 0.825, -0.12]}>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.03, 6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.038, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.02, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.056, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.018, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-0.045, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 0.02]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <Text
          position={[-0.045, 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.0075}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          GAS OUTLET
        </Text>
      </group>

      {/* Model Specification Plate on Top Surface */}
      <mesh position={[-0.15, 0.824, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.16, 0.08]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <Text
        position={[-0.15, 0.825, -0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.0082}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        lineHeight={1.25}
        font="/fonts/arial.ttf"
      >
        {`G1TD LOW HUMIDITY GENERATION SYSTEM\nRANGE: -80 °C TO +10 °C FP\nFLOW: 0.1 TO 5.0 SLPM\nCALIBRATED: TÜBİTAK UME`}
      </Text>
    </group>
  )
}

export default memo(ThunderScientific3920)
