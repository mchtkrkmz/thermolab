import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

export interface MeasurementRecord {
  ref: number
  measured: number
  device: string
}

interface MissionBoardProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  missionActive: boolean
  startMission: () => void
  measurements: MeasurementRecord[]
}

export default function MissionBoard({ position, rotation = [0, 0, 0], missionActive, startMission, measurements }: MissionBoardProps) {
  const handleStart = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    startMission()
  }

  return (
    <group position={position} rotation={rotation}>
        {/* Board Background */}
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        
        {/* Frame */}
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[1.25, 0.85, 0.02]} />
          <meshStandardMaterial color="#444444" roughness={0.8} />
        </mesh>

        {/* Title */}
        <Text
          position={[0, 0.32, 0.026]}
          fontSize={0.05}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          Kalibrasyon İş Emri
        </Text>

        {/* Divider line */}
        <mesh position={[0, 0.26, 0.026]}>
          <planeGeometry args={[1.0, 0.003]} />
          <meshBasicMaterial color="#cccccc" />
        </mesh>

        {!missionActive ? (
          <>
            {/* Waiting message */}
            <Text
              position={[0, 0.1, 0.026]}
              fontSize={0.035}
              color="#555555"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              Bekleyen yeni bir iş emri var.
            </Text>

            {/* Start Button */}
            <mesh 
              position={[0, -0.05, 0.026]} 
              onPointerDown={handleStart}
            >
              <planeGeometry args={[0.4, 0.08]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
            <Text
              position={[0, -0.05, 0.028]}
              fontSize={0.03}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              Görevi Başlat
            </Text>
          </>
        ) : (
          <>
            {/* Customer info */}
            <Text
              position={[-0.5, 0.18, 0.026]}
              fontSize={0.025}
              color="#444444"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
              maxWidth={1.0}
            >
              {`Müşteri: ABC A.Ş.\nGörev: Radyasyon termometrelerinin kalibrasyonu\nİstenen: En az 3 farklı sıcaklıkta ölçüm`}
            </Text>

            {/* Progress background */}
            <mesh position={[0, -0.05, 0.025]}>
              <planeGeometry args={[1.0, 0.15]} />
              <meshBasicMaterial color="#f0f0f0" />
            </mesh>

            {/* Progress text */}
            <Text
              position={[-0.45, -0.01, 0.027]}
              fontSize={0.025}
              color="#333333"
              anchorX="left"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {`İlerleme: ${measurements.length} / 3 Ölçüm`}
            </Text>

            {/* Last 3 measurement entries */}
            {measurements.slice(-3).map((m, i) => (
              <Text
                key={i}
                position={[-0.45, -0.04 - i * 0.025, 0.027]}
                fontSize={0.018}
                color="#388E3C"
                anchorX="left"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                {`${m.device} | Ref: ${m.ref.toFixed(1)}°C | Ölç: ${m.measured.toFixed(1)}°C`}
              </Text>
            ))}

            {/* Completion message */}
            {measurements.length >= 3 && (
              <Text
                position={[0, -0.2, 0.027]}
                fontSize={0.022}
                color="#4CAF50"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
                fontWeight="bold"
              >
                ✓ Ölçümler tamam! Sertifika oluşturun.
              </Text>
            )}
          </>
        )}
      </group>
  )
}
