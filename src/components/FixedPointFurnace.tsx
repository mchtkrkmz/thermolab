import { useState, useMemo, memo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import QuartzSPRT from './QuartzSPRT'

export interface FixedPointFurnaceProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  modelName: string // e.g. "_In", "_Sn", "_Zn", "_Al", "_Ag"
  elementName: string // e.g. "Indium (İndiyum)", "Tin (Kalay)"
  elementSymbol: string // "In", "Sn", "Zn", "Al", "Ag"
  fixedPointTemp: number // e.g. 156.5985
  scale?: number
  probeLocation?: 'preheat' | 'cell'
  onToggleProbeLocation?: () => void
  currentTemp?: number
  isHeated?: boolean
}

function FixedPointFurnace({
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
}: FixedPointFurnaceProps) {
  const [isOn, setIsOn] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Materials
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        metalness: 0.2,
        roughness: 0.35
      }),
    []
  )

  const topPlateMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.5,
        roughness: 0.3
      }),
    []
  )

  const towerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.4,
        roughness: 0.4
      }),
    []
  )

  const stainlessMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.85,
        roughness: 0.2
      }),
    []
  )

  // Determine displayed temperature based on probe location and status
  const effectiveTemp = currentTemp !== undefined
    ? currentTemp
    : (probeLocation === 'cell' ? fixedPointTemp : (isHeated ? fixedPointTemp - 0.8 : 25.0))

  const isProbeInPreheat = probeLocation === 'preheat'

  const handleProbeTransfer = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onToggleProbeLocation) {
      onToggleProbeLocation()
    }
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* ==================================================================== */}
      {/* 4 ADJUSTABLE STAINLESS STEEL LEVELING FEET ON BASE PLINTH            */}
      {/* ==================================================================== */}
      <mesh position={[-0.01, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.04, 0.44]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {[
        [-0.18, -0.18],
        [0.17, -0.18],
        [-0.18, 0.18],
        [0.17, 0.18]
      ].map(([fx, fz], idx) => (
        <group key={`foot-${idx}`} position={[fx, 0.015, fz]}>
          <mesh material={stainlessMaterial}>
            <cylinderGeometry args={[0.022, 0.026, 0.015, 16]} />
          </mesh>
          <mesh position={[0, 0.015, 0]} material={stainlessMaterial}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
          </mesh>
        </group>
      ))}

      {/* ==================================================================== */}
      {/* MAIN BODY (LIGHT OFF-WHITE INSULATED HOUSING)                         */}
      {/* ==================================================================== */}
      <group position={[-0.065, 0.46, 0]}>
        {/* Main Cabinet Box */}
        <mesh material={bodyMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.33, 0.80, 0.46]} />
        </mesh>

        {/* Top Dark Slate Rim Cover */}
        <mesh position={[0, 0.41, 0]} material={topPlateMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.334, 0.025, 0.464]} />
        </mesh>

        {/* ==================================================================== */}
        {/* TOP WELL 1: PRIMARY FIXED-POINT CELL WELL (SABİT NOKTA HÜCRESİ)      */}
        {/* Position: x = -0.055                                                 */}
        {/* ==================================================================== */}
        <group
          position={[-0.055, 0.423, 0]}
          onClick={handleProbeTransfer}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Circular Stainless Collar Flange */}
          <mesh material={stainlessMaterial}>
            <cylinderGeometry args={[0.052, 0.056, 0.008, 32]} />
          </mesh>
          {/* Dark Well Aperture Bore */}
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.006, 32]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>
          {/* Cell Guide Bushing */}
          <mesh position={[0, 0.008, 0]} material={stainlessMaterial}>
            <cylinderGeometry args={[0.016, 0.022, 0.015, 24]} />
          </mesh>

          {/* If probe is in cell, show it here */}
          {!isProbeInPreheat && (
            <QuartzSPRT
              position={[0, 0.015, 0]}
              label={`${modelName} SPRT`}
              sheathLength={0.35}
            />
          )}

          {/* Text Label on Top Plate for Cell Well */}
          <Text
            position={[0, 0.005, 0.075]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.009}
            color={!isProbeInPreheat ? '#38bdf8' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            SABİT NOKTA (CELL)
          </Text>
        </group>

        {/* ==================================================================== */}
        {/* TOP WELL 2: PRE-HEAT WELL (ÖN ISITMA YUVASI)                         */}
        {/* Position: x = +0.065 (Marked in green by user)                       */}
        {/* ==================================================================== */}
        <group
          position={[0.065, 0.423, 0]}
          onClick={handleProbeTransfer}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Pre-Heat Stainless Flange Collar */}
          <mesh material={stainlessMaterial}>
            <cylinderGeometry args={[0.046, 0.050, 0.008, 32]} />
          </mesh>
          {/* Ceramic Heat Insulator Collar Ring (Bronze/Copper) */}
          <mesh position={[0, 0.004, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.003, 32]} />
            <meshStandardMaterial color="#b45309" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Pre-Heat Glowing Heating Chamber Bore */}
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.030, 0.030, 0.006, 32]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ea580c"
              emissiveIntensity={isOn ? 0.8 : 0.1}
            />
          </mesh>
          {/* Pre-Heat Guide Collar */}
          <mesh position={[0, 0.008, 0]} material={stainlessMaterial}>
            <cylinderGeometry args={[0.015, 0.020, 0.015, 24]} />
          </mesh>

          {/* If probe is in pre-heat, show it here */}
          {isProbeInPreheat && (
            <QuartzSPRT
              position={[0, 0.015, 0]}
              label={`${modelName} SPRT`}
              sheathLength={0.35}
            />
          )}

          {/* Text Label on Top Plate for Pre-Heat Well */}
          <Text
            position={[0, 0.005, 0.075]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.009}
            color={isProbeInPreheat ? '#f97316' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ÖN ISITMA (PRE-HEAT)
          </Text>
        </group>

        {/* ==================================================================== */}
        {/* INTERACTIVE FLOATING PROMPT & STATUS ABOVE FURNACE                   */}
        {/* ==================================================================== */}
        <group
          position={[0, 0.65, 0]}
          onClick={handleProbeTransfer}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Badge Background */}
          <mesh>
            <planeGeometry args={[0.28, 0.07]} />
            <meshBasicMaterial
              color={
                isProbeInPreheat
                  ? (isHeated ? '#065f46' : '#7c2d12')
                  : '#1e3a8a'
              }
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh position={[0, 0.032, 0.001]}>
            <planeGeometry args={[0.276, 0.005]} />
            <meshBasicMaterial
              color={
                isProbeInPreheat
                  ? (isHeated ? '#34d399' : '#fb923c')
                  : '#38bdf8'
              }
            />
          </mesh>

          {/* Status Header */}
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
              ? (isHeated ? '♨️ ÖN ISITMA TAMAMLANDI' : '♨️ ÖN ISITMA YAPILIYOR...')
              : '❄️ SABİT NOKTA PLATO'}
          </Text>

          {/* Action Sub-text */}
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
              ? (isHeated ? '▶ Tıkla: Sabit Noktaya Yerleştir' : 'Termal Şok Önleme: Isınıyor')
              : '▶ Tıkla: Ön Isıtmaya Al'}
          </Text>
        </group>

        {/* FRONT PANEL BADGING & MODEL SILKSCREEN */}
        <group position={[0, 0.18, 0.231]}>
          <mesh position={[0, 0.075, 0]}>
            <planeGeometry args={[0.26, 0.003]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* mchtkrkmz Brand Text */}
          <mesh position={[-0.08, 0.055, 0.001]}>
            <planeGeometry args={[0.08, 0.018]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          <Text
            position={[-0.08, 0.055, 0.002]}
            fontSize={0.010}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            G1TD
          </Text>

          <Text
            position={[0.04, 0.055, 0.002]}
            fontSize={0.0075}
            color="#475569"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            METROLOGY SYSTEMS
          </Text>

          {/* LARGE PROMINENT MODEL NAME */}
          <Text
            position={[0, 0.01, 0.002]}
            fontSize={0.030}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {modelName}
          </Text>

          {/* Fixed-Point Cell Name & Status */}
          <Text
            position={[0, -0.026, 0.002]}
            fontSize={0.009}
            color="#0284c7"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            ITS-90 {elementSymbol.toUpperCase()} FIXED-POINT
          </Text>

          <Text
            position={[0, -0.044, 0.002]}
            fontSize={0.0075}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {elementName} ({fixedPointTemp.toFixed(3)} °C)
          </Text>

          {/* Quick Transfer Button on Front Panel */}
          <group
            position={[0, -0.075, 0.002]}
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
              <boxGeometry args={[0.24, 0.024, 0.004]} />
              <meshStandardMaterial
                color={isProbeInPreheat ? '#ea580c' : '#0284c7'}
                roughness={0.4}
              />
            </mesh>
            <Text
              position={[0, 0, 0.003]}
              fontSize={0.0072}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isProbeInPreheat
                ? '♨️ ÖN ISITMADA (SABİT NOKTAYA GEÇİR)'
                : '❄️ SABİT NOKTADA (ÖN ISITMAYA GEÇİR)'}
            </Text>
          </group>
        </group>
      </group>

      {/* ==================================================================== */}
      {/* RIGHT COLUMN / CONTROL TOWER                                          */}
      {/* ==================================================================== */}
      <group position={[0.165, 0.46, 0]}>
        <mesh material={towerMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.80, 0.46]} />
        </mesh>

        <mesh position={[0, 0.41, 0]} material={topPlateMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.132, 0.025, 0.464]} />
        </mesh>

        {/* ANGLED UPPER CONTROL CONSOLE POD */}
        <group position={[0, 0.33, 0.23]} rotation={[-0.32, 0, 0]}>
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[0.12, 0.09, 0.03]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>

          <mesh position={[0, 0.015, 0.031]}>
            <planeGeometry args={[0.108, 0.045]} />
            <meshBasicMaterial color="#050811" />
          </mesh>

          {/* Display Header */}
          <Text
            position={[-0.048, 0.030, 0.032]}
            fontSize={0.0048}
            color="#38bdf8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {modelName} | {isProbeInPreheat ? 'PRE-HEAT' : 'ITS-90'}
          </Text>
          <Text
            position={[0.048, 0.030, 0.032]}
            fontSize={0.0044}
            color={isOn ? (isProbeInPreheat ? '#f97316' : '#4ade80') : '#ef4444'}
            anchorX="right"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {isOn ? (isProbeInPreheat ? 'PREHEAT' : 'PLATEAU') : 'STANDBY'}
          </Text>

          {/* High-Precision Temperature Readout */}
          <Text
            position={[0, 0.012, 0.032]}
            fontSize={0.0105}
            color={isOn ? (isProbeInPreheat ? '#fb923c' : '#22c55e') : '#64748b'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {isOn
              ? `${effectiveTemp >= 0 ? '+' : ''}${effectiveTemp.toFixed(3)} °C`
              : 'OFF'}
          </Text>

          {/* Sub-status */}
          <Text
            position={[0, -0.002, 0.032]}
            fontSize={0.0036}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {isOn
              ? (isProbeInPreheat ? 'PRE-HEAT STAGE ACTIVE' : 'STABILITY: ±0.2 ')
              : 'HEATER DISENGAGED'}
          </Text>

          {/* Tactile Keypad */}
          <group position={[0, -0.018, 0.031]}>
            {[-0.036, -0.012, 0.012, 0.036].map((bx) => (
              <mesh key={`btn-${bx}`} position={[bx, 0, 0]}>
                <boxGeometry args={[0.018, 0.009, 0.004]} />
                <meshStandardMaterial color="#475569" roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Rocker Power Switch with LED */}
        <group
          position={[0, 0.16, 0.231]}
          onClick={(e) => {
            e.stopPropagation()
            setIsOn((prev) => !prev)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setIsHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setIsHovered(false)
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <planeGeometry args={[0.032, 0.042]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
          <mesh position={[0, isOn ? 0.005 : -0.005, 0.003]} rotation={[isOn ? -0.2 : 0.2, 0, 0]}>
            <boxGeometry args={[0.022, 0.026, 0.008]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.006, 0.007]}>
            <planeGeometry args={[0.012, 0.004]} />
            <meshBasicMaterial color={isOn ? '#22c55e' : '#334155'} />
          </mesh>
          <Text
            position={[0, -0.028, 0.001]}
            fontSize={0.0055}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            Güç
          </Text>
        </group>

        {/* Lower Front Ventilation Slots */}
        <group position={[0, -0.15, 0.231]}>
          {[-0.04, -0.02, 0, 0.02, 0.04].map((sy) => (
            <mesh key={`slot-${sy}`} position={[0, sy, 0]}>
              <planeGeometry args={[0.08, 0.005]} />
              <meshBasicMaterial color="#090d16" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Floating Hover Info Tag in 3D Space */}
      <group position={[0, 1.25, 0]} visible={isHovered}>
        <mesh>
          <planeGeometry args={[0.36, 0.13]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
        </mesh>
        <Text
          position={[0, 0.042, 0.002]}
          fontSize={0.015}
          color="#eab308"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          {modelName}
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
          color={isProbeInPreheat ? '#f97316' : '#38bdf8'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          Konum: {isProbeInPreheat ? 'Ön Isıtma Yuvası' : 'Sabit Nokta Yuvası'} ({effectiveTemp.toFixed(3)} °C)
        </Text>
        <Text
          position={[0, -0.036, 0.002]}
          fontSize={0.009}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          Tıklayarak Ön Isıtma / Sabit Nokta arasında aktarabilirsiniz
        </Text>
      </group>
    </group>
  )
}

export default memo(FixedPointFurnace)

