import { useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ChannelInfo } from './FixedPointBridge'

export interface PlateauState {
  mode: 'idle' | 'melt' | 'freeze'
  phase: 'idle' | 'supercooling' | 'recalescence' | 'plateau' | 'complete'
  progress: number // 0 to 1
  elapsedSec: number
  stabilityMilliKelvin: number
}

interface FixedPointPlateauGraphProps {
  channelInfo: ChannelInfo
  probeLocation: 'preheat' | 'cell'
  liveTemp: number
  liveRt: number
  liveRatioW: number
  plateauState: PlateauState
  onStartPlateau: (mode: 'melt' | 'freeze') => void
  onResetPlateau: () => void
  onToggleProbe: () => void
  onCloseGraph: () => void
  onOpenVRScreen?: () => void
}

/**
 * FixedPointPlateauGraph
 * High-fidelity Metrology Oscilloscope / ITS-90 Realization Curve Display
 * Renders real-time melting & freezing plateau curves with supercooling,
 * recalescence, and micro-kelvin equilibrium plateau phases.
 */
function FixedPointPlateauGraph({
  channelInfo,
  probeLocation,
  liveTemp,
  liveRt,
  liveRatioW,
  plateauState,
  onStartPlateau,
  onResetPlateau,
  onToggleProbe,
  onCloseGraph,
  onOpenVRScreen
}: FixedPointPlateauGraphProps) {
  const isFreeze = plateauState.mode === 'freeze'
  const isMelt = plateauState.mode === 'melt'
  const isActive = plateauState.mode !== 'idle'
  const currentProgress = plateauState.progress

  // Graph dimensions in 3D units (matches the central LCD area: width 0.332m, height 0.176m)
  const plotWidth = 0.280
  const plotHeight = 0.085
  const plotOriginX = -plotWidth / 2
  const plotOriginY = -0.015

  // Generate 48 discrete trajectory points for the characteristic ITS-90 curve
  const curvePoints = useMemo(() => {
    const pts: { x: number; y: number; normT: number; phase: string }[] = []
    const steps = 48

    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      let relY = 0 // Relative to nominal 0
      let phaseName = 'idle'

      if (isFreeze) {
        if (u < 0.14) {
          // Liquid cooling down towards supercooling dip
          const t = u / 0.14
          relY = 0.45 * (1 - t) - 0.28 * t
          phaseName = 'Soğuma'
        } else if (u < 0.22) {
          // Supercooling dip (Aşırı Soğuma dip)
          const t = (u - 0.14) / 0.08
          relY = -0.28 * Math.cos((t * Math.PI) / 2)
          phaseName = 'Aşırı Soğuma'
        } else if (u < 0.28) {
          // Recalescence (Nükleasyon ve ani ısınma)
          const t = (u - 0.22) / 0.06
          relY = -0.28 * (1 - t)
          phaseName = 'Recalescence'
        } else if (u < 0.82) {
          // Stable ITS-90 Freezing Plateau (Kusursuz sabit plato)
          const t = (u - 0.28) / 0.54
          relY = Math.sin(t * 18.0) * 0.006 // Micro-ripple ~0.1 mK
          phaseName = 'Sabit Plato'
        } else {
          // Liquid exhausted, solid phase cooling
          const t = (u - 0.82) / 0.18
          relY = -0.40 * t
          phaseName = 'Katılaşma Sonu'
        }
      } else {
        // Melting curve
        if (u < 0.20) {
          // Solid heating up towards melting point
          const t = u / 0.20
          relY = -0.45 * (1 - t)
          phaseName = 'Katı Isınma'
        } else if (u < 0.80) {
          // Stable ITS-90 Melting Plateau
          const t = (u - 0.20) / 0.60
          relY = Math.sin(t * 14.0) * 0.005
          phaseName = 'Erime Platosu'
        } else {
          // Melt complete, liquid heating
          const t = (u - 0.80) / 0.20
          relY = 0.42 * t
          phaseName = 'Sıvı Isınma'
        }
      }

      // Map u to X and relY (-0.5 to +0.5) to Y
      const px = plotOriginX + u * plotWidth
      const py = plotOriginY + relY * (plotHeight * 0.85)

      pts.push({
        x: px,
        y: py,
        normT: relY,
        phase: phaseName
      })
    }
    return pts
  }, [isFreeze, plotOriginX, plotOriginY, plotWidth, plotHeight])

  // Current marker position on the curve
  const markerPos = useMemo(() => {
    if (!isActive || curvePoints.length === 0) {
      return { x: plotOriginX, y: plotOriginY }
    }
    const idx = Math.min(
      curvePoints.length - 1,
      Math.floor(currentProgress * (curvePoints.length - 1))
    )
    return { x: curvePoints[idx].x, y: curvePoints[idx].y }
  }, [isActive, currentProgress, curvePoints, plotOriginX, plotOriginY])

  // Phase title & badge color
  const phaseStatus = useMemo(() => {
    if (!isActive) {
      return {
        text: 'BEKLEMEDE (İŞLEM SEÇİN)',
        color: '#94a3b8',
        bg: '#1e293b'
      }
    }
    if (isFreeze) {
      if (currentProgress < 0.22) {
        return {
          text: '1. FAZ: AŞIRI SOĞUMA (SUPERCOOLING)',
          color: '#38bdf8',
          bg: '#0c4a6e'
        }
      }
      if (currentProgress < 0.28) {
        return {
          text: '2. FAZ: RECALESCENCE (NÜKLEASYON & ISINMA)',
          color: '#facc15',
          bg: '#713f12'
        }
      }
      if (currentProgress < 0.82) {
        return {
          text: '3. FAZ: ITS-90 DENGE PLATOSU (STABİL)',
          color: '#4ade80',
          bg: '#064e3b'
        }
      }
      return {
        text: '4. FAZ: TAM KATILAŞMA (DONMA TAMAMLANDI)',
        color: '#a78bfa',
        bg: '#4c1d95'
      }
    } else {
      if (currentProgress < 0.20) {
        return {
          text: '1. FAZ: KATI FAZ ÖN ISINMA',
          color: '#fb923c',
          bg: '#7c2d12'
        }
      }
      if (currentProgress < 0.80) {
        return {
          text: '2. FAZ: ITS-90 ERİME PLATOSU (STABİL)',
          color: '#4ade80',
          bg: '#064e3b'
        }
      }
      return {
        text: '3. FAZ: ERİME TAMAMLANDI (SIVI FAZ)',
        color: '#a78bfa',
        bg: '#4c1d95'
      }
    }
  }, [isActive, isFreeze, currentProgress])

  // Stop event bubbling for 3D buttons
  const stopEvt = (e: ThreeEvent<MouseEvent>) => e.stopPropagation()

  return (
    <group position={[0, 0, 0.002]}>
      {/* Background Container for Graph Display */}
      <mesh>
        <planeGeometry args={[0.330, 0.210]} />
        <meshBasicMaterial color="#050a15" />
      </mesh>

      {/* ==================================================================== */}
      {/* 1. TOP HEADER & TAB SWITCH STRIP                                     */}
      {/* ==================================================================== */}
      <group position={[0, 0.088, 0.001]}>
        {/* Top Header Background */}
        <mesh>
          <planeGeometry args={[0.326, 0.024]} />
          <meshBasicMaterial color="#0b1329" />
        </mesh>

        {/* Tab Button: 9 Kanal Tablosuna Dön */}
        <group
          position={[-0.118, 0, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onCloseGraph()
          }}
          onPointerOver={(e) => {
            stopEvt(e)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.076, 0.016, 0.002]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0044}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            📋 LİSTE
          </Text>
        </group>

        {/* Tab Button: Canlı Plato Grafiği (Active) */}
        <group position={[-0.045, 0, 0.002]}>
          <mesh>
            <boxGeometry args={[0.068, 0.016, 0.002]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0044}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            📈 GRAFİK
          </Text>
        </group>

        {/* VR Büyüt / Quest 3 Button */}
        {onOpenVRScreen && (
          <group
            position={[0.024, 0, 0.002]}
            onClick={(e) => {
              stopEvt(e)
              onOpenVRScreen()
            }}
            onPointerOver={(e) => {
              stopEvt(e)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <mesh>
              <boxGeometry args={[0.066, 0.016, 0.002]} />
              <meshStandardMaterial color="#059669" roughness={0.3} />
            </mesh>
            <Text
              position={[0, 0, 0.002]}
              fontSize={0.0042}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ⤢ VR BÜYÜT
            </Text>
          </group>
        )}

        {/* Current Fixed-Point Chip */}
        <group position={[0.106, 0, 0.002]}>
          <mesh>
            <boxGeometry args={[0.096, 0.016, 0.002]} />
            <meshStandardMaterial color={phaseStatus.bg} roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0042}
            color={phaseStatus.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {channelInfo.label} [{channelInfo.nominalTemp.toFixed(1)}°C]
          </Text>
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 2. SUB-BAR: LIVE METROLOGY TELEMETRY READOUTS                        */}
      {/* ==================================================================== */}
      <group position={[0, 0.063, 0.001]}>
        <mesh>
          <planeGeometry args={[0.326, 0.022]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Live Temperature */}
        <Text
          position={[-0.155, 0, 0.002]}
          fontSize={0.0078}
          color="#4ade80"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {liveTemp >= 0 ? `+${liveTemp.toFixed(4)}` : liveTemp.toFixed(4)} °C
        </Text>

        {/* Resistance Rt */}
        <Text
          position={[-0.045, 0, 0.002]}
          fontSize={0.0056}
          color="#fbbf24"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          Rt: {liveRt.toFixed(4)} Ω
        </Text>

        {/* Ratio W */}
        <Text
          position={[0.042, 0, 0.002]}
          fontSize={0.0056}
          color="#c084fc"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          W: {liveRatioW.toFixed(5)}
        </Text>

        {/* Stability badge */}
        <Text
          position={[0.155, 0, 0.002]}
          fontSize={0.0048}
          color="#38bdf8"
          anchorX="right"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          ±{plateauState.stabilityMilliKelvin.toFixed(2)} mK/h
        </Text>
      </group>

      {/* ==================================================================== */}
      {/* 3. OSCILLOSCOPE GRAPH PLOT AREA                                      */}
      {/* ==================================================================== */}
      <group position={[0, 0.002, 0.001]}>
        {/* Plot Frame Background */}
        <mesh position={[0, plotOriginY, 0]}>
          <planeGeometry args={[plotWidth + 0.038, plotHeight + 0.022]} />
          <meshBasicMaterial color="#030712" />
        </mesh>

        {/* Outer subtle border */}
        <mesh position={[0, plotOriginY, 0.0005]}>
          <planeGeometry args={[plotWidth + 0.036, plotHeight + 0.020]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, plotOriginY, 0.001]}>
          <planeGeometry args={[plotWidth + 0.034, plotHeight + 0.018]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* Horizontal Grid Lines (Temperature ticks: +0.4°C, Nominal 0, -0.4°C) */}
        {[-0.35, 0, 0.35].map((gVal, idx) => {
          const gy = plotOriginY + gVal * (plotHeight * 0.85)
          const isCenter = idx === 1
          return (
            <group key={`h-grid-${idx}`} position={[0, gy, 0.0015]}>
              <mesh>
                <planeGeometry args={[plotWidth, isCenter ? 0.0008 : 0.0004]} />
                <meshBasicMaterial color={isCenter ? '#0284c7' : '#1e293b'} />
              </mesh>
              {/* Y-Axis Label */}
              <Text
                position={[plotOriginX - 0.004, 0, 0.001]}
                fontSize={0.0038}
                color={isCenter ? '#38bdf8' : '#64748b'}
                anchorX="right"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {isCenter
                  ? 'T_90'
                  : gVal > 0
                  ? `+${(channelInfo.nominalTemp + 0.35).toFixed(1)}`
                  : `${(channelInfo.nominalTemp - 0.35).toFixed(1)}`}
              </Text>
            </group>
          )
        })}

        {/* Vertical Grid Lines (Time ticks: 0, 5, 10, 15, 20, 25 dk) */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((tx, idx) => {
          const gx = plotOriginX + tx * plotWidth
          const minLabel = idx * 5
          return (
            <group key={`v-grid-${idx}`} position={[gx, plotOriginY, 0.0015]}>
              <mesh>
                <planeGeometry args={[0.0004, plotHeight]} />
                <meshBasicMaterial color="#1e293b" />
              </mesh>
              {/* X-Axis Label */}
              <Text
                position={[0, -plotHeight / 2 - 0.005, 0.001]}
                fontSize={0.0036}
                color="#64748b"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {minLabel}m
              </Text>
            </group>
          )
        })}

        {/* ITS-90 Characteristic Plateau Curve Segments */}
        {curvePoints.map((pt, idx) => {
          if (idx === 0) return null
          const prev = curvePoints[idx - 1]
          const dx = pt.x - prev.x
          const dy = pt.y - prev.y
          const len = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx)
          const midX = (pt.x + prev.x) / 2
          const midY = (pt.y + prev.y) / 2
          const segProgress = idx / (curvePoints.length - 1)
          const isPassed = segProgress <= currentProgress

          // Color based on mode & progress
          const segColor = !isActive
            ? '#334155'
            : isPassed
            ? isFreeze
              ? '#38bdf8'
              : '#f59e0b'
            : '#1e293b'

          return (
            <mesh
              key={`curve-seg-${idx}`}
              position={[midX, midY, 0.002]}
              rotation={[0, 0, angle]}
            >
              <planeGeometry args={[len, isPassed ? 0.0014 : 0.0006]} />
              <meshBasicMaterial color={segColor} />
            </mesh>
          )
        })}

        {/* Annotations directly on the curve */}
        {isFreeze && (
          <>
            {/* Supercooling Dip Annotation */}
            <group position={[plotOriginX + 0.18 * plotWidth, plotOriginY - 0.026, 0.003]}>
              <Text
                position={[0, 0, 0]}
                fontSize={0.0036}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                ▼ Aşırı Soğuma (Dip)
              </Text>
            </group>
            {/* Recalescence Annotation */}
            <group position={[plotOriginX + 0.27 * plotWidth, plotOriginY + 0.018, 0.003]}>
              <Text
                position={[0, 0, 0]}
                fontSize={0.0036}
                color="#facc15"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                ▲ Nükleasyon / Isınma
              </Text>
            </group>
            {/* Plateau Region Bracket */}
            <group position={[plotOriginX + 0.55 * plotWidth, plotOriginY + 0.015, 0.003]}>
              <Text
                position={[0, 0, 0]}
                fontSize={0.0042}
                color="#4ade80"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                ═══ ITS-90 SABİT DONMA PLATOSU (±0.1 mK) ═══
              </Text>
            </group>
          </>
        )}

        {isMelt && (
          <group position={[plotOriginX + 0.50 * plotWidth, plotOriginY + 0.015, 0.003]}>
            <Text
              position={[0, 0, 0]}
              fontSize={0.0042}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ═══ ITS-90 SABİT ERİME PLATOSU (DENGE) ═══
            </Text>
          </group>
        )}

        {/* Live Active Tracer Marker (Pulsing glowing dot) */}
        {isActive && (
          <group position={[markerPos.x, markerPos.y, 0.0035]}>
            {/* Inner glowing dot */}
            <mesh>
              <circleGeometry args={[0.0024, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Outer halo ring */}
            <mesh position={[0, 0, -0.0002]}>
              <ringGeometry args={[0.0035, 0.0050, 16]} />
              <meshBasicMaterial
                color={isFreeze ? '#38bdf8' : '#f59e0b'}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ==================================================================== */}
      {/* 4. BOTTOM ACTION CONTROL TOOLBAR (ERİME / DONMA / PROB TRANSFER)     */}
      {/* ==================================================================== */}
      <group position={[0, -0.075, 0.001]}>
        {/* Toolbar Background */}
        <mesh>
          <planeGeometry args={[0.326, 0.038]} />
          <meshBasicMaterial color="#0b1329" />
        </mesh>

        {/* BUTTON 1: DONMA PLATOSU BAŞLAT */}
        <group
          position={[-0.118, 0.006, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onStartPlateau('freeze')
          }}
          onPointerOver={(e) => {
            stopEvt(e)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.082, 0.016, 0.003]} />
            <meshStandardMaterial
              color={isFreeze && isActive ? '#0284c7' : '#0369a1'}
              roughness={0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0046}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ❄ DONMAYA GÖNDER
          </Text>
        </group>

        {/* BUTTON 2: ERİME PLATOSU BAŞLAT */}
        <group
          position={[-0.032, 0.006, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onStartPlateau('melt')
          }}
          onPointerOver={(e) => {
            stopEvt(e)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.082, 0.016, 0.003]} />
            <meshStandardMaterial
              color={isMelt && isActive ? '#d97706' : '#b45309'}
              roughness={0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0046}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            🔥 ERİMEYE GÖNDER
          </Text>
        </group>

        {/* BUTTON 3: PROB KONUMU TRANSFER (HÜCRE / ÖN ISITMA) */}
        <group
          position={[0.054, 0.006, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onToggleProbe()
          }}
          onPointerOver={(e) => {
            stopEvt(e)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.082, 0.016, 0.003]} />
            <meshStandardMaterial
              color={probeLocation === 'cell' ? '#166534' : '#c2410c'}
              roughness={0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0044}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {probeLocation === 'cell' ? '📍 PROB: HÜCREDE' : '⏳ PROB: ÖN ISITMA'}
          </Text>
        </group>

        {/* BUTTON 4: SIFIRLA / BEKLEME */}
        <group
          position={[0.134, 0.006, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onResetPlateau()
          }}
          onPointerOver={(e) => {
            stopEvt(e)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.050, 0.016, 0.003]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.0044}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ⟲ SIFIRLA
          </Text>
        </group>

        {/* Status Line at very bottom */}
        <Text
          position={[0, -0.012, 0.002]}
          fontSize={0.0040}
          color={phaseStatus.color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          DURUM: {phaseStatus.text}
        </Text>
      </group>
    </group>
  )
}

export default memo(FixedPointPlateauGraph)
