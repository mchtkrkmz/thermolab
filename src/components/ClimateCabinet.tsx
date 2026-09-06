import { useRef, useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface ClimateCabinetProps {
  position: [number, number, number]
  targetTemp: number
  setTargetTemp: React.Dispatch<React.SetStateAction<number>>
  currentTemp: number
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>
  targetHum: number
  setTargetHum: React.Dispatch<React.SetStateAction<number>>
  currentHum: number
  setCurrentHum: React.Dispatch<React.SetStateAction<number>>
}

// Customer calibration unit under test (KEC: Kalibrasyon Edilen Cihaz)
function InternalSensor({
  position,
  rotation = [0, 0, 0],
  temp,
  hum,
  code = 'KEC-1',
  tempOffset = 0,
  humOffset = 0
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  temp: number
  hum: number
  code?: string
  tempOffset?: number
  humOffset?: number
}) {
  const displayTemp = temp + tempOffset
  const displayHum = Math.max(0, Math.min(100, hum + humOffset))

  return (
    <group position={position} rotation={rotation}>
      {/* Molded Enclosure Body */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[0.095, 0.115, 0.038]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Recessed Screen Bezel */}
      <mesh position={[0, 0.012, 0.02]}>
        <boxGeometry args={[0.084, 0.076, 0.004]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* High-Contrast LCD / OLED Screen Glass */}
      <mesh position={[0, 0.012, 0.023]}>
        <planeGeometry args={[0.08, 0.072]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      {/* Status LED Indicator */}
      <mesh position={[-0.03, 0.038, 0.024]}>
        <circleGeometry args={[0.0025, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      {/* Sensor Code & Calibration Tag */}
      <Text
        position={[0.002, 0.040, 0.024]}
        fontSize={0.0085}
        color="#38bdf8"
        anchorX="center"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        {code}
      </Text>
      <Text
        position={[0.002, 0.031, 0.024]}
        fontSize={0.005}
        color="#94a3b8"
        anchorX="center"
        font="/fonts/arial.ttf"
      >
        MÜŞTERİ CİHAZI
      </Text>
      {/* Temperature Value (Glowing Amber-Red) */}
      <Text
        position={[-0.032, 0.017, 0.024]}
        fontSize={0.007}
        color="#ef4444"
        anchorX="left"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        T:
      </Text>
      <Text
        position={[0.032, 0.017, 0.024]}
        fontSize={0.0155}
        color="#fca5a5"
        anchorX="right"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        {displayTemp.toFixed(1)}°C
      </Text>
      {/* Humidity Value (Glowing Sky-Blue) */}
      <Text
        position={[-0.032, -0.006, 0.024]}
        fontSize={0.007}
        color="#0ea5e9"
        anchorX="left"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        RH:
      </Text>
      <Text
        position={[0.032, -0.006, 0.024]}
        fontSize={0.0155}
        color="#7dd3fc"
        anchorX="right"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        {displayHum.toFixed(1)}%
      </Text>
      {/* Calibration Error / Offset Tag */}
      <Text
        position={[0, -0.021, 0.024]}
        fontSize={0.0055}
        color="#eab308"
        anchorX="center"
        font="/fonts/arial.ttf"
      >
        ΔT:{tempOffset >= 0 ? '+' : ''}{tempOffset.toFixed(1)}° | ΔRH:{humOffset >= 0 ? '+' : ''}{humOffset.toFixed(1)}%
      </Text>
      {/* Tilt Stand */}
      <mesh position={[0, -0.045, -0.012]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.05, 0.025, 0.035]} />
        <meshStandardMaterial color="#64748b" roughness={0.5} />
      </mesh>
    </group>
  )
}

function ClimateCabinet({
  position,
  targetTemp,
  setTargetTemp,
  currentTemp,
  setCurrentTemp,
  targetHum,
  setTargetHum,
  currentHum,
  setCurrentHum
}: ClimateCabinetProps) {
  const doorRef = useRef<THREE.Group>(null)
  const [isOpen, setIsOpen] = useState(false)
  const throttleTimerRef = useRef(0)

  // Interactive customer devices under test (KEC: Kalibrasyon Edilen Cihaz)
  // Each customer device has realistic sensor offsets/deviations relative to the reference chamber
  const [sensors, setSensors] = useState<{
    id: number
    code: string
    name: string
    tempOffset: number
    humOffset: number
    x: number
    y: number
    z: number
    shelf: 'lower' | 'upper'
  }[]>([
    {
      id: 1,
      code: 'KEC-1',
      name: 'KEC-1 (Müşteri Cihazı 1)',
      tempOffset: 0.1, // Ref: 25.0°C / 50.0% -> KEC-1: 25.1°C / 49.5%
      humOffset: -0.5,
      x: -0.16,
      y: 1.06,
      z: 0.18,
      shelf: 'lower'
    },
    {
      id: 2,
      code: 'KEC-2',
      name: 'KEC-2 (Müşteri Cihazı 2)',
      tempOffset: -0.3, // Ref: 25.0°C / 50.0% -> KEC-2: 24.7°C / 51.2%
      humOffset: 1.2,
      x: 0.00,
      y: 1.06,
      z: 0.22,
      shelf: 'lower'
    },
    {
      id: 3,
      code: 'KEC-3',
      name: 'KEC-3 (Müşteri Cihazı 3)',
      tempOffset: 0.4, // Ref: 25.0°C / 50.0% -> KEC-3: 25.4°C / 48.4%
      humOffset: -1.6,
      x: 0.16,
      y: 1.06,
      z: 0.18,
      shelf: 'lower'
    }
  ])
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null)

  const moveSensor = useCallback((id: number, dx: number, dz: number) => {
    setSensors((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const nextX = Math.max(-0.27, Math.min(0.27, s.x + dx))
        const nextZ = Math.max(-0.28, Math.min(0.28, s.z + dz))
        return { ...s, x: Number(nextX.toFixed(3)), z: Number(nextZ.toFixed(3)) }
      })
    )
  }, [])

  const toggleShelf = useCallback((id: number) => {
    setSensors((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const nextShelf = s.shelf === 'lower' ? 'upper' : 'lower'
        const nextY = nextShelf === 'upper' ? 1.40 : 1.06
        return { ...s, shelf: nextShelf, y: nextY }
      })
    )
  }, [])

  // Keyboard navigation support for selected sensor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSensorId) return
      if (e.key === 'ArrowLeft') {
        moveSensor(selectedSensorId, -0.04, 0)
      } else if (e.key === 'ArrowRight') {
        moveSensor(selectedSensorId, 0.04, 0)
      } else if (e.key === 'ArrowUp') {
        moveSensor(selectedSensorId, 0, -0.04)
      } else if (e.key === 'ArrowDown') {
        moveSensor(selectedSensorId, 0, 0.04)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSensorId, moveSensor])

  // Simulation parameters in refs to avoid per-frame React re-renders
  const currentTempRef = useRef(currentTemp)
  currentTempRef.current = currentTemp
  const currentHumRef = useRef(currentHum)
  currentHumRef.current = currentHum

  // Reusable materials
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Clean laboratory light gray
        roughness: 0.35,
        metalness: 0.15
      }),
    []
  )

  const darkPanelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b', // Deep industrial slate
        roughness: 0.5,
        metalness: 0.25
      }),
    []
  )

  const gasketMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#090d16', // Matte black silicone sealing rubber
        roughness: 0.95,
        metalness: 0.05
      }),
    []
  )

  const stainlessMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        metalness: 0.9,
        roughness: 0.18
      }),
    []
  )

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0f9ff',
        transparent: true,
        opacity: 0.08, // Crystal-clear multi-pane heated glass
        roughness: 0.02,
        metalness: 0.05,
        depthWrite: false, // Ensures internal sensors and illumination are 100% visible
        side: THREE.DoubleSide
      }),
    []
  )

  // Smooth door animation and throttled climate convergence
  useFrame((_, delta) => {
    // 1. Smooth 60/90Hz Door Rotation
    if (doorRef.current) {
      const targetRot = isOpen ? -Math.PI / 2 : 0
      doorRef.current.rotation.y += (targetRot - doorRef.current.rotation.y) * delta * 5
    }

    // 2. Throttled Climate Convergence (10Hz) to prevent main-thread stutter
    throttleTimerRef.current += delta
    if (throttleTimerRef.current >= 0.1) {
      const dt = throttleTimerRef.current
      throttleTimerRef.current = 0

      // Temperature convergence
      if (Math.abs(currentTempRef.current - targetTemp) > 0.05) {
        const actualTarget = isOpen ? 25 : targetTemp
        const diffT = Math.abs(actualTarget - currentTempRef.current)
        const move = (isOpen ? 8.0 : 3.0) * dt
        const nextT =
          currentTempRef.current +
          (actualTarget > currentTempRef.current ? 1 : -1) * Math.min(diffT, move)
        setCurrentTemp(Number(nextT.toFixed(2)))
      }

      // Humidity convergence
      if (Math.abs(currentHumRef.current - targetHum) > 0.1) {
        const actualTargetH = isOpen ? 40 : targetHum
        const diffH = Math.abs(actualTargetH - currentHumRef.current)
        const moveH = (isOpen ? 15.0 : 5.0) * dt
        const nextH =
          currentHumRef.current +
          (actualTargetH > currentHumRef.current ? 1 : -1) * Math.min(diffH, moveH)
        setCurrentHum(Number(nextH.toFixed(1)))
      }
    }
  })

  // Dimensions:
  // Cabinet outer: width = 0.80m, height = 1.70m, depth = 0.85m
  // Front face at z = 0.425
  // Clear chamber door aperture: width = 0.68m (x: -0.34 to +0.34), height = 1.08m (y: 0.60 to 1.68)
  // Insulated Door: width = 0.75m (x: -0.375 to +0.375), height = 1.12m (y: 0.58 to 1.70)
  // Result: Total overlap of 35mm on sides and 20mm on top/bottom with 100% perimeter seal.

  return (
    <group position={position}>
      {/* ==================================================================== */}
      {/* 1. SOLID HOLLOW MAIN CABINET BODY ENCLOSURE                          */}
      {/* ==================================================================== */}

      {/* Back Wall */}
      <mesh position={[0, 0.95, -0.425]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.80, 1.70, 0.05]} />
      </mesh>

      {/* Left Wall with 10cm x 10cm Dew-Point Mirror Cable Penetration Port */}
      {/* Bottom section */}
      <mesh position={[-0.375, 0.50, 0]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.80, 0.80]} />
      </mesh>
      {/* Top section */}
      <mesh position={[-0.375, 1.40, 0]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.80, 0.80]} />
      </mesh>
      {/* Front piece (beside port hole) */}
      <mesh position={[-0.375, 0.95, 0.225]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.10, 0.35]} />
      </mesh>
      {/* Back piece (beside port hole) */}
      <mesh position={[-0.375, 0.95, -0.225]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.10, 0.35]} />
      </mesh>
      {/* Port Flange & Rubber Seal Ring */}
      <mesh position={[-0.375, 0.95, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.054, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[0.375, 0.95, 0]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.05, 1.70, 0.80]} />
      </mesh>

      {/* Top Roof Wall */}
      <mesh position={[0, 1.775, 0]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.70, 0.05, 0.80]} />
      </mesh>

      {/* Bottom Floor Wall */}
      <mesh position={[0, 0.125, 0]} material={bodyMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.70, 0.05, 0.80]} />
      </mesh>

      {/* ==================================================================== */}
      {/* 2. SOLID FRONT FACE FRAME (COMPLETELY CLOSES SIDES & TOP/BOTTOM)     */}
      {/* ==================================================================== */}

      {/* A. Top Front Header Fascia (Spans full width x: -0.40 to +0.40, y: 1.68 to 1.80) */}
      <mesh position={[0, 1.74, 0.405]} material={bodyMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.80, 0.12, 0.05]} />
      </mesh>

      {/* Prominent mchtkrkmz Brand Text & Metrology Badge on Top Header */}
      <group position={[0, 1.74, 0.432]}>
        <Text
          position={[0, 0.016, 0]}
          fontSize={0.034}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          ZHL_AKBLT
        </Text>
        <Text
          position={[0, -0.016, 0]}
          fontSize={0.012}
          color="#475569"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          CLIMATIC TEST CHAMBER  | G1TD
        </Text>
      </group>

      {/* B. Bottom Front Compressor & Ventilation Compartment (y: 0.10 to 0.60) */}
      <mesh position={[0, 0.35, 0.405]} material={darkPanelMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.80, 0.50, 0.05]} />
      </mesh>

      {/* Ventilation Louvers & Service Grille on Bottom Panel */}
      <group position={[0, 0.35, 0.432]}>
        <mesh>
          <planeGeometry args={[0.72, 0.42]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {[-0.15, -0.09, -0.03, 0.03, 0.09, 0.15].map((ly, lIdx) => (
          <mesh key={`louver-${lIdx}`} position={[0, ly, 0.002]}>
            <boxGeometry args={[0.68, 0.018, 0.004]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
        ))}
        {/* Service Keyhole Latch */}
        <mesh position={[0.31, 0.15, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.004, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* C. Left Solid Front Jamb (x: -0.40 to -0.34, y: 0.60 to 1.68) */}
      <mesh position={[-0.37, 1.14, 0.405]} material={bodyMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.06, 1.08, 0.05]} />
      </mesh>

      {/* D. Right Solid Front Jamb (x: +0.34 to +0.40, y: 0.60 to 1.68) */}
      <mesh position={[0.37, 1.14, 0.405]} material={bodyMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.06, 1.08, 0.05]} />
      </mesh>

      {/* ==================================================================== */}
      {/* 3. HEAVY-DUTY PERIMETER SILICONE SEAL GASKET (SEATING RECESS)        */}
      {/* ==================================================================== */}
      <group position={[0, 1.14, 0.431]}>
        {/* Left seal strip */}
        <mesh position={[-0.342, 0, 0]} material={gasketMaterial}>
          <boxGeometry args={[0.024, 1.08, 0.008]} />
        </mesh>
        {/* Right seal strip */}
        <mesh position={[0.342, 0, 0]} material={gasketMaterial}>
          <boxGeometry args={[0.024, 1.08, 0.008]} />
        </mesh>
        {/* Top seal strip */}
        <mesh position={[0, 0.535, 0]} material={gasketMaterial}>
          <boxGeometry args={[0.708, 0.024, 0.008]} />
        </mesh>
        {/* Bottom seal strip */}
        <mesh position={[0, -0.535, 0]} material={gasketMaterial}>
          <boxGeometry args={[0.708, 0.024, 0.008]} />
        </mesh>
      </group>

      {/* ==================================================================== */}
      {/* 4. INTERNAL TEST CHAMBER LIGHTING, SHELVES & SENSORS                 */}
      {/* ==================================================================== */}
      {/* Chamber LED Task Lighting (Bright and clear so items inside are vivid) */}
      <pointLight position={[0, 1.62, 0.1]} intensity={1.5} distance={2.5} color="#ffffff" />
      <pointLight position={[0, 1.25, 0.25]} intensity={0.8} distance={1.8} color="#f0f9ff" />
      <mesh position={[0, 1.74, 0]}>
        <boxGeometry args={[0.55, 0.015, 0.55]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>

      {/* Vertical Corner LED Light Bars */}
      {[-0.33, 0.33].map((lx, lIdx) => (
        <mesh key={`led-bar-${lIdx}`} position={[lx, 1.15, 0.35]}>
          <boxGeometry args={[0.012, 0.95, 0.012]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* 2 Stainless Steel Grid Shelves Aligned with Glass Window (Window is y=0.99m to 1.59m) */}
      {[1.04, 1.38].map((y, i) => (
        <mesh key={`shelf-${i}`} position={[0, y, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.67, 0.012, 0.70]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} wireframe={true} />
        </mesh>
      ))}

      {/* Interactive Repositionable Humidity & Temperature Devices */}
      {sensors.map((s) => {
        const isSel = selectedSensorId === s.id
        return (
          <group
            key={`sensor-${s.id}`}
            position={[s.x, s.y, s.z]}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedSensorId((prev) => (prev === s.id ? null : s.id))
            }}
          >
            {/* Active Selection Glow Ring on shelf surface */}
            {isSel && (
              <mesh position={[0, -0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.065, 0.088, 32]} />
                <meshBasicMaterial color="#22c55e" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Sensor Display Unit */}
            <InternalSensor
              position={[0, 0, 0]}
              rotation={[-0.15, 0, 0]}
              temp={currentTemp}
              hum={currentHum}
              code={s.code}
              tempOffset={s.tempOffset}
              humOffset={s.humOffset}
            />

            {/* Interactive 3D Directional Nav-Pad (SOL, SAĞ, İLERİ, GERİ, RAF) */}
            {isSel && (
              <group position={[0, 0.16, 0]}>
                {/* Background card */}
                <mesh>
                  <planeGeometry args={[0.30, 0.22]} />
                  <meshBasicMaterial color="#090d16" transparent opacity={0.94} />
                </mesh>

                {/* Header Title */}
                <Text
                  position={[0, 0.088, 0.005]}
                  fontSize={0.012}
                  color="#38bdf8"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  {s.code} MÜŞTERİ CİHAZI KALİBRASYONU
                </Text>

                {/* Live Calibration Readout */}
                <Text
                  position={[0, 0.070, 0.005]}
                  fontSize={0.0085}
                  color="#fca5a5"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  ÖLÇÜLEN: {(currentTemp + s.tempOffset).toFixed(1)}°C  |  {Math.max(0, Math.min(100, currentHum + s.humOffset)).toFixed(1)}% RH
                </Text>
                <Text
                  position={[0, 0.054, 0.005]}
                  fontSize={0.008}
                  color="#eab308"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  SAPMA: ΔT = {s.tempOffset >= 0 ? '+' : ''}{s.tempOffset.toFixed(1)}°C  |  ΔRH = {s.humOffset >= 0 ? '+' : ''}{s.humOffset.toFixed(1)}%
                </Text>

                {/* Sol Button [ ◀ SOL ] */}
                <group
                  position={[-0.08, 0.015, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSensor(s.id, -0.04, 0)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.06, 0.026, 0.008]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.005]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                    ◀ SOL
                  </Text>
                </group>

                {/* Sağ Button [ SAĞ ▶ ] */}
                <group
                  position={[0.08, 0.015, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSensor(s.id, 0.04, 0)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.06, 0.026, 0.008]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.005]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                    SAĞ ▶
                  </Text>
                </group>

                {/* İleri Button [ ▲ İLERİ ] (Daha derine / arkaya) */}
                <group
                  position={[0, 0.030, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSensor(s.id, 0, -0.04)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.07, 0.026, 0.008]} />
                    <meshStandardMaterial color="#065f46" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.005]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                    ▲ İLERİ
                  </Text>
                </group>

                {/* Geri Button [ ▼ GERİ ] (Öne / kapıya doğru) */}
                <group
                  position={[0, -0.012, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveSensor(s.id, 0, 0.04)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.07, 0.026, 0.008]} />
                    <meshStandardMaterial color="#065f46" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.005]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                    ▼ GERİ
                  </Text>
                </group>

                {/* Raf Değiştirme Butonu [ ⇪ ÜST RAFA / ⇩ ALT RAFA ] */}
                <group
                  position={[0, -0.056, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShelf(s.id)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.20, 0.026, 0.008]} />
                    <meshStandardMaterial color="#854d0e" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.005]} fontSize={0.009} color="#fef08a" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                    {s.shelf === 'lower' ? '⇪ ÜST RAFA TAŞI' : '⇩ ALT RAFA TAŞI'}
                  </Text>
                </group>

                <Text
                  position={[0, -0.084, 0.005]}
                  fontSize={0.007}
                  color="#94a3b8"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  (Klavyeden Ok Tuşlarıyla da Taşınabilir)
                </Text>
              </group>
            )}
          </group>
        )
      })}

      {/* ==================================================================== */}
      {/* 5. HEAVY-DUTY INSULATED HINGED DOOR WITH OVERLAPPING SEAL LIP        */}
      {/* Hinge Pivot on Left at x = -0.375, z = 0.435                         */}
      {/* Door width = 0.75m -> centers precisely at world x = 0 when closed   */}
      {/* ==================================================================== */}
      <group ref={doorRef} position={[-0.375, 0, 0.435]}>
        {/* Door group origin is at hinge line (local x = 0) */}
        {/* When closed, door spans from local x = 0 to local x = 0.75 */}
        {/* Center of door elements is at local x = 0.375 */}

        {/* ------------------------------------------------------------------ */}
        {/* Robust Industrial Stainless Steel Hinges                           */}
        {/* ------------------------------------------------------------------ */}
        {[0.72, 1.55].map((hy, hIdx) => (
          <group key={`hinge-${hIdx}`} position={[0.005, hy, 0.015]}>
            {/* Hinge Pin Barrel */}
            <mesh material={stainlessMaterial}>
              <cylinderGeometry args={[0.014, 0.014, 0.08, 16]} />
            </mesh>
            {/* Cabinet Leaf */}
            <mesh position={[-0.015, 0, -0.015]} material={stainlessMaterial}>
              <boxGeometry args={[0.03, 0.06, 0.008]} />
            </mesh>
            {/* Door Leaf */}
            <mesh position={[0.015, 0, 0.01]} material={stainlessMaterial}>
              <boxGeometry args={[0.03, 0.06, 0.008]} />
            </mesh>
          </group>
        ))}

        {/* ------------------------------------------------------------------ */}
        {/* Door Main Insulated Structure (Anthracite Powder-Coated Steel)      */}
        {/* Total dimensions: width 0.75m, height 1.12m, thickness 0.04m      */}
        {/* ------------------------------------------------------------------ */}
        <group position={[0.375, 1.14, 0.02]}>
          {/* Left Stile Frame (local dx: -0.305, width: 0.14) */}
          <mesh position={[-0.305, 0, 0]} material={darkPanelMaterial} castShadow>
            <boxGeometry args={[0.14, 1.12, 0.04]} />
          </mesh>

          {/* Right Stile Frame (local dx: +0.305, width: 0.14) */}
          <mesh position={[0.305, 0, 0]} material={darkPanelMaterial} castShadow>
            <boxGeometry args={[0.14, 1.12, 0.04]} />
          </mesh>

          {/* Top Rail Frame (local dy: +0.505, height: 0.11) */}
          <mesh position={[0, 0.505, 0]} material={darkPanelMaterial} castShadow>
            <boxGeometry args={[0.47, 0.11, 0.04]} />
          </mesh>

          {/* Bottom Panel Section (local dy: -0.355, height: 0.41) */}
          <mesh position={[0, -0.355, 0]} material={darkPanelMaterial} castShadow>
            <boxGeometry args={[0.47, 0.41, 0.04]} />
          </mesh>

          {/* Perimeter Door Gasket on rear of door (Hollow center so window is completely clear) */}
          <group position={[0, 0, -0.021]}>
            <mesh position={[-0.35, 0, 0]} material={gasketMaterial}>
              <boxGeometry args={[0.038, 1.10, 0.004]} />
            </mesh>
            <mesh position={[0.35, 0, 0]} material={gasketMaterial}>
              <boxGeometry args={[0.038, 1.10, 0.004]} />
            </mesh>
            <mesh position={[0, 0.535, 0]} material={gasketMaterial}>
              <boxGeometry args={[0.73, 0.038, 0.004]} />
            </mesh>
            <mesh position={[0, -0.535, 0]} material={gasketMaterial}>
              <boxGeometry args={[0.73, 0.038, 0.004]} />
            </mesh>
          </group>

          {/* ---------------------------------------------------------------- */}
          {/* Inspection Window (Anti-Condensation Heated Multi-Pane Glass)    */}
          {/* Window Center at local dy: +0.15 (world y = 1.29)                */}
          {/* 100% HOLLOW APERTURE - ZERO OCCLUDING BOXES                      */}
          {/* ---------------------------------------------------------------- */}
          <group position={[0, 0.15, 0]}>
            {/* Stainless Steel Inner Window Frame (Perimeter Border Strips) */}
            <mesh position={[-0.233, 0, 0.002]} material={stainlessMaterial}>
              <boxGeometry args={[0.012, 0.60, 0.038]} />
            </mesh>
            <mesh position={[0.233, 0, 0.002]} material={stainlessMaterial}>
              <boxGeometry args={[0.012, 0.60, 0.038]} />
            </mesh>
            <mesh position={[0, 0.297, 0.002]} material={stainlessMaterial}>
              <boxGeometry args={[0.478, 0.012, 0.038]} />
            </mesh>
            <mesh position={[0, -0.297, 0.002]} material={stainlessMaterial}>
              <boxGeometry args={[0.478, 0.012, 0.038]} />
            </mesh>

            {/* Crystal-Clear Transparent Heated Glass Pane */}
            <mesh position={[0, 0, 0.005]} material={glassMaterial}>
              <boxGeometry args={[0.466, 0.596, 0.006]} />
            </mesh>

            {/* Stainless Steel Outer Window Accent Bezel */}
            <mesh position={[-0.232, 0, 0.022]} material={stainlessMaterial}>
              <boxGeometry args={[0.008, 0.59, 0.004]} />
            </mesh>
            <mesh position={[0.232, 0, 0.022]} material={stainlessMaterial}>
              <boxGeometry args={[0.008, 0.59, 0.004]} />
            </mesh>
            <mesh position={[0, 0.297, 0.022]} material={stainlessMaterial}>
              <boxGeometry args={[0.472, 0.008, 0.004]} />
            </mesh>
            <mesh position={[0, -0.297, 0.022]} material={stainlessMaterial}>
              <boxGeometry args={[0.472, 0.008, 0.004]} />
            </mesh>
          </group>

          {/* ---------------------------------------------------------------- */}
          {/* Digital Controller & LCD Panel (Below Window)                   */}
          {/* Centered at local dy: -0.37 (world y = 0.77)                     */}
          {/* ---------------------------------------------------------------- */}
          <group position={[0, -0.37, 0.021]}>
            {/* Chrome Controller Frame */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.39, 0.19, 0.008]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* LCD Screen Glass */}
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.37, 0.17]} />
              <meshBasicMaterial color="#090d16" />
            </mesh>

            {/* Controller Header Brand & Status */}
            <Text
              position={[0, 0.068, 0.008]}
              fontSize={0.010}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ZHL_AKBLT DIGITAL METROLOGY CONTROLLER
            </Text>

            {/* Left Column: Temperature Zone */}
            <group position={[-0.092, -0.01, 0.008]}>
              <Text
                position={[0, 0.048, 0]}
                fontSize={0.012}
                color="#f87171"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                TEMPERATURE
              </Text>
              <Text
                position={[0, 0.018, 0]}
                fontSize={0.022}
                color="#fca5a5"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                {`${currentTemp.toFixed(1)}°C`}
              </Text>
              <Text
                position={[0, -0.012, 0]}
                fontSize={0.009}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {`SET: ${targetTemp.toFixed(0)}°C`}
              </Text>

              {/* - / + Buttons for Temperature */}
              <group
                position={[-0.028, -0.042, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetTemp((t) => Math.max(-40, t - 1))
                }}
              >
                <mesh>
                  <boxGeometry args={[0.024, 0.020, 0.006]} />
                  <meshStandardMaterial color="#7f1d1d" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.004]} fontSize={0.014} color="#ffffff" anchorX="center" anchorY="middle">
                  -
                </Text>
              </group>

              <group
                position={[0.028, -0.042, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetTemp((t) => Math.min(150, t + 1))
                }}
              >
                <mesh>
                  <boxGeometry args={[0.024, 0.020, 0.006]} />
                  <meshStandardMaterial color="#14532d" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.004]} fontSize={0.014} color="#ffffff" anchorX="center" anchorY="middle">
                  +
                </Text>
              </group>
            </group>

            {/* Center Vertical Divider */}
            <mesh position={[0, -0.01, 0.007]}>
              <planeGeometry args={[0.002, 0.12]} />
              <meshBasicMaterial color="#334155" />
            </mesh>

            {/* Right Column: Humidity Zone */}
            <group position={[0.092, -0.01, 0.008]}>
              <Text
                position={[0, 0.048, 0]}
                fontSize={0.012}
                color="#60a5fa"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                HUMIDITY
              </Text>
              <Text
                position={[0, 0.018, 0]}
                fontSize={0.022}
                color="#93c5fd"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                {`${currentHum.toFixed(1)}%`}
              </Text>
              <Text
                position={[0, -0.012, 0]}
                fontSize={0.009}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {`SET: ${targetHum.toFixed(0)}%`}
              </Text>

              {/* - / + Buttons for Humidity */}
              <group
                position={[-0.028, -0.042, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetHum((h) => Math.max(0, h - 5))
                }}
              >
                <mesh>
                  <boxGeometry args={[0.024, 0.020, 0.006]} />
                  <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.004]} fontSize={0.014} color="#ffffff" anchorX="center" anchorY="middle">
                  -
                </Text>
              </group>

              <group
                position={[0.028, -0.042, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setTargetHum((h) => Math.min(100, h + 5))
                }}
              >
                <mesh>
                  <boxGeometry args={[0.024, 0.020, 0.006]} />
                  <meshStandardMaterial color="#14532d" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.004]} fontSize={0.014} color="#ffffff" anchorX="center" anchorY="middle">
                  +
                </Text>
              </group>
            </group>
          </group>

          {/* ---------------------------------------------------------------- */}
          {/* Heavy-Duty Industrial Slam Latch & Lever Handle                  */}
          {/* Located on the right edge: local dx = +0.345, dy = -0.04          */}
          {/* ---------------------------------------------------------------- */}
          <group
            position={[0.345, -0.04, 0.03]}
            onPointerDown={(e) => {
              e.stopPropagation()
              setIsOpen((prev) => !prev)
            }}
          >
            {/* Latch Base Escutcheon Plate */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.05, 0.14, 0.015]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Rotating Cam Barrel */}
            <mesh position={[0.01, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.025, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Lever Arm Handle */}
            <mesh position={[0.045, 0, 0.025]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.09, 0.022, 0.018]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>

            {/* Visual Touch Indicator / Status Hint */}
            <Text
              position={[0.02, -0.08, 0.01]}
              fontSize={0.012}
              color="#eab308"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isOpen ? 'KAPAT' : 'AÇ'}
            </Text>
          </group>
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 6. CABINET ADJUSTABLE HEAVY-DUTY FEET                                */}
      {/* ==================================================================== */}
      {[-0.34, 0.34].map((fx, i) =>
        [-0.36, 0.36].map((fz, j) => (
          <mesh key={`cabinet-foot-${i}-${j}`} position={[fx, 0.05, fz]}>
            <cylinderGeometry args={[0.038, 0.032, 0.10, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  )
}

export default memo(ClimateCabinet)
