import { Text } from '@react-three/drei'

interface DashboardLeftProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  cal1Temp: number
  cal2Temp: number
}

export default function DashboardLeft({
  position,
  rotation = [0, 0, 0],
  cal1Temp,
  cal2Temp
}: DashboardLeftProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Monitor Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[1.6, 1.2, 0.1]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Screen Background */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.38, 0.01]}
        fontSize={0.05}
        color="#ffcc00"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        IR Calibrator Operations
      </Text>

      {/* Divider */}
      <mesh position={[0, 0.32, 0.01]}>
        <planeGeometry args={[1.2, 0.003]} />
        <meshBasicMaterial color="#444466" />
      </mesh>

      {/* Calibrator 1 */}
      <mesh position={[0, 0.1, 0.005]}>
        <planeGeometry args={[1.0, 0.3]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[-0.4, 0.2, 0.01]} fontSize={0.03} color="#0055ff" anchorX="left" anchorY="middle"
        font="/fonts/arial.ttf">
        Calibrator 1 (-15 to 150°C)
      </Text>
      <Text position={[0, 0.06, 0.01]} fontSize={0.08} color="#4488ff" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {cal1Temp.toFixed(1)}°C
      </Text>

      {/* Calibrator 2 */}
      <mesh position={[0, -0.25, 0.005]}>
        <planeGeometry args={[1.0, 0.3]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      <Text position={[-0.4, -0.15, 0.01]} fontSize={0.03} color="#ff0000" anchorX="left" anchorY="middle"
        font="/fonts/arial.ttf">
        Calibrator 2 (35 to 500°C)
      </Text>
      <Text position={[0, -0.29, 0.01]} fontSize={0.08} color="#ff4444" anchorX="center" anchorY="middle"
        font="/fonts/arial.ttf">
        {cal2Temp.toFixed(1)}°C
      </Text>
    </group>
  )
}
