import { Text, CatmullRomLine } from '@react-three/drei'

interface DewPointMirrorProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  currentTemp: number
  currentHum: number
  holePosition: [number, number, number] // To route the cable through
  sensorPosition: [number, number, number] // Where the sensor is placed
}

export default function DewPointMirror({ 
  position, 
  rotation = [0, 0, 0],
  currentTemp, 
  currentHum,
  holePosition,
  sensorPosition
}: DewPointMirrorProps) {

  // Simple approx formula for Dew Point for display purposes
  const dewPoint = currentTemp - ((100 - currentHum) / 5)

  // Start position for the cable (back left of the device)
  const cableStart: [number, number, number] = [position[0] - 0.1, position[1] + 0.05, position[2] - 0.1]
  
  // Dynamically compute realistic cable path from device rear -> cabinet hole -> sensor head
  const p1: [number, number, number] = [cableStart[0], cableStart[1] - 0.02, cableStart[2] - 0.08]
  const p2: [number, number, number] = [
    cableStart[0] * 0.65 + holePosition[0] * 0.35,
    Math.min(cableStart[1], holePosition[1]) - 0.04,
    cableStart[2] * 0.65 + holePosition[2] * 0.35
  ]
  const p3: [number, number, number] = [
    cableStart[0] * 0.25 + holePosition[0] * 0.75,
    holePosition[1] - 0.01,
    cableStart[2] * 0.25 + holePosition[2] * 0.75
  ]
  const p4: [number, number, number] = [
    holePosition[0] + (holePosition[0] < cableStart[0] ? 0.02 : -0.02),
    holePosition[1],
    holePosition[2]
  ]
  const p5: [number, number, number] = [
    holePosition[0] + (holePosition[0] < sensorPosition[0] ? 0.08 : -0.08),
    holePosition[1] - 0.04,
    holePosition[2]
  ]
  const p6: [number, number, number] = [
    (holePosition[0] + sensorPosition[0]) / 2,
    (holePosition[1] + sensorPosition[1]) / 2 - 0.05,
    (holePosition[2] + sensorPosition[2]) / 2
  ]
  const p7: [number, number, number] = [
    sensorPosition[0],
    sensorPosition[1] + 0.02,
    sensorPosition[2] + 0.04
  ]

  return (
    <group>
      {/* --- Main Device --- */}
      <group position={position} rotation={rotation}>
        <group>
          {/* Main Body (Cream/Light Grey) */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.35, 0.18, 0.25]} />
            <meshStandardMaterial color="#e0e0d8" roughness={0.6} />
          </mesh>

          {/* Side panels (Dark Grey) */}
          <mesh position={[-0.176, 0.1, 0]}>
            <boxGeometry args={[0.005, 0.15, 0.15]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[0.176, 0.1, 0]}>
            <boxGeometry args={[0.005, 0.15, 0.15]} />
            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Front Bezel */}
          <mesh position={[0, 0.1, 0.126]}>
            <boxGeometry args={[0.33, 0.16, 0.01]} />
            <meshStandardMaterial color="#cccccc" roughness={0.3} />
          </mesh>

          {/* 3D LCD Display (Visible in VR) */}
          <group position={[0, 0.1, 0.132]}>
            {/* LCD Background */}
            <mesh>
              <planeGeometry args={[0.2, 0.1]} />
              <meshBasicMaterial color="#1a5ebd" />
            </mesh>

            {/* Dew Point */}
            <Text position={[-0.04, 0.032, 0.001]} fontSize={0.016} color="#ffffff" anchorX="left" anchorY="middle"
              font="/fonts/arial.ttf">
              {dewPoint.toFixed(2)}
            </Text>
            <Text position={[0.08, 0.032, 0.001]} fontSize={0.007} color="#aaccff" anchorX="right" anchorY="middle"
              font="/fonts/arial.ttf">
              Dew Pt °C
            </Text>

            {/* Divider 1 */}
            <mesh position={[0, 0.015, 0.001]}>
              <planeGeometry args={[0.18, 0.001]} />
              <meshBasicMaterial color="#4a8df0" />
            </mesh>

            {/* RH */}
            <Text position={[-0.04, 0.0, 0.001]} fontSize={0.016} color="#ffffff" anchorX="left" anchorY="middle"
              font="/fonts/arial.ttf">
              {currentHum.toFixed(2)}
            </Text>
            <Text position={[0.08, 0.0, 0.001]} fontSize={0.007} color="#aaccff" anchorX="right" anchorY="middle"
              font="/fonts/arial.ttf">
              RH %
            </Text>

            {/* Divider 2 */}
            <mesh position={[0, -0.015, 0.001]}>
              <planeGeometry args={[0.18, 0.001]} />
              <meshBasicMaterial color="#4a8df0" />
            </mesh>

            {/* Temp */}
            <Text position={[-0.04, -0.032, 0.001]} fontSize={0.016} color="#ffffff" anchorX="left" anchorY="middle"
              font="/fonts/arial.ttf">
              {currentTemp.toFixed(2)}
            </Text>
            <Text position={[0.08, -0.032, 0.001]} fontSize={0.007} color="#aaccff" anchorX="right" anchorY="middle"
              font="/fonts/arial.ttf">
              Temp °C
            </Text>
          </group>

          {/* Stand / Tilt Handle */}
          {/* Left Arm */}
          <mesh position={[-0.19, 0.05, 0.05]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.015, 0.2, 0.03]} />
            <meshStandardMaterial color="#888888" metalness={0.6} />
          </mesh>
          {/* Right Arm */}
          <mesh position={[0.19, 0.05, 0.05]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.015, 0.2, 0.03]} />
            <meshStandardMaterial color="#888888" metalness={0.6} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -0.045, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.395, 16]} />
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* --- Remote Sensor Head (Placed inside the cabinet) --- */}
      <group position={sensorPosition}>
        {/* Metal Block Base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.03, 0.08]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Top Cylinder Head */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.03, 32]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Probe stick */}
        <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.05, 16]} />
          <meshStandardMaterial color="#dddddd" metalness={0.9} />
        </mesh>
      </group>

      {/* --- Flexible Probe Cable connecting device through cabinet hole to sensor --- */}
      <CatmullRomLine
        points={[
          cableStart,
          p1,
          p2,
          p3,
          p4,
          holePosition,
          p5,
          p6,
          p7
        ]}
        color="#1a1a1a"
        lineWidth={4}
        tension={0.4}
      />
    </group>
  )
}
