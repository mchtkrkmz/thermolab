import { useState, Suspense, Component, type ReactNode } from 'react'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { getAssetUrl } from '../utils/assets'

interface SlideData {
  title: string
  subtitle: string
  imagePath: string
  imageCaption: string
  badge: string
  badgeColor: string
  heading: string
  formulaTitle: string
  formula: string
  formulaExplanation: string
  bullets: { label: string; text: string; highlight?: boolean }[]
  takeaway: string
}

const SLIDES: SlideData[] = [
  {
    title: '1. PLANCK IŞINIM KURAMI & SPEKTRAL IŞINIKLIK',
    subtitle: 'Kuantum Fiziğinin Doğuşu ve Termal Radyasyonun Temel İlkeleri',
    imagePath: '/slides/planck_curves.jpg',
    imageCaption: 'Spektral Işınım Dağılımı L_λ(T) vs Dalgaboyu (Planck Eğrileri, Wien Kayması & Klasik Çıkmaz)',
    badge: 'TEMEL KURAM (1900)',
    badgeColor: '#00f0ff',
    heading: 'Planck Spektral Işınım Formülasyonu',
    formulaTitle: 'Planck Işınım Bağıntısı [W / (m² · sr · µm)]',
    formula: 'L_λ(λ, T) = (2·h·c²) / [ λ⁵ · (e^(h·c / (λ·k_B·T)) - 1) ]',
    formulaExplanation: 'h: 6.626×10⁻³⁴ J·s (Planck) | c: 3×10⁸ m/s | k_B: 1.381×10⁻²³ J/K (Boltzmann)',
    bullets: [
      {
        label: 'Termal Radyasyonun Tanımı (TÜBİTAK UME Temeli):',
        text: 'Radyasyon sıcaklığı, bir nesnenin yüzeyinden yayılan termal radyasyonun Planck kuramına göre temassız ölçülmesiyle elde edilen fiziksel büyüklüktür.',
        highlight: true,
      },
      {
        label: 'Klasik Fizik & Morötesi Felaketin Çözümü:',
        text: 'Klasik Rayleigh-Jeans yasası kısa dalgaboylarında sonsuz ışıma öngörüyordu. Max Planck, enerjinin sürekli değil "h·ν" kuantları halinde yayıldığını ortaya koyarak kuantum fiziğini başlattı.',
      },
      {
        label: 'Wien Kayma Kanunu (λ_peak · T = 2897.8 µm·K):',
        text: 'Sıcaklık arttıkça spektrum tepe noktası daha kısa dalgaboylarına kayar. Güneş (~5800 K) 0.5 µm görünür ışıkta, oda sıcaklığı (~300 K) 10 µm LWIR bölgesinde tepe yapar.',
      },
      {
        label: 'Stefan-Boltzmann Toplam Güç Yasası (M = σ·T⁴):',
        text: 'Siyah cismin yaydığı toplam güç Kelvin sıcaklığının 4. kuvvetiyle orantılıdır (σ ≈ 5.670×10⁻⁸ W/m²K⁴). Sıcaklık arttıkça yayılan enerji muazzam bir hızla büyür.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Planck kuramı temassız sıcaklık ölçümünün kalbidir. Yüzeyden yayılan ışımanın spektral dağılımı ölçülerek nesnenin mutlak sıcaklığı hesaplanır.',
  },
  {
    title: '2. TÜBİTAK UME ULUSAL RADYASYON SICAKLIĞI ÖLÇEĞİ',
    subtitle: 'Birincil Seviye Metroloji: -80 °C ile 3500 °C Arasında SI İzlenebilirliği',
    imagePath: '/slides/tubitak_ume_radiation_scale.jpg',
    imageCaption: 'TÜBİTAK UME Birincil Seviye Siyah Cisim Kalibrasyon Düzeneği ve Yüksek Sıcaklık Sabit Noktaları',
    badge: 'TÜBİTAK UME BİRİNCİL ÖLÇEK',
    badgeColor: '#f59e0b',
    heading: 'Ulusal Radyasyon Sıcaklığı Ölçeği Realizasyonu',
    formulaTitle: 'Gümüş Donma Noktası (961.78 °C) Üzerinde Birincil Tanım',
    formula: 'T_90(Ag) = 961.78 °C   |   Ölçüm Aralığı: -80 °C ile 3500 °C',
    formulaExplanation: 'ITS-90 & MeP-K tanımlı saf metal ve metal-karbon ötetik faz dönüşüm hücreleri',
    bullets: [
      {
        label: 'Birincil Seviye Ulusal Ölçek Misyonu:',
        text: 'TÜBİTAK UME Radyasyon Sıcaklığı Laboratuvarı, Ulusal Radyasyon Sıcaklığı Ölçeği’ni birincil seviyede kurmakta, korumakta ve gümüş donma noktası (961.78 °C) üzerindeki sıcaklıklarda SI izlenebilirliği sağlamaktadır.',
        highlight: true,
      },
      {
        label: 'ITS-90 Sabit Nokta Siyah Cisim Hücreleri:',
        text: '• Saf Metal Hücreleri: İndiyum (156.6 °C), Kalay (231.9 °C), Çinko (419.5 °C), Alüminyum (660.3 °C), Gümüş (961.78 °C), Altın (1064.18 °C), Bakır (1084.62 °C).',
      },
      {
        label: 'Metal-Karbon Ötetik Hücreleri (MeP-K Tanımlı, 3000 °C):',
        text: 'Yüksek sıcaklıklar için laboratuvarda doldurulan Fe-C, Pd-C, Pt-C, Co-C, Ru-C, Re-C, TiC-C ve WC-C ötetik hücreleri ile 3000 °C\'ye kadar birincil kalibrasyon imkanı sunulur.',
        highlight: true,
      },
      {
        label: 'Uluslararası Projeler & Teknik Komiteler:',
        text: 'MultiFixRad (2023-2026: Çoklu Sabit Noktalı Radyasyon Termometrisi), Real-K (2019-2023: Yeniden Tanımlanan Kelvin), InK / InK-2; BIPM CCT, EURAMET, COOMET ve SMIIC üyelikleri.',
      },
    ],
    takeaway: 'Özet: TÜBİTAK UME, -80 °C\'den 3500 °C\'ye kadar sabit nokta hücreleri ve referans siyah cisimlerle Türkiye\'nin ulusal izlenebilirlik zincirini güvenceye alır.',
  },
  {
    title: '3. PİROMETRE & TERMAL KAMERA KALİBRASYON DÜZENEKLERİ',
    subtitle: 'Ters Planck Çözümlemesi, Optik Parametreler ve Metroloji Altyapısı',
    imagePath: '/slides/pyrometer_guide.jpg',
    imageCaption: 'Optik Pirometre Ölçüm Geometrisi: Objektif Lens, Spektral Filtre, Dedektör ve Siyah Cisim Kavitesi',
    badge: 'KALİBRASYON & ENSTRÜMANTASYON',
    badgeColor: '#10b981',
    heading: 'Optik Ölçüm Parametreleri ve Ters Planck Bağıntısı',
    formulaTitle: 'Ters Planck Denklemi ile Sıcaklık Çözümlemesi',
    formula: 'T = c₂ / [ λ · ln( 1 + (ε_eff · c₁) / (λ⁵ · L_ölçülen) ) ]',
    formulaExplanation: 'c₁ = 3.7418×10⁻¹⁶ W·m²  |  c₂ = 1.4388×10⁻² m·K  |  ε_eff ≥ 0.998 (Kavite Emissivitesi)',
    bullets: [
      {
        label: 'Gelişmiş Laboratuvar Test Düzenekleri:',
        text: '• Tayfsal Tepki Ölçüm Düzeneği: 300 nm – 1100 nm aralığı\n• Doğrusallık (Linearity) Düzeneği: Görünür ve yakın kızılötesi dalgaboyları\n• Kararlı Lambalar Kalibrasyon Düzeneği: 700 °C – 2200 °C aralığı.',
        highlight: true,
      },
      {
        label: 'Kaynak Büyüklüğü Etkisi (SSE - Size-of-Source Effect):',
        text: 'Lens içi yansımalar ve optik saçılma nedeniyle dedektöre hedefin dışından giren kaçak ışık karakterize edilerek SSE ölçüm düzeneğiyle düzeltilir.',
      },
      {
        label: 'Dedektör Dalgaboyu Bantları ve Cihaz Tasarımları:',
        text: 'TÜBİTAK UME cihaz yapımı kabiliyeti:\n• 150 °C – 1000 °C ve 650 °C – 1600 °C radyasyon termometreleri\n• 1000 °C – 2500 °C dar bantlı radyasyon termometreleri (0.9 µm Si / 1.6 µm InGaAs).',
      },
      {
        label: 'Laboratuvarda Ölçüm Alma:',
        text: 'Masanın üzerindeki 4 pirometreden birini elinize alıp siyah cisim fırınına yöneltin ve tetiğe basın! Pirometre foton akısını okuyarak bu formülle sıcaklığı hesaplar.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Doğru radyasyon sıcaklığı ölçümü; odaklama geometrisi, SSE düzeltmesi, tayfsal doğrusallık ve yüksek kavite emissivitesinin (ε ≥ 0.998) bileşimidir.',
  },
  {
    title: '4. ENDÜSTRİYEL, SAVUNMA VE TIBBİ METROLOJİ UYGULAMALARI',
    subtitle: 'Ağır Sanayiden Sağlık Sektörüne ve İklim Değişikliği İzlemesine Uzanan Alanlar',
    imagePath: '/slides/scientists.jpg',
    imageCaption: 'TÜBİTAK UME Radyasyon Sıcaklığı Uygulama Alanları: Sanayi Fırınları, Savunma Kızılötesi Sistemleri ve Tıbbi Metroloji',
    badge: 'UYGULAMA ALANLARI & TOPLUM',
    badgeColor: '#8b5cf6',
    heading: 'Temassız Sıcaklık Ölçümünün Hayati Rolü',
    formulaTitle: 'Metrolojik Çevre Şartları & Güvenilirlik Standartları',
    formula: 'T_ortam = (21.0 ± 3.0) °C   |   Bağıl Nem = (45 ± 15) % rh',
    formulaExplanation: 'İzlenebilir kalibrasyon sertifikaları TÜBİTAK UME laboratuvar şartlarında verilir.',
    bullets: [
      {
        label: 'Ağır Sanayi & Üretim Optimizasyonu:',
        text: 'Eriyik metaller, cam üretimi, çimento fırınları, petrokimya ve kağıt sanayisi gibi temaslı sensörlerin eridiği veya ulaşılamadığı tehlikeli ortamlarda güvenli süreç kontrolü sağlar.',
        highlight: true,
      },
      {
        label: 'Tıbbi Metroloji & Salgın Hastalık Tespiti:',
        text: 'COVID-19 sürecinde önemi katlanan temassız alın/deri termometreleri ve termal kameraların (in-vivo) vücut ateşi ölçümlerinde güvenilirlik TÜBİTAK UME kalibrasyonlarıyla temin edilir.',
        highlight: true,
      },
      {
        label: 'Savunma Sanayii & Kızılötesi Hedef Tespiti:',
        text: 'Uzak ve hareketli nesnelerin termal ışıma imzalarının (IR signature) tespit edilmesi, güdüm sistemleri ve termal görüş cihazlarının kalibrasyonunda kritik öneme sahiptir.',
      },
      {
        label: 'Çevre, İklim Değişikliği & Uydu Metrolojisi:',
        text: 'Toprak, göl ve deniz yüzey sıcaklıklarının (SST) uydu tabanlı radyometrelerle uzaktan izlenmesinde referans radyasyon sıcaklığı standartları kullanılır.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Çelik ergitme fırınlarından pandemi ateş taramasına ve iklim uydularına kadar temassız sıcaklık ölçümü modern dünyanın vazgeçilmezidir.',
  },
]

class TextureErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.05}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          Görsel Hazırlanıyor...
        </Text>
      )
    }
    return this.props.children
  }
}

function SlideImageMesh({ imagePath }: { imagePath: string }) {
  const finalUrl = getAssetUrl(imagePath)
  const texture = useTexture(finalUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[2.34, 1.48]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

interface RadiationPhysicsBoardProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export default function RadiationPhysicsBoard({
  position = [0, 2.45, -4.82],
  rotation = [0, 0, 0],
}: RadiationPhysicsBoardProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const activeSlide = SLIDES[currentSlideIndex]

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : SLIDES.length - 1))
  }

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < SLIDES.length - 1 ? prev + 1 : 0))
  }

  return (
    <group position={position} rotation={rotation}>
      {/* ========================================================
          1. MAIN CHASSIS & BACKPLATE (Modern Lab Metrology Finish)
         ======================================================== */}
      {/* Outer Dark Charcoal Bezel */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[5.20, 2.50, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Subtle Neon Outer Frame Border */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[5.14, 2.44]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Inner Screen Canvas */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[5.08, 2.38]} />
        <meshBasicMaterial color="#090d16" />
      </mesh>

      {/* ========================================================
          2. HEADER SECTION (Title, Metrology Badge, Breadcrumbs)
         ======================================================== */}
      {/* Top Banner Background */}
      <mesh position={[0, 1.02, 0.006]}>
        <planeGeometry args={[5.04, 0.26]} />
        <meshBasicMaterial color="#111827" />
      </mesh>

      {/* TÜBİTAK / PTB Metrology Badge */}
      <mesh position={[-1.95, 1.06, 0.008]}>
        <planeGeometry args={[1.0, 0.07]} />
        <meshBasicMaterial color="#1e3a8a" />
      </mesh>
      <Text
        position={[-1.95, 1.06, 0.01]}
        fontSize={0.032}
        color="#93c5fd"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        METROLOJİ & EĞİTİM MODÜLÜ
      </Text>

      {/* Main Title */}
      <Text
        position={[0, 1.06, 0.01]}
        fontSize={0.065}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        RADYASYON VE SICAKLIK METROLOJİSİ EĞİTİM PANOSU
      </Text>

      {/* Slide Badge on Top Right */}
      <mesh position={[2.0, 1.06, 0.008]}>
        <planeGeometry args={[0.85, 0.07]} />
        <meshBasicMaterial color={activeSlide.badgeColor} />
      </mesh>
      <Text
        position={[2.0, 1.06, 0.01]}
        fontSize={0.032}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        {activeSlide.badge}
      </Text>

      {/* Subtitle / Topic Breadcrumb */}
      <Text
        position={[0, 0.93, 0.01]}
        fontSize={0.042}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        {activeSlide.title}
      </Text>

      {/* Decorative Horizontal Divider Line */}
      <mesh position={[0, 0.85, 0.008]}>
        <planeGeometry args={[5.0, 0.006]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* ========================================================
          3. INTERACTIVE SLIDE TABS BAR (TOP NAVIGATION)
         ======================================================== */}
      {SLIDES.map((_slide, idx) => {
        const isSelected = idx === currentSlideIndex
        const tabWidth = 1.18
        const posX = (idx - 1.5) * 1.25
        const posY = 0.76

        const tabTitles = [
          '1. Planck Kuramı',
          '2. UME Birincil Ölçeği',
          '3. Pirometre Kalibrasyonu',
          '4. Endüstri & Tıp'
        ]

        return (
          <group
            key={`tab-${idx}`}
            position={[posX, posY, 0.01]}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSlideIndex(idx)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredButton(`tab-${idx}`)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHoveredButton(null)
            }}
          >
            {/* Tab Background */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[tabWidth, 0.11]} />
              <meshBasicMaterial
                color={
                  isSelected
                    ? '#0284c7'
                    : hoveredButton === `tab-${idx}`
                    ? '#334155'
                    : '#1e293b'
                }
              />
            </mesh>
            {/* Active Indicator Underline */}
            {isSelected && (
              <mesh position={[0, -0.052, 0.002]}>
                <planeGeometry args={[tabWidth, 0.008]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            )}
            <Text
              position={[0, 0.005, 0.004]}
              fontSize={0.034}
              color={isSelected ? '#ffffff' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {tabTitles[idx] || `Slayt ${idx + 1}`}
            </Text>
          </group>
        )
      })}

      {/* ========================================================
          4. LEFT SECTION: SLIDE PROJECTION SCREEN (HIGH-RES IMAGE)
         ======================================================== */}
      <group position={[-1.25, -0.10, 0.01]}>
        {/* Screen Bezel Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.42, 1.56, 0.02]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Screen Surface with Border */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[2.36, 1.50]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* Texture Projection */}
        <Suspense
          fallback={
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.05}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              Görsel Yükleniyor...
            </Text>
          }
        >
          <TextureErrorBoundary>
            <SlideImageMesh imagePath={activeSlide.imagePath} />
          </TextureErrorBoundary>
        </Suspense>

        {/* Image Caption Bar */}
        <mesh position={[0, -0.70, 0.02]}>
          <planeGeometry args={[2.34, 0.08]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.88} />
        </mesh>
        <Text
          position={[0, -0.70, 0.025]}
          fontSize={0.030}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.28}
          font="/fonts/arial.ttf"
        >
          {activeSlide.imageCaption}
        </Text>
      </group>

      {/* ========================================================
          5. RIGHT SECTION: SCIENTIFIC THEORY & METROLOGY FORMULAS
         ======================================================== */}
      <group position={[1.25, -0.10, 0.01]}>
        {/* Background Card */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[2.38, 1.56]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Subtitle / Heading */}
        <Text
          position={[-1.12, 0.71, 0.005]}
          fontSize={0.046}
          color="#f8fafc"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {activeSlide.heading}
        </Text>

        {/* Formula Container Box */}
        <mesh position={[0, 0.54, 0.005]}>
          <planeGeometry args={[2.28, 0.19]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        <mesh position={[0, 0.54, 0.004]}>
          <planeGeometry args={[2.30, 0.21]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>

        <Text
          position={[-1.10, 0.60, 0.008]}
          fontSize={0.028}
          color="#93c5fd"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {activeSlide.formulaTitle}
        </Text>

        <Text
          position={[0, 0.53, 0.008]}
          fontSize={0.040}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {activeSlide.formula}
        </Text>

        <Text
          position={[0, 0.465, 0.008]}
          fontSize={0.024}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          {activeSlide.formulaExplanation}
        </Text>

        {/* Bullet Points Container */}
        <group position={[-1.12, 0.36, 0.005]}>
          {activeSlide.bullets.map((b, i) => {
            // Dynamic vertical position for bullet items
            const itemY = -i * 0.165
            return (
              <group key={`bullet-${i}`} position={[0, itemY, 0]}>
                {/* Bullet Icon / Diamond */}
                <mesh position={[0.02, 0, 0]}>
                  <planeGeometry args={[0.022, 0.022]} />
                  <meshBasicMaterial color={b.highlight ? '#38bdf8' : '#e2e8f0'} />
                </mesh>

                {/* Bullet Bold Title */}
                <Text
                  position={[0.06, 0.025, 0]}
                  fontSize={0.031}
                  color={b.highlight ? '#38bdf8' : '#f1f5f9'}
                  anchorX="left"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  {b.label}
                </Text>

                {/* Bullet Text */}
                <Text
                  position={[0.06, -0.045, 0]}
                  fontSize={0.027}
                  color="#94a3b8"
                  anchorX="left"
                  anchorY="top"
                  maxWidth={2.15}
                  lineHeight={1.18}
                  font="/fonts/arial.ttf"
                >
                  {b.text}
                </Text>
              </group>
            )
          })}
        </group>

        {/* Bottom Key Takeaway Callout Box */}
        <mesh position={[0, -0.68, 0.005]}>
          <planeGeometry args={[2.28, 0.12]} />
          <meshBasicMaterial color="#1e1b4b" />
        </mesh>
        <mesh position={[-1.13, -0.68, 0.007]}>
          <planeGeometry args={[0.02, 0.12]} />
          <meshBasicMaterial color="#818cf8" />
        </mesh>
        <Text
          position={[-1.09, -0.68, 0.008]}
          fontSize={0.028}
          color="#c7d2fe"
          anchorX="left"
          anchorY="middle"
          maxWidth={2.18}
          lineHeight={1.15}
          font="/fonts/arial.ttf"
        >
          {activeSlide.takeaway}
        </Text>
      </group>

      {/* ========================================================
          6. BOTTOM CONTROLS & SLIDE STEPPER (PREV / NEXT / DOTS)
         ======================================================== */}
      <group position={[0, -1.02, 0.01]}>
        {/* Navigation Bar Background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[5.04, 0.16]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* PREVIOUS SLIDE BUTTON */}
        <group
          position={[-1.6, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoveredButton('prev')
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHoveredButton(null)
          }}
        >
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.7, 0.09]} />
            <meshBasicMaterial
              color={hoveredButton === 'prev' ? '#2563eb' : '#1e293b'}
            />
          </mesh>
          <Text
            position={[0, 0, 0.005]}
            fontSize={0.038}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            ◀ ÖNCEKİ SLAYT
          </Text>
        </group>

        {/* SLIDE NUMBER BUTTONS & INDICATOR */}
        <group position={[0, 0, 0.01]}>
          {SLIDES.map((_, i) => {
            const isCurrent = i === currentSlideIndex
            const posX = (i - (SLIDES.length - 1) / 2) * 0.35
            return (
              <group
                key={`dot-${i}`}
                position={[posX, 0, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlideIndex(i)
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoveredButton(`dot-${i}`)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoveredButton(null)
                }}
              >
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[0.26, 0.08]} />
                  <meshBasicMaterial
                    color={
                      isCurrent
                        ? '#0284c7'
                        : hoveredButton === `dot-${i}`
                        ? '#475569'
                        : '#1e293b'
                    }
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.005]}
                  fontSize={0.036}
                  color={isCurrent ? '#ffffff' : '#94a3b8'}
                  anchorX="center"
                  anchorY="middle"
                  font="/fonts/arial.ttf"
                >
                  {`Slayt ${i + 1}`}
                </Text>
              </group>
            )
          })}
        </group>

        {/* NEXT SLIDE BUTTON */}
        <group
          position={[1.6, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoveredButton('next')
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHoveredButton(null)
          }}
        >
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.7, 0.09]} />
            <meshBasicMaterial
              color={hoveredButton === 'next' ? '#2563eb' : '#1e293b'}
            />
          </mesh>
          <Text
            position={[0, 0, 0.005]}
            fontSize={0.038}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            SONRAKİ SLAYT ▶
          </Text>
        </group>
      </group>
    </group>
  )
}
