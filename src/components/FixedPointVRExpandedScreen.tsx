import { useState, useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { FIXED_CHANNELS } from './FixedPointBridge'
import type { PlateauState } from './FixedPointPlateauGraph'

interface FixedPointVRExpandedScreenProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  activeChannel: number
  onSelectChannel: (chNum: number) => void
  channelTemps: number[]
  probeLocations: ('preheat' | 'cell')[]
  plateauStates: PlateauState[]
  onStartPlateau: (channelIdx: number, mode: 'melt' | 'freeze') => void
  onResetPlateau: (channelIdx: number) => void
  onToggleProbe: (channelIdx: number) => void
  onClose: () => void
}

/**
 * FixedPointVRExpandedScreen
 * Ultra-large, high-visibility Meta Quest 3 VR Inspection & Control Display.
 * Provides huge, crystal-clear typography, extra-large touch buttons with deep hitboxes,
 * full fixed-point plateau curve visualization, and ergonomic distance/height controls.
 */
function FixedPointVRExpandedScreen({
  position = [4.52, 1.55, 1.10],
  rotation = [0, 0, 0],
  scale = 1,
  activeChannel,
  onSelectChannel,
  channelTemps,
  probeLocations,
  plateauStates,
  onStartPlateau,
  onResetPlateau,
  onToggleProbe,
  onClose
}: FixedPointVRExpandedScreenProps) {
  // VR screen spatial offsets for personal ergonomic adjustment
  const [yOffset, setYOffset] = useState(0)
  const [zOffset, setZOffset] = useState(0)

  // Active channel data
  const chIdx = activeChannel - 1
  const activeInfo = FIXED_CHANNELS[chIdx]
  const activeLoc = probeLocations[chIdx]
  const activeTemp = channelTemps[chIdx]
  const activePl = plateauStates[chIdx]
  const isFreeze = activePl.mode === 'freeze'
  const isMelt = activePl.mode === 'melt'
  const isActive = activePl.mode !== 'idle'

  // Standard PRT equations
  const activeRt = activeInfo.r0 * (1 + activeInfo.alpha * activeTemp)
  const activeRatioW = activeRt / activeInfo.r0

  // Graph plotting constants (large VR scale: width 0.94m, height 0.32m)
  const plotWidth = 0.94
  const plotHeight = 0.32
  const plotOriginX = -plotWidth / 2
  const plotOriginY = -0.01

  // 48-Point Characteristic ITS-90 realization curve
  const curvePoints = useMemo(() => {
    const pts: { x: number; y: number; normT: number; phase: string }[] = []
    const steps = 48

    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      let relY = 0
      let phaseName = 'idle'

      if (isFreeze) {
        if (u < 0.14) {
          const t = u / 0.14
          relY = 0.45 * (1 - t) - 0.28 * t
          phaseName = 'Sıvı Soğuma'
        } else if (u < 0.22) {
          relY = -0.28
          phaseName = 'Aşırı Soğuma (Dip)'
        } else if (u < 0.28) {
          const t = (u - 0.22) / 0.06
          relY = -0.28 * (1 - t)
          phaseName = 'Recalescence (Isınma)'
        } else if (u < 0.82) {
          const t = (u - 0.28) / 0.54
          relY = Math.sin(t * 18.0) * 0.005
          phaseName = 'ITS-90 Sabit Donma Platosu'
        } else {
          const t = (u - 0.82) / 0.18
          relY = -0.40 * t
          phaseName = 'Katılaşma Sonu'
        }
      } else {
        // melt
        if (u < 0.20) {
          const t = u / 0.20
          relY = -0.45 * (1 - t)
          phaseName = 'Katı Isınma'
        } else if (u < 0.80) {
          const t = (u - 0.20) / 0.60
          relY = Math.sin(t * 14.0) * 0.005
          phaseName = 'ITS-90 Sabit Erime Platosu'
        } else {
          const t = (u - 0.80) / 0.20
          relY = 0.42 * t
          phaseName = 'Sıvı Isınma'
        }
      }

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
      Math.floor(activePl.progress * (curvePoints.length - 1))
    )
    return { x: curvePoints[idx].x, y: curvePoints[idx].y }
  }, [isActive, activePl.progress, curvePoints, plotOriginX, plotOriginY])

  // Phase Title & Badge Color
  const phaseStatus = useMemo(() => {
    if (!isActive) {
      return {
        text: 'BEKLEMEDE (DONMA VEYA ERİME İŞLEMİ SEÇİN)',
        color: '#94a3b8',
        bg: '#1e293b'
      }
    }
    if (isFreeze) {
      if (activePl.progress < 0.22) {
        return {
          text: '1. FAZ: AŞIRI SOĞUMA (SUPERCOOLING DIP -0.28°C)',
          color: '#38bdf8',
          bg: '#0c4a6e'
        }
      }
      if (activePl.progress < 0.28) {
        return {
          text: '2. FAZ: RECALESCENCE (NÜKLEASYON & ANİ ISINMA)',
          color: '#facc15',
          bg: '#713f12'
        }
      }
      if (activePl.progress < 0.82) {
        return {
          text: '3. FAZ: ITS-90 STABİL DENGE PLATOSU (±0.1 mK)',
          color: '#4ade80',
          bg: '#064e3b'
        }
      }
      return {
        text: '4. FAZ: TAM KATILAŞMA (DONMA DÖNGÜSÜ TAMAMLANDI)',
        color: '#a78bfa',
        bg: '#4c1d95'
      }
    } else {
      if (activePl.progress < 0.20) {
        return {
          text: '1. FAZ: KATI FAZ ERİME ÖNCESİ ISINMA',
          color: '#fb923c',
          bg: '#7c2d12'
        }
      }
      if (activePl.progress < 0.80) {
        return {
          text: '2. FAZ: ITS-90 STABİL ERİME PLATOSU (DENGE)',
          color: '#4ade80',
          bg: '#064e3b'
        }
      }
      return {
        text: '3. FAZ: ERİME TAMAMLANDI (SIVI FAZ ISINMASI)',
        color: '#a78bfa',
        bg: '#4c1d95'
      }
    }
  }, [isActive, isFreeze, activePl.progress])

  const stopEvt = (e: ThreeEvent<MouseEvent>) => e.stopPropagation()

  const finalPos: [number, number, number] = [
    position[0],
    position[1] + yOffset,
    position[2] + zOffset
  ]

  return (
    <group position={finalPos} rotation={rotation} scale={scale}>
      {/* ==================================================================== */}
      {/* 1. ULTRA-PREMIUM HOLOGRAPHIC VR CASING & BACKDROP                    */}
      {/* ==================================================================== */}
      {/* Outer Glow Halo Border */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[1.56, 0.96]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.45} />
      </mesh>

      {/* Main Glass Panel Chassis */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[1.54, 0.94]} />
        <meshStandardMaterial color="#030712" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Inner Active Display Surface */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.52, 0.92]} />
        <meshBasicMaterial color="#060d1d" />
      </mesh>

      {/* ==================================================================== */}
      {/* 2. TOP VR HEADER BAR: BRAND, TITLE & CLOSE / ADJUST CONTROLS         */}
      {/* ==================================================================== */}
      <group position={[0, 0.41, 0.002]}>
        <mesh>
          <planeGeometry args={[1.50, 0.075]} />
          <meshBasicMaterial color="#0b162c" />
        </mesh>

        {/* Brand Badge */}
        <group position={[-0.64, 0, 0.002]}>
          <mesh>
            <planeGeometry args={[0.15, 0.042]} />
            <meshBasicMaterial color="#08b5ea" />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.019}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            mchtkrkmz
          </Text>
        </group>

        {/* Header Title */}
        <Text
          position={[-0.54, 0.012, 0.002]}
          fontSize={0.016}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          ITS-90 PRIMER KALİBRASYON & DİRENÇ KÖPRÜSÜ
        </Text>
        <Text
          position={[-0.54, -0.015, 0.002]}
          fontSize={0.012}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          Meta Quest 3 Yüksek Çözünürlüklü VR İnceleme ve Kontrol Ekranı
        </Text>

        {/* VR Position Adjusters: [YÜKSELT], [ALÇALT], [YAKINLAŞTIR], [UZAKLAŞTIR] */}
        <group position={[0.22, 0, 0.002]}>
          {/* Yükselt */}
          <group
            position={[-0.10, 0, 0]}
            onClick={(e) => {
              stopEvt(e)
              setYOffset((prev) => Math.min(0.35, prev + 0.06))
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
              <boxGeometry args={[0.045, 0.034, 0.005]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} />
            </mesh>
            <Text position={[0, 0, 0.004]} fontSize={0.011} color="#38bdf8" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              ▲ Y
            </Text>
          </group>

          {/* Alçalt */}
          <group
            position={[-0.05, 0, 0]}
            onClick={(e) => {
              stopEvt(e)
              setYOffset((prev) => Math.max(-0.35, prev - 0.06))
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
              <boxGeometry args={[0.045, 0.034, 0.005]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} />
            </mesh>
            <Text position={[0, 0, 0.004]} fontSize={0.011} color="#38bdf8" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              ▼ Y
            </Text>
          </group>

          {/* Yakınlaştır */}
          <group
            position={[0.01, 0, 0]}
            onClick={(e) => {
              stopEvt(e)
              setZOffset((prev) => Math.min(0.40, prev + 0.08))
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
              <boxGeometry args={[0.065, 0.034, 0.005]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} />
            </mesh>
            <Text position={[0, 0, 0.004]} fontSize={0.010} color="#34d399" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              + YAKIN
            </Text>
          </group>

          {/* Uzaklaştır */}
          <group
            position={[0.08, 0, 0]}
            onClick={(e) => {
              stopEvt(e)
              setZOffset((prev) => Math.max(-0.40, prev - 0.08))
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
              <boxGeometry args={[0.065, 0.034, 0.005]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} />
            </mesh>
            <Text position={[0, 0, 0.004]} fontSize={0.010} color="#fbbf24" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              - UZAK
            </Text>
          </group>
        </group>

        {/* Big Close Button: [ ✖ VR EKRANINI KAPAT ] */}
        <group
          position={[0.62, 0, 0.002]}
          onClick={(e) => {
            stopEvt(e)
            onClose()
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
            <boxGeometry args={[0.19, 0.044, 0.006]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.3} />
          </mesh>
          <Text
            position={[0, 0, 0.004]}
            fontSize={0.012}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ✖ EKRANI KAPAT
          </Text>
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 3. LEFT PANEL: 9 LARGE INTERACTIVE CHANNEL SELECTION TILES           */}
      {/* ==================================================================== */}
      <group position={[-0.56, -0.045, 0.002]}>
        {/* Left Panel Frame */}
        <mesh>
          <planeGeometry args={[0.36, 0.79]} />
          <meshBasicMaterial color="#091224" />
        </mesh>

        {/* Subheader */}
        <Text
          position={[0, 0.365, 0.002]}
          fontSize={0.013}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          SABİT NOKTALAR (9 KANAL)
        </Text>

        {/* 9 Large Channel Buttons */}
        {FIXED_CHANNELS.map((ch, idx) => {
          const isSel = activeChannel === ch.ch
          const tileY = 0.315 - idx * 0.076
          const chLoc = probeLocations[idx]
          const chTemp = channelTemps[idx]
          const chPl = plateauStates[idx]
          const hasPlateau = chPl.mode !== 'idle'

          return (
            <group
              key={`vr-tile-${ch.ch}`}
              position={[0, tileY, 0.002]}
              onClick={(e) => {
                stopEvt(e)
                onSelectChannel(ch.ch)
              }}
              onPointerOver={(e) => {
                stopEvt(e)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              {/* Tile Box with thick VR collider hitbox */}
              <mesh>
                <boxGeometry args={[0.33, 0.066, 0.008]} />
                <meshStandardMaterial
                  color={isSel ? '#0284c7' : '#0f1d38'}
                  roughness={0.3}
                  metalness={0.2}
                />
              </mesh>

              {/* Left Active Accent Bar */}
              {isSel && (
                <mesh position={[-0.158, 0, 0.005]}>
                  <boxGeometry args={[0.010, 0.060, 0.002]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
              )}

              {/* Channel & Element Symbol */}
              <Text
                position={[-0.142, 0.014, 0.005]}
                fontSize={0.013}
                color={isSel ? '#ffffff' : '#f8fafc'}
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                C{ch.ch} {ch.model} ({ch.elementName.split(' ')[0]})
              </Text>

              {/* Nominal & Live Temperature */}
              <Text
                position={[-0.142, -0.014, 0.005]}
                fontSize={0.011}
                color={isSel ? '#fef08a' : '#4ade80'}
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {chTemp >= 0 ? `+${chTemp.toFixed(2)}` : chTemp.toFixed(2)} °C
              </Text>

              {/* Status Chips on the Right Side of Tile */}
              <group position={[0.10, 0, 0.005]}>
                {/* Probe Location Chip */}
                <mesh position={[0, 0.014, 0]}>
                  <planeGeometry args={[0.088, 0.020]} />
                  <meshBasicMaterial color={chLoc === 'cell' ? '#166534' : '#9a3412'} />
                </mesh>
                <Text position={[0, 0.014, 0.002]} fontSize={0.0085} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                  {chLoc === 'cell' ? 'HÜCREDE' : 'ÖN ISITMA'}
                </Text>

                {/* Plateau Mode Chip if Active */}
                {hasPlateau && (
                  <>
                    <mesh position={[0, -0.014, 0]}>
                      <planeGeometry args={[0.088, 0.020]} />
                      <meshBasicMaterial color={chPl.mode === 'freeze' ? '#0369a1' : '#b45309'} />
                    </mesh>
                    <Text position={[0, -0.014, 0.002]} fontSize={0.0085} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                      {chPl.mode === 'freeze' ? '❄ DONMA' : '🔥 ERİME'}
                    </Text>
                  </>
                )}
              </group>
            </group>
          )
        })}
      </group>

      {/* ==================================================================== */}
      {/* 4. MAIN STAGE: TELEMETRY, MASSIVE GRAPH & LARGE VR TOUCH BUTTONS     */}
      {/* ==================================================================== */}
      <group position={[0.20, -0.045, 0.002]}>
        {/* Main Stage Background */}
        <mesh>
          <planeGeometry args={[1.12, 0.79]} />
          <meshBasicMaterial color="#070f20" />
        </mesh>

        {/* ------------------------------------------------------------------ */}
        {/* 4.1 LIVE TELEMETRY HERO BAR (MASSIVE NUMERICAL DISPLAY)            */}
        {/* ------------------------------------------------------------------ */}
        <group position={[0, 0.33, 0.002]}>
          <mesh>
            <planeGeometry args={[1.08, 0.095]} />
            <meshBasicMaterial color="#0b172e" />
          </mesh>

          {/* Active Model & Element Title */}
          <Text
            position={[-0.52, 0.026, 0.002]}
            fontSize={0.015}
            color="#38bdf8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            CH{activeInfo.ch} {activeInfo.model} — {activeInfo.elementName} [ITS-90: {activeInfo.nominalTemp.toFixed(4)} °C]
          </Text>

          {/* Huge Temperature Readout */}
          <Text
            position={[-0.52, -0.018, 0.002]}
            fontSize={0.025}
            color="#4ade80"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {activeTemp >= 0 ? `+${activeTemp.toFixed(4)}` : activeTemp.toFixed(4)} °C
          </Text>

          {/* Huge Resistance Rt Readout */}
          <Text
            position={[-0.14, -0.018, 0.002]}
            fontSize={0.019}
            color="#fbbf24"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            Rt: {activeRt.toFixed(4)} Ω
          </Text>

          {/* Huge Ratio W Readout */}
          <Text
            position={[0.18, -0.018, 0.002]}
            fontSize={0.019}
            color="#c084fc"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            Ratio W: {activeRatioW.toFixed(5)}
          </Text>

          {/* Stability Metric */}
          <group position={[0.42, 0.024, 0.002]}>
            <mesh>
              <planeGeometry args={[0.18, 0.024]} />
              <meshBasicMaterial color="#064e3b" />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.010} color="#34d399" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              ±{activePl.stabilityMilliKelvin.toFixed(2)} mK/h DENGEDE
            </Text>
          </group>

          {/* Phase Status Banner */}
          <Text
            position={[0.51, -0.018, 0.002]}
            fontSize={0.011}
            color={phaseStatus.color}
            anchorX="right"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {phaseStatus.text}
          </Text>
        </group>

        {/* ------------------------------------------------------------------ */}
        {/* 4.2 MASSIVE OSCILLOSCOPE REALIZATION GRAPH (0.94m x 0.32m)         */}
        {/* ------------------------------------------------------------------ */}
        <group position={[0, 0.08, 0.002]}>
          {/* Plot Frame */}
          <mesh position={[0, plotOriginY, 0]}>
            <planeGeometry args={[plotWidth + 0.08, plotHeight + 0.06]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
          <mesh position={[0, plotOriginY, 0.001]}>
            <planeGeometry args={[plotWidth + 0.076, plotHeight + 0.056]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, plotOriginY, 0.002]}>
            <planeGeometry args={[plotWidth + 0.072, plotHeight + 0.052]} />
            <meshBasicMaterial color="#050b18" />
          </mesh>

          {/* Horizontal Temperature Lines with Labels */}
          {[-0.35, 0, 0.35].map((gVal, idx) => {
            const gy = plotOriginY + gVal * (plotHeight * 0.85)
            const isCenter = idx === 1
            return (
              <group key={`vr-hgrid-${idx}`} position={[0, gy, 0.003]}>
                <mesh>
                  <planeGeometry args={[plotWidth, isCenter ? 0.0025 : 0.001]} />
                  <meshBasicMaterial color={isCenter ? '#0284c7' : '#1e293b'} />
                </mesh>
                <Text
                  position={[plotOriginX - 0.012, 0, 0.002]}
                  fontSize={0.011}
                  color={isCenter ? '#38bdf8' : '#64748b'}
                  anchorX="right"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  {isCenter
                    ? `T_90 (${activeInfo.nominalTemp.toFixed(2)}°C)`
                    : gVal > 0
                    ? `+${(activeInfo.nominalTemp + 0.35).toFixed(2)}°C`
                    : `${(activeInfo.nominalTemp - 0.35).toFixed(2)}°C`}
                </Text>
              </group>
            )
          })}

          {/* Vertical Time Lines with Labels */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((tx, idx) => {
            const gx = plotOriginX + tx * plotWidth
            const minLabel = idx * 5
            return (
              <group key={`vr-vgrid-${idx}`} position={[gx, plotOriginY, 0.003]}>
                <mesh>
                  <planeGeometry args={[0.001, plotHeight]} />
                  <meshBasicMaterial color="#1e293b" />
                </mesh>
                <Text
                  position={[0, -plotHeight / 2 - 0.016, 0.002]}
                  fontSize={0.010}
                  color="#64748b"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  {minLabel} dk
                </Text>
              </group>
            )
          })}

          {/* Curve Segments: Rendered thick and vibrant for VR visibility */}
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
            const isPassed = segProgress <= activePl.progress

            const segColor = !isActive
              ? '#334155'
              : isPassed
              ? isFreeze
                ? '#38bdf8'
                : '#f59e0b'
              : '#1e293b'

            return (
              <mesh
                key={`vr-curve-${idx}`}
                position={[midX, midY, 0.004]}
                rotation={[0, 0, angle]}
              >
                <planeGeometry args={[len, isPassed ? 0.0042 : 0.0018]} />
                <meshBasicMaterial color={segColor} />
              </mesh>
            )
          })}

          {/* Curve Phase Annotations (Large VR Text) */}
          {isFreeze && (
            <>
              {/* Supercooling Dip Annotation */}
              <group position={[plotOriginX + 0.18 * plotWidth, plotOriginY - 0.095, 0.006]}>
                <mesh>
                  <planeGeometry args={[0.22, 0.030]} />
                  <meshBasicMaterial color="#0c4a6e" />
                </mesh>
                <Text
                  position={[0, 0, 0.002]}
                  fontSize={0.011}
                  color="#38bdf8"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  ▼ Aşırı Soğuma (-0.28°C Dip)
                </Text>
              </group>

              {/* Recalescence Spike Annotation */}
              <group position={[plotOriginX + 0.28 * plotWidth, plotOriginY + 0.085, 0.006]}>
                <mesh>
                  <planeGeometry args={[0.22, 0.030]} />
                  <meshBasicMaterial color="#713f12" />
                </mesh>
                <Text
                  position={[0, 0, 0.002]}
                  fontSize={0.011}
                  color="#facc15"
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  ▲ Nükleasyon & Isınma
                </Text>
              </group>

              {/* Equilibrium Plateau Region Bracket */}
              <group position={[plotOriginX + 0.58 * plotWidth, plotOriginY + 0.065, 0.006]}>
                <mesh>
                  <planeGeometry args={[0.42, 0.032]} />
                  <meshBasicMaterial color="#064e3b" />
                </mesh>
                <Text
                  position={[0, 0, 0.002]}
                  fontSize={0.012}
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
            <group position={[plotOriginX + 0.50 * plotWidth, plotOriginY + 0.065, 0.006]}>
              <mesh>
                <planeGeometry args={[0.42, 0.032]} />
                <meshBasicMaterial color="#78350f" />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.012}
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

          {/* Live Pulsing Tracer Marker (High-visibility VR Sphere & Concentric Ring) */}
          {isActive && (
            <group position={[markerPos.x, markerPos.y, 0.008]}>
              <mesh>
                <circleGeometry args={[0.007, 24]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, -0.001]}>
                <ringGeometry args={[0.010, 0.015, 24]} />
                <meshBasicMaterial
                  color={isFreeze ? '#38bdf8' : '#f59e0b'}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </group>
          )}
        </group>

        {/* ------------------------------------------------------------------ */}
        {/* 4.3 LARGE VR ACTION BUTTONS FOR META QUEST 3 TOUCH & CONTROLLER    */}
        {/* ------------------------------------------------------------------ */}
        <group position={[0, -0.24, 0.002]}>
          <mesh>
            <planeGeometry args={[1.08, 0.16]} />
            <meshBasicMaterial color="#0b172e" />
          </mesh>

          {/* Button 1: DONMAYA GÖNDER (Large VR Push Button) */}
          <group
            position={[-0.38, 0.025, 0.005]}
            onClick={(e) => {
              stopEvt(e)
              onStartPlateau(chIdx, 'freeze')
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
              <boxGeometry args={[0.26, 0.056, 0.012]} />
              <meshStandardMaterial
                color={isFreeze && isActive ? '#0284c7' : '#0369a1'}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>
            <Text
              position={[0, 0, 0.007]}
              fontSize={0.014}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ❄ DONMAYA GÖNDER
            </Text>
          </group>

          {/* Button 2: ERİMEYE GÖNDER (Large VR Push Button) */}
          <group
            position={[-0.11, 0.025, 0.005]}
            onClick={(e) => {
              stopEvt(e)
              onStartPlateau(chIdx, 'melt')
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
              <boxGeometry args={[0.26, 0.056, 0.012]} />
              <meshStandardMaterial
                color={isMelt && isActive ? '#d97706' : '#b45309'}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>
            <Text
              position={[0, 0, 0.007]}
              fontSize={0.014}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              🔥 ERİMEYE GÖNDER
            </Text>
          </group>

          {/* Button 3: PROBU HÜCREYE YERLEŞTİR / ÖN ISITMA TRANSFER */}
          <group
            position={[0.18, 0.025, 0.005]}
            onClick={(e) => {
              stopEvt(e)
              onToggleProbe(chIdx)
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
              <boxGeometry args={[0.28, 0.056, 0.012]} />
              <meshStandardMaterial
                color={activeLoc === 'cell' ? '#166534' : '#c2410c'}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>
            <Text
              position={[0, 0, 0.007]}
              fontSize={0.013}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {activeLoc === 'cell' ? '📍 PROB: HÜCREDE (ÇIKAR)' : '⏳ PROB: ÖN ISITMADA (HÜCREYE AL)'}
            </Text>
          </group>

          {/* Button 4: SIFIRLA / BEKLEME */}
          <group
            position={[0.42, 0.025, 0.005]}
            onClick={(e) => {
              stopEvt(e)
              onResetPlateau(chIdx)
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
              <boxGeometry args={[0.16, 0.056, 0.012]} />
              <meshStandardMaterial color="#334155" roughness={0.3} />
            </mesh>
            <Text
              position={[0, 0, 0.007]}
              fontSize={0.013}
              color="#cbd5e1"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ⟲ SIFIRLA
            </Text>
          </group>

          {/* Quick Channel Navigation: [◀ ÖNCEKİ SABİT NOKTA] and [SONRAKİ SABİT NOKTA ▶] */}
          <group position={[0, -0.042, 0.005]}>
            <group
              position={[-0.26, 0, 0]}
              onClick={(e) => {
                stopEvt(e)
                onSelectChannel(activeChannel > 1 ? activeChannel - 1 : 9)
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
                <boxGeometry args={[0.34, 0.038, 0.008]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.012} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                ◀ ÖNCEKİ SABİT NOKTA
              </Text>
            </group>

            <group
              position={[0.26, 0, 0]}
              onClick={(e) => {
                stopEvt(e)
                onSelectChannel(activeChannel < 9 ? activeChannel + 1 : 1)
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
                <boxGeometry args={[0.34, 0.038, 0.008]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.012} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                SONRAKİ SABİT NOKTA ▶
              </Text>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

export default memo(FixedPointVRExpandedScreen)
