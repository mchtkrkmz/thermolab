import { useState } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGrabbableDevice } from '../hooks/useGrabbableDevice'

export interface LaserInfraredThermometerProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp?: number
}

/**
 * Çift Lazerli Tabanca Tipi Kızılötesi Radyasyon Termometresi (Fluke 62 MAX+)
 * 
 * Özellikler:
 * - VR Kumanda veya Fare ile tutulabilir.
 * - Bırakıldığında ASLA yere düşmez; doğrudan masadaki standına süzülerek geri döner.
 * - Siyah cisim fırını (MK1600, MK1200) veya IR kalibratörlere doğrultulduğunda canlı sıcaklık ölçer.
 * - Çift kırmızı lazer ışını hedefin yüzeyine kadar uzanır ve odak noktalarını yansıtır.
 * - Canlı LCD ekranda anlık hedef sıcaklığını ve hedef adını gösterir.
 */
export default function LaserInfraredThermometer({
  position = [0.35, 0.90, -3.40],
  rotation = [0, -0.20, 0],
  targetTemp: _targetTemp = 348.5,
}: LaserInfraredThermometerProps) {
  const [laserOn] = useState(true)

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
    snoutOffset: [0, 0.118, -0.075],
    rayDirection: [0, 0, -1],
    baseTemp: 25.0,
    minRangeTemp: -30,
    maxRangeTemp: 1650,
  })

  return (
    <>
      {/* ---------- 1. MASADAKİ SABİT TABAN AYAKLIĞI (DESK HOLSTER / DOCK) ---------- */}
      {/* Cihaz eldeyken masada nerede durduğu belli olsun */}
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry args={[0.048, 0.054, 0.012, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.024, 0]}>
          <cylinderGeometry args={[0.026, 0.036, 0.026, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Holografik Geri Yuva Göstergesi */}
        <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.035, 0.042, 24]} />
          <meshBasicMaterial
            color={isGrabbed ? '#facc15' : '#22c55e'}
            transparent
            opacity={isGrabbed ? 0.85 : 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ---------- 2. TUTULABİLİR FLUKE TABANCA GÖVDESİ ---------- */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        {...handlers}
      >
        {/* Tabanca Gövde Grubu */}
        <group position={[0, 0.08, 0]}>
          {/* Tabanca Sapı (Fluke Sarı & Antrasit Kauçuk Yivler) */}
          <mesh position={[0, -0.03, 0.005]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.032, 0.075, 0.038]} />
            <meshStandardMaterial color="#eab308" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.03, 0.023]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.034, 0.072, 0.006]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>

          {/* Tetik (Trigger Button) */}
          <mesh position={[0, -0.008, -0.016]}>
            <boxGeometry args={[0.012, 0.018, 0.010]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>

          {/* Ana Üst Başlık Bloğu (Sarı Gövde) */}
          <mesh position={[0, 0.035, -0.01]}>
            <boxGeometry args={[0.048, 0.062, 0.105]} />
            <meshStandardMaterial
              color={isGrabbed ? '#fde047' : isHovered ? '#facc15' : '#eab308'}
              metalness={0.15}
              roughness={0.4}
            />
          </mesh>

          {/* Kauçuk Koruyucu Çerçeve (Ön ve Arka Şok Tamponları) */}
          <mesh position={[0, 0.035, -0.063]}>
            <boxGeometry args={[0.052, 0.066, 0.006]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.035, 0.043]}>
            <boxGeometry args={[0.052, 0.066, 0.006]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>

          {/* Yan Etiket: FLUKE 62 MAX+ */}
          <mesh position={[0.025, 0.042, -0.01]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.045, 0.014]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0.026, 0.042, -0.01]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.0065}
            color="#facc15"
            anchorX="center"
            anchorY="middle"
          >
            FLUKE 62 MAX+
          </Text>

          {/* ---------- 3. ÇİFT LAZERLİ VE MERCEKLİ ÖN OPTİK BURUN ---------- */}
          <group position={[0, 0.038, -0.065]}>
            {/* Ana Kızılötesi Algılayıcı Mercek Konisi */}
            <mesh position={[0, 0, -0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.017, 0.016, 24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.017]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.011, 0.011, 0.002, 24]} />
              <meshPhysicalMaterial color="#38bdf8" transmission={0.5} roughness={0.1} />
            </mesh>

            {/* Çift Lazer Diyot Çıkışları */}
            <mesh position={[0, 0.018, -0.006]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.004, 0.008, 12]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.018, -0.011]}>
              <circleGeometry args={[0.002, 12]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>

            <mesh position={[0, -0.018, -0.006]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.004, 0.008, 12]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, -0.018, -0.011]}>
              <circleGeometry args={[0.002, 12]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>

            {/* HEDEFE KADAR UZANAN ÇİFT KIRMIZI LAZER IŞINI */}
            {laserOn && (
              <>
                {/* Üst Işın */}
                <mesh
                  position={[0, 0.018, -laserHitDistance / 2]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.0008, 0.0008, laserHitDistance, 8]} />
                  <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
                </mesh>
                {/* Üst Hedef Noktası */}
                <mesh position={[0, 0.018, -laserHitDistance]}>
                  <sphereGeometry args={[0.006, 12, 12]} />
                  <meshBasicMaterial color="#ff1111" />
                </mesh>

                {/* Alt Işın */}
                <mesh
                  position={[0, -0.018, -laserHitDistance / 2]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.0008, 0.0008, laserHitDistance, 8]} />
                  <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
                </mesh>
                {/* Alt Hedef Noktası */}
                <mesh position={[0, -0.018, -laserHitDistance]}>
                  <sphereGeometry args={[0.006, 12, 12]} />
                  <meshBasicMaterial color="#ff1111" />
                </mesh>
              </>
            )}
          </group>

          {/* ---------- 4. ARKA DİJİTAL LCD EKRAN ---------- */}
          <group position={[0, 0.038, 0.044]}>
            {/* Ekran Koruyucu Cam */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.044, 0.048]} />
              <meshStandardMaterial color="#020617" roughness={0.3} />
            </mesh>

            {/* Arka Aydınlatmalı LCD Panel */}
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[0.040, 0.044]} />
              <meshBasicMaterial color="#0b132b" />
            </mesh>

            {/* Büyük Dijital Canlı Sıcaklık Değeri */}
            <Text
              position={[0, 0.008, 0.003]}
              fontSize={0.011}
              color={hasHitTarget ? '#38bdf8' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
            >
              {`${detectedTemp.toFixed(1)}`}
            </Text>
            <Text
              position={[0.015, 0.014, 0.003]}
              fontSize={0.0045}
              color="#38bdf8"
              anchorX="center"
            >
              °C
            </Text>

            {/* Üst Durum: SCAN / HOLD, Hedef Bilgisi */}
            <Text
              position={[-0.013, 0.016, 0.003]}
              fontSize={0.0035}
              color={hasHitTarget ? '#4ade80' : '#facc15'}
              anchorX="center"
            >
              {hasHitTarget ? '🎯 SCAN' : 'HOLD'}
            </Text>

            {/* Hedef Bilgisi */}
            <Text
              position={[0, -0.006, 0.003]}
              fontSize={0.0032}
              color="#94a3b8"
              anchorX="center"
            >
              {targetName.slice(0, 18)}
            </Text>

            {/* Alt Parametre: Emisivite & Optik Oran */}
            <Text
              position={[0, -0.014, 0.003]}
              fontSize={0.0033}
              color="#e2e8f0"
              anchorX="center"
            >
              ε = 0.95 | D:S 50:1
            </Text>
          </group>

          {/* ---------- 5. TUTULDUĞUNDA GÖRÜNEN HOLOGRAFİK HIZLI KONTROL HUD'I ---------- */}
          {isGrabbed && (
            <group position={[0, 0.14, 0.02]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.18, 0.075]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
              </mesh>
              <mesh position={[0, 0, -0.001]}>
                <planeGeometry args={[0.184, 0.079]} />
                <meshBasicMaterial color="#facc15" transparent opacity={0.7} />
              </mesh>
              <Text position={[0, 0.024, 0.004]} fontSize={0.0075} color="#facc15" anchorX="center">
                🎯 FLUKE 62 MAX+ (Elde)
              </Text>
              <Text position={[0, 0.010, 0.004]} fontSize={0.0065} color="#38bdf8" anchorX="center">
                {`Hedef: ${targetName}`}
              </Text>
              <Text position={[0, -0.003, 0.004]} fontSize={0.0075} color="#4ade80" anchorX="center">
                {`Canlı: ${detectedTemp.toFixed(1)} °C`}
              </Text>

              {/* Masaya Bırak Butonu */}
              <group
                position={[0, -0.022, 0.004]}
                onClick={(e) => {
                  e.stopPropagation()
                  release()
                }}
              >
                <mesh>
                  <boxGeometry args={[0.14, 0.018, 0.002]} />
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
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} wireframe />
            </mesh>
          )}
        </group>
      </group>
    </>
  )
}
