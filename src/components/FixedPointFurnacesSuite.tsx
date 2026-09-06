import { Suspense, useState, useMemo, useRef, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import FixedPointFurnace from './FixedPointFurnace'
import FixedPointBath from './FixedPointBath'
import FixedPointBridge from './FixedPointBridge'
import FixedPointCables from './FixedPointCables'
import type { PlateauState } from './FixedPointPlateauGraph'
import FixedPointVRExpandedScreen from './FixedPointVRExpandedScreen'

// Complete 9 ITS-90 Primary Fixed-Point Cell Maintenance Systems
// Cryogenic to High-Temperature: Ar, Hg, TPW, Ga, In, Sn, Zn, Al, Ag
export const ALL_FIXED_POINTS = [
  {
    model: 'MK_Ar',
    name: 'Argon (Ar) Üçlü Noktası',
    symbol: 'Ar',
    temp: -189.3442,
    x: 2.40
  },
  {
    model: 'MK_Hg',
    name: 'Cıva (Hg) Üçlü Noktası',
    symbol: 'Hg',
    temp: -38.8344,
    x: 2.93
  },
  {
    model: 'MK_TPW',
    name: 'Suyun Üçlü Noktası (TPW)',
    symbol: 'TPW',
    temp: 0.010,
    x: 3.46
  },
  {
    model: 'MK_Ga',
    name: 'Galyum (Ga) Erim Noktası',
    symbol: 'Ga',
    temp: 29.7646,
    x: 3.99
  },
  {
    model: 'MK_In',
    name: 'İndiyum (In) Donma Noktası',
    symbol: 'In',
    temp: 156.5985,
    x: 4.52
  },
  {
    model: 'MK_Sn',
    name: 'Kalay (Sn) Donma Noktası',
    symbol: 'Sn',
    temp: 231.928,
    x: 5.05
  },
  {
    model: 'MK_Zn',
    name: 'Çinko (Zn) Donma Noktası',
    symbol: 'Zn',
    temp: 419.527,
    x: 5.58
  },
  {
    model: 'MK_Al',
    name: 'Alüminyum (Al) Donma Noktası',
    symbol: 'Al',
    temp: 660.323,
    x: 6.11
  },
  {
    model: 'MK_Ag',
    name: 'Gümüş (Ag) Donma Noktası',
    symbol: 'Ag',
    temp: 961.78,
    x: 6.64
  }
]

export default function FixedPointFurnacesSuite() {
  const bridgePos: [number, number, number] = [4.52, 1.43, 0.52]
  const bridgeTilt = 0.12 // Tilted ~7 degrees downwards towards operator eye line

  // 9 Probes: start in pre-heat / conditioning well
  const [probeLocations, setProbeLocations] = useState<('preheat' | 'cell')[]>([
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat'
  ])

  // Live probe temperatures: start from room temp 25 °C
  const [probeTemps, setProbeTemps] = useState<number[]>([
    25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0
  ])

  // Plateau realization states for all 9 fixed points
  const [plateauStates, setPlateauStates] = useState<PlateauState[]>(() =>
    ALL_FIXED_POINTS.map(() => ({
      mode: 'idle',
      phase: 'idle',
      progress: 0,
      elapsedSec: 0,
      stabilityMilliKelvin: 0.05
    }))
  )

  // Meta Quest 3 VR High-Visibility Expanded Screen
  const [isVRScreenOpen, setIsVRScreenOpen] = useState(false)
  const [activeVRChannel, setActiveVRChannel] = useState(3)

  // Simulation Refs (keeps physics running smoothly at 60/90Hz without triggering React re-renders every 11ms)
  const probeTempsRef = useRef<number[]>([25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0])
  const probeLocationsRef = useRef<('preheat' | 'cell')[]>([
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat',
    'preheat'
  ])
  const plateauStatesRef = useRef<PlateauState[]>(
    ALL_FIXED_POINTS.map(() => ({
      mode: 'idle',
      phase: 'idle',
      progress: 0,
      elapsedSec: 0,
      stabilityMilliKelvin: 0.05
    }))
  )
  const throttleTimerRef = useRef(0)

  const toggleProbe = useCallback((idx: number) => {
    setProbeLocations((prev) => {
      const next = [...prev]
      next[idx] = next[idx] === 'preheat' ? 'cell' : 'preheat'
      probeLocationsRef.current = next
      return next
    })
  }, [])

  const handleStartPlateau = useCallback((idx: number, mode: 'melt' | 'freeze') => {
    // 1. Move probe to fixed-point cell if currently in preheat
    setProbeLocations((prev) => {
      const next = [...prev]
      next[idx] = 'cell'
      probeLocationsRef.current = next
      return next
    })
    // 2. Initialize plateau state
    setPlateauStates((prev) => {
      const next = [...prev]
      next[idx] = {
        mode,
        phase: mode === 'freeze' ? 'supercooling' : 'plateau',
        progress: 0.02,
        elapsedSec: 0,
        stabilityMilliKelvin: 0.06
      }
      plateauStatesRef.current = next
      return next
    })
  }, [])

  const handleResetPlateau = useCallback((idx: number) => {
    setPlateauStates((prev) => {
      const next = [...prev]
      next[idx] = {
        mode: 'idle',
        phase: 'idle',
        progress: 0,
        elapsedSec: 0,
        stabilityMilliKelvin: 0.05
      }
      plateauStatesRef.current = next
      return next
    })
  }, [])

  const handleToggleVRScreen = useCallback(() => setIsVRScreenOpen((prev) => !prev), [])
  const handleCloseVRScreen = useCallback(() => setIsVRScreenOpen(false), [])
  const toggleProbeHandlers = useMemo(
    () => ALL_FIXED_POINTS.map((_, i) => () => toggleProbe(i)),
    [toggleProbe]
  )

  // Dynamic progressive conditioning & plateau simulation
  useFrame((_, delta) => {
    // 1. Advance active plateau cycles in ref
    let hasActivePlateau = false
    const currentPlateaus = plateauStatesRef.current
    for (let i = 0; i < currentPlateaus.length; i++) {
      const st = currentPlateaus[i]
      if (st.mode !== 'idle') {
        hasActivePlateau = true
        const newElapsed = st.elapsedSec + delta
        const totalDuration = 45.0
        const newProgress = Math.min(1.0, newElapsed / totalDuration)

        let newPhase: PlateauState['phase'] = 'idle'
        let stab = 0.05
        if (st.mode === 'freeze') {
          if (newProgress < 0.22) {
            newPhase = 'supercooling'
            stab = 0.8
          } else if (newProgress < 0.28) {
            newPhase = 'recalescence'
            stab = 1.2
          } else if (newProgress < 0.82) {
            newPhase = 'plateau'
            stab = 0.03
          } else {
            newPhase = 'complete'
            stab = 0.4
          }
        } else {
          // melt
          if (newProgress < 0.20) {
            newPhase = 'supercooling'
            stab = 0.6
          } else if (newProgress < 0.80) {
            newPhase = 'plateau'
            stab = 0.04
          } else {
            newPhase = 'complete'
            stab = 0.5
          }
        }

        currentPlateaus[i] = {
          ...st,
          elapsedSec: newElapsed,
          progress: newProgress,
          phase: newPhase,
          stabilityMilliKelvin: stab
        }
      }
    }

    // 2. Compute probe temperatures following ITS-90 plateau thermodynamics in ref
    const currentTemps = probeTempsRef.current
    const currentLocs = probeLocationsRef.current
    let tempsChanged = false

    for (let idx = 0; idx < ALL_FIXED_POINTS.length; idx++) {
      const fp = ALL_FIXED_POINTS[idx]
      const loc = currentLocs[idx]
      const pl = currentPlateaus[idx]
      const t = currentTemps[idx]

      let dest = loc === 'cell' ? fp.temp : (fp.temp > 25 ? fp.temp - 0.8 : fp.temp + 0.5)

      if (pl.mode === 'freeze') {
        if (pl.progress < 0.14) {
          const u = pl.progress / 0.14
          dest = fp.temp + 0.5 * (1 - u) - 0.28 * u
        } else if (pl.progress < 0.22) {
          dest = fp.temp - 0.28
        } else if (pl.progress < 0.28) {
          const u = (pl.progress - 0.22) / 0.06
          dest = fp.temp - 0.28 + 0.28 * u
        } else if (pl.progress < 0.82) {
          dest = fp.temp
        } else {
          const u = (pl.progress - 0.82) / 0.18
          dest = fp.temp - 0.45 * u
        }
      } else if (pl.mode === 'melt') {
        if (pl.progress < 0.20) {
          const u = pl.progress / 0.20
          dest = fp.temp - 0.45 * (1 - u)
        } else if (pl.progress < 0.80) {
          dest = fp.temp
        } else {
          const u = (pl.progress - 0.80) / 0.20
          dest = fp.temp + 0.45 * u
        }
      }

      if (Math.abs(t - dest) > 0.005) {
        tempsChanged = true
        const rate = pl.mode !== 'idle' ? 30 : Math.max(12, Math.abs(dest - 25) * 0.25)
        const step = Math.sign(dest - t) * Math.min(Math.abs(dest - t), rate * delta)
        currentTemps[idx] = t + step
      }
    }

    // 3. THROTTLED REACT STATE FLUSH: Only trigger React reconciliation at ~10Hz (every 100ms)
    // This reduces component re-renders from 90/sec down to 10/sec, completely eliminating VR interaction freezes!
    throttleTimerRef.current += delta
    if (throttleTimerRef.current >= 0.1) {
      throttleTimerRef.current = 0
      if (hasActivePlateau) {
        setPlateauStates([...currentPlateaus])
      }
      if (tempsChanged || hasActivePlateau) {
        setProbeTemps([...currentTemps])
      }
    }
  })

  // Aluminum profile and shelf materials
  const aluminumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#475569',
        metalness: 0.8,
        roughness: 0.25
      }),
    []
  )

  const shelfMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.5,
        roughness: 0.4
      }),
    []
  )

  const stainlessMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.9,
        roughness: 0.2
      }),
    []
  )

  const furnacesX = useMemo(() => ALL_FIXED_POINTS.map((fp) => fp.x), [])

  return (
    <group>
      {/* Overhead Task Lighting spanning across all 9 units */}
      <pointLight position={[3.40, 2.7, 1.2]} intensity={1.8} distance={7} color="#f8fafc" />
      <pointLight position={[5.60, 2.7, 1.2]} intensity={1.8} distance={7} color="#f8fafc" />
      <pointLight position={[4.52, 1.7, 0.9]} intensity={1.5} distance={5} color="#f8fafc" />

      {/* ==================================================================== */}
      {/* 1. OVERHEAD EQUIPMENT GANTRY RACK SPANNING ACROSS ALL 9 FURNACES     */}
      {/* ==================================================================== */}
      <group position={[4.52, 0, 0.52]}>
        {/* Left Column (x = -2.44 -> world x = 2.08) */}
        <mesh position={[-2.44, 1.05, 0]} material={aluminumMaterial} castShadow>
          <boxGeometry args={[0.05, 2.10, 0.05]} />
        </mesh>
        <mesh position={[-2.44, 0.01, 0]} material={aluminumMaterial}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
        </mesh>

        {/* Center Intermediate Column (x = 0 -> world x = 4.52) */}
        <mesh position={[0, 1.05, -0.18]} material={aluminumMaterial} castShadow>
          <boxGeometry args={[0.04, 2.10, 0.04]} />
        </mesh>

        {/* Right Column (x = +2.44 -> world x = 6.96) */}
        <mesh position={[2.44, 1.05, 0]} material={aluminumMaterial} castShadow>
          <boxGeometry args={[0.05, 2.10, 0.05]} />
        </mesh>
        <mesh position={[2.44, 0.01, 0]} material={aluminumMaterial}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
        </mesh>

        {/* Shelf Support Beams spanning 4.92m */}
        <mesh position={[0, 1.40, -0.18]} material={aluminumMaterial}>
          <boxGeometry args={[4.92, 0.04, 0.04]} />
        </mesh>
        <mesh position={[0, 1.40, 0.18]} material={aluminumMaterial}>
          <boxGeometry args={[4.92, 0.04, 0.04]} />
        </mesh>

        {/* Top Header Cross-Beam */}
        <mesh position={[0, 2.05, 0]} material={aluminumMaterial}>
          <boxGeometry args={[4.92, 0.04, 0.04]} />
        </mesh>

        {/* Solid Overhead Shelf Platform (Width: 4.92m, Depth: 0.42m) */}
        <mesh position={[0, 1.42, 0]} material={shelfMaterial} receiveShadow castShadow>
          <boxGeometry args={[4.92, 0.03, 0.42]} />
        </mesh>
        {/* Stainless Steel Front Edge Trim */}
        <mesh position={[0, 1.42, 0.212]} material={stainlessMaterial}>
          <boxGeometry args={[4.92, 0.032, 0.005]} />
        </mesh>

        {/* LED Under-Shelf Task Lighting Strip */}
        <mesh position={[0, 1.398, 0]}>
          <boxGeometry args={[4.80, 0.006, 0.03]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
        </mesh>

        {/* Overhead Laboratory Banner Sign */}
        <group position={[0, 1.90, 0]}>
          <mesh>
            <planeGeometry args={[3.8, 0.22]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0.095, 0.001]}>
            <planeGeometry args={[3.76, 0.012]} />
            <meshBasicMaterial color="#08b5ea" />
          </mesh>
          <Text
            position={[0, 0.032, 0.002]}
            fontSize={0.042}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ITS-90 SABİT NOKTA KALİBRASYON İSTASYONU (9 SABİT NOKTA)
          </Text>
          <Text
            position={[0, -0.040, 0.002]}
            fontSize={0.024}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            Ar (-189.3°C) | Hg (-38.8°C) | TPW (0.01°C) | Ga (29.8°C) | In (156.6°C) | Sn (231.9°C) | Zn (419.5°C) | Al (660.3°C) | Ag (961.8°C)
          </Text>
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 2. ALL 9 UNITS ON FLOOR (BATHS FOR Hg, TPW, Ga & FURNACES FOR OTHERS) */}
      {/* ==================================================================== */}
      {ALL_FIXED_POINTS.map((fp, idx) => {
        const isLocCell = probeLocations[idx] === 'cell'
        const isHeated = Math.abs(probeTemps[idx] - (fp.temp > 25 ? fp.temp - 0.8 : fp.temp + 0.5)) < 2.0 || isLocCell
        const isBath = fp.model === 'MK_Hg' || fp.model === 'MK_TPW' || fp.model === 'MK_Ga'

        if (isBath) {
          return (
            <Suspense key={fp.model} fallback={null}>
              <FixedPointBath
                position={[fp.x, 0, 0.60]}
                rotation={[0, 0, 0]}
                modelName={fp.model}
                elementName={fp.name}
                elementSymbol={fp.symbol}
                fixedPointTemp={fp.temp}
                probeLocation={probeLocations[idx]}
                onToggleProbeLocation={toggleProbeHandlers[idx]}
                currentTemp={probeTemps[idx]}
                isHeated={isHeated}
              />
            </Suspense>
          )
        }

        return (
          <Suspense key={fp.model} fallback={null}>
            <FixedPointFurnace
              position={[fp.x, 0, 0.60]}
              rotation={[0, 0, 0]}
              modelName={fp.model}
              elementName={fp.name}
              elementSymbol={fp.symbol}
              fixedPointTemp={fp.temp}
              probeLocation={probeLocations[idx]}
              onToggleProbeLocation={toggleProbeHandlers[idx]}
              currentTemp={probeTemps[idx]}
              isHeated={isHeated}
            />
          </Suspense>
        )
      })}

      {/* ==================================================================== */}
      {/* 3. DEDICATED 9-CHANNEL BRIDGE MOUNTED ON OVERHEAD SHELF              */}
      {/* ==================================================================== */}
      <Suspense fallback={null}>
        <FixedPointBridge
          position={bridgePos}
          rotation={[bridgeTilt, 0, 0]}
          scale={1.22}
          channelTemps={probeTemps}
          probeLocations={probeLocations}
          plateauStates={plateauStates}
          onStartPlateau={handleStartPlateau}
          onResetPlateau={handleResetPlateau}
          onToggleProbe={toggleProbe}
          onToggleVRScreen={handleToggleVRScreen}
          isVRScreenOpen={isVRScreenOpen}
        />
      </Suspense>

      {/* ==================================================================== */}
      {/* 4. 9 SPRT 3D CABLES DYNAMICALLY ROUTING UP TO THE 9 BRIDGE CHANNELS  */}
      {/* ==================================================================== */}
      <Suspense fallback={null}>
        <FixedPointCables
          furnacesX={furnacesX}
          furnaceZ={0.60}
          bridgePos={bridgePos}
          bridgeTiltX={bridgeTilt}
          probeLocations={probeLocations}
        />
      </Suspense>

      {/* ==================================================================== */}
      {/* 5. META QUEST 3 HIGH-VISIBILITY VR EXPANDED SCREEN & CONTROLS        */}
      {/* ==================================================================== */}
      {isVRScreenOpen && (
        <Suspense fallback={null}>
          <FixedPointVRExpandedScreen
            position={[4.52, 1.55, 1.15]}
            rotation={[0, 0, 0]}
            scale={1}
            activeChannel={activeVRChannel}
            onSelectChannel={setActiveVRChannel}
            channelTemps={probeTemps}
            probeLocations={probeLocations}
            plateauStates={plateauStates}
            onStartPlateau={handleStartPlateau}
            onResetPlateau={handleResetPlateau}
            onToggleProbe={toggleProbe}
            onClose={handleCloseVRScreen}
          />
        </Suspense>
      )}
    </group>
  )
}
