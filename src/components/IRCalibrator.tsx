import { useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface IRCalibratorProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  minTemp: number
  maxTemp: number
  targetTemp: number
  setTargetTemp: React.Dispatch<React.SetStateAction<number>>
  currentTemp: number
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>
}

export default function IRCalibrator({
  position,
  rotation = [0, 0, 0],
  minTemp,
  maxTemp,
  targetTemp,
  setTargetTemp,
  currentTemp,
  setCurrentTemp
}: IRCalibratorProps) {

  const targetDiscRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (Math.abs(currentTemp - targetTemp) > 0.01) {
      const isHeating = targetTemp > currentTemp
      const rate = 25.0 // 25°C per second realistic simulation
      const step = rate * delta
      const diff = Math.abs(targetTemp - currentTemp)
      const direction = isHeating ? 1 : -1
      setCurrentTemp(t => t + direction * Math.min(diff, step))
    }

    if (targetDiscRef.current) {
      targetDiscRef.current.userData.temperature = currentTemp
      targetDiscRef.current.userData.currentTemp = currentTemp
      targetDiscRef.current.userData.isIRCalibrator = true
      targetDiscRef.current.userData.isApertureCenter = true
      targetDiscRef.current.userData.sourceName = 'Düzlemsel IR Kalibratör'
    }
  })

  const glowColor = useMemo(() => {
    if (currentTemp < 200) return "#111111"
    const r = currentTemp >= 200 ? 255 : 17
    let g = 17
    if (currentTemp > 250) {
      const ratio = Math.min((currentTemp - 250) / 250, 1)
      g = Math.floor(ratio * 255)
    }
    let b = 17
    if (currentTemp > 400) {
      const ratio = Math.min((currentTemp - 400) / 100, 1)
      b = Math.floor(ratio * 255)
    }
    return `rgb(${r}, ${g}, ${b})`
  }, [currentTemp])

  const intensity = currentTemp > 200 ? Math.min((currentTemp - 200) / 100, 2) : 0

  return (
    <group position={position} rotation={rotation} userData={{ isIRCalibrator: true, temperature: currentTemp, currentTemp, sourceName: 'Düzlemsel IR Kalibratör' }}>
      <group>
        <group position={[0, 0, 0]}>

          {/* Core body (Dark Grey) */}
          <mesh position={[0, 0.225, 0]}>
            <boxGeometry args={[0.26, 0.45, 0.25]} />
            <meshStandardMaterial color="#222222" roughness={0.7} />
          </mesh>

          {/* Left Red Panel */}
          <mesh position={[-0.14, 0.225, 0]}>
            <boxGeometry args={[0.02, 0.45, 0.25]} />
            <meshStandardMaterial color="#b30000" roughness={0.5} />
          </mesh>

          {/* Right Red Panel */}
          <mesh position={[0.14, 0.225, 0]}>
            <boxGeometry args={[0.02, 0.45, 0.25]} />
            <meshStandardMaterial color="#b30000" roughness={0.5} />
          </mesh>

          {/* Top Vents */}
          <mesh position={[0, 0.451, 0]}>
            <planeGeometry args={[0.24, 0.2]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
            <group rotation={[-Math.PI / 2, 0, 0]} />
          </mesh>

          {/* Front Plate */}
          <mesh position={[0, 0.3, 0.126]}>
            <boxGeometry args={[0.26, 0.28, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
          </mesh>

          {/* Target Cavity Hole */}
          <mesh position={[0, 0.3, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.01, 32, 1, true]} />
            <meshStandardMaterial color="#050505" side={THREE.BackSide} />
          </mesh>

          {/* Cavity Inner Surface (Glowing) */}
          <mesh
            position={[0, 0.3, 0.127]}
            userData={{ temperature: currentTemp, currentTemp, isIRCalibrator: true, sourceName: 'Düzlemsel IR Kalibratör' }}
          >
            <circleGeometry args={[0.059, 32]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={intensity}
              roughness={0.9}
            />
          </mesh>

          {/* Expanded Raycast Target Plate for Pyrometers / Cameras */}
          <mesh
            ref={targetDiscRef}
            position={[0, 0.3, 0.134]}
            userData={{ temperature: currentTemp, currentTemp, isIRCalibrator: true, isApertureCenter: true, sourceName: 'Düzlemsel IR Kalibratör' }}
          >
            <circleGeometry args={[0.11, 32]} />
            <meshBasicMaterial transparent opacity={0.001} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>

          {/* Ring */}
          <mesh position={[0, 0.3, 0.131]}>
            <torusGeometry args={[0.063, 0.003, 16, 32]} />
            <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Lower panel base */}
          <mesh position={[0, 0.07, 0.125]}>
            <boxGeometry args={[0.26, 0.15, 0.02]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.4} />
          </mesh>

          {/* Brand & Model Text */}
          <Text position={[-0.11, 0.12, 0.136]} fontSize={0.008} color="#ffcc00" anchorX="left">
            mchtkrkmz
          </Text>
          <Text position={[-0.11, 0.10, 0.136]} fontSize={0.006} color="#cccccc" anchorX="left">
            PRECISION IR CALIBRATOR
          </Text>
          <Text position={[-0.11, 0.08, 0.136]} fontSize={0.006} color="#888888" anchorX="left">
            {minTemp}°C to {maxTemp}°C
          </Text>

          {/* 3D Control Panel (Visible in VR) */}
          <group position={[0, 0.05, 0.136]}>
            {/* LCD Screen Background */}
            <mesh position={[-0.03, 0, 0]}>
              <planeGeometry args={[0.14, 0.07]} />
              <meshBasicMaterial color="#d8e5ff" />
            </mesh>

            {/* Current Temp */}
            <Text
              position={[-0.03, 0.012, 0.001]}
              fontSize={0.016}
              color="#111111"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {currentTemp.toFixed(2)}°C
            </Text>

            {/* SET and HEAT status */}
            <Text
              position={[-0.07, -0.015, 0.001]}
              fontSize={0.007}
              color="#333333"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {`SET: ${targetTemp.toFixed(1)}°C`}
            </Text>
            <Text
              position={[0.02, -0.015, 0.001]}
              fontSize={0.007}
              color={Math.abs(targetTemp - currentTemp) > 0.1 ? '#ff0000' : '#00aa00'}
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {Math.abs(targetTemp - currentTemp) > 0.1 ? 'HEAT: ON' : 'HEAT: OFF'}
            </Text>

            {/* Up (+1 °C) Button */}
            <mesh
              position={[0.085, 0.018, 0.001]}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.min(maxTemp, Math.round((t + 1) * 10) / 10)) }}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.min(maxTemp, Math.round((t + 1) * 10) / 10)) }}
            >
              <planeGeometry args={[0.035, 0.022]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <Text position={[0.085, 0.018, 0.002]} fontSize={0.0085} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
              +1°
            </Text>

            {/* Left (-0.1) Button */}
            <mesh
              position={[0.068, -0.003, 0.001]}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.max(minTemp, Math.round((t - 0.1) * 10) / 10)) }}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.max(minTemp, Math.round((t - 0.1) * 10) / 10)) }}
            >
              <planeGeometry args={[0.022, 0.016]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <Text position={[0.068, -0.003, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" anchorY="middle">◀</Text>

            {/* Right (+0.1) Button */}
            <mesh
              position={[0.102, -0.003, 0.001]}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.min(maxTemp, Math.round((t + 0.1) * 10) / 10)) }}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.min(maxTemp, Math.round((t + 0.1) * 10) / 10)) }}
            >
              <planeGeometry args={[0.022, 0.016]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <Text position={[0.102, -0.003, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" anchorY="middle">▶</Text>

            {/* Down (-1 °C) Button */}
            <mesh
              position={[0.085, -0.024, 0.001]}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.max(minTemp, Math.round((t - 1) * 10) / 10)) }}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setTargetTemp(t => Math.max(minTemp, Math.round((t - 1) * 10) / 10)) }}
            >
              <planeGeometry args={[0.035, 0.022]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <Text position={[0.085, -0.024, 0.002]} fontSize={0.0085} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
              -1°
            </Text>
          </group>

        </group>
      </group>
    </group>
  )
}
