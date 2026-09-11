import { useState, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export interface ThunderScientific2900Props {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetRH: number
  setTargetRH: (rh: number) => void
  currentRH: number
  setCurrentRH: (rh: number) => void
  chamberTemp: number
  setChamberTemp: (t: number) => void
  doorOpen: boolean
  setDoorOpen: (open: boolean | ((prev: boolean) => boolean)) => void
}

/**
 * Thunder Scientific Model 2900 Two-Pressure Automated Humidity Generation System
 * Primer Nem Kalibratörü (%10 RH ila %95 RH, -10 °C ila 70 °C)
 * 
 * Özellikler:
 * - Sağ tarafta gerçek, derinliği olan açık test odası (Test Chamber Cavity).
 * - İçeride 1 adet paslanmaz çelik kalibrasyon rafı.
 * - Raf üzerinde gerçek zamanlı çalışan Vaisala Çiğ Noktası (Dew Point) ve Sıcaklık/Nem Ölçer cihazı + çelik prob.
 * - Açılıp kapanabilir cam pencereli kapak.
 */
function ThunderScientific2900({
  position = [-3.85, 0.0, 3.45],
  rotation = [0, Math.PI / 2, 0],
  targetRH,
  setTargetRH,
  currentRH,
  setCurrentRH,
  chamberTemp,
  setChamberTemp,
  doorOpen,
  setDoorOpen,
}: ThunderScientific2900Props) {
  const [powerOn, setPowerOn] = useState(true)
  const [chamberLightOn, setChamberLightOn] = useState(true)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [vaisalaUnit, setVaisalaUnit] = useState<'C' | 'F'>('C')

  // Door angle ref for smooth animation (0 = closed, 1.65 rad = ~95 deg open)
  const doorHingeRef = useRef<THREE.Group>(null)
  const currentAngleRef = useRef(doorOpen ? 1.65 : 0.0)

  // Physics simulation for 2P system approaching setpoint
  useFrame((_, delta) => {
    if (!powerOn) return

    // Smooth asymptotic approach to target RH
    if (Math.abs(currentRH - targetRH) > 0.01) {
      const step = (targetRH - currentRH) * Math.min(delta * 1.5, 0.2)
      setCurrentRH(Number((currentRH + step).toFixed(2)))
    }

    // Smooth door swinging animation
    const targetAngle = doorOpen ? 1.65 : 0.0
    currentAngleRef.current = THREE.MathUtils.lerp(
      currentAngleRef.current,
      targetAngle,
      Math.min(delta * 7.0, 0.25)
    )
    if (doorHingeRef.current) {
      doorHingeRef.current.rotation.y = currentAngleRef.current
    }
  })

  // Calculate thermodynamic Dew Point Td from Bolton / Magnus approximation
  const b = 17.67
  const c = 243.5
  const gamma = Math.log(Math.max(currentRH, 1.0) / 100.0) + (b * chamberTemp) / (c + chamberTemp)
  const calculatedDewPoint = Number(((c * gamma) / (b - gamma)).toFixed(2))

  // Calculated Saturator Pressure for Two-Pressure generation:
  // e = (P_test / P_sat) * e_s(T_sat) -> P_sat approx = P_test * (100 / RH) * f
  const pTest = 14.696
  const pSat = Number((pTest * (100.0 / Math.max(currentRH, 10.0)) * 0.72).toFixed(1))
  const tSat = Number((chamberTemp - 8.5).toFixed(1))

  // Powder blue industrial paint color matching authentic Thunder Scientific chassis
  const powderBlue = '#5297c9'
  const cartFrameColor = '#4786b8'

  // Vaisala display temperature conversion
  const dispTemp = vaisalaUnit === 'C' ? chamberTemp : Number((chamberTemp * 1.8 + 32).toFixed(1))
  const dispDew = vaisalaUnit === 'C' ? calculatedDewPoint : Number((calculatedDewPoint * 1.8 + 32).toFixed(1))

  return (
    <group position={position} rotation={rotation}>
      {/* ========================================================
          1. HEAVY-DUTY MOBILE LABORATORY CART (TEKERLEKLİ ARABA)
         ======================================================== */}
      {/* 4 Heavy-Duty Caster Wheels */}
      {[
        [-0.40, 0.40],
        [0.40, 0.40],
        [-0.40, -0.40],
        [0.40, -0.40],
      ].map(([wx, wz], idx) => (
        <group key={`wheel-${idx}`} position={[wx, 0.08, wz]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.08, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.05]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.035, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.036, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Cart Lower Shelf Platform (Zemin Rafı) */}
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <boxGeometry args={[0.92, 0.035, 0.84]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Cart 4 Vertical Leg Pillars (Square Tubular Steel) */}
      {[
        [-0.42, 0.38],
        [0.42, 0.38],
        [-0.42, -0.38],
        [0.42, -0.38],
      ].map(([px, pz], idx) => (
        <mesh key={`pillar-${idx}`} position={[px, 0.54, pz]}>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color={cartFrameColor} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Cart Middle Work Platform Shelf */}
      <mesh position={[0, 0.88, 0]} receiveShadow>
        <boxGeometry args={[0.92, 0.04, 0.84]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Push/Pull Maneuver Handle Rail on Left Side of Cart */}
      <group position={[-0.48, 0.88, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.024, 0.60]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================
          2. LOWER TIER: HIGH-PRESSURE AIR COMPRESSOR & CHILLER UNIT
         ======================================================== */}
      <group position={[0, 0.38, 0]}>
        {/* Enclosure Body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.74, 0.38, 0.66]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>

        {/* Front Dual Control Panels */}
        {[-0.20, 0.20].map((cx, idx) => (
          <group key={`ctrl-panel-${idx}`} position={[cx, 0, 0.332]}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.035, 0.03, 0.008]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <planeGeometry args={[0.16, 0.06]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.02, 0.002]}>
              <planeGeometry args={[0.13, 0.04]} />
              <meshBasicMaterial color="#1e3a5f" />
            </mesh>
            <Text position={[0, 0.02, 0.004]} fontSize={0.012} color="#38bdf8" anchorX="center" anchorY="middle" font="/fonts/arial.ttf">
              {idx === 0 ? 'COMPRESSOR: 150 PSI' : 'CHILLER: -12.4 °C'}
            </Text>
            {/* Ventilation Slots */}
            {[-0.04, -0.06, -0.08, -0.10].map((ly, lidx) => (
              <mesh key={`louver-${lidx}`} position={[0, ly, 0]}>
                <boxGeometry args={[0.16, 0.008, 0.004]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        ))}

        {/* Top Pneumatic Swagelok Coiled Hoses */}
        <group position={[0, 0.20, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.22, 0.015, 12, 36]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.18, 0.013, 12, 36]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.14, 0.012, 12, 36]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.08, 0.18, 0.02]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.014, 0.014, 0.07, 12]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          3. TOP TIER: THUNDER SCIENTIFIC 2900 GENERATOR CHASSIS
         ======================================================== */}
      <group position={[0, 1.18, 0]}>
        {/* ----------------------------------------------------
            3A. LEFT HALF: CONTROLLER & ELECTRONICS HOUSING
           ---------------------------------------------------- */}
        <mesh position={[-0.21, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.54, 0.68]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>

        {/* Central Partition Wall separating electronics from chamber */}
        <mesh position={[0.00, 0, 0]}>
          <boxGeometry args={[0.02, 0.52, 0.66]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Top Swagelok Pressure Relief Fitting on Left Unit */}
        <mesh position={[-0.28, 0.285, 0.20]}>
          <cylinderGeometry args={[0.016, 0.016, 0.03, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Side Ventilation Louvers (Left Wall) */}
        <group position={[-0.421, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <mesh key={`top-louver-${idx}`} position={[-0.15 + idx * 0.05, 0.14, 0]}>
              <planeGeometry args={[0.035, 0.007]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => (
            <mesh key={`bot-louver-${idx}`} position={[-0.15 + (idx % 4) * 0.08, -0.05 - Math.floor(idx / 4) * 0.035, 0]}>
              <planeGeometry args={[0.065, 0.009]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>

        {/* ----------------------------------------------------
            TOUCHSCREEN CONTROLLER CONSOLE (FRONT LEFT: x = -0.19)
           ---------------------------------------------------- */}
        <group position={[-0.19, 0.04, 0.341]}>
          {/* Bezel Frame */}
          <mesh position={[0, 0.02, 0]}>
            <planeGeometry args={[0.38, 0.42]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.5} />
          </mesh>

          {/* Top Brand Header Text */}
          <Text
            position={[0, 0.21, 0.005]}
            fontSize={0.010}
            color="#facc15"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            TUBİTAK UME G1NM
          </Text>

          {/* Touchscreen Glass Panel */}
          <mesh position={[0, 0.03, 0.006]}>
            <planeGeometry args={[0.34, 0.28]} />
            <meshBasicMaterial color="#020617" />
          </mesh>

          {/* Screen Content */}
          {powerOn ? (
            <group position={[0, 0.03, 0.008]}>
              {/* Top Navigation Ribbon */}
              <mesh position={[0, 0.122, 0]}>
                <planeGeometry args={[0.33, 0.024]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              <Text position={[-0.155, 0.122, 0.002]} fontSize={0.009} color="#ffffff" anchorX="left" font="/fonts/arial.ttf">
                2900 HUMIDITY CONTROLLER - 2P PRIMARY
              </Text>
              <Text position={[0.155, 0.122, 0.002]} fontSize={0.008} color="#86efac" anchorX="right" font="/fonts/arial.ttf">
                ● RUNNING (STABLE)
              </Text>

              {/* Relative Humidity (%RH) */}
              <group position={[-0.08, 0.075, 0]}>
                <mesh>
                  <planeGeometry args={[0.16, 0.05]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                <Text position={[-0.07, 0.016, 0.002]} fontSize={0.008} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                  CHAMBER HUMIDITY:
                </Text>
                <Text position={[-0.07, -0.010, 0.002]} fontSize={0.022} color="#38bdf8" anchorX="left" font="/fonts/arial.ttf">
                  {`${currentRH.toFixed(3)} %RH`}
                </Text>
              </group>

              {/* Chamber Temperature (°C) */}
              <group
                position={[-0.08, 0.020, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setChamberTemp(chamberTemp === 35 ? 25 : chamberTemp === 25 ? 50 : 35)
                }}
              >
                <mesh>
                  <planeGeometry args={[0.16, 0.045]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                <Text position={[-0.07, 0.013, 0.002]} fontSize={0.0075} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                  CHAMBER TEMP (CLICK):
                </Text>
                <Text position={[-0.07, -0.010, 0.002]} fontSize={0.017} color="#4ade80" anchorX="left" font="/fonts/arial.ttf">
                  {`${chamberTemp.toFixed(3)} °C`}
                </Text>
              </group>

              {/* Calculated Dew Point */}
              <group position={[-0.08, -0.035, 0]}>
                <mesh>
                  <planeGeometry args={[0.16, 0.045]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                <Text position={[-0.07, 0.013, 0.002]} fontSize={0.0075} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                  CALCULATED DEW POINT (Td):
                </Text>
                <Text position={[-0.07, -0.010, 0.002]} fontSize={0.017} color="#fbbf24" anchorX="left" font="/fonts/arial.ttf">
                  {`${calculatedDewPoint.toFixed(2)} °C`}
                </Text>
              </group>

              {/* Thermodynamic Pressures Box */}
              <group position={[-0.08, -0.090, 0]}>
                <mesh>
                  <planeGeometry args={[0.16, 0.042]} />
                  <meshBasicMaterial color="#09101d" />
                </mesh>
                <Text position={[-0.07, 0.010, 0.002]} fontSize={0.007} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                  {`P_sat: ${pSat} psia | T_sat: ${tSat} °C`}
                </Text>
                <Text position={[-0.07, -0.002, 0.002]} fontSize={0.007} color="#94a3b8" anchorX="left" font="/fonts/arial.ttf">
                  {`P_test = 14.696 psia | Flow = 4.0 SLPM`}
                </Text>
                <Text position={[-0.07, -0.013, 0.002]} fontSize={0.0065} color="#38bdf8" anchorX="left" font="/fonts/arial.ttf">
                  {`e = (P_test / P_sat) · es(T_sat) · f`}
                </Text>
              </group>

              {/* Right Column: Trend Graph & Presets */}
              <group position={[0.085, 0.015, 0]}>
                <mesh position={[0, 0.01, 0]}>
                  <planeGeometry args={[0.15, 0.15]} />
                  <meshBasicMaterial color="#090d16" />
                </mesh>
                <Text position={[0, 0.070, 0.002]} fontSize={0.0075} color="#64748b" anchorX="center" font="/fonts/arial.ttf">
                  STABILITY TREND
                </Text>
                <mesh position={[0, 0.035, 0.002]}>
                  <planeGeometry args={[0.13, 0.002]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <mesh position={[0, 0.010, 0.002]}>
                  <planeGeometry args={[0.13, 0.002]} />
                  <meshBasicMaterial color="#4ade80" />
                </mesh>
                <mesh position={[0, -0.015, 0.002]}>
                  <planeGeometry args={[0.13, 0.002]} />
                  <meshBasicMaterial color="#f59e0b" />
                </mesh>
                <Text position={[0, -0.035, 0.002]} fontSize={0.007} color="#4ade80" anchorX="center" font="/fonts/arial.ttf">
                  Oscillation: ±0.01 %RH
                </Text>
                {/* 4 Quick Preset Buttons: 10%, 30%, 50%, 80% RH */}
                {[
                  { rh: 10, px: -0.05 },
                  { rh: 30, px: -0.017 },
                  { rh: 50, px: 0.017 },
                  { rh: 80, px: 0.05 },
                ].map((p, pidx) => (
                  <group
                    key={`pbtn-${pidx}`}
                    position={[p.px, -0.055, 0.004]}
                    onClick={(e) => {
                      e.stopPropagation()
                      setTargetRH(p.rh)
                    }}
                  >
                    <mesh>
                      <planeGeometry args={[0.030, 0.018]} />
                      <meshBasicMaterial color={targetRH === p.rh ? '#0284c7' : '#1e293b'} />
                    </mesh>
                    <Text position={[0, 0, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                      {`${p.rh}%`}
                    </Text>
                  </group>
                ))}
              </group>

              {/* Bottom Footer Label */}
              <Text position={[0, -0.125, 0.002]} fontSize={0.0075} color="#eab308" anchorX="center" font="/fonts/arial.ttf">
                2900 HUMIDITY GENERATION SYSTEM
              </Text>
            </group>
          ) : (
            <Text position={[0, 0.03, 0.01]} fontSize={0.016} color="#ef4444" anchorX="center" font="/fonts/arial.ttf">
              POWER OFF
            </Text>
          )}

          {/* Bottom Physical Pushbutton Controls */}
          <group position={[0, -0.165, 0.005]}>
            {/* Step -5% RH */}
            <group
              position={[-0.13, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setTargetRH(Math.max(10, targetRH - 5))
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredBtn('rh-down')
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                setHoveredBtn(null)
              }}
            >
              <mesh>
                <planeGeometry args={[0.08, 0.032]} />
                <meshBasicMaterial color={hoveredBtn === 'rh-down' ? '#dc2626' : '#b91c1c'} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.008} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                ▼ AZALT (%5)
              </Text>
            </group>

            {/* Step +5% RH */}
            <group
              position={[-0.04, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setTargetRH(Math.min(95, targetRH + 5))
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredBtn('rh-up')
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                setHoveredBtn(null)
              }}
            >
              <mesh>
                <planeGeometry args={[0.08, 0.032]} />
                <meshBasicMaterial color={hoveredBtn === 'rh-up' ? '#16a34a' : '#15803d'} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.008} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                ▲ ARTIR (%5)
              </Text>
            </group>

            {/* Chamber Light Toggle */}
            <group
              position={[0.05, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setChamberLightOn((prev) => !prev)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredBtn('light-btn')
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                setHoveredBtn(null)
              }}
            >
              <mesh>
                <planeGeometry args={[0.07, 0.032]} />
                <meshBasicMaterial color={hoveredBtn === 'light-btn' ? '#0284c7' : '#334155'} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.008} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                {chamberLightOn ? '💡 IŞIK AÇIK' : '💡 IŞIK KAPALI'}
              </Text>
            </group>

            {/* Power Switch */}
            <group
              position={[0.13, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setPowerOn((prev) => !prev)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredBtn('pwr-btn')
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                setHoveredBtn(null)
              }}
            >
              <mesh>
                <planeGeometry args={[0.08, 0.032]} />
                <meshBasicMaterial color={hoveredBtn === 'pwr-btn' ? (powerOn ? '#059669' : '#475569') : (powerOn ? '#047857' : '#334155')} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.008} color="#ffffff" anchorX="center" font="/fonts/arial.ttf">
                {powerOn ? 'PWR ON' : 'OFF'}
              </Text>
            </group>
          </group>
        </group>

        {/* ----------------------------------------------------
            3B. RIGHT HALF: REAL HOLLOW TEST CHAMBER CAVITY (AÇIK ALAN / BOŞLUK)
           ---------------------------------------------------- */}
        {/* Right Outer Casing Shell (Top, Bottom, Back, Right Wall) */}
        {/* Chamber Top Roof Shell */}
        <mesh position={[0.21, 0.255, 0]}>
          <boxGeometry args={[0.42, 0.03, 0.68]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Chamber Bottom Floor Shell */}
        <mesh position={[0.21, -0.255, 0]}>
          <boxGeometry args={[0.42, 0.03, 0.68]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Chamber Back Wall Shell */}
        <mesh position={[0.21, 0, -0.325]}>
          <boxGeometry args={[0.42, 0.48, 0.03]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Chamber Right Outer Wall Shell */}
        <mesh position={[0.405, 0, 0]}>
          <boxGeometry args={[0.03, 0.48, 0.68]} />
          <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
        </mesh>

        {/* ========================================================
            POLISHED STAINLESS STEEL INTERIOR CHAMBER LINING (İÇ AYNA YÜZEY)
           ======================================================== */}
        <group position={[0.20, 0, 0]}>
          {/* Chamber Back Mirror Wall */}
          <mesh position={[0, 0, -0.30]}>
            <planeGeometry args={[0.38, 0.46]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Chamber Ceiling Liner */}
          <mesh position={[0, 0.235, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.38, 0.60]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Chamber Floor Liner */}
          <mesh position={[0, -0.235, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.38, 0.60]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Left Partition Stainless Interior Wall */}
          <mesh position={[-0.19, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.60, 0.46]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
          </mesh>
          {/* Right Stainless Interior Wall */}
          <mesh position={[0.19, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.60, 0.46]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
          </mesh>

          {/* Chamber Top Interior LED Lighting Fixture Strip */}
          <mesh position={[0, 0.228, 0.05]}>
            <boxGeometry args={[0.32, 0.012, 0.03]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          {powerOn && chamberLightOn && (
            <>
              <mesh position={[0, 0.222, 0.05]}>
                <planeGeometry args={[0.30, 0.024]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
              <pointLight position={[0, 0.18, 0.02]} color="#fef9c3" intensity={2.2} distance={1.2} />
            </>
          )}

          {/* ========================================================
              PASLANMAZ ÇELİK TEST RAFI (1 ADET RAF)
             ======================================================== */}
          <group position={[0, -0.06, 0.02]}>
            {/* Left & Right Shelf Wall Support Brackets */}
            <mesh position={[-0.185, -0.01, 0]}>
              <boxGeometry args={[0.01, 0.015, 0.44]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.185, -0.01, 0]}>
              <boxGeometry args={[0.01, 0.015, 0.44]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Perforated Stainless Steel Shelf Plate */}
            <mesh receiveShadow castShadow>
              <boxGeometry args={[0.36, 0.008, 0.46]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
            </mesh>

            {/* Shelf Front Safety Lip */}
            <mesh position={[0, 0.008, 0.228]}>
              <boxGeometry args={[0.36, 0.012, 0.006]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
            </mesh>

            {/* Wire-mesh grid perforations visual overlay */}
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.34, 0.44]} />
              <meshStandardMaterial color="#64748b" wireframe={true} metalness={0.8} />
            </mesh>

            {/* ========================================================
                VAISALA DEW POINT & NEM/SICAKLIK ÖLÇER CİHAZI (RAF ÜZERİNDE)
               ======================================================== */}
            {/* 1. VAISALA EL TİPİ GÖSTERGE & ANA ÜNİTE (INDIGO / DM70 / DRYCAP) */}
            <group
              position={[-0.05, 0.025, 0.08]}
              rotation={[-0.12, 0.08, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setVaisalaUnit((u) => (u === 'C' ? 'F' : 'C'))
              }}
              onPointerOver={() => setHoveredBtn('vaisala-unit')}
              onPointerOut={() => setHoveredBtn(null)}
            >
              {/* Ergonomic Dark Blue / Charcoal Rubberized Housing */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.086, 0.034, 0.165]} />
                <meshStandardMaterial color="#023e7d" roughness={0.4} metalness={0.2} />
              </mesh>

              {/* Top Face Accent Plate */}
              <mesh position={[0, 0.0175, 0]}>
                <planeGeometry args={[0.082, 0.158]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.3} />
              </mesh>

              {/* Official White VAISALA Brand Header */}
              <Text
                position={[0, 0.0185, 0.062]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.0095}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                VAISALA
              </Text>
              <Text
                position={[0, 0.0185, 0.050]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.0055}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                DRYCAP® / HUMICAP® REFERENCE
              </Text>

              {/* Backlit Graphic LCD Screen */}
              <mesh position={[0, 0.0185, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.074, 0.068]} />
                <meshBasicMaterial color="#042f2e" />
              </mesh>

              {/* Live Vaisala Digital Readings */}
              <group position={[0, 0.0195, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
                {/* Line 1: Dew Point */}
                <Text position={[-0.033, 0.024, 0]} fontSize={0.0068} color="#2dd4bf" anchorX="left" font="/fonts/arial.ttf">
                  {`Td:  ${dispDew} °${vaisalaUnit}`}
                </Text>
                {/* Line 2: Relative Humidity */}
                <Text position={[-0.033, 0.010, 0]} fontSize={0.0068} color="#2dd4bf" anchorX="left" font="/fonts/arial.ttf">
                  {`RH:  ${currentRH.toFixed(1)} %RH`}
                </Text>
                {/* Line 3: Temperature */}
                <Text position={[-0.033, -0.004, 0]} fontSize={0.0068} color="#2dd4bf" anchorX="left" font="/fonts/arial.ttf">
                  {`T:   ${dispTemp} °${vaisalaUnit}`}
                </Text>
                {/* Line 4: Status Indicator */}
                <Text position={[-0.033, -0.018, 0]} fontSize={0.0055} color="#86efac" anchorX="left" font="/fonts/arial.ttf">
                  {`P: 1013.2 hPa | ● STABLE`}
                </Text>
                {/* Click toggle hint */}
                <Text position={[0, -0.028, 0]} fontSize={0.0042} color="#94a3b8" anchorX="center" font="/fonts/arial.ttf">
                  (Click to toggle °C/°F)
                </Text>
              </group>

              {/* Keypad Buttons (Hold, Unit, Mode, Power) */}
              {[-0.024, -0.008, 0.008, 0.024].map((bx, bidx) => (
                <mesh key={`v-key-${bidx}`} position={[bx, 0.019, -0.046]}>
                  <boxGeometry args={[0.012, 0.003, 0.010]} />
                  <meshStandardMaterial color={bidx === 3 ? '#ef4444' : '#334155'} roughness={0.6} />
                </mesh>
              ))}
            </group>

            {/* 2. VAISALA PASLANMAZ ÇELİK ÖLÇÜM PROBU & STANDI (PROBE CRADLE) */}
            <group position={[0.10, 0.015, 0.05]}>
              {/* Silicone / Anodized Probe Stand Cradle */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.036, 0.018, 0.06]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.01, 0]}>
                <cylinderGeometry args={[0.011, 0.011, 0.06, 16]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>

              {/* Stainless Steel Vaisala Probe Body */}
              <group position={[0, 0.014, 0]} rotation={[0, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.12, 20]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Sintered Stainless Steel / PTFE Filter Cap on Tip */}
                <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.032, 20]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.75} roughness={0.4} />
                </mesh>
                {/* Sensor Tip Aperture Ring */}
                <mesh position={[0, 0, 0.086]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.002, 16]} />
                  <meshBasicMaterial color="#0284c7" />
                </mesh>
                {/* Laser Engraved Collar */}
                <Text
                  position={[0, 0.009, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  fontSize={0.0048}
                  color="#1e293b"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  VAISALA HUMICAP® / DRYCAP® PROBE
                </Text>
              </group>

              {/* Coiled Black Connection Cable linking probe to Vaisala indicator unit */}
              <mesh position={[-0.07, 0.004, -0.06]} rotation={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.14, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ----------------------------------------------------
            3C. OPENABLE / CLOSABLE TEST CHAMBER DOOR (KAPAK)
           ---------------------------------------------------- */}
        {/* Door Hinge Pivot Point: mounted on the RIGHT front edge [x = 0.405, z = 0.34] */}
        <group ref={doorHingeRef} position={[0.405, 0, 0.341]}>
          {/* Door Panel Body (Hinged to swing open to the right) */}
          <group
            position={[-0.20, 0, 0]}
            onClick={(e) => {
              e.stopPropagation()
              setDoorOpen((prev) => !prev)
            }}
          >
            {/* Outer Insulated Door Frame (Powder Blue with Center Cutout) */}
            {/* Left vertical border */}
            <mesh position={[-0.175, 0, 0]}>
              <boxGeometry args={[0.05, 0.48, 0.035]} />
              <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
            </mesh>
            {/* Right vertical border */}
            <mesh position={[0.175, 0, 0]}>
              <boxGeometry args={[0.05, 0.48, 0.035]} />
              <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
            </mesh>
            {/* Top horizontal border */}
            <mesh position={[0, 0.215, 0]}>
              <boxGeometry args={[0.30, 0.05, 0.035]} />
              <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
            </mesh>
            {/* Bottom horizontal border */}
            <mesh position={[0, -0.215, 0]}>
              <boxGeometry args={[0.30, 0.05, 0.035]} />
              <meshStandardMaterial color={powderBlue} roughness={0.35} metalness={0.3} />
            </mesh>

            {/* Inner Perimeter Rubber Gasket Seal */}
            <mesh position={[0, 0, -0.019]}>
              <boxGeometry args={[0.39, 0.47, 0.003]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>

            {/* Double-Pane Heated Viewing Window (Transparent Glass) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.30, 0.38, 0.010]} />
              <meshStandardMaterial
                color="#bae6fd"
                transparent
                opacity={0.32}
                metalness={0.1}
                roughness={0.05}
              />
            </mesh>

            {/* Anodized Aluminum Window Bezel Frame */}
            <mesh position={[0, 0, 0.006]}>
              <boxGeometry args={[0.306, 0.386, 0.004]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} wireframe={true} />
            </mesh>

            {/* Heavy-Duty Compression Lever Latch / Handle on Left Edge */}
            <group position={[-0.18, 0, 0.025]}>
              <mesh>
                <boxGeometry args={[0.025, 0.065, 0.018]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
              <mesh position={[0.04, 0, 0.008]}>
                <boxGeometry args={[0.07, 0.020, 0.012]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          </group>

          {/* Stainless Steel Heavy-Duty Hinges on Right Frame */}
          {[-0.16, 0.16].map((hy, idx) => (
            <mesh key={`hinge-${idx}`} position={[0, hy, 0.01]}>
              <cylinderGeometry args={[0.012, 0.012, 0.05, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================
          4. FLOOR SHADOW & BASE METROLOGY IDENTITY BADGE
         ======================================================== */}
      <mesh position={[0, 0.002, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.88, 0.12]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.003, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.89, 0.13]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <Text
        position={[0, 0.005, 0.56]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.018}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME 2P İKİ-BASINÇLI NEM JENERATÖRÜ İSTASYONU
      </Text>
      <Text
        position={[0, 0.005, 0.60]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.013}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME G1NM (ARALIK: %10 RH - %95 RH, -10 °C ila 70 °C)
      </Text>
    </group>
  )
}

export default memo(ThunderScientific2900)
