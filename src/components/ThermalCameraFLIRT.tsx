import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGrabbableDevice } from '../hooks/useGrabbableDevice'

export interface ThermalCameraFLIRTProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  targetTemp?: number
}

/**
 * Bilimsel ve Araştırma Tipi Yüksek Çözünürlüklü Radyometrik Termal Kamera (FLIR T1020)
 * 
 * Özellikler:
 * - VR Kumanda veya Fare ile tripottan alınıp serbestçe yönlendirilebilir.
 * - Bırakıldığında ASLA yere düşmez; doğrudan masadaki mini-tripod yuvasına süzülerek kilitlenir.
 * - 1024x768 UFPA mikrobolometre ile siyah cisim ve IR kalibratörleri canlı görüntüler.
 * - Ekrandaki renk gradyanı hedefin sıcaklığına göre (Ironbow) gerçek zamanlı güncellenir.
 */
export default function ThermalCameraFLIRT({
  position = [-0.08, 0.90, -3.38],
  rotation = [0, 0.12, 0],
  targetTemp: _targetTemp = 520,
}: ThermalCameraFLIRTProps) {
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
    snoutOffset: [0, 0.22, -0.09],
    rayDirection: [0, 0, -1],
    baseTemp: 25.0,
    minRangeTemp: -40,
    maxRangeTemp: 2000,
  })

  // Sıcaklığa göre termal spot rengi
  const spotColor = useMemo(() => {
    if (detectedTemp < 100) return '#3b82f6'
    if (detectedTemp < 300) return '#a855f7'
    if (detectedTemp < 700) return '#ea580c'
    if (detectedTemp < 1100) return '#facc15'
    return '#ffffff'
  }, [detectedTemp])

  return (
    <>
      {/* ---------- 1. MASADAKİ SABİT MİNİ TRİPOD (TRIPOD STAND / DOCK) ---------- */}
      <group position={position} rotation={rotation}>
        {/* Tripod Taban Halkası */}
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.016, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Tripod 3 Ayak Destekleri */}
        {[-0.6, 0.6, 2.7].map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0.06, 0.012, 0]} rotation={[0, 0, -0.22]}>
              <cylinderGeometry args={[0.009, 0.012, 0.11, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.11, 0.005, 0]}>
              <sphereGeometry args={[0.012, 12, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Yükseklik Mili */}
        <mesh position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.018, 0.02, 0.06, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.024, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.018, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Küresel Kafa & Hızlı Çıkarma Yuvası (Arca-Swiss Base) */}
        <mesh position={[0, 0.085, 0]}>
          <sphereGeometry args={[0.022, 24, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.108, 0]}>
          <boxGeometry args={[0.07, 0.01, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Holografik Yuva Göstergesi */}
        <mesh position={[0, 0.116, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.028, 0.036, 24]} />
          <meshBasicMaterial
            color={isGrabbed ? '#0284c7' : '#22c55e'}
            transparent
            opacity={isGrabbed ? 0.8 : 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ---------- 2. TUTULABİLİR FLIR T1020 KAMERA GÖVDESİ ---------- */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        {...handlers}
      >
        <group position={[0, 0.165, 0]}>
          {/* Gövde Taban ve Batarya Yuvası */}
          <mesh position={[0, -0.045, 0]}>
            <boxGeometry args={[0.11, 0.025, 0.11]} />
            <meshStandardMaterial
              color={isGrabbed ? '#334155' : isHovered ? '#1e293b' : '#0f172a'}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>

          {/* Arca-Swiss Kamera Alt Bağlantı Pabucu */}
          <mesh position={[0, -0.056, 0]}>
            <boxGeometry args={[0.065, 0.008, 0.055]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Ergonomik Döner Magnezyum Kamera Gövdesi */}
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[0.13, 0.095, 0.13]} />
            <meshStandardMaterial
              color={isGrabbed ? '#1e293b' : isHovered ? '#1e293b' : '#0f172a'}
              metalness={0.4}
              roughness={0.6}
            />
          </mesh>

          {/* Kauçuk Tutamak (Sağ El Grip) */}
          <mesh position={[0.07, 0.015, 0.01]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.028, 0.09, 0.095]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0.07, 0.052, -0.02]}>
            <cylinderGeometry args={[0.006, 0.007, 0.008, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>

          {/* Üst Logosu: FLIR T1020 */}
          <mesh position={[0, 0.065, 0]}>
            <planeGeometry args={[0.08, 0.018]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <Text
            position={[0, 0.065, 0.001]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.009}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            FLIR T1020 HD
          </Text>

          {/* ---------- 3. ÖN DEV GERMANYUM (Ge) LENS SİSTEMİ ---------- */}
          <group position={[0, 0.015, -0.065]}>
            {/* Lens Namlu Gövdesi */}
            <mesh position={[0, 0, -0.025]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.044, 0.05, 32]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
            </mesh>

            {/* Manuel / Otomatik Odaklama Bileziği (Focus Ring) */}
            <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.02, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>

            {/* Ön Altın Parıltılı Germanium Lens Camı */}
            <mesh position={[0, 0, -0.051]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.034, 0.034, 0.003, 32]} />
              <meshPhysicalMaterial
                color="#eab308"
                transmission={0.4}
                roughness={0.08}
                metalness={0.3}
              />
            </mesh>
          </group>

          {/* ---------- 4. ARKA 4.3" YÜKSEK ÇÖZÜNÜRLÜKLÜ DOKUNMATİK EKRAN ---------- */}
          <group position={[0, 0.02, 0.065]} rotation={[0.08, 0, 0]}>
            {/* Ekran Çerçevesi */}
            <mesh position={[0, 0, 0.005]}>
              <boxGeometry args={[0.108, 0.064, 0.01]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Termal Görüntü Matrisi */}
            <mesh position={[0, 0, 0.011]}>
              <planeGeometry args={[0.096, 0.054]} />
              <meshBasicMaterial color="#1e1b4b" />
            </mesh>

            {/* Merkez Termal Isı Dağılımı Çekirdeği */}
            <mesh position={[0.005, 0.002, 0.012]}>
              <circleGeometry args={[hasHitTarget ? 0.024 : 0.012, 24]} />
              <meshBasicMaterial color={spotColor} />
            </mesh>
            <mesh position={[0.005, 0.002, 0.0125]}>
              <circleGeometry args={[hasHitTarget ? 0.014 : 0.006, 24]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Merkez Artıkıl (+) */}
            <mesh position={[0.005, 0.002, 0.0135]}>
              <boxGeometry args={[0.016, 0.001, 0.001]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            <mesh position={[0.005, 0.002, 0.0135]}>
              <boxGeometry args={[0.001, 0.016, 0.001]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>

            {/* OSD Canlı Sıcaklık Göstergesi */}
            <Text
              position={[-0.042, 0.018, 0.014]}
              fontSize={0.0065}
              color="#38bdf8"
              anchorX="left"
              anchorY="middle"
            >
              {`SP1: ${detectedTemp.toFixed(1)} °C`}
            </Text>

            {/* Hedef Bilgisi */}
            <Text
              position={[-0.042, 0.008, 0.014]}
              fontSize={0.0045}
              color="#facc15"
              anchorX="left"
            >
              {targetName.slice(0, 20)}
            </Text>

            <Text
              position={[-0.042, -0.018, 0.014]}
              fontSize={0.0042}
              color="#94a3b8"
              anchorX="left"
            >
              {`1024x768 | NETD < 20mK | ε=0.98`}
            </Text>
          </group>

          {/* ---------- 5. TUTULDUĞUNDA GÖRÜNEN HOLOGRAFİK HUD ---------- */}
          {isGrabbed && (
            <group position={[0, 0.18, 0.02]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.22, 0.08]} />
                <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
              </mesh>
              <mesh position={[0, 0, -0.001]}>
                <planeGeometry args={[0.224, 0.084]} />
                <meshBasicMaterial color="#0284c7" transparent opacity={0.75} />
              </mesh>
              <Text position={[0, 0.026, 0.004]} fontSize={0.0085} color="#38bdf8" anchorX="center">
                🔬 FLIR T1020 HD Termal Kamera
              </Text>
              <Text position={[0, 0.011, 0.004]} fontSize={0.007} color="#facc15" anchorX="center">
                {`Hedef: ${targetName}`}
              </Text>
              <Text position={[0, -0.004, 0.004]} fontSize={0.0085} color="#4ade80" anchorX="center">
                {`Merkez Sıcaklık: ${detectedTemp.toFixed(1)} °C`}
              </Text>

              {/* Masadaki Tripoda Bırak Butonu */}
              <group
                position={[0, -0.024, 0.004]}
                onClick={(e) => {
                  e.stopPropagation()
                  release()
                }}
              >
                <mesh>
                  <boxGeometry args={[0.17, 0.018, 0.002]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.002]} fontSize={0.006} color="#ffffff" anchorX="center" anchorY="middle">
                  ⬇️ Masadaki Tripoda Bırak
                </Text>
              </group>
            </group>
          )}

          {/* Geri Dönüş Efekti */}
          {isReturning && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.3} wireframe />
            </mesh>
          )}
        </group>
      </group>
    </>
  )
}
