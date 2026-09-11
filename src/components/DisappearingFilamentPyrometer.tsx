import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGrabbableDevice } from '../hooks/useGrabbableDevice'

export interface DisappearingFilamentPyrometerProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp?: number
}

/**
 * Klasik Kaybolan Filamanlı Optik Pirometre (Disappearing Filament Optical Pyrometer)
 * ITS-90 Yüksek Sıcaklık Skalası Birincil Metroloji Referans Cihazı (0.65 µm)
 * 
 * Özellikler:
 * - VR Kumanda veya Fare ile tutulabilir.
 * - Bırakıldığında ASLA yere düşmez; doğrudan masadaki pirinç sütununa geri kilitlenir.
 * - Siyah cisim fırınına (MK1600, MK1200) doğrultulduğunda canlı sıcaklık okur.
 * - Altın Donma Noktası (1064.18 °C) pirometri referansını simüle eder.
 */
export default function DisappearingFilamentPyrometer({
  position = [0.82, 0.90, -3.40],
  rotation = [0, -0.14, 0],
  targetTemp: _targetTemp = 1064.2,
}: DisappearingFilamentPyrometerProps) {
  const {
    groupRef,
    isGrabbed,
    isHovered,
    isReturning,
    detectedTemp,
    targetName,
    release,
    handlers,
  } = useGrabbableDevice({
    initialPosition: position,
    initialRotation: rotation,
    snoutOffset: [0, 0.165, -0.12],
    rayDirection: [0, 0, -1],
    baseTemp: 25.0,
    minRangeTemp: 700,
    maxRangeTemp: 3500,
  })

  return (
    <>
      {/* ---------- 1. MASADAKİ SABİT DÖKÜM ÇELİK TABAN & PİRİNÇ AYAR SÜTUNU ---------- */}
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.065, 0.07, 0.016, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.012, 0.014, 0.14, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.035, 0.030, 0.035]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.024, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Holografik Geri Yuva Göstergesi */}
        <mesh position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.024, 0.032, 24]} />
          <meshBasicMaterial
            color={isGrabbed ? '#f59e0b' : '#22c55e'}
            transparent
            opacity={isGrabbed ? 0.8 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ---------- 2. TUTULABİLİR TELESKOPİK OPTİK TÜP ---------- */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        {...handlers}
      >
        <group position={[0, 0.165, 0]} rotation={[0, 0.12, 0]}>
          {/* Ana Teleskop Gövdesi */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.22, 32]} />
            <meshStandardMaterial
              color={isGrabbed ? '#475569' : isHovered ? '#334155' : '#1e293b'}
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>

          {/* Pirinç Odaklama Bileziği */}
          <mesh position={[0, 0, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 32]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.2} />
          </mesh>

          {/* Ön Objektif Başlığı ve Akromatik Mercek */}
          <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.026, 0.025, 32]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.123]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.020, 0.020, 0.003, 32]} />
            <meshPhysicalMaterial color="#ef4444" transmission={0.65} roughness={0.1} />
          </mesh>

          {/* Arka Oküler / Göz Merceği */}
          <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.019, 0.03, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.126]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.021, 0.021, 0.006, 24]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>

          {/* Yan Analog Kadran ve Potansiyometre */}
          <mesh position={[0.025, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.012, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0.032, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.020, 24]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>

          {/* Kadran İbre ve Değer */}
          <Text
            position={[0.033, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.0055}
            color="#b45309"
            anchorX="center"
            anchorY="middle"
          >
            {`${detectedTemp.toFixed(1)}°C`}
          </Text>

          {/* Tutulduğunda Görünen HUD */}
          {isGrabbed && (
            <group position={[0, 0.12, 0]}>
              <mesh>
                <planeGeometry args={[0.20, 0.065]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
              </mesh>
              <Text position={[0, 0.018, 0.003]} fontSize={0.007} color="#f59e0b" anchorX="center">
                👁️ Kaybolan Filamanlı Pirometre
              </Text>
              <Text position={[0, 0.005, 0.003]} fontSize={0.006} color="#38bdf8" anchorX="center">
                {`Hedef: ${targetName}`}
              </Text>
              <Text position={[0, -0.008, 0.003]} fontSize={0.0075} color="#4ade80" anchorX="center">
                {`Okunan: ${detectedTemp.toFixed(1)} °C`}
              </Text>

              <group
                position={[0, -0.022, 0.003]}
                onClick={(e) => {
                  e.stopPropagation()
                  release()
                }}
              >
                <mesh>
                  <boxGeometry args={[0.13, 0.015, 0.002]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.002]} fontSize={0.0055} color="#ffffff" anchorX="center" anchorY="middle">
                  ⬇️ Yuvasına Bırak
                </Text>
              </group>
            </group>
          )}

          {isReturning && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} wireframe />
            </mesh>
          )}
        </group>
      </group>
    </>
  )
}
