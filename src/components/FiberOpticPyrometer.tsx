import { Text } from '@react-three/drei'
import { useGrabbableDevice } from '../hooks/useGrabbableDevice'

export interface FiberOpticPyrometerProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp?: number
}

/**
 * Endüstriyel Ağır Hizmet Fiber Optik Radyasyon Pirometresi (Optris CTlaser SWIR)
 * 
 * Özellikler:
 * - VR Kumanda veya Fare ile optik algılayıcı başlık tutulup yönlendirilebilir.
 * - Bırakıldığında ASLA yere düşmez; doğrudan masadaki optik montaj ayağına geri kilitlenir.
 * - Siyah cisim fırınına (MK1600, MK1200) doğrultulduğunda canlı sıcaklık okur.
 * - Masaüstü konsolu 7-segment LED ekranda anlık sıcaklığı gösterir.
 */
export default function FiberOpticPyrometer({
  position = [-1.40, 0.90, -3.42],
  rotation = [0, 0, 0],
  targetTemp: _targetTemp = 850.0,
}: FiberOpticPyrometerProps) {
  const {
    groupRef,
    isGrabbed,
    isHovered,
    isReturning,
    detectedTemp,
    targetName,
    hasHitTarget,
    laserHitDistance,
    release,
    handlers,
  } = useGrabbableDevice({
    initialPosition: position,
    initialRotation: rotation,
    snoutOffset: [0.08, 0.115, -0.12],
    rayDirection: [0, 0, -1],
    baseTemp: 25.0,
    minRangeTemp: 250,
    maxRangeTemp: 1800,
  })

  return (
    <>
      {/* ---------- 1. MASADAKİ SABİT KONSOL VE MONTAJ FLANŞI ---------- */}
      <group position={position} rotation={rotation}>
        {/* Taban Montaj Flanşı */}
        <mesh position={[0.08, 0.008, 0]}>
          <cylinderGeometry args={[0.04, 0.045, 0.016, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Dikey Paslanmaz Çelik Çubuk */}
        <mesh position={[0.08, 0.075, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Ayarlanabilir Açı Kelepçesi */}
        <mesh position={[0.08, 0.115, 0]}>
          <boxGeometry args={[0.038, 0.028, 0.038]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.105, 0.115, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.016, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Masaüstü Dijital İşlemci Konsolu (Benchtop Controller) */}
        <group position={[-0.10, 0.035, 0.02]} rotation={[0, 0.15, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.065, 0.13]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.002, 0.066]} rotation={[-0.08, 0, 0]}>
            <planeGeometry args={[0.114, 0.058]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>

          <Text position={[0, 0.024, 0.068]} fontSize={0.0065} color="#38bdf8" anchorX="center">
            OPTRIS CTlaser SWIR
          </Text>

          {/* 7 Segment LED Gösterge */}
          <mesh position={[0, 0.007, 0.068]}>
            <planeGeometry args={[0.088, 0.022]} />
            <meshBasicMaterial color="#022c22" />
          </mesh>
          <Text
            position={[-0.004, 0.007, 0.070]}
            fontSize={0.012}
            color={hasHitTarget ? '#4ade80' : '#86efac'}
            anchorX="center"
          >
            {`${detectedTemp.toFixed(1)} °C`}
          </Text>

          <Text position={[0, -0.018, 0.070]} fontSize={0.004} color="#94a3b8" anchorX="center">
            {targetName.slice(0, 18)}
          </Text>
        </group>
      </group>

      {/* ---------- 2. TUTULABİLİR OPTİK SENSÖR KAFASI ---------- */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        {...handlers}
      >
        <group position={[0.08, 0.115, 0]} rotation={[0, -0.28, 0]}>
          {/* Paslanmaz Çelik Soğutma Ceketi */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.11, 32]} />
            <meshStandardMaterial
              color={isGrabbed ? '#f8fafc' : isHovered ? '#f1f5f9' : '#e2e8f0'}
              metalness={0.92}
              roughness={0.2}
            />
          </mesh>

          {/* Ön Hava Perdesi Başlığı ve Optik Mercek */}
          <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.020, 0.024, 0.020, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.121]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.003, 32]} />
            <meshPhysicalMaterial color="#38bdf8" transmission={0.6} roughness={0.08} />
          </mesh>

          {/* Hedefe Ulaşan Kırmızı Lazer Odaklama Işını */}
          <mesh
            position={[0, 0, -laserHitDistance / 2 - 0.12]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.0008, 0.0008, laserHitDistance, 8]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, 0, -laserHitDistance - 0.12]}>
            <sphereGeometry args={[0.005, 12, 12]} />
            <meshBasicMaterial color="#ff2222" />
          </mesh>

          {/* Tutulduğunda Görünen HUD */}
          {isGrabbed && (
            <group position={[0, 0.12, 0]}>
              <mesh>
                <planeGeometry args={[0.18, 0.065]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
              </mesh>
              <Text position={[0, 0.018, 0.003]} fontSize={0.007} color="#4ade80" anchorX="center">
                ⚡ Fiber Pirometre Başlığı
              </Text>
              <Text position={[0, 0.005, 0.003]} fontSize={0.006} color="#38bdf8" anchorX="center">
                {`Hedef: ${targetName}`}
              </Text>
              <Text position={[0, -0.008, 0.003]} fontSize={0.0075} color="#ffffff" anchorX="center">
                {`Sıcaklık: ${detectedTemp.toFixed(1)} °C`}
              </Text>

              <group
                position={[0, -0.022, 0.003]}
                onClick={(e) => {
                  e.stopPropagation()
                  release()
                }}
              >
                <mesh>
                  <boxGeometry args={[0.12, 0.015, 0.002]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.002]} fontSize={0.0055} color="#ffffff" anchorX="center" anchorY="middle">
                  ⬇️ Ayağına Bırak
                </Text>
              </group>
            </group>
          )}

          {isReturning && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#4ade80" transparent opacity={0.3} wireframe />
            </mesh>
          )}
        </group>
      </group>
    </>
  )
}
