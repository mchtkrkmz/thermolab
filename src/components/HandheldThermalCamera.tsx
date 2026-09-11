import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGrabbableDevice } from '../hooks/useGrabbableDevice'

export interface HandheldThermalCameraProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp?: number
}

/**
 * Endüstriyel Tabanca Tipi Taşınabilir Termal Kamera (FLIR E8-XT)
 * 
 * Özellikler:
 * - VR Kumanda veya Fare ile tutulabilir.
 * - Bırakıldığında ASLA yere düşmez; doğrudan masadaki şarj dokuna süzülerek geri döner.
 * - Siyah cisim veya IR kalibratörlere tutulduğunda dinamik termogram simülasyonu üretir.
 * - Ekrandaki renk paleti (Ironbow: mor -> turuncu -> sarı -> akkor beyaz) sıcaklığa göre değişir.
 * - Merkez nokta sıcaklığını ve hedef kaynağın adını gerçek zamanlı gösterir.
 */
export default function HandheldThermalCamera({
  position = [-0.50, 0.90, -3.42],
  rotation = [0, 0.25, 0],
  targetTemp: _targetTemp = 185,
}: HandheldThermalCameraProps) {
  const {
    groupRef,
    isGrabbed,
    isHovered,
    isReturning,
    detectedTemp,
    targetName,
    hasHitTarget,
    release,
    handlers,
  } = useGrabbableDevice({
    initialPosition: position,
    initialRotation: rotation,
    snoutOffset: [0, 0.125, -0.07],
    rayDirection: [0, 0, -1],
    baseTemp: 25.0,
    minRangeTemp: -20,
    maxRangeTemp: 1650,
  })

  // Hedef sıcaklığına göre termal ekranın renk gradyanı
  const thermalCenterColor = useMemo(() => {
    if (detectedTemp < 50) return '#3b82f6' // Mavi (soğuk)
    if (detectedTemp < 150) return '#a855f7' // Mor
    if (detectedTemp < 300) return '#ea580c' // Turuncu
    if (detectedTemp < 600) return '#eab308' // Sarı
    return '#fef08a' // Akkor sıcak beyaz-sarı
  }, [detectedTemp])

  return (
    <>
      {/* ---------- 1. MASADAKİ SABİT ŞARJ DOKU (CHARGING DOCK) ---------- */}
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0.007, 0]}>
          <boxGeometry args={[0.09, 0.014, 0.10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.025, 0.01]} rotation={[-0.20, 0, 0]}>
          <boxGeometry args={[0.075, 0.03, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.012, 0.046]}>
          <cylinderGeometry args={[0.003, 0.003, 0.004, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        {/* Holografik Yuva Göstergesi */}
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.048, 24]} />
          <meshBasicMaterial
            color={isGrabbed ? '#f97316' : '#22c55e'}
            transparent
            opacity={isGrabbed ? 0.8 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ---------- 2. TUTULABİLİR TERMAL KAMERA GÖVDESİ ---------- */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        {...handlers}
      >
        <group position={[0, 0.09, 0]} rotation={[-0.18, 0, 0]}>
          {/* Ergonomik Tabanca Kabzası */}
          <mesh position={[0, -0.035, 0.01]} rotation={[0.22, 0, 0]}>
            <boxGeometry args={[0.036, 0.08, 0.042]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* Kabza Ön Kauçuk Tırtıkları */}
          {[-0.05, -0.035, -0.02].map((y, i) => (
            <mesh key={i} position={[0, y, -0.014]} rotation={[0.22, 0, 0]}>
              <boxGeometry args={[0.032, 0.005, 0.006]} />
              <meshStandardMaterial color="#f97316" roughness={0.8} />
            </mesh>
          ))}

          {/* Tetik Butonu */}
          <mesh position={[0, -0.012, -0.018]}>
            <boxGeometry args={[0.015, 0.022, 0.012]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>

          {/* Ana Üst Kamera Kafası (Turuncu Darbe Korumalı Zırh) */}
          <mesh position={[0, 0.035, -0.01]}>
            <boxGeometry args={[0.065, 0.072, 0.11]} />
            <meshStandardMaterial
              color={isGrabbed ? '#fdba74' : isHovered ? '#fb923c' : '#ea580c'}
              metalness={0.2}
              roughness={0.4}
            />
          </mesh>

          {/* Ön ve Arka Koruma Şok Tamponları */}
          <mesh position={[0, 0.035, -0.066]}>
            <boxGeometry args={[0.07, 0.076, 0.006]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.035, 0.046]}>
            <boxGeometry args={[0.07, 0.076, 0.006]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* ---------- 3. ÖN ÇİFT LENS (GERMANYUM IR + GÖRÜNÜR CMOS KAMERA) ---------- */}
          <group position={[0, 0.035, -0.068]}>
            {/* Büyük Germanyum Kızılötesi Mercek Yuvası */}
            <mesh position={[0, 0.01, -0.006]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.022, 0.014, 24]} />
              <meshStandardMaterial color="#020617" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.01, -0.014]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.002, 24]} />
              <meshPhysicalMaterial color="#38bdf8" transmission={0.6} roughness={0.1} />
            </mesh>

            {/* Görünür Işık Kamerası (MSX Füzyon) */}
            <mesh position={[0, -0.018, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.007, 0.008, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.018, -0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.002, 16]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
          </group>

          {/* ---------- 4. ARKA CANLI TERMAL EKRAN (MSX TERMAL GÖRÜNTÜLEYİCİ) ---------- */}
          <group position={[0, 0.036, 0.048]}>
            {/* Ekran Koruyucu Cam */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.056, 0.052]} />
              <meshStandardMaterial color="#020617" roughness={0.2} />
            </mesh>

            {/* Termal Görüntü Matrisi / Renkli Sıcaklık Haritası */}
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[0.052, 0.048]} />
              <meshBasicMaterial color="#1e1035" />
            </mesh>

            {/* Termal Odak Noktası (Ironbow merkez sıcaklık lekesi) */}
            <mesh position={[0, 0.002, 0.002]}>
              <circleGeometry args={[hasHitTarget ? 0.018 : 0.010, 24]} />
              <meshBasicMaterial color={thermalCenterColor} />
            </mesh>

            {/* Merkez Artı Kılı (Crosshair) */}
            <mesh position={[0, 0.002, 0.003]}>
              <ringGeometry args={[0.004, 0.005, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.002, 0.003]}>
              <planeGeometry args={[0.014, 0.001]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.002, 0.003]}>
              <planeGeometry args={[0.001, 0.014]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Canlı Nokta Sıcaklığı */}
            <Text
              position={[0, 0.017, 0.004]}
              fontSize={0.0052}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
            >
              {`Sp: ${detectedTemp.toFixed(1)} °C`}
            </Text>

            {/* Hedef Bilgisi */}
            <Text
              position={[0, -0.012, 0.004]}
              fontSize={0.0032}
              color="#facc15"
              anchorX="center"
            >
              {targetName.slice(0, 16)}
            </Text>

            {/* Alt Durum */}
            <Text
              position={[0, -0.019, 0.004]}
              fontSize={0.003}
              color="#38bdf8"
              anchorX="center"
            >
              {`MSX | ε=0.95 | FLIR E8-XT`}
            </Text>
          </group>

          {/* ---------- 5. TUTULDUĞUNDA GÖRÜNEN HOLOGRAFİK KONTROL HUD'I ---------- */}
          {isGrabbed && (
            <group position={[0, 0.16, 0.02]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.20, 0.08]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
              </mesh>
              <mesh position={[0, 0, -0.001]}>
                <planeGeometry args={[0.204, 0.084]} />
                <meshBasicMaterial color="#ea580c" transparent opacity={0.7} />
              </mesh>
              <Text position={[0, 0.026, 0.004]} fontSize={0.008} color="#fb923c" anchorX="center">
                📷 FLIR E8-XT Termal Kamera
              </Text>
              <Text position={[0, 0.011, 0.004]} fontSize={0.0068} color="#38bdf8" anchorX="center">
                {`Hedef: ${targetName}`}
              </Text>
              <Text position={[0, -0.003, 0.004]} fontSize={0.008} color="#4ade80" anchorX="center">
                {`Merkez Sıcaklık: ${detectedTemp.toFixed(1)} °C`}
              </Text>

              {/* Masaya Geri Bırak Butonu */}
              <group
                position={[0, -0.024, 0.004]}
                onClick={(e) => {
                  e.stopPropagation()
                  release()
                }}
              >
                <mesh>
                  <boxGeometry args={[0.15, 0.018, 0.002]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.002]} fontSize={0.006} color="#ffffff" anchorX="center" anchorY="middle">
                  ⬇️ Masadaki Yerine Bırak
                </Text>
              </group>
            </group>
          )}

          {/* Geri Dönüş Efekti */}
          {isReturning && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.25} wireframe />
            </mesh>
          )}
        </group>
      </group>
    </>
  )
}
