import { useState, useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import FixedPointPlateauGraph, { type PlateauState } from './FixedPointPlateauGraph'

interface FixedPointBridgeProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  channelTemps?: number[]
  probeLocations?: ('preheat' | 'cell')[]
  plateauStates?: PlateauState[]
  onStartPlateau?: (channelIdx: number, mode: 'melt' | 'freeze') => void
  onResetPlateau?: (channelIdx: number) => void
  onToggleProbe?: (channelIdx: number) => void
  onToggleVRScreen?: () => void
  isVRScreenOpen?: boolean
}

export interface ChannelInfo {
  ch: number
  model: string
  elementName: string
  label: string
  nominalTemp: number
  r0: number
  alpha: number
  tagColor: string
}

export const FIXED_CHANNELS: ChannelInfo[] = [
  {
    ch: 1,
    model: 'MK_Ar',
    elementName: 'Argon Üçlü Noktası',
    label: 'CH1 [Ar]',
    nominalTemp: -189.3442,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#06b6d4' // Cyan / cryogenic
  },
  {
    ch: 2,
    model: 'MK_Hg',
    elementName: 'Cıva Üçlü Noktası',
    label: 'CH2 [Hg]',
    nominalTemp: -38.8344,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#38bdf8' // Sky blue
  },
  {
    ch: 3,
    model: 'MK_TPW',
    elementName: 'Suyun Üçlü Noktası',
    label: 'CH3 [TPW]',
    nominalTemp: 0.01,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#60a5fa' // Pure blue / TPW reference anchor (W=1.00000)
  },
  {
    ch: 4,
    model: 'MK_Ga',
    elementName: 'Galyum Erim Noktası',
    label: 'CH4 [Ga]',
    nominalTemp: 29.7646,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#34d399' // Emerald green
  },
  {
    ch: 5,
    model: 'MK_In',
    elementName: 'İndiyum Donma Noktası',
    label: 'CH5 [In]',
    nominalTemp: 156.5985,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#38bdf8'
  },
  {
    ch: 6,
    model: 'MK_Sn',
    elementName: 'Kalay Donma Noktası',
    label: 'CH6 [Sn]',
    nominalTemp: 231.928,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#38bdf8'
  },
  {
    ch: 7,
    model: 'MK_Zn',
    elementName: 'Çinko Donma Noktası',
    label: 'CH7 [Zn]',
    nominalTemp: 419.527,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#38bdf8'
  },
  {
    ch: 8,
    model: 'MK_Al',
    elementName: 'Alüminyum Donma Noktası',
    label: 'CH8 [Al]',
    nominalTemp: 660.323,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#facc15'
  },
  {
    ch: 9,
    model: 'MK_Ag',
    elementName: 'Gümüş Donma Noktası',
    label: 'CH9 [Ag]',
    nominalTemp: 961.78,
    r0: 25.0,
    alpha: 0.003926,
    tagColor: '#facc15'
  }
]

/**
 * mchtkrkmz 1595A Super-Thermometer Fixed-Point Resistance Bridge
 * Complete 9-Channel Primary ITS-90 Suite:
 * Ar, Hg, TPW, Ga, In, Sn, Zn, Al, Ag
 */
