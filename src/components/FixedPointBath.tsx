import { useState, useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import QuartzSPRT from './QuartzSPRT'

export interface FixedPointBathProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  modelName: string // e.g. "MK_Hg", "MK_TPW", "MK_Ga"
  elementName: string // e.g. "Cıva Üçlü Noktası", "Suyun Üçlü Noktası (TPW)", "Galyum Erim Noktası"
  elementSymbol: string // "Hg", "TPW", "Ga"
  fixedPointTemp: number // -38.8344, 0.0100, 29.7646
  scale?: number
  probeLocation?: 'preheat' | 'cell'
  onToggleProbeLocation?: () => void
  currentTemp?: number
  isHeated?: boolean
}

/**
 * High-Precision Fixed-Point Maintenance Bath
 * Modeled after Fluke Calibration 7380 / 9210 Deep-Well Metrology Bath.
 * Features:
 * - Platinum/off-white powder-coated steel chassis with lower front condenser louvers.
 * - 4 heavy-duty dual-wheel black caster wheels at base.
 * - Beveled dark slate top-front console with digital temperature readout and membrane keypad.
 * - Raised insulated cell well tower on top deck with thumb screws and guide aperture.
 * - Pre-conditioning / tempering well on right side of top deck.
 * - Interactive transfer of Quartz SPRT between Pre-Conditioning and Main Cell!
 */
