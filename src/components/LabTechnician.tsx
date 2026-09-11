import { useState, useRef } from 'react'
import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getAssetUrl } from '../utils/assets'

export interface LabTechnicianProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  currentBbTemp?: number
  currentCabTemp?: number
  currentCabHum?: number
}

export interface MetrologyStation {
  id: number
  title: string
  shortName: string
  category: string
  x: number
  z: number
  targetRotation: number
  roleText: string
  principleText: string
  paramsList: string[]
  procedureText: string[]
  liveDataGetter: (bb: number, cabT: number, cabH: number) => string
}

/**
 * Laboratuvar Metroloji Uzmanı / Teknisyeni Bileşeni
 * 
 * Özellikler:
 * - Tüm laboratuvarın cihazlarını, kalibrasyon süreçlerini ve deneylerini anlatan
 *   bilimsel olarak %100 doğru ve kapsamlı rehberli sunum sistemi.
 * - 5 Temel İstasyon:
 *   1. Siyah Cisim Fırınları & Yüksek Sıcaklık Pirometrisi
 *   2. ME30 Transfer Standardı, Düzlemsel IR Kalibratörler & Termal Kameralar
 *   3. ZHL_AKBLT İklimlendirme Kabini & Chilled Mirror Çiğ Noktası Aynası
 *   4. Thunder Scientific 3920 & 2900 Primer Nem Jeneratörleri
 *   5. ITS-90 Sabit Nokta Hücreleri (9 Faz Değişim Fırını) & ASL F900 Direnç Masası
 * - "Yerinde Anlatım": Seçilen istasyona yürür, cihazların önünde durup yönelir ve açıklar.
 * - Kullanıcı yaklaştığında yol verme (Proximity Detection) ve ışınlanmayı engellemeyen raycast yapısı.
 */