function FixedPointBridge({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  channelTemps,
  probeLocations,
  plateauStates,
  onStartPlateau,
  onResetPlateau,
  onToggleProbe,
  onToggleVRScreen,
  isVRScreenOpen
}: FixedPointBridgeProps) {
  const [activeChannel, setActiveChannel] = useState<number>(3) // Default to TPW (fundamental anchor)
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table')

  // Chassis materials
  const chassisMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.35,
        roughness: 0.4
      }),
    []
  )

  const bezelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e3a8a', // Deep sapphire/navy instrument bezel
        metalness: 0.6,
        roughness: 0.3
      }),
    []
  )

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#eab308',
        metalness: 0.9,
        roughness: 0.15
      }),
    []
  )

  // Active channel details for focus card
  const activeInfo = FIXED_CHANNELS[activeChannel - 1]
  const activeLoc = probeLocations ? probeLocations[activeChannel - 1] : 'cell'
  const activeBaseT = channelTemps ? channelTemps[activeChannel - 1] : activeInfo.nominalTemp
  const activeLiveTemp = activeLoc === 'cell' ? activeInfo.nominalTemp : activeBaseT
  const activeRt = activeInfo.r0 * (1 + activeInfo.alpha * activeLiveTemp)
  const activeRatioW = activeRt / activeInfo.r0

  const activePlateauState =
    plateauStates && plateauStates[activeChannel - 1]
      ? plateauStates[activeChannel - 1]
      : {
          mode: 'idle' as const,
          phase: 'idle' as const,
          progress: 0,
          elapsedSec: 0,
          stabilityMilliKelvin: 0.05
        }

  const handleTriggerPlateau = (mode: 'melt' | 'freeze') => {
    setViewMode('graph')
    if (onStartPlateau) {
      onStartPlateau(activeChannel - 1, mode)
    }
  }

  const handleResetPlateau = () => {
    if (onResetPlateau) {
      onResetPlateau(activeChannel - 1)
    }
  }

  const handleToggleProbe = () => {
    if (onToggleProbe) {
      onToggleProbe(activeChannel - 1)
    }
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 4 Rubber Base Feet */}
      {[
        [-0.38, -0.16],
        [0.38, -0.16],
        [-0.38, 0.16],
        [0.38, 0.16]
      ].map(([fx, fz], idx) => (
        <mesh key={`foot-${idx}`} position={[fx, 0.008, fz]}>
          <cylinderGeometry args={[0.014, 0.014, 0.016, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {/* Main Chassis Box (Width: 0.82m, Height: 0.28m, Depth: 0.38m) */}
      <mesh position={[0, 0.145, 0]} material={chassisMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.27, 0.38]} />
      </mesh>

      {/* Sapphire Corner Bumpers */}
      <mesh position={[-0.412, 0.145, 0]} material={bezelMaterial}>
        <boxGeometry args={[0.008, 0.276, 0.386]} />
      </mesh>
      <mesh position={[0.412, 0.145, 0]} material={bezelMaterial}>
        <boxGeometry args={[0.008, 0.276, 0.386]} />
      </mesh>

      {/* Top Carrying Handle */}
      <group position={[0, 0.285, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.42, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ==================================================================== */}
      {/* FRONT INSTRUMENT FACEPLATE                                            */}
      {/* ==================================================================== */}
      <group position={[0, 0.145, 0.191]}>
        {/* Front Panel Base */}
        <mesh>
          <planeGeometry args={[0.81, 0.265]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>

        {/* Top Header Banner Bar */}
        <mesh position={[0, 0.120, 0.001]}>
          <planeGeometry args={[0.81, 0.025]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* mchtkrkmz Brand Badge */}
        <mesh position={[-0.34, 0.120, 0.002]}>
          <planeGeometry args={[0.075, 0.016]} />
          <meshBasicMaterial color="#08b5ea" />
        </mesh>
        <Text
          position={[-0.34, 0.120, 0.003]}
          fontSize={0.0085}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          mchtkrkmz
        </Text>
        <Text
          position={[-0.29, 0.120, 0.003]}
          fontSize={0.0085}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          Termometre Direnç Köprüsü (1595A)
        </Text>
        {/* Quest 3 VR Big Screen Toggle Button */}
        {onToggleVRScreen && (
          <group
            position={[0.30, 0.120, 0.002]}
            onClick={(e) => {
              e.stopPropagation()
              onToggleVRScreen()
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
              <boxGeometry args={[0.155, 0.017, 0.003]} />
              <meshStandardMaterial color={isVRScreenOpen ? '#b91c1c' : '#0284c7'} roughness={0.3} />
            </mesh>
            <Text
              position={[0, 0, 0.002]}
              fontSize={0.0055}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isVRScreenOpen ? '✖ VR EKRANI KAPAT' : '⤢ QUEST 3 VR EKRANI'}
            </Text>
          </group>
        )}

        {/* ==================================================================== */}
        {/* LEFT SECTION: 9 Input Channels with Gold Binding Posts               */}
        {/* ==================================================================== */}
        <group position={[-0.28, -0.010, 0.001]}>
          <mesh>
            <planeGeometry args={[0.23, 0.22]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>

          {/* 9 Channel Columns (CH1 to CH9) */}
          {[-0.096, -0.072, -0.048, -0.024, 0.0, 0.024, 0.048, 0.072, 0.096].map((colX, chIdx) => {
            const chNum = chIdx + 1
            const isSel = activeChannel === chNum
            return (
              <group key={`bridge-col-${chIdx}`} position={[colX, 0, 0]}>
                {/* Column Channel Header */}
                <Text
                  position={[0, 0.096, 0.002]}
                  fontSize={0.0055}
                  color={isSel ? '#0284c7' : '#475569'}
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  C{chNum}
                </Text>

                {/* 4 Binding Posts per channel: I+, V+, V-, I-, GND */}
                {[
                  { y: 0.065, color: '#dc2626' }, // I+ Red
                  { y: 0.035, color: '#dc2626' }, // V+ Red
                  { y: 0.005, color: '#1e293b' }, // V- Black
                  { y: -0.025, color: '#1e293b' }, // I- Black
                  { y: -0.055, color: '#16a34a' } // GND Green
                ].map((post, pIdx) => (
                  <group key={`fpost-${chIdx}-${pIdx}`} position={[0, post.y, 0.003]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
                      <cylinderGeometry args={[0.0042, 0.0042, 0.004, 8]} />
                    </mesh>
                    <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.0035, 0.0035, 0.007, 16]} />
                      <meshStandardMaterial color={post.color} metalness={0.4} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
                      <cylinderGeometry args={[0.0016, 0.0016, 0.002, 16]} />
                    </mesh>
                  </group>
                ))}
              </group>
            )
          })}
        </group>

        {/* ==================================================================== */}
        {/* CENTER SECTION: 9-Channel LCD Display (TABLE OR GRAPH MODE)          */}
        {/* ==================================================================== */}
        <group position={[0.015, -0.010, 0.001]}>
          {/* Bezel */}
          <mesh>
            <planeGeometry args={[0.34, 0.22]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          {/* LCD Background */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.334, 0.214]} />
            <meshBasicMaterial color="#070a13" />
          </mesh>

          {viewMode === 'graph' ? (
            /* ================= VIEW 1: PLATO GRAFİĞİ GÖRÜNÜMÜ ================= */
            <FixedPointPlateauGraph
              channelInfo={activeInfo}
              probeLocation={activeLoc}
              liveTemp={activeLiveTemp}
              liveRt={activeRt}
              liveRatioW={activeRatioW}
              plateauState={activePlateauState}
              onStartPlateau={handleTriggerPlateau}
              onResetPlateau={handleResetPlateau}
              onToggleProbe={handleToggleProbe}
              onCloseGraph={() => setViewMode('table')}
              onOpenVRScreen={onToggleVRScreen}
            />
          ) : (
            /* ================= VIEW 2: 9 KANAL TABLO GÖRÜNÜMÜ ================= */
            <>
              {/* Top Focus Bar: Active Channel Highlight with Large Numbers */}
              <group position={[0, 0.082, 0.002]}>
                <mesh>
                  <planeGeometry args={[0.330, 0.038]} />
                  <meshBasicMaterial color="#172554" />
                </mesh>

                {/* Active Channel Label */}
                <Text
                  position={[-0.16, 0.010, 0.001]}
                  fontSize={0.0055}
                  color="#38bdf8"
                  anchorX="left"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  SEÇİLİ KANAL: CH{activeInfo.ch} [{activeInfo.model} - {activeInfo.elementName} | {activeLoc === 'cell' ? 'PLATO' : 'ÖN ISITMA'}]
                </Text>

                {/* Switch to Graph View Button inside Focus Bar */}
                <group
                  position={[0.090, 0.010, 0.002]}
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewMode('graph')
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
                    <boxGeometry args={[0.054, 0.014, 0.002]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.3} />
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
                    📈 GRAFİK
                  </Text>
                </group>

                {/* VR Big Screen Button inside Focus Bar */}
                {onToggleVRScreen && (
                  <group
                    position={[0.140, 0.010, 0.002]}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleVRScreen()
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
                      <boxGeometry args={[0.048, 0.014, 0.002]} />
                      <meshStandardMaterial color={isVRScreenOpen ? '#b91c1c' : '#059669'} roughness={0.3} />
                    </mesh>
                    <Text
                      position={[0, 0, 0.002]}
                      fontSize={0.0039}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                      fontWeight="bold"
                    >
                      {isVRScreenOpen ? '✖ VR' : '⤢ VR BÜYÜT'}
                    </Text>
                  </group>
                )}

                {/* Large Temperature Readout */}
                <Text
                  position={[-0.16, -0.007, 0.001]}
                  fontSize={0.0092}
                  color="#4ade80"
                  anchorX="left"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  {activeLiveTemp >= 0 ? `+${activeLiveTemp.toFixed(4)}` : activeLiveTemp.toFixed(4)} °C
                </Text>
                {/* Resistance Rt */}
                <Text
                  position={[0.01, -0.007, 0.001]}
                  fontSize={0.0068}
                  color="#fbbf24"
                  anchorX="left"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  Rt: {activeRt.toFixed(4)} Ω
                </Text>
                {/* Ratio W(T90) */}
                <Text
                  position={[0.16, -0.007, 0.001]}
                  fontSize={0.0068}
                  color="#a78bfa"
                  anchorX="right"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                  fontWeight="bold"
                >
                  Ratio W: {activeRatioW.toFixed(5)}
                </Text>
              </group>

              {/* Sub-Header Column Labels */}
              <group position={[0, 0.055, 0.002]}>
                <Text position={[-0.16, 0, 0.001]} fontSize={0.0042} color="#64748b" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
                  SABİT NOKTA
                </Text>
                <Text position={[-0.055, 0, 0.001]} fontSize={0.0042} color="#64748b" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
                  SICAKLIK (°C)
                </Text>
                <Text position={[0.035, 0, 0.001]} fontSize={0.0042} color="#64748b" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
                  DİRENÇ Rt (Ω)
                </Text>
                <Text position={[0.16, 0, 0.001]} fontSize={0.0042} color="#64748b" anchorX="right" anchorY="middle" font="/fonts/arial.ttf">
                  RATIO W = Rt/R(TPW)
                </Text>
              </group>

              {/* 9 SIMULTANEOUS CHANNEL ROWS (Ar, Hg, TPW, Ga, In, Sn, Zn, Al, Ag) */}
              {FIXED_CHANNELS.map((chInfo, idx) => {
                const isSel = activeChannel === chInfo.ch
                const rowY = 0.040 - idx * 0.0165
                const chLoc = probeLocations ? probeLocations[idx] : 'cell'
                const baseT = channelTemps ? channelTemps[idx] : chInfo.nominalTemp
                const liveT = chLoc === 'cell' ? chInfo.nominalTemp : baseT
                const rt = chInfo.r0 * (1 + chInfo.alpha * liveT)
                const ratioW = rt / chInfo.r0
                const stateLabel = chLoc === 'cell' ? 'PLATO' : 'ÖN ISITMA'
                const tagColor = chLoc === 'cell' ? chInfo.tagColor : '#fb923c'

                return (
                  <group
                    key={`screen-row-${chInfo.ch}`}
                    position={[0, rowY, 0.002]}
                    onClick={(e: ThreeEvent<MouseEvent>) => {
                      e.stopPropagation()
                      setActiveChannel(chInfo.ch)
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = 'auto'
                    }}
                  >
                    {/* Row Container Background (clickable) */}
                    <mesh>
                      <planeGeometry args={[0.330, 0.015]} />
                      <meshBasicMaterial color={isSel ? '#1d4ed8' : idx % 2 === 0 ? '#0f172a' : '#090d16'} />
                    </mesh>

                    {/* Left Active Indicator Notch */}
                    {isSel && (
                      <mesh position={[-0.163, 0, 0.001]}>
                        <planeGeometry args={[0.004, 0.014]} />
                        <meshBasicMaterial color="#38bdf8" />
                      </mesh>
                    )}

                    {/* Fixed Point Model & State */}
                    <Text
                      position={[-0.158, 0, 0.001]}
                      fontSize={0.0044}
                      color={tagColor}
                      anchorX="left"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                      fontWeight="bold"
                    >
                      {chInfo.label} [{stateLabel}]
                    </Text>

                    {/* 1. Sıcaklık Değeri (°C) */}
                    <Text
                      position={[-0.055, 0, 0.001]}
                      fontSize={0.0055}
                      color="#4ade80"
                      anchorX="left"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                      fontWeight="bold"
                    >
                      {liveT >= 0 ? `+${liveT.toFixed(4)}` : liveT.toFixed(4)} °C
                    </Text>

                    {/* 2. Direnç Değeri Rt (Ω) */}
                    <Text
                      position={[0.035, 0, 0.001]}
                      fontSize={0.0050}
                      color="#fbbf24"
                      anchorX="left"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                      fontWeight="bold"
                    >
                      {rt.toFixed(4)} Ω
                    </Text>

                    {/* 3. Ratio Oran Değeri W */}
                    <Text
                      position={[0.158, 0, 0.001]}
                      fontSize={0.0050}
                      color="#c084fc"
                      anchorX="right"
                      anchorY="middle"
                      font="/fonts/arial.ttf"
                      fontWeight="bold"
                    >
                      W: {ratioW.toFixed(5)}
                    </Text>
                  </group>
                )
              })}
            </>
          )}
        </group>

        {/* ==================================================================== */}
        {/* RIGHT SECTION: 9-Channel Selection & Plato Action Controls           */}
        {/* ==================================================================== */}
        <group position={[0.29, -0.010, 0.001]}>
          <mesh>
            <planeGeometry args={[0.19, 0.22]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>

          {/* Section Header */}
          <Text
            position={[0, 0.096, 0.002]}
            fontSize={0.0058}
            color="#1e293b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            KANAL GEÇİŞİ (9 SABİT NOKTA)
          </Text>

          {/* Previous / Next Quick Buttons */}
          <group position={[0, 0.076, 0.002]}>
            <group
              position={[-0.044, 0, 0.001]}
              onClick={(e) => {
                e.stopPropagation()
                setActiveChannel((prev) => (prev > 1 ? prev - 1 : 9))
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
                <boxGeometry args={[0.078, 0.015, 0.004]} />
                <meshStandardMaterial color="#334155" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.003]} fontSize={0.0055} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                ◀ ÖNCEKİ
              </Text>
            </group>

            <group
              position={[0.044, 0, 0.001]}
              onClick={(e) => {
                e.stopPropagation()
                setActiveChannel((prev) => (prev < 9 ? prev + 1 : 1))
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
                <boxGeometry args={[0.078, 0.015, 0.004]} />
                <meshStandardMaterial color="#334155" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.003]} fontSize={0.0055} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                SONRAKİ ▶
              </Text>
            </group>
          </group>

          {/* 9 Channel Buttons arranged in 2 Clean Columns */}
          <group position={[0, 0.052, 0.002]}>
            {FIXED_CHANNELS.map((chData, idx) => {
              const chNum = idx + 1
              const isSel = activeChannel === chNum
              const col = idx < 5 ? -0.045 : 0.045
              const row = idx < 5 ? idx : idx - 5
              const btnY = -row * 0.0135

              return (
                <group
                  key={`direct-btn-${chNum}`}
                  position={[col, btnY, 0.002]}
                  onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation()
                    setActiveChannel(chNum)
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
                    <boxGeometry args={[0.086, 0.0115, 0.003]} />
                    <meshStandardMaterial
                      color={isSel ? '#0284c7' : '#e2e8f0'}
                      roughness={0.3}
                    />
                  </mesh>
                  <Text
                    position={[-0.038, 0, 0.002]}
                    fontSize={0.0044}
                    color={isSel ? '#ffffff' : '#0f172a'}
                    anchorX="left"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                    fontWeight="bold"
                  >
                    C{chNum} {chData.model.replace('MK_', '')}
                  </Text>
                  <Text
                    position={[0.038, 0, 0.002]}
                    fontSize={0.0040}
                    color={isSel ? '#fef08a' : '#64748b'}
                    anchorX="right"
                    anchorY="middle"
                    font="/fonts/arial.ttf"
                  >
                    {chData.nominalTemp >= 0 ? `+${chData.nominalTemp.toFixed(0)}` : chData.nominalTemp.toFixed(0)}°C
                  </Text>
                </group>
              )
            })}
          </group>

          {/* ================================================================ */}
          {/* PLATO AKSİYON PANELİ: ERİME / DONMAYA GÖNDERME & GRAFİK AÇMA     */}
          {/* ================================================================ */}
          <group position={[0, -0.040, 0.002]}>
            <mesh>
              <planeGeometry args={[0.180, 0.076]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>

            {/* Selected Channel Label */}
            <Text
              position={[0, 0.026, 0.002]}
              fontSize={0.0048}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              CH{activeChannel} [{activeInfo.model}] PLATO İŞLEMLERİ
            </Text>

            {/* Button 1: DONMAYA GÖNDER */}
            <group
              position={[-0.044, 0.008, 0.002]}
              onClick={(e) => {
                e.stopPropagation()
                handleTriggerPlateau('freeze')
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
                <boxGeometry args={[0.082, 0.015, 0.003]} />
                <meshStandardMaterial color="#0284c7" roughness={0.3} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.0044} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                ❄ DONMAYA AL
              </Text>
            </group>

            {/* Button 2: ERİMEYE GÖNDER */}
            <group
              position={[0.044, 0.008, 0.002]}
              onClick={(e) => {
                e.stopPropagation()
                handleTriggerPlateau('melt')
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
                <boxGeometry args={[0.082, 0.015, 0.003]} />
                <meshStandardMaterial color="#d97706" roughness={0.3} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.0044} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                🔥 ERİMEYE AL
              </Text>
            </group>

            {/* Button 3: PLATO GRAFİĞİ GÖRÜNÜMÜNÜ AÇ / KAPAT */}
            <group
              position={[0, -0.010, 0.002]}
              onClick={(e) => {
                e.stopPropagation()
                setViewMode((prev) => (prev === 'graph' ? 'table' : 'graph'))
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
                <boxGeometry args={[0.170, 0.013, 0.003]} />
                <meshStandardMaterial color={viewMode === 'graph' ? '#059669' : '#334155'} roughness={0.3} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.0044} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                {viewMode === 'graph' ? '📋 TABLO GÖRÜNÜMÜ' : '📈 CANLI PLATO GRAFİĞİ'}
              </Text>
            </group>

            {/* Button 4: QUEST 3 VR BÜYÜK EKRANI */}
            {onToggleVRScreen && (
              <group
                position={[0, -0.024, 0.002]}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVRScreen()
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
                  <boxGeometry args={[0.170, 0.013, 0.003]} />
                  <meshStandardMaterial color={isVRScreenOpen ? '#b91c1c' : '#0284c7'} roughness={0.3} />
                </mesh>
                <Text position={[0, 0, 0.002]} fontSize={0.0042} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
                  {isVRScreenOpen ? '✖ VR EKRANI KAPAT' : '⤢ QUEST 3 VR BÜYÜK EKRAN'}
                </Text>
              </group>
            )}

            {/* Status indicator line */}
            <Text
              position={[0, -0.035, 0.002]}
              fontSize={0.0035}
              color={activePlateauState.mode !== 'idle' ? '#4ade80' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {activePlateauState.mode === 'freeze'
                ? '● DONMA İŞLEMİ AKTİF'
                : activePlateauState.mode === 'melt'
                ? '● ERİME İŞLEMİ AKTİF'
                : '○ BEKLEMEDE (İŞLEM SEÇİN)'}
            </Text>
          </group>

          {/* Power On Lamp */}
          <group position={[0, -0.094, 0.003]}>
            <mesh position={[0.04, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.004, 16]} />
              <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.6} />
            </mesh>
            <Text
              position={[-0.015, 0, 0]}
              fontSize={0.0046}
              color="#64748b"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              POWER ONLINE
            </Text>
          </group>
        </group>
      </group>
    </group>
  )
}

export default memo(FixedPointBridge)