function FixedPointBath({
  position,
  rotation = [0, 0, 0],
  modelName,
  elementName,
  elementSymbol,
  fixedPointTemp,
  scale = 1,
  probeLocation = 'preheat',
  onToggleProbeLocation,
  currentTemp,
  isHeated = true
}: FixedPointBathProps) {
  const [isOn, setIsOn] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Materials matching reference image
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Warm platinum / light off-white powder-coated metal
        metalness: 0.25,
        roughness: 0.35
      }),
    []
  )

  const topPlateMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155', // Slate grey top deck and console cowl
        metalness: 0.45,
        roughness: 0.35
      }),
    []
  )

  const towerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b', // Dark charcoal raised bath housing box
        metalness: 0.5,
        roughness: 0.4
      }),
    []
  )

  const stainlessMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        metalness: 0.85,
        roughness: 0.2
      }),
    []
  )

  const casterMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.4,
        roughness: 0.7
      }),
    []
  )

  // Effective live temperature
  const effectiveTemp =
    currentTemp !== undefined
      ? currentTemp
      : probeLocation === 'cell'
      ? fixedPointTemp
      : isHeated
      ? fixedPointTemp > 25
        ? fixedPointTemp - 0.8
        : fixedPointTemp + 0.5
      : 25.0

  const isProbeInPreheat = probeLocation === 'preheat'

  const handleProbeTransfer = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onToggleProbeLocation) {
      onToggleProbeLocation()
    }
  }

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation()
        setIsHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setIsHovered(false)
      }}
    >
      {/* ==================================================================== */}
      {/* 4 HEAVY-DUTY DUAL-WHEEL CASTER WHEELS (Matching photo!)              */}
      {/* ==================================================================== */}
      {[
        [-0.17, -0.19],
        [0.17, -0.19],
        [-0.17, 0.19],
        [0.17, 0.19]
      ].map(([cx, cz], idx) => (
        <group key={`caster-${idx}`} position={[cx, 0.045, cz]}>
          {/* Swivel Fork Bracket */}
          <mesh position={[0, 0.02, 0]} material={casterMaterial}>
            <cylinderGeometry args={[0.018, 0.022, 0.025, 16]} />
          </mesh>
          {/* Dual Wheels */}
          {[-0.012, 0.012].map((wx, wIdx) => (
            <mesh
              key={`wheel-${wIdx}`}
              position={[wx, -0.01, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={casterMaterial}
            >
              <cylinderGeometry args={[0.024, 0.024, 0.012, 16]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ==================================================================== */}
      {/* MAIN VERTICAL CABINET (PLATINUM POWDER-COATED STEEL)                  */}
      {/* ==================================================================== */}
      {/* Width: 0.44m, Depth: 0.52m, Height: 0.86m (Base y=0.08 to y=0.94)    */}
      <group position={[0, 0.51, 0]}>
        {/* Main Cabinet Box */}
        <mesh material={bodyMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.86, 0.52]} />
        </mesh>

        {/* Lower Front Ventilation Louver Grille (Refrigeration Condenser) */}
        {/* As seen in the reference image: wide horizontal slotted vents */}
        <group position={[0, -0.22, 0.261]}>
          {/* Grille background cut-out */}
          <mesh>
            <planeGeometry args={[0.34, 0.28]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>
          {/* 12 Horizontal Air Louver Slats */}
          {Array.from({ length: 12 }).map((_, sIdx) => {
            const sy = 0.12 - sIdx * 0.022
            return (
              <mesh key={`louver-${sIdx}`} position={[0, sy, 0.002]} material={bodyMaterial}>
                <boxGeometry args={[0.33, 0.008, 0.004]} />
              </mesh>
            )
          })}
        </group>

        {/* FRONT CABINET SILKSCREEN BRANDING */}
        <group position={[0, 0.16, 0.261]}>
          {/* Accent Line */}
          <mesh position={[0, 0.08, 0]}>
            <planeGeometry args={[0.32, 0.003]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* mchtkrkmz Brand Badge */}
          <mesh position={[-0.10, 0.06, 0.001]}>
            <planeGeometry args={[0.09, 0.020]} />
            <meshBasicMaterial color="#08b5ea" />
          </mesh>
          <Text
            position={[-0.10, 0.06, 0.002]}
            fontSize={0.011}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            mchtkrkmz
          </Text>

          <Text
            position={[0.06, 0.06, 0.002]}
            fontSize={0.0085}
            color="#475569"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            METROLOGY BATH
          </Text>

          {/* LARGE PROMINENT MODEL NAME (MK_Hg / MK_TPW / MK_Ga) */}
          <Text
            position={[0, 0.015, 0.002]}
            fontSize={0.034}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {modelName}
          </Text>

          {/* Fixed-Point Sub-title */}
          <Text
            position={[0, -0.025, 0.002]}
            fontSize={0.010}
            color="#0284c7"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ITS-90 {elementSymbol.toUpperCase()} FIXED-POINT
          </Text>

          <Text
            position={[0, -0.046, 0.002]}
            fontSize={0.0085}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {elementName} ({fixedPointTemp.toFixed(4)} °C)
          </Text>

          {/* Front Quick Transfer Button */}
          <group
            position={[0, -0.082, 0.002]}
            onClick={handleProbeTransfer}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <mesh>
              <boxGeometry args={[0.30, 0.026, 0.004]} />
              <meshStandardMaterial
                color={isProbeInPreheat ? '#ea580c' : '#0284c7'}
                roughness={0.4}
              />
            </mesh>
            <Text
              position={[0, 0, 0.003]}
              fontSize={0.0080}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isProbeInPreheat
                ? '♨️ ŞARTLANDIRMADA (HÜCREYE YERLEŞTİR)'
                : '❄️ HÜCREDE AKTİF (ŞARTLANDIRMAYA AL)'}
            </Text>
          </group>
        </group>

        {/* ==================================================================== */}
        {/* BEVELED TOP-FRONT CONTROL CONSOLE COWL (Matching reference image!)   */}
        {/* ==================================================================== */}
        <group position={[0, 0.435, 0.22]} rotation={[-0.30, 0, 0]}>
          {/* Dark Slate Bezel Cowl */}
          <mesh material={topPlateMaterial}>
            <boxGeometry args={[0.444, 0.08, 0.08]} />
          </mesh>

          {/* VFD Digital Display Screen in Center */}
          <group position={[-0.04, 0.005, 0.041]}>
            <mesh>
              <planeGeometry args={[0.22, 0.046]} />
              <meshBasicMaterial color="#050811" />
            </mesh>

            {/* Screen Header */}
            <Text
              position={[-0.10, 0.012, 0.001]}
              fontSize={0.0055}
              color="#38bdf8"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {modelName} | {isProbeInPreheat ? 'PRE-COND' : 'STABLE'}
            </Text>

            {/* Large Digital Temperature Readout */}
            <Text
              position={[-0.10, -0.008, 0.001]}
              fontSize={0.0115}
              color={isOn ? (isProbeInPreheat ? '#fb923c' : '#22c55e') : '#64748b'}
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isOn
                ? `${effectiveTemp >= 0 ? '+' : ''}${effectiveTemp.toFixed(4)} °C`
                : 'OFF'}
            </Text>

            <Text
              position={[0.10, -0.008, 0.001]}
              fontSize={0.0050}
              color="#94a3b8"
              anchorX="right"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {isProbeInPreheat ? 'TEMP DENGELENİYOR' : 'PLATO ±0.2mK'}
            </Text>
          </group>

          {/* Membrane Keypad Buttons */}
          <group position={[0.10, 0.005, 0.041]}>
            {[-0.024, -0.008, 0.008, 0.024].map((bx) => (
              <mesh key={`btn-bath-${bx}`} position={[bx, 0, 0]}>
                <boxGeometry args={[0.012, 0.014, 0.003]} />
                <meshStandardMaterial color="#475569" roughness={0.4} />
              </mesh>
            ))}
          </group>

          {/* Rocker Power Switch on the right side */}
          <group
            position={[0.175, 0.005, 0.041]}
            onClick={(e) => {
              e.stopPropagation()
              setIsOn((prev) => !prev)
            }}
          >
            <mesh>
              <boxGeometry args={[0.022, 0.028, 0.005]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.005, 0.004]}>
              <planeGeometry args={[0.010, 0.004]} />
              <meshBasicMaterial color={isOn ? '#22c55e' : '#334155'} />
            </mesh>
          </group>
        </group>

        {/* ==================================================================== */}
        {/* TOP DECK & RAISED INSULATED BATH TOWER (Exactly as in photo!)        */}
        {/* ==================================================================== */}
        <group position={[0, 0.44, 0]}>
          {/* Dark Slate Top Deck Plate */}
          <mesh material={topPlateMaterial} receiveShadow castShadow>
            <boxGeometry args={[0.444, 0.025, 0.524]} />
          </mesh>

          {/* RAISED INSULATED BATH CELL TOWER (The prominent dark box in the photo!) */}
          {/* Position: slightly towards the rear-center */}
          <group position={[-0.045, 0.09, -0.05]}>
            {/* Raised Box (Width: 0.22m, Height: 0.16m, Depth: 0.22m) */}
            <mesh material={towerMaterial} castShadow receiveShadow>
              <boxGeometry args={[0.22, 0.16, 0.22]} />
            </mesh>

            {/* Stainless Mounting Base Flange */}
            <mesh position={[0, -0.075, 0]} material={stainlessMaterial}>
              <boxGeometry args={[0.24, 0.010, 0.24]} />
            </mesh>

            {/* Two Vertical Knurled Thumb Screws / Guide Pins on Sides */}
            {[-0.10, 0.10].map((px) => (
              <group key={`pin-${px}`} position={[px, 0.08, 0]}>
                <mesh material={stainlessMaterial}>
                  <cylinderGeometry args={[0.006, 0.006, 0.035, 16]} />
                </mesh>
                <mesh position={[0, 0.020, 0]} material={stainlessMaterial}>
                  <cylinderGeometry args={[0.010, 0.010, 0.010, 16]} />
                </mesh>
              </group>
            ))}

            {/* Side Ventilation Slits on the raised tower */}
            {[-0.03, 0, 0.03].map((vy) => (
              <mesh key={`tvent-${vy}`} position={[-0.111, vy, 0]}>
                <planeGeometry args={[0.004, 0.012]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
            ))}

            {/* PRIMARY FIXED-POINT CELL WELL OPENING ON TOP OF TOWER */}
            <group
              position={[0, 0.08, 0]}
              onClick={handleProbeTransfer}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              {/* Stainless Collar */}
              <mesh material={stainlessMaterial}>
                <cylinderGeometry args={[0.045, 0.048, 0.010, 24]} />
              </mesh>
              {/* Bore Aperture */}
              <mesh position={[0, 0.006, 0]}>
                <cylinderGeometry args={[0.032, 0.032, 0.006, 24]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
              {/* PTFE Guide Sleeve */}
              <mesh position={[0, 0.010, 0]} material={stainlessMaterial}>
                <cylinderGeometry args={[0.016, 0.020, 0.016, 20]} />
              </mesh>

              {/* If probe is in cell, it sits on this tower! */}
              {!isProbeInPreheat && (
                <QuartzSPRT
                  position={[0, 0.018, 0]}
                  label={`${modelName} SPRT`}
                  sheathLength={0.35}
                />
              )}

              <Text
                position={[0, 0.008, 0.065]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.0085}
                color={!isProbeInPreheat ? '#38bdf8' : '#94a3b8'}
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                SABİT NOKTA HÜCRESİ (CELL)
              </Text>
            </group>
          </group>

          {/* PRE-CONDITIONING / TEMPERING WELL ON TOP DECK (Right Side) */}
          <group
            position={[0.13, 0.015, -0.05]}
            onClick={handleProbeTransfer}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            {/* Stainless Well Flange */}
            <mesh material={stainlessMaterial}>
              <cylinderGeometry args={[0.038, 0.042, 0.010, 24]} />
            </mesh>
            {/* Tempering Collar Ring */}
            <mesh position={[0, 0.006, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.006, 24]} />
              <meshStandardMaterial
                color="#0284c7"
                emissive="#0369a1"
                emissiveIntensity={isOn ? 0.6 : 0.1}
              />
            </mesh>

            {/* If probe is in preheat / conditioning, it sits here! */}
            {isProbeInPreheat && (
              <QuartzSPRT
                position={[0, 0.015, 0]}
                label={`${modelName} SPRT`}
                sheathLength={0.35}
              />
            )}

            <Text
              position={[0, 0.008, 0.055]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.0080}
              color={isProbeInPreheat ? '#f97316' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              ŞARTLANDIRMA (PRE-COND)
            </Text>
          </group>

          {/* FLOATING STATUS BADGE ABOVE BATH */}
          <group
            position={[0, 0.45, -0.05]}
            onClick={handleProbeTransfer}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <mesh>
              <planeGeometry args={[0.30, 0.07]} />
              <meshBasicMaterial
                color={
                  isProbeInPreheat
                    ? isHeated
                      ? '#065f46'
                      : '#7c2d12'
                    : '#1e3a8a'
                }
                transparent
                opacity={0.92}
              />
            </mesh>
            <mesh position={[0, 0.032, 0.001]}>
              <planeGeometry args={[0.296, 0.005]} />
              <meshBasicMaterial
                color={
                  isProbeInPreheat
                    ? isHeated
                      ? '#34d399'
                      : '#fb923c'
                    : '#38bdf8'
                }
              />
            </mesh>

            <Text
              position={[0, 0.012, 0.002]}
              fontSize={0.0105}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isProbeInPreheat
                ? isHeated
                  ? '♨️ ŞARTLANDIRMA TAMAMLANDI'
                  : '⏳ SICAKLIK DENGELENİYOR...'
                : '❄️ SABİT NOKTA PLATO'}
            </Text>

            <Text
              position={[0, -0.014, 0.002]}
              fontSize={0.0085}
              color={isProbeInPreheat ? (isHeated ? '#fef08a' : '#fed7aa') : '#93c5fd'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isProbeInPreheat
                ? isHeated
                  ? '▶ Tıkla: Hücreye Yerleştir'
                  : 'Termal Denge Bekleniyor'
                : '▶ Tıkla: Şartlandırmaya Al'}
            </Text>
          </group>
        </group>
      </group>

      {/* Hover Information Tooltip */}
      <group position={[0, 1.35, 0]} visible={isHovered}>
        <mesh>
          <planeGeometry args={[0.38, 0.13]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.94} />
        </mesh>
        <Text
          position={[0, 0.042, 0.002]}
          fontSize={0.015}
          color="#08b5ea"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {modelName} (Metrology Bath)
        </Text>
        <Text
          position={[0, 0.018, 0.002]}
          fontSize={0.012}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {elementName}
        </Text>
        <Text
          position={[0, -0.008, 0.002]}
          fontSize={0.011}
          color={isProbeInPreheat ? '#fb923c' : '#38bdf8'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          Durum: {isProbeInPreheat ? 'Şartlandırma Haznesi' : 'Sabit Nokta Hücresi'} ({effectiveTemp.toFixed(4)} °C)
        </Text>
        <Text
          position={[0, -0.036, 0.002]}
          fontSize={0.009}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          Tıklayarak Şartlandırma / Sabit Nokta arasında aktarabilirsiniz
        </Text>
      </group>
    </group>
  )
}

export default memo(FixedPointBath)
