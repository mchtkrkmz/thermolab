import { useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export interface CabinetSensorSuiteProps {
  cabCurrentTemp: number
  cabCurrentHum: number
}

export type SensorType = 'HUMIDITY_POLYMER' | 'TEMP_PT100' | 'CHILLED_MIRROR_DP' | 'FROST_POINT_FP' | 'DATA_LOGGER'

export interface SensorItem {
  id: string
  name: string
  shortCode: string
  type: SensorType
  badgeColor: string
  specRange: string
  accuracy: string
  inCabinet: boolean
  shelf: 'lower' | 'upper'
  traySlot: number // 0..4 on table tray
  cabSlot: number // 0..4 on cabinet shelf
  tempOffset: number
  humOffset: number
}

// Psikrometrik Çiğ Noktası (Dew Point) Hesabı (Magnus-Tetens Denklemi)
function calcDewPoint(T: number, RH: number): number {
  const safeRH = Math.max(0.1, Math.min(100, RH))
  const a = 17.62
  const b = 243.12
  const alpha = ((a * T) / (b + T)) + Math.log(safeRH / 100.0)
  const dp = (b * alpha) / (a - alpha)
  return Number(dp.toFixed(1))
}

// Sonntag Donma Noktası (Frost Point) Hesabı (Buz Üzerinde Doygun Buhar Basıncı)
function calcFrostPoint(T: number, RH: number): number {
  const safeRH = Math.max(0.1, Math.min(100, RH))
  const a = 22.46
  const b = 272.62
  const ew = 6.112 * Math.exp((17.62 * T) / (243.12 + T))
  const e = (safeRH / 100.0) * ew
  if (e <= 0) return -75.0
  const fp = (b * Math.log(e / 6.112)) / (a - Math.log(e / 6.112))
  return Number(fp.toFixed(1))
}

export default function CabinetSensorSuite({
  cabCurrentTemp,
  cabCurrentHum
}: CabinetSensorSuiteProps) {
  // Masadaki tepsi konumu (Sol masa üzeri, kabinin hemen yanı)
  const trayBasePos: [number, number, number] = [-3.80, 0.90, 0.08]

  // Kabin içindeki referans raf koordinatları (Dünya koordinatları)
  // Kabin merkezi: [-3.1, 0, -0.6], alt raf: Y=1.06, üst raf: Y=1.40
  const cabLowerShelfY = 1.06
  const cabUpperShelfY = 1.40
  const cabCenterX = -3.10
  const cabCenterZ = -0.60
  const cabHolePos: [number, number, number] = [-3.475, 0.95, -0.60]

  // Ortam (Laboratuvar) Referans Değerleri
  const ambientTemp = 23.2
  const ambientHum = 45.0

  // 5 Farklı Tipte ve Görünüşte Nem, Sıcaklık, DP, FP Sensörü
  const [sensors, setSensors] = useState<SensorItem[]>([
    {
      id: 'sensor-hmp',
      name: 'Vaisala HMP Kapasitif Polimer Nem & Sıcaklık Probu',
      shortCode: 'HMP-PROBE',
      type: 'HUMIDITY_POLYMER',
      badgeColor: '#0284c7',
      specRange: '%0 - 100 RH / -40°C ila +80°C',
      accuracy: '±%0.8 RH / ±0.1 °C',
      inCabinet: false,
      shelf: 'lower',
      traySlot: 0,
      cabSlot: 0,
      tempOffset: 0.1,
      humOffset: -0.4,
    },
    {
      id: 'sensor-pt100',
      name: 'Hassas 4-Telli Pt100 / PRT Metroloji Sıcaklık Probu',
      shortCode: 'PT100-PRT',
      type: 'TEMP_PT100',
      badgeColor: '#dc2626',
      specRange: '-80°C ila +250°C',
      accuracy: '±0.015 °C (ITS-90)',
      inCabinet: false,
      shelf: 'lower',
      traySlot: 1,
      cabSlot: 1,
      tempOffset: -0.05,
      humOffset: 0.0,
    },
    {
      id: 'sensor-cm-dp',
      name: 'Optik Aynalı Çiğ Noktası (DP) Minyatür Başlığı',
      shortCode: 'CHILLED-DP',
      type: 'CHILLED_MIRROR_DP',
      badgeColor: '#f59e0b',
      specRange: 'DP: -40°C ila +70°C',
      accuracy: '±0.1 °C DP (Birincil Ayna)',
      inCabinet: false,
      shelf: 'lower',
      traySlot: 2,
      cabSlot: 2,
      tempOffset: 0.0,
      humOffset: 0.2,
    },
    {
      id: 'sensor-fp-cryo',
      name: 'Kriyojenik Donma Noktası (FP) Higrometre Probu',
      shortCode: 'FROST-FP',
      type: 'FROST_POINT_FP',
      badgeColor: '#a855f7',
      specRange: 'FP: -75°C ila 0°C',
      accuracy: '±0.15 °C FP (Buz Dengesi)',
      inCabinet: false,
      shelf: 'lower',
      traySlot: 3,
      cabSlot: 3,
      tempOffset: -0.1,
      humOffset: -0.2,
    },
    {
      id: 'sensor-datalogger',
      name: 'Kompakt Dijital Kablosuz Mini Veri Kaydedici',
      shortCode: 'MINI-LOGGER',
      type: 'DATA_LOGGER',
      badgeColor: '#10b981',
      specRange: '-30°C ila +70°C / %0 - 100 RH',
      accuracy: '±0.4 °C / ±%2.0 RH',
      inCabinet: false,
      shelf: 'upper',
      traySlot: 4,
      cabSlot: 4,
      tempOffset: 0.3,
      humOffset: 1.1,
    },
  ])

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Kabine gönderme veya masaya geri alma
  const toggleCabinet = (id: string) => {
    setSensors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, inCabinet: !s.inCabinet } : s))
    )
  }

  // Raf değiştirme (Alt Raf / Üst Raf)
  const toggleShelf = (id: string) => {
    setSensors((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, shelf: s.shelf === 'lower' ? 'upper' : 'lower' } : s
      )
    )
  }

  // Kablo eğrileri ve yolları
  const cableGeometries = useMemo(() => {
    return sensors.map((s) => {
      if (!s.inCabinet) return null
      // Kabin içi prob pozisyonu
      const shelfY = s.shelf === 'upper' ? cabUpperShelfY : cabLowerShelfY
      const targetX = cabCenterX + (s.cabSlot - 2) * 0.11
      const targetZ = cabCenterZ + (s.cabSlot % 2 === 0 ? 0.08 : -0.06)

      // Kablo başlangıcı: Kabin duvarı deliği
      const p1 = new THREE.Vector3(...cabHolePos)
      // Ara sarkma noktası
      const p2 = new THREE.Vector3(
        (cabHolePos[0] + targetX) / 2,
        Math.min(cabHolePos[1], shelfY) - 0.05,
        (cabHolePos[2] + targetZ) / 2
      )
      // Prob arkası
      const p3 = new THREE.Vector3(targetX, shelfY + 0.015, targetZ + 0.06)

      const curve = new THREE.CatmullRomCurve3([p1, p2, p3])
      return new THREE.TubeGeometry(curve, 20, 0.0035, 8, false)
    })
  }, [sensors, cabUpperShelfY, cabLowerShelfY, cabCenterX, cabCenterZ, cabHolePos])

  return (
    <group>
      {/* ==================================================================== */}
      {/* 1. MASADAKİ DÜZENLİ SENSÖR TEST STANDI / TEPSİSİ (ESD BENCH TRAY)     */}
      {/* ==================================================================== */}
      <group position={trayBasePos}>
        {/* Antistatik Siyah ESD Mat Tabanı */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.55, 0.010, 0.36]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Alüminyum Eloksallı Çerçeve */}
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.56, 0.008, 0.37]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Tepsi Başlık Yazısı */}
        <Text
          position={[0, 0.012, -0.155]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.012}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          NEM, SICAKLIK, ÇİĞ NOKTASI (DP) & DONMA NOKTASI (FP) TEST PROBLARI
        </Text>

        {/* Tepsi Alt Bilgi İpucu */}
        <Text
          position={[0, 0.012, 0.16]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.008}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          Prob seçip kabin içine yerleştirmek için üzerine tıklayın 📥
        </Text>

        {/* 5 Adet Pleksiglas / Teflon Yuva (V-Block Slots) */}
        {[-0.20, -0.10, 0.0, 0.10, 0.20].map((slotX, idx) => (
          <group key={idx} position={[slotX, 0.012, 0]}>
            <mesh>
              <boxGeometry args={[0.075, 0.014, 0.22]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Boş Yuva İndikatörü */}
            <mesh position={[0, 0.008, 0]}>
              <boxGeometry args={[0.065, 0.002, 0.20]} />
              <meshBasicMaterial color="#020617" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ==================================================================== */}
      {/* 2. SENSÖR PROBLARI MODELLEMESİ (MASA VEYA KABİN İÇİNDE)              */}
      {/* ==================================================================== */}
      {sensors.map((s) => {
        // Prob Pozisyonunu Hesapla:
        // Eğer kabindeyse: Kabin rafına yerleşir
        // Eğer masadaysa: Masadaki tepsi yuvasına yerleşir
        const shelfY = s.shelf === 'upper' ? cabUpperShelfY : cabLowerShelfY
        const targetPos: [number, number, number] = s.inCabinet
          ? [
              cabCenterX + (s.cabSlot - 2) * 0.11,
              shelfY + 0.012,
              cabCenterZ + (s.cabSlot % 2 === 0 ? 0.08 : -0.06),
            ]
          : [
              trayBasePos[0] + (s.traySlot - 2) * 0.10,
              trayBasePos[1] + 0.026,
              trayBasePos[2],
            ]

        const isSelected = selectedSensorId === s.id
        const isHovered = hoveredId === s.id

        // Canlı Ölçüm Değerleri (Kabin içi veya Ortam)
        const currentT = s.inCabinet ? cabCurrentTemp + s.tempOffset : ambientTemp + s.tempOffset
        const currentRH = s.inCabinet
          ? Math.max(0, Math.min(100, cabCurrentHum + s.humOffset))
          : Math.max(0, Math.min(100, ambientHum + s.humOffset))
        const currentDP = calcDewPoint(currentT, currentRH)
        const currentFP = calcFrostPoint(currentT, currentRH)

        return (
          <group
            key={s.id}
            position={targetPos}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedSensorId(isSelected ? null : s.id)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredId(s.id)
            }}
            onPointerOut={() => setHoveredId(null)}
          >
            {/* Seçim Vurgusu (Holografik Çember) */}
            {(isSelected || isHovered) && (
              <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.045, 0.055, 24]} />
                <meshBasicMaterial color={s.badgeColor} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* ---------- SENSÖR 1: KAPASİTİF POLİMER NEM PROBU (HMP) ---------- */}
            {s.type === 'HUMIDITY_POLYMER' && (
              <group rotation={[Math.PI / 2, 0, 0]}>
                {/* Paslanmaz Çelik Ana Gövde */}
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.007, 0.007, 0.13, 24]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Sinterlenmiş Gözenekli Tel Filtre Başlığı */}
                <mesh position={[0, -0.075, 0]}>
                  <cylinderGeometry args={[0.0072, 0.0072, 0.024, 24]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.8} />
                </mesh>
                {/* Mavi Silikon Conta Halkası */}
                <mesh position={[0, 0.02, 0]}>
                  <cylinderGeometry args={[0.0085, 0.0085, 0.006, 24]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.5} />
                </mesh>
                {/* Arka Kablo Rakoru ve LED Halkası */}
                <mesh position={[0, 0.07, 0]}>
                  <cylinderGeometry args={[0.006, 0.008, 0.016, 16]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.065, 0]}>
                  <cylinderGeometry args={[0.0075, 0.0075, 0.003, 16]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
              </group>
            )}

            {/* ---------- SENSÖR 2: 4-TELLİ HASSAS PT100 PROBU ---------- */}
            {s.type === 'TEMP_PT100' && (
              <group rotation={[Math.PI / 2, 0, 0]}>
                {/* İnce Parlak Kılıf (Thin Stainless Steel Sheath) */}
                <mesh position={[0, -0.03, 0]}>
                  <cylinderGeometry args={[0.0025, 0.0025, 0.16, 24]} />
                  <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Altın Algılayıcı Uç (Sıcaklık Algılama Noktası) */}
                <mesh position={[0, -0.112, 0]}>
                  <cylinderGeometry args={[0.0025, 0.0025, 0.006, 16]} />
                  <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Anodize Kırmızı Alüminyum Tutma Sapı (Handle) */}
                <mesh position={[0, 0.065, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.045, 24]} />
                  <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Altın Kaplama Lemo Konektör Rakoru */}
                <mesh position={[0, 0.092, 0]}>
                  <cylinderGeometry args={[0.006, 0.007, 0.012, 16]} />
                  <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.15} />
                </mesh>
              </group>
            )}

            {/* ---------- SENSÖR 3: OPTİK AYNALI ÇİĞ NOKTASI (DP) BAŞLIĞI ---------- */}
            {s.type === 'CHILLED_MIRROR_DP' && (
              <group>
                {/* Nikel Kaplama Döküm Algılama Bloğu */}
                <mesh position={[0, 0.015, 0]}>
                  <boxGeometry args={[0.042, 0.030, 0.055]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Ön Çiy Noktası Ayna Hücresi Odacığı */}
                <mesh position={[0, 0.015, -0.028]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.012, 0.014, 0.006, 24]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
                {/* Altın / Rodyum Kaplama Aynalı Disk (Chilled Mirror) */}
                <mesh position={[0, 0.015, -0.031]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.002, 24]} />
                  <meshPhysicalMaterial
                    color="#facc15"
                    metalness={0.95}
                    roughness={0.02}
                    reflectivity={1.0}
                    clearcoat={1.0}
                  />
                </mesh>
                {/* Yan Peltier Mikro Isı Dağıtıcı Kanatçıkları */}
                <mesh position={[0.023, 0.015, 0]}>
                  <boxGeometry args={[0.006, 0.024, 0.045]} />
                  <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
                </mesh>
                <mesh position={[-0.023, 0.015, 0]}>
                  <boxGeometry args={[0.006, 0.024, 0.045]} />
                  <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
                </mesh>
                {/* Optik LED Çiğ Durum Işığı */}
                <mesh position={[0, 0.031, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.003, 12]} />
                  <meshBasicMaterial color="#f59e0b" />
                </mesh>
              </group>
            )}

            {/* ---------- SENSÖR 4: KRİYOJENİK DONMA NOKTASI (FP) PROBU ---------- */}
            {s.type === 'FROST_POINT_FP' && (
              <group>
                {/* Gümüş Eloksallı Radyal Kanatçık Bloğu */}
                <mesh position={[0, 0.018, 0]}>
                  <cylinderGeometry args={[0.018, 0.020, 0.038, 24]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.92} roughness={0.15} />
                </mesh>
                {/* Soğutma Isı Çemberleri */}
                {[-0.01, 0.0, 0.01].map((fy, fIdx) => (
                  <mesh key={fIdx} position={[0, 0.018 + fy, 0]}>
                    <cylinderGeometry args={[0.023, 0.023, 0.003, 24]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
                  </mesh>
                ))}
                {/* Buz Kristali Optik Prizma Penceresi */}
                <mesh position={[0, 0.018, -0.02]}>
                  <boxGeometry args={[0.012, 0.016, 0.008]} />
                  <meshPhysicalMaterial
                    color="#c084fc"
                    transmission={0.8}
                    roughness={0.05}
                    ior={1.31} // Buz kırma indisi
                  />
                </mesh>
                {/* Mor Kriyojenik Durum Göstergesi */}
                <mesh position={[0, 0.038, 0]}>
                  <cylinderGeometry args={[0.0035, 0.0035, 0.003, 12]} />
                  <meshBasicMaterial color="#a855f7" />
                </mesh>
              </group>
            )}

            {/* ---------- SENSÖR 5: DİJİTAL MİNİ VERİ KAYDEDİCİ (DATA LOGGER) ---------- */}
            {s.type === 'DATA_LOGGER' && (
              <group position={[0, 0.02, 0]} rotation={[-0.15, 0, 0]}>
                {/* Şeffaf Pencereli Kompakt ABS Kasa */}
                <mesh>
                  <boxGeometry args={[0.048, 0.065, 0.024]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
                {/* LCD Dijital Ekran Çerçevesi */}
                <mesh position={[0, 0.008, 0.013]}>
                  <planeGeometry args={[0.038, 0.032]} />
                  <meshBasicMaterial color="#020617" />
                </mesh>
                {/* Ekran Değerleri (T ve RH) */}
                <Text
                  position={[0, 0.016, 0.014]}
                  fontSize={0.0065}
                  color="#10b981"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`${currentT.toFixed(1)}°C`}
                </Text>
                <Text
                  position={[0, 0.006, 0.014]}
                  fontSize={0.0065}
                  color="#38bdf8"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`${currentRH.toFixed(1)}%`}
                </Text>
                <Text
                  position={[0, -0.003, 0.014]}
                  fontSize={0.004}
                  color="#fbbf24"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`DP:${currentDP}°C`}
                </Text>

                {/* Alt Havalandırma Nem Sensörü Izgarası */}
                <mesh position={[0, -0.022, 0.012]}>
                  <boxGeometry args={[0.034, 0.008, 0.004]} />
                  <meshStandardMaterial color="#334155" />
                </mesh>
                {/* Kayıt LED'i (Yeşil Flaş) */}
                <mesh position={[-0.016, 0.025, 0.013]}>
                  <circleGeometry args={[0.002, 12]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              </group>
            )}

            {/* ---------- KÜÇÜK DURUM ETİKETİ (PROB KODU & KONUM) ---------- */}
            <Text
              position={[0, 0.055, 0]}
              fontSize={0.009}
              color={s.badgeColor}
              anchorX="center"
              anchorY="middle"
            >
              {s.shortCode}
            </Text>
            <Text
              position={[0, 0.044, 0]}
              fontSize={0.0065}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {s.inCabinet ? `[Kabin ${s.shelf === 'upper' ? 'Üst' : 'Alt'} Raf]` : '[Masada]'}
            </Text>

            {/* ================================================================ */}
            {/* 3. İNTERAKTİF SEÇİM VE KONTROL KARTI (HOLOGRAFİK OSD)           */}
            {/* ================================================================ */}
            {isSelected && (
              <group position={[0, 0.18, 0]}>
                {/* Arka Plan Paneli */}
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[0.34, 0.23]} />
                  <meshBasicMaterial color="#090d16" transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0, -0.001]}>
                  <planeGeometry args={[0.346, 0.236]} />
                  <meshBasicMaterial color={s.badgeColor} transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>

                {/* Başlık ve Cihaz Adı */}
                <Text
                  position={[0, 0.092, 0.005]}
                  fontSize={0.012}
                  color={s.badgeColor}
                  anchorX="center"
                  anchorY="middle"
                >
                  {s.name}
                </Text>

                {/* Canlı Ölçüm Değerleri */}
                <Text
                  position={[-0.15, 0.065, 0.005]}
                  fontSize={0.009}
                  color="#f8fafc"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`• Sıcaklık (T): ${currentT.toFixed(2)} °C`}
                </Text>
                <Text
                  position={[-0.15, 0.045, 0.005]}
                  fontSize={0.009}
                  color="#38bdf8"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`• Bağıl Nem (RH): ${currentRH.toFixed(1)} %RH`}
                </Text>
                <Text
                  position={[-0.15, 0.025, 0.005]}
                  fontSize={0.009}
                  color="#f59e0b"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`• Çiğ Noktası (DP): ${currentDP} °C`}
                </Text>
                <Text
                  position={[-0.15, 0.005, 0.005]}
                  fontSize={0.009}
                  color="#c084fc"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`• Donma Noktası (FP): ${currentFP} °C`}
                </Text>
                <Text
                  position={[-0.15, -0.015, 0.005]}
                  fontSize={0.0075}
                  color="#94a3b8"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`Aralık: ${s.specRange} | Belirsizlik: ${s.accuracy}`}
                </Text>

                {/* BUTON 1: [📥 KABİNE YERLEŞTİR] / [📤 MASAYA GERİ AL] */}
                <group
                  position={[-0.075, -0.055, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCabinet(s.id)
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.14, 0.030, 0.006]} />
                    <meshStandardMaterial
                      color={s.inCabinet ? '#ef4444' : '#22c55e'}
                      roughness={0.4}
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.005]}
                    fontSize={0.0085}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {s.inCabinet ? '📤 Masaya Al' : '📥 Kabine Yerleştir'}
                  </Text>
                </group>

                {/* BUTON 2: [RAF DEĞİŞTİR: ALT / ÜST] (Eğer kabindeyse aktif) */}
                <group
                  position={[0.075, -0.055, 0.005]}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (s.inCabinet) {
                      toggleShelf(s.id)
                    } else {
                      toggleCabinet(s.id)
                    }
                  }}
                >
                  <mesh>
                    <boxGeometry args={[0.14, 0.030, 0.006]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.4} />
                  </mesh>
                  <Text
                    position={[0, 0, 0.005]}
                    fontSize={0.0085}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {s.inCabinet
                      ? `Raf: ${s.shelf === 'lower' ? 'Alt ➔ Üst' : 'Üst ➔ Alt'}`
                      : 'Kabine Taşı'}
                  </Text>
                </group>

                {/* Kapatma İpucu */}
                <Text
                  position={[0, -0.092, 0.005]}
                  fontSize={0.007}
                  color="#64748b"
                  anchorX="center"
                  anchorY="middle"
                >
                  (Kapatmak için proba tekrar tıklayın)
                </Text>
              </group>
            )}
          </group>
        )
      })}

      {/* ==================================================================== */}
      {/* 4. KABİNE BAĞLANAN ESNEK SENSÖR KABLOLARI (PORT HOLE TRAIL)          */}
      {/* ==================================================================== */}
      {cableGeometries.map((geom, cIdx) => {
        if (!geom) return null
        return (
          <mesh key={`cable-${cIdx}`} geometry={geom}>
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}
