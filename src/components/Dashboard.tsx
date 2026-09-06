import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

interface DashboardProps {
  position: [number, number, number]
  ambientTemp: number
  bbTemp: number
  bb2Temp: number
  cabinetTemp: number
  cabinetHum: number
}

export default function Dashboard({
  position,
  ambientTemp,
  bbTemp,
  bb2Temp,
  cabinetTemp,
  cabinetHum
}: DashboardProps) {
  // Simple live value display instead of recharts (which needs Html/DOM)
  const timeRef = useRef('')

  useFrame(() => {
    const now = new Date()
    timeRef.current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  })

  return (
    <group position={position}>
      {/* Monitor Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.4, 1.4, 0.1]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Screen Background */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.48, 0.01]}
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        Lab Environment Dashboard
      </Text>

      {/* Divider */}
      <mesh position={[0, 0.42, 0.01]}>
        <planeGeometry args={[2.0, 0.003]} />
        <meshBasicMaterial color="#444466" />
      </mesh>

      {/* === Left Section: Black Body Sources === */}
      <Text position={[-0.55, 0.34, 0.01]} fontSize={0.04} color="#ff9800" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        Black Body Sources
      </Text>

      {/* Ambient */}
      <mesh position={[-0.8, 0.2, 0.005]}>
        <planeGeometry args={[0.35, 0.15]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[-0.8, 0.24, 0.01]} fontSize={0.025} color="#8884d8" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        Ambient
      </Text>
      <Text position={[-0.8, 0.17, 0.01]} fontSize={0.04} color="#8884d8" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {ambientTemp.toFixed(1)}°C
      </Text>

      {/* BB1 */}
      <mesh position={[-0.55, 0.0, 0.005]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[-0.55, 0.06, 0.01]} fontSize={0.025} color="#ff7300" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        MK1600
      </Text>
      <Text position={[-0.55, -0.02, 0.01]} fontSize={0.055} color="#ff7300" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {bbTemp.toFixed(1)}°C
      </Text>

      {/* BB2 */}
      <mesh position={[-0.55, -0.28, 0.005]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[-0.55, -0.22, 0.01]} fontSize={0.025} color="#ffaa00" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        MK1200
      </Text>
      <Text position={[-0.55, -0.3, 0.01]} fontSize={0.055} color="#ffaa00" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {bb2Temp.toFixed(1)}°C
      </Text>

      {/* Center Divider */}
      <mesh position={[0, 0.1, 0.01]}>
        <planeGeometry args={[0.003, 0.9]} />
        <meshBasicMaterial color="#444466" />
      </mesh>

      {/* === Right Section: Climate Cabinet === */}
      <Text position={[0.55, 0.34, 0.01]} fontSize={0.04} color="#2196F3" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        Climate Cabinet
      </Text>

      {/* Cabinet Temp */}
      <mesh position={[0.55, 0.05, 0.005]}>
        <planeGeometry args={[0.5, 0.25]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[0.55, 0.12, 0.01]} fontSize={0.025} color="#ff0000" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        Temperature
      </Text>
      <Text position={[0.55, 0.02, 0.01]} fontSize={0.06} color="#ff4444" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {cabinetTemp.toFixed(1)}°C
      </Text>

      {/* Cabinet Humidity */}
      <mesh position={[0.55, -0.25, 0.005]}>
        <planeGeometry args={[0.5, 0.25]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[0.55, -0.18, 0.01]} fontSize={0.025} color="#0055ff" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        Humidity
      </Text>
      <Text position={[0.55, -0.28, 0.01]} fontSize={0.06} color="#4488ff" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {cabinetHum.toFixed(1)}%
      </Text>
    </group>
  )
}