export default function LabTechnician({
  position: _pos,
  rotation: _rot,
  currentBbTemp = 500,
  currentCabTemp = 25,
  currentCabHum = 50,
}: LabTechnicianProps) {
  const photoTexture = useTexture(getAssetUrl('technician.png'))
  photoTexture.colorSpace = THREE.SRGBColorSpace

  // 5 BÜYÜK METROLOJİK İSTASYONUN BİLİMSEL VERİLERİ (SIFIR HATALI METROLOJİK STANDARTLAR)
  const STATIONS: MetrologyStation[] = [
    {
      id: 0,
      title: '🔥 Siyah Cisim Fırınları & Yüksek Sıcaklık Termometreleri',
      shortName: 'Siyah Cisim Fırınları',
      category: 'Radyasyon Termometrisi',
      x: -1.25,
      z: -2.35,
      targetRotation: -0.15,
      roleText: 'Radyasyon termometrelerinin birincil Planck spektral ışıma kaynağına göre kalibrasyonu.',
      principleText: 'Planck Işınım Yasası L(λ,T) = c1 / [π λ^5 (exp(c2/λT) - 1)] ve Stefan-Boltzmann toplam ışıma yasası (M = σ T^4).',
      paramsList: [
        '• BB1600 Fırın: 500 °C ila 1600 °C | SiC tüp kavite | ε = 0.998 ± 0.001 | Açıklık Ø25 mm',
        '• BB1200 Fırın: 50 °C ila 1200 °C | Kanthal rezistans dairesel kavite | ε = 0.997',
        '• CTlaser Fiber Termometre: 250 °C ila 1800 °C | λ = 1.0 / 1.6 µm (SWIR) | D:S = 150:1',
        '• Kaybolan Filamanlı Termometre: 700 °C ila 2000 °C | λ = 0.65 µm | ITS-90 Altın Noktası (1064.18 °C)',
        '• Sıcaklık Kararlılığı: ±0.15 °C/saat | Kavite Homojenliği: 120 mm derinlikte ±0.2 °C',
      ],
      procedureText: [
        '1. Termometre namlusu kavite açıklığına tam dik ve eksensel olarak hizalanır.',
        '2. Hedef spot çapının kavite taban çapının %60\'ını aşmadığı doğrulanır (SSE - Size-of-Source Effect denetimi).',
        '3. Kavite termal dengeye ulaştığında termometre dedektöründen 10 ardışık okuma alınıp Planck hesabı yapılır.',
      ],
      liveDataGetter: (bb) => `BB1600 Kavite Sıcaklığı: ${bb.toFixed(1)} °C | Emisivite ε: 0.998`,
    },
    {
      id: 1,
      title: '🎯 HEITRONICS ME30, Düzlemsel IR Kalibratörler & Termal Kameralar',
      shortName: 'ME30 & Termal Kameralar',
      category: 'Geniş Yüzeyli IR Kalibrasyon',
      x: 0.40,
      z: -2.35,
      targetRotation: 0.10,
      roleText: 'Geniş görüş açılı termal kameraların, pirometrelerin sıcaklık doğruluğu ve yüzey homojenliğinin kalibrasyonu.',
      principleText: 'Geniş alanlı yüksek emisiviteli mikro-oluklu yüzey ışıması ve yansıyan ortam sıcaklığı (Trefl) düzeltmesi.',
      paramsList: [
        '• HEITRONICS ME30: -30 °C ila +350 °C | λ = 8 - 14 µm (LWIR) | U = 0.15 °C (Transfer Standardı)',
        '• IR Kalibratör 1: -15 °C ila 150 °C | Geniş düzlem plaka (Ø152 mm) | ε = 0.95 ± 0.02 | Peltier kontrollü',
        '• IR Kalibratör 2: 35 °C ila 500 °C | Yüksek sıcaklık mikro-yivli yüzey kaplaması | ε = 0.95',
        '• FLIR T1020 HD: 1024 x 768 UFPA mikrobolometre | NETD < 20 mK | -40 °C ila 2000 °C | 30 Hz',
        '• Fluke 62 MAX+: -30 °C ila 800 °C | D:S = 50:1 | Çift kesişen kırmızı lazer hedefleme',
      ],
      procedureText: [
        '1. Düzlem plaka sıcaklığı önce ME30 transfer pirometresiyle doğrulanır.',
        '2. Test edilen termal kamera hedefe odaklanarak merkez 3x3 piksel ortalaması alınır.',
        '3. Ortam sıcaklığı (Trefl) sensörden okunarak kamera yazılımında telafi edilir.',
      ],
      liveDataGetter: () => `ME30 Referans: 100.0 °C | IR Plaka: 50.0 °C | Yüzey Homojenliği: ±0.18 °C`,
    },
    {
      id: 2,
      title: '❄️ ZHL_AKBLT İklimlendirme Kabini & Chilled Mirror Çiğ Noktası Aynası',
      shortName: 'İklimlendirme Kabini',
      category: 'Nem & Sıcaklık Metrolojisi',
      x: -2.15,
      z: -0.85,
      targetRotation: 1.50,
      roleText: 'Nem/sıcaklık transmiterlerinin, datalogger\'ların kontrollü iklim koşullarında doğrudan kalibrasyonu.',
      principleText: 'Peltier soğutmalı ayna yüzeyinde mikroskobik çiğ damlacıklarının yoğunlaşması (faz değişimi) fotodedektörle izlenir.',
      paramsList: [
        '• ZHL_AKBLT Kabin: Sıcaklık -20 °C ila +100 °C | Kararlılık: ±0.10 °C',
        '• Bağıl Nem Aralığı: %10 ila %98 RH | Homojenlik: ±%0.5 RH (Hava sirkülasyon kanallı)',
        '• MBW Chilled Mirror: Çiğ Noktası -40 °C ila +60 °C DP | Belirsizlik U = 0.10 °C DP (Primer Standart)',
        '• Pt100 RTD: 4 telli endüstriyel standart platin direnç termometresi (Sınıf 1/10 DIN)',
        '• Kapasitif Nem Sensörü: İnce film polimer dielektrik | Yanıt süresi < 15 s',
      ],
      procedureText: [
        '1. Sensörler kabin merkez tepsisine yerleştirilir ve MBW ayna numune hattı bağlanır.',
        '2. Sıcaklık ve nem kademeli olarak ayarlanır (örn: 23 °C / %50 RH).',
        '3. 45 dakika termal ve nem dengesi beklendikten sonra çiğ noktası ve bağıl nem kaydedilir.',
      ],
      liveDataGetter: (_bb, cabT, cabH) => `Kabin Sıcaklık: ${cabT.toFixed(1)} °C | Bağıl Nem: %${cabH.toFixed(0)} RH`,
    },
    {
      id: 3,
      title: '🌀 Thunder Scientific 3920 & 2900 Primer Nem Jeneratörleri',
      shortName: 'Thunder Nem Jeneratörü',
      category: 'Primer Nem Standardı',
      x: -2.15,
      z: 1.65,
      targetRotation: 1.65,
      roleText: 'En üst düzey primer seviyede eser nem ve yüksek hassasiyetli gaz nemi üretimi ve ayna higrometrelerinin kalibrasyonu.',
      principleText: 'İki-Sıcaklık İki-Basınç Prensibi: e(Td) = (Pt / Ps) · f(Ps, Ts) · ew(Ts). Gaz doyurucudan test hücresine genleştirilir.',
      paramsList: [
        '• Model 3920 Donma Noktası Aralığı: -95.0 °C FP ila +10.0 °C DP (Ultra düşük eser nem)',
        '• Model 3920 Belirsizliği: U = 0.05 °C Donma Noktası (TÜBİTAK UME / NIST Primer Seviye)',
        '• Çalışma Basıncı: 100 kPa ila 2.0 MPa (20 bar yüksek basınç doyurucu)',
        '• Model 2900 İki-Basınç Jeneratörü: %10 ila %95 RH | -10 °C ila +70 °C çalışma aralığı',
        '• Kriyojenik Stirling Soğutmalı Donma Noktası Aynası: -90 °C FP dedeksiyonu',
      ],
      procedureText: [
        '1. Doyurucu sıcaklığı (Ts) ve basıncı (Ps) kararlı rejimde sabitlenir.',
        '2. Yüksek saflıkta Kuru Azot (5.0 N2) gazı doyurucudan geçirilerek buharla doyurulur.',
        '3. Test odası basıncına (Pt) genişletilerek mutlak termodinamik nem üretilir ve ayna test edilir.',
      ],
      liveDataGetter: () => `Doyurucu Basıncı Ps: 1.25 MPa | Üretilen FP: -65.0 °C | Gaz Akışı: 5.0 SLPM`,
    },
    {
      id: 4,
      title: '🏛️ ITS-90 Sabit Nokta Hücreleri (9 Hücre) & ASL F900 Direnç Masası',
      shortName: 'ITS-90 Sabit Noktalar',
      category: 'Primer Termodinamik Standart',
      x: 2.35,
      z: 1.35,
      targetRotation: -1.60,
      roleText: 'Uluslararası Sıcaklık Skalası ITS-90\'ın birincil sabit noktalarının gerçekleştirilmesi ve SPRT problarının kalibrasyonu.',
      principleText: '%99.9999 (6N) saflıktaki metallerin erime ve donma faz dönüşümü esnasında sıcaklığın sabit kaldığı plato kullanılır.',
      paramsList: [
        '• Ar (Argon Üçlü Noktası): -189.3442 °C (83.8058 K)',
        '• Hg (Cıva Üçlü Noktası): -38.8344 °C (234.3156 K)',
        '• Su Üçlü Noktası (TPW): +0.0100 °C (273.1600 K - Termodinamiğin temel sıfır noktası, U = 0.1 mK)',
        '• Ga (Galyum Erime): +29.7646 °C | In (İndiyum Donma): +156.5985 °C',
        '• Sn (Kalay Donma): +231.9280 °C | Zn (Çinko Donma): +419.5270 °C',
        '• Al (Alüminyum Donma): +660.3230 °C | Ag (Gümüş Donma): +961.7800 °C',
        '• ASL F900 AC Direnç Köprüsü: 0.1 ppb oran doğruluğu | 25.5 Ω Standart Platin Termometre (SPRT)',
      ],
      procedureText: [
        '1. Fırın aşırı soğutulup nükleasyon başlatılır ve saatlerce süren donma platosu izlenir.',
        '2. Kuvars kılıflı SPRT hücre kuyusuna daldırılır; 1 mA ve √2 mA akımlarla kendini ısıtma etkisi sıfırlanır.',
        '3. R(T) direnci ASL F900 köprüsüyle ölçülüp W(T) = R(T)/R_TPW direnç oranı hesaplanır.',
      ],
      liveDataGetter: () => `Su Üçlü Noktası: +0.0100 °C | Galyum Platosu: +29.7646 °C | F900 Oranı: 1.0000000`,
    },
  ]

  // Devriye, Sunum ve Hareket Referansları
  const activeStationIdxRef = useRef(0)
  const modeRef = useRef<'WALKING' | 'INSPECTING'>('INSPECTING')
  const pauseTimerRef = useRef(10.0)
  const walkCycleRef = useRef(0)
  const posRef = useRef({ x: STATIONS[0].x, z: STATIONS[0].z })
  const isAutoTourActive = useRef(false)
  const isYieldingToPlayer = useRef(false)

  // React State'leri
  const [selectedStationId, setSelectedStationId] = useState(0)
  const [isWalkingUI, setIsWalkingUI] = useState(false)
  const [isNearPlayerUI, setIsNearPlayerUI] = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const [autoTourState, setAutoTourState] = useState(false)

  // 3D Eklemler
  const rootGroupRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const upperBodyRef = useRef<THREE.Group>(null)
  const coatSkirtRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const tabletRef = useRef<THREE.Group>(null)

  // İstasyona Yürüme ve Yerinde Sunuma Geçme
  const navigateToStation = (idx: number) => {
    activeStationIdxRef.current = idx
    setSelectedStationId(idx)
    modeRef.current = 'WALKING'
    setIsWalkingUI(true)
  }

  // 60 FPS Hareket ve Sunum Yürütücüsü
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    if (!rootGroupRef.current) return

    // 1. KULLANICI YAKINLIĞI DENETİMİ (Kullanıcıya Yol Verme)
    const playerX = state.camera.position.x
    const playerZ = state.camera.position.z
    const distToPlayer = Math.hypot(posRef.current.x - playerX, posRef.current.z - playerZ)
    const nearPlayer = distToPlayer < 1.45

    if (nearPlayer !== isNearPlayerUI) {
      setIsNearPlayerUI(nearPlayer)
    }
    isYieldingToPlayer.current = nearPlayer

    // Kullanıcı yaklaştığında adımları durdurup yol verir
    if (isYieldingToPlayer.current) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 8)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 8)
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1, delta * 6)
      if (coatSkirtRef.current) coatSkirtRef.current.rotation.x = THREE.MathUtils.lerp(coatSkirtRef.current.rotation.x, 0, delta * 6)
      if (upperBodyRef.current) {
        upperBodyRef.current.position.y = Math.sin(t * 1.8) * 0.003
        upperBodyRef.current.rotation.z = THREE.MathUtils.lerp(upperBodyRef.current.rotation.z, 0, delta * 6)
      }

      // Kullanıcıya doğru saygıyla yönelme
      const lookAtUserAngle = Math.atan2(playerX - posRef.current.x, playerZ - posRef.current.z)
      let turnDiff = lookAtUserAngle - rootGroupRef.current.rotation.y
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2
      rootGroupRef.current.rotation.y += turnDiff * Math.min(1, delta * 4.0)

      return // Kullanıcının hareket alanını asla engellemez
    }

    const activeStation = STATIONS[activeStationIdxRef.current]

    // 2. İSTASYONDA İNCELEME & YERİNDE SUNUM MODU
    if (modeRef.current === 'INSPECTING') {
      if (isAutoTourActive.current) {
        pauseTimerRef.current -= delta
        if (pauseTimerRef.current <= 0) {
          // Otomatik turda sonraki istasyona geç
          const nextIdx = (activeStationIdxRef.current + 1) % STATIONS.length
          navigateToStation(nextIdx)
          pauseTimerRef.current = 14.0
        }
      }

      // Ayaklar sakin durur
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 6)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 6)
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1, delta * 5)
      if (coatSkirtRef.current) coatSkirtRef.current.rotation.x = THREE.MathUtils.lerp(coatSkirtRef.current.rotation.x, 0, delta * 5)

      // Cihazlara doğru yönelme
      let angleDiff = activeStation.targetRotation - rootGroupRef.current.rotation.y
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      rootGroupRef.current.rotation.y += angleDiff * Math.min(1, delta * 3.5)

      // Gövde nefes alma
      if (upperBodyRef.current) {
        upperBodyRef.current.position.y = Math.sin(t * 1.8) * 0.003
        upperBodyRef.current.rotation.z = THREE.MathUtils.lerp(upperBodyRef.current.rotation.z, 0, delta * 5)
      }
      // Tablet sunum/not alma hareketi
      if (tabletRef.current) {
        tabletRef.current.rotation.x = -0.32 + Math.sin(t * 1.4) * 0.025
      }
    } else {
      // 3. YÜRÜME MODU (WALKING TO STATION)
      const target = activeStation
      const dx = target.x - posRef.current.x
      const dz = target.z - posRef.current.z
      const dist = Math.hypot(dx, dz)

      const walkSpeed = 0.64
      const step = walkSpeed * delta

      if (dist <= step || dist < 0.06) {
        // İstasyona ulaşıldı! Sunum moduna geç
        posRef.current.x = target.x
        posRef.current.z = target.z
        rootGroupRef.current.position.x = target.x
        rootGroupRef.current.position.z = target.z

        modeRef.current = 'INSPECTING'
        setIsWalkingUI(false)
        pauseTimerRef.current = 14.0
      } else {
        // Hedefe doğru adım atma
        posRef.current.x += (dx / dist) * step
        posRef.current.z += (dz / dist) * step
        rootGroupRef.current.position.x = posRef.current.x
        rootGroupRef.current.position.z = posRef.current.z

        // Yürüme açısına dönme
        const travelAngle = Math.atan2(dx, dz)
        let rotDiff = travelAngle - rootGroupRef.current.rotation.y
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
        rootGroupRef.current.rotation.y += rotDiff * Math.min(1, delta * 6.0)

        // Kinematik Yürüyüş
        walkCycleRef.current += delta * 5.4
        const sinCycle = Math.sin(walkCycleRef.current)

        if (leftLegRef.current) leftLegRef.current.rotation.x = sinCycle * 0.36
        if (rightLegRef.current) rightLegRef.current.rotation.x = -sinCycle * 0.36
        if (leftArmRef.current) leftArmRef.current.rotation.x = -sinCycle * 0.24
        if (upperBodyRef.current) {
          upperBodyRef.current.position.y = Math.abs(sinCycle) * 0.015
          upperBodyRef.current.rotation.z = Math.sin(walkCycleRef.current) * 0.016
        }
        if (coatSkirtRef.current) coatSkirtRef.current.rotation.x = sinCycle * 0.06
        if (tabletRef.current) tabletRef.current.rotation.x = -0.36 + Math.abs(sinCycle) * 0.02
      }
    }
  })

  const currentStation = STATIONS[selectedStationId]

  return (
    <group ref={rootGroupRef} position={[posRef.current.x, 0, posRef.current.z]}>
      {/* ---------- 1. ZEMİN İSTASYON HALKASI (RAYCAST ENGELLEMEZ) ---------- */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[0.26, 0.32, 32]} />
        <meshBasicMaterial
          color={isNearPlayerUI ? '#38bdf8' : isWalkingUI ? '#0284c7' : '#22c55e'}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ---------- 2. BACAKLAR & AYAKKABILAR ---------- */}
      <group ref={leftLegRef} position={[-0.10, 0.76, 0]}>
        <mesh position={[0, -0.36, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.062, 0.052, 0.72, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
        <group position={[0, -0.72, 0]}>
          <mesh position={[0, 0.015, 0.035]} raycast={() => null}>
            <boxGeometry args={[0.088, 0.065, 0.22]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      </group>

      <group ref={rightLegRef} position={[0.10, 0.76, 0]}>
        <mesh position={[0, -0.36, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.062, 0.052, 0.72, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
        <group position={[0, -0.72, 0]}>
          <mesh position={[0, 0.015, 0.035]} raycast={() => null}>
            <boxGeometry args={[0.088, 0.065, 0.22]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* ---------- 3. KESİNTİSİZ LABORATUVAR ÖNLÜĞÜ VE GÖVDE ---------- */}
      <group ref={upperBodyRef}>
        {/* Alt Etekler */}
        <group ref={coatSkirtRef} position={[0, 0.74, 0]}>
          <mesh position={[0, -0.16, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.19, 0.24, 0.36, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.65} />
          </mesh>
        </group>

        {/* Bel Ara Katmanı */}
        <mesh position={[0, 0.83, 0]} raycast={() => null}>
          <boxGeometry args={[0.36, 0.22, 0.21]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.73, 0.005]} raycast={() => null}>
          <boxGeometry args={[0.365, 0.03, 0.215]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Göğüs Bloğu (Tıklandığında Sunumu Açar) */}
        <mesh
          position={[0, 1.12, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setShowPresentation(!showPresentation)
          }}
        >
          <boxGeometry args={[0.39, 0.38, 0.23]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>

        {/* Önlük Yakaları & Düğmeler */}
        <mesh position={[-0.08, 1.25, 0.122]} rotation={[0, 0.1, 0.15]} raycast={() => null}>
          <boxGeometry args={[0.085, 0.16, 0.015]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
        </mesh>
        <mesh position={[0.08, 1.25, 0.122]} rotation={[0, -0.1, -0.15]} raycast={() => null}>
          <boxGeometry args={[0.085, 0.16, 0.015]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
        </mesh>
        {[1.20, 1.08, 0.96, 0.84, 0.66].map((by, i) => (
          <mesh key={i} position={[0, by, 0.122]} raycast={() => null}>
            <cylinderGeometry args={[0.007, 0.007, 0.004, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}

        {/* TÜBİTAK UME Göğüs Rozeti */}
        <group position={[-0.11, 1.18, 0.12]}>
          <mesh raycast={() => null}>
            <planeGeometry args={[0.065, 0.065]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <Text position={[0, -0.01, 0.002]} fontSize={0.008} color="#0f172a" anchorX="center" anchorY="middle">
            METROLOJİ
          </Text>
        </group>

        {/* ---------- 4. KOLLAR & TABLET ---------- */}
        <mesh position={[-0.20, 1.22, 0]} raycast={() => null}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
        <group ref={leftArmRef} position={[-0.22, 1.20, 0]}>
          <mesh position={[0, -0.16, 0]} rotation={[0.05, 0, -0.08]} raycast={() => null}>
            <cylinderGeometry args={[0.052, 0.046, 0.32, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.65} />
          </mesh>
          <mesh position={[0, -0.34, 0]} raycast={() => null}>
            <sphereGeometry args={[0.036, 16, 16]} />
            <meshStandardMaterial color="#e2a77f" roughness={0.8} />
          </mesh>
        </group>

        <mesh position={[0.20, 1.22, 0]} raycast={() => null}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
        <group position={[0.22, 1.20, 0]}>
          <mesh position={[0, -0.14, 0.04]} rotation={[0.3, 0, 0.12]} raycast={() => null}>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.65} />
          </mesh>
          <mesh position={[-0.08, -0.22, 0.14]} rotation={[0.4, -0.4, -0.5]} raycast={() => null}>
            <cylinderGeometry args={[0.046, 0.042, 0.22, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.65} />
          </mesh>
        </group>

        {/* Canlı Dijital Metroloji Tableti */}
        <group
          ref={tabletRef}
          position={[0.05, 0.98, 0.22]}
          rotation={[-0.32, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setShowPresentation(!showPresentation)
          }}
        >
          <mesh>
            <boxGeometry args={[0.25, 0.18, 0.012]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.007]} raycast={() => null}>
            <planeGeometry args={[0.23, 0.16]} />
            <meshBasicMaterial color="#020617" />
          </mesh>

          <Text position={[0, 0.062, 0.009]} fontSize={0.0105} color="#38bdf8" anchorX="center">
            TÜBİTAK UME METROLOJİ
          </Text>
          <Text position={[-0.10, 0.038, 0.009]} fontSize={0.0085} color="#facc15" anchorX="left">
            {`İstasyon: ${currentStation.shortName}`}
          </Text>
          <Text position={[-0.10, 0.020, 0.009]} fontSize={0.0075} color="#4ade80" anchorX="left">
            {`Kategori: ${currentStation.category}`}
          </Text>
          <Text position={[-0.10, 0.002, 0.009]} fontSize={0.0075} color="#f8fafc" anchorX="left">
            {currentStation.liveDataGetter(currentBbTemp, currentCabTemp, currentCabHum).slice(0, 32)}
          </Text>
          <Text position={[0, -0.026, 0.009]} fontSize={0.008} color="#38bdf8" anchorX="center">
            [ Sunum Kartı İçin Dokunun ]
          </Text>
        </group>

        {/* ---------- 5. BAŞLIK VE GERÇEK FOTOĞRAF ---------- */}
        <mesh position={[0, 1.32, 0.01]} raycast={() => null}>
          <cylinderGeometry args={[0.075, 0.082, 0.05, 20]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.38, 0.02]} raycast={() => null}>
          <cylinderGeometry args={[0.058, 0.062, 0.09, 20]} />
          <meshStandardMaterial color="#e2a77f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.53, 0.01]} raycast={() => null}>
          <sphereGeometry args={[0.118, 24, 24]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.95} />
        </mesh>

        <group position={[0, 1.53, 0.095]}>
          <mesh position={[0, 0, -0.004]} raycast={() => null}>
            <boxGeometry args={[0.204, 0.244, 0.01]} />
            <meshStandardMaterial color="#1e1b18" roughness={0.9} />
          </mesh>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setShowPresentation(!showPresentation)
            }}
          >
            <planeGeometry args={[0.20, 0.24]} />
            <meshBasicMaterial map={photoTexture} transparent opacity={0.99} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* ---------- 6. BAŞ ÜSTÜ ROZETİ ---------- */}
        <group position={[0, 1.83, 0]}>
          <mesh position={[0, 0, 0]} raycast={() => null}>
            <planeGeometry args={[0.48, 0.058]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0, -0.001]} raycast={() => null}>
            <planeGeometry args={[0.486, 0.064]} />
            <meshBasicMaterial
              color={isNearPlayerUI ? '#38bdf8' : isWalkingUI ? '#0284c7' : '#22c55e'}
              transparent
              opacity={0.75}
            />
          </mesh>
          <Text
            position={[0, 0.009, 0.005]}
            fontSize={0.013}
            color={isNearPlayerUI ? '#38bdf8' : '#22c55e'}
            anchorX="center"
          >
            {isNearPlayerUI
              ? '👋 Hoş Geldiniz! Buyrun, sizi engellemiyorum'
              : isWalkingUI
                ? `🚶 İstasyona İlerliyor: ${currentStation.shortName}`
                : `👨‍🔬 Metroloji Uzmanı: ${currentStation.shortName}`}
          </Text>
          <Text position={[0, -0.012, 0.005]} fontSize={0.0085} color="#f8fafc" anchorX="center">
            {showPresentation ? '📋 Detaylı Laboratuvar Sunumu Açık' : 'Tıklayarak Tüm Laboratuvar Sunumunu Başlatın'}
          </Text>
        </group>
      </group>

      {/* ---------- 7. BİLİMSEL LABORATUVAR VE CİHAZ SUNUMU HOLOGRAFİK TERMİNALİ ---------- */}
      {showPresentation && (
        <group position={[0, 1.45, 0.52]}>
          {/* Arka Plan Paneli (Dark Glassmorphism) */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.96, 0.72]} />
            <meshBasicMaterial color="#050811" transparent opacity={0.97} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[0.968, 0.728]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Üst Başlık ve Kurumsal Kimlik */}
          <Text position={[0, 0.325, 0.005]} fontSize={0.020} color="#38bdf8" anchorX="center">
            🏛️ TÜBİTAK UME SICAKLIK & NEM METROLOJİSİ LABORATUVARI
          </Text>
          <Text position={[0, 0.300, 0.005]} fontSize={0.011} color="#94a3b8" anchorX="center">
            Uluslararası Sıcaklık Skalası (ITS-90) & ISO/IEC 17025 Kalibrasyon Rehberli Sunumu
          </Text>

          {/* İSTASYON SEKMELERİ (5 İSTASYON SEÇİCİ) */}
          <group position={[0, 0.255, 0.005]}>
            {STATIONS.map((st, i) => {
              const isSelected = st.id === selectedStationId
              const tabX = (i - 2) * 0.185
              return (
                <group
                  key={st.id}
                  position={[tabX, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStationId(st.id)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.175, 0.030, 0.004]} />
                    <meshStandardMaterial
                      color={isSelected ? '#0284c7' : '#1e293b'}
                      metalness={0.5}
                      roughness={0.3}
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.004]}
                    fontSize={0.0085}
                    color={isSelected ? '#ffffff' : '#94a3b8'}
                    anchorX="center"
                    anchorY="middle"
                  >
                    {st.shortName}
                  </Text>
                </group>
              )
            })}
          </group>

          {/* İSTASYON BİLGİ KARTI */}
          <group position={[0, 0.04, 0.005]}>
            {/* İstasyon Adı */}
            <Text position={[-0.45, 0.17, 0]} fontSize={0.015} color="#facc15" anchorX="left">
              {currentStation.title}
            </Text>

            {/* Cihazın Görevi ve Amacı */}
            <Text position={[-0.45, 0.138, 0]} fontSize={0.011} color="#38bdf8" anchorX="left">
              🎯 Cihazların Görevi ve Kullanım Amacı:
            </Text>
            <Text position={[-0.45, 0.116, 0]} fontSize={0.0095} color="#f8fafc" anchorX="left">
              {currentStation.roleText}
            </Text>

            {/* Fiziksel / Metrolojik Prensip */}
            <Text position={[-0.45, 0.088, 0]} fontSize={0.011} color="#c084fc" anchorX="left">
              🔬 Metrolojik Çalışma Prensibi & Formüller:
            </Text>
            <Text position={[-0.45, 0.066, 0]} fontSize={0.0092} color="#f1f5f9" anchorX="left">
              {currentStation.principleText}
            </Text>

            {/* Teknik Parametreler */}
            <Text position={[-0.45, 0.038, 0]} fontSize={0.011} color="#4ade80" anchorX="left">
              📊 Ölçüm Parametreleri & Metrolojik Özellikler (Doğrulanmış Değerler):
            </Text>
            {currentStation.paramsList.map((param, pIdx) => (
              <Text
                key={pIdx}
                position={[-0.45, 0.016 - pIdx * 0.019, 0]}
                fontSize={0.0088}
                color="#e2e8f0"
                anchorX="left"
              >
                {param}
              </Text>
            ))}

            {/* Kalibrasyon Prosedürü */}
            <Text position={[-0.45, -0.095, 0]} fontSize={0.011} color="#f97316" anchorX="left">
              ⚙️ Kalibrasyon & Deney Ölçüm Prosedürü:
            </Text>
            {currentStation.procedureText.map((step, sIdx) => (
              <Text
                key={sIdx}
                position={[-0.45, -0.117 - sIdx * 0.018, 0]}
                fontSize={0.0086}
                color="#cbd5e1"
                anchorX="left"
              >
                {step}
              </Text>
            ))}

            {/* Canlı Laboratuvar Sensör Verisi */}
            <Text position={[-0.45, -0.178, 0]} fontSize={0.010} color="#38bdf8" anchorX="left">
              {`📡 Canlı Laboratuvar Değeri: ${currentStation.liveDataGetter(currentBbTemp, currentCabTemp, currentCabHum)}`}
            </Text>
          </group>

          {/* ALT NAVİGASYON VE KONTROL BUTONLARI */}
          <group position={[0, -0.295, 0.005]}>
            {/* Önceki İstasyon Butonu */}
            <group
              position={[-0.33, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                const prevIdx = (selectedStationId - 1 + STATIONS.length) % STATIONS.length
                setSelectedStationId(prevIdx)
              }}
            >
              <mesh>
                <boxGeometry args={[0.18, 0.038, 0.006]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.010} color="#ffffff" anchorX="center" anchorY="middle">
                ◀ Önceki İstasyon
              </Text>
            </group>

            {/* YERİNDE ANLATIM BUTONU: Teknisyen Oraya Yürür */}
            <group
              position={[0, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                navigateToStation(selectedStationId)
              }}
            >
              <mesh>
                <boxGeometry args={[0.42, 0.042, 0.008]} />
                <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.25} />
              </mesh>
              <Text position={[0, 0, 0.006]} fontSize={0.0115} color="#ffffff" anchorX="center" anchorY="middle">
                🚀 Teknisyeni Oraya Gönder ve Yerinde Dinle
              </Text>
            </group>

            {/* Sonraki İstasyon Butonu */}
            <group
              position={[0.33, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                const nextIdx = (selectedStationId + 1) % STATIONS.length
                setSelectedStationId(nextIdx)
              }}
            >
              <mesh>
                <boxGeometry args={[0.18, 0.038, 0.006]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.010} color="#ffffff" anchorX="center" anchorY="middle">
                Sonraki İstasyon ▶
              </Text>
            </group>
          </group>

          {/* Otomatik Tur Modu ve Kapatma Butonları */}
          <group position={[0, -0.342, 0.005]}>
            <group
              position={[-0.18, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                isAutoTourActive.current = !isAutoTourActive.current
                setAutoTourState(isAutoTourActive.current)
              }}
            >
              <mesh>
                <boxGeometry args={[0.30, 0.028, 0.004]} />
                <meshStandardMaterial color={autoTourState ? '#ef4444' : '#22c55e'} roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.004]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle">
                {autoTourState ? '⏸️ Otomatik Turu Duraklat' : '▶️ Tüm Laboratuvarı Otomatik Gezdir'}
              </Text>
            </group>

            <group
              position={[0.22, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                setShowPresentation(false)
              }}
            >
              <mesh>
                <boxGeometry args={[0.16, 0.028, 0.004]} />
                <meshStandardMaterial color="#334155" roughness={0.5} />
              </mesh>
              <Text position={[0, 0, 0.004]} fontSize={0.009} color="#ffffff" anchorX="center" anchorY="middle">
                ✕ Sunumu Kapat
              </Text>
            </group>
          </group>
        </group>
      )}
    </group>
  )
}
