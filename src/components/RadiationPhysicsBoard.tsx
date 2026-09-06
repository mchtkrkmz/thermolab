import { useState, Suspense } from 'react'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

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
    title: '1. PLANCK IŞINIM KANUNU & SPEKTRAL IŞINIKLIK',
    subtitle: 'Kuantum Fiziğinin Doğuşu ve Siyah Cisim Radyasyon Spektrumu',
    imagePath: '/slides/planck_curves.jpg',
    imageCaption: 'Spektral Işınım Dağılımı L_λ(T) vs Dalgaboyu (Planck Eğrileri, Wien Kayması & Klasik Çıkmaz)',
    badge: 'TEMEL KURAM (1900)',
    badgeColor: '#00f0ff',
    heading: 'Planck Spektral Işınım Formülasyonu',
    formulaTitle: 'Planck Işınım Bağıntısı [W / (m² · sr · µm)]',
    formula: 'L_λ(λ, T) = (2·h·c²) / [ λ⁵ · (e^(h·c / (λ·k_B·T)) - 1) ]',
    formulaExplanation: 'h: 6.626×10⁻³⁴ J·s (Planck sabiti) | c: 3×10⁸ m/s | k_B: 1.381×10⁻²³ J/K (Boltzmann)',
    bullets: [
      {
        label: 'Klasik Fizik & Morötesi Felaket:',
        text: 'Klasik Rayleigh-Jeans formülü kısa dalgaboylarında sonsuz enerji ışıması öngörüyordu. Max Planck, enerjinin sürekli değil "h·ν" kuantları halinde yayıldığını varsayarak bu krizi çözdü.',
        highlight: true,
      },
      {
        label: 'Wien Kayma Kanunu (λ_peak · T = 2897.8 µm·K):',
        text: 'Sıcaklık arttıkça spektrumun tepe noktası daha kısa dalgaboylarına (mavi/morötesine) kayar. Güneş (~5800 K) 0.5 µm yeşil ışıkta, oda sıcaklığı (~300 K) 10 µm LWIR bölgesinde tepe yapar.',
      },
      {
        label: 'Stefan-Boltzmann Toplam Güç Yasası (M = σ·T⁴):',
        text: 'Bir siyah cismin tüm dalgaboylarında yaydığı toplam güç, mutlak Kelvin sıcaklığının 4. kuvvetiyle katlanarak artar (σ ≈ 5.670×10⁻⁸ W/m²K⁴).',
      },
      {
        label: 'Laboratuvardaki Uygulaması:',
        text: 'Masadaki 4 pirometre, tam bu eğrilerdeki farklı dalgaboylarına (0.9 µm, 1.6 µm, 3.9 µm ve 10.0 µm) göre dedektör filtreleri kullanılarak imal edilmiştir.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Planck kanunu olmadan radyasyon sıcaklığı ölçülemez. Sıcaklık ve dalgaboyu bilindiğinde cismin yayacağı ışıma mutlak kesinlikle hesaplanır.',
  },
  {
    title: '2. TERMAL RADYASYON FİZİĞİNİN ÖNCÜ BİLİM İNSANLARI',
    subtitle: 'Termodinamik ve Kuantum Optiğinin Temelini Atan Bilim İnsanları',
    imagePath: '/slides/scientists.jpg',
    imageCaption: '19. Yüzyıl Berlin ve Viyana Fizik Enstitüleri Öncüleri: Planck, Boltzmann, Stefan, Wien, Kirchhoff',
    badge: 'BİLİM TARİHİ & NOBEL',
    badgeColor: '#f59e0b',
    heading: 'Termal Işınım Teorisini İnşa Eden Fizikçiler',
    formulaTitle: 'Öncülerin Ortak Mirası: Termal Denge & Işıma Yasaları',
    formula: 'ε_λ = α_λ (Kirchhoff)  |  E = σ·T⁴ (Stefan-Boltzmann)  |  λ_max·T = b (Wien)',
    formulaExplanation: 'Bu 5 bilim insanının ardışık çalışmaları modern metroloji ve ITS-90 sıcaklık ölçeğini kurmuştur.',
    bullets: [
      {
        label: 'Gustav Kirchhoff (1824 - 1887):',
        text: '1860 yılında "Siyah Cisim" (Blackbody) kavramını ilk kez tanımladı. Termal dengedeki bir cismin yayma gücünün (ε) soğurma gücüne (α) eşit olduğunu ispatladı (Kirchhoff Kanunu).',
      },
      {
        label: 'Josef Stefan (1835 - 1893):',
        text: '1879\'da John Tyndall\'ın platin tel ışıma deneylerini matematiksel olarak analiz etti ve toplam ışımanın mutlak sıcaklığın dördüncü kuvveti (T⁴) ile orantılı olduğunu deneysel buldu.',
      },
      {
        label: 'Ludwig Boltzmann (1844 - 1906):',
        text: '1884\'te Stefan\'ın deneysel bulgusunu, termodinamik Carnot çevrimleri ve Maxwell elektromanyetik ışık basıncı teorisiyle kuramsal olarak ispatladı (Stefan-Boltzmann Kanunu).',
        highlight: true,
      },
      {
        label: 'Wilhelm Wien (1864 - 1928):',
        text: '1893\'te adiyabatik genleşme analiziyle tepe dalgaboyu kaymasını (Wien Kanunu) formüle etti. 1911 Nobel Fizik Ödülü\'ne layık görüldü.',
      },
      {
        label: 'Max Planck (1858 - 1947):',
        text: '14 Aralık 1900\'de Alman Fizik Derneği\'ne sunduğu bildiriyle ışınım yasasını tam olarak formüle etti. Enerji kuantumu (E = h·ν) devrimiyle 1918 Nobel Fizik Ödülü\'nü aldı.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Kirchhoff siyah cismi tanımladı, Stefan ve Boltzmann toplam gücü çözdü, Wien tepe kaymasını buldu, Planck ise kuantum ile spektrumun tamamını aydınlattı.',
  },
  {
    title: '3. PİROMETRE İLE RADYASYON SICAKLIĞI NASIL ÖLÇÜLÜR?',
    subtitle: 'Siyah Cisim Kalibrasyonu, Hedefleme Geometrisi ve Emissivite İlkeleri',
    imagePath: '/slides/pyrometer_guide.jpg',
    imageCaption: 'Radyasyon Pirometresi Optik Kesiti: Objektif Lens, Spektral Filtre, Dedektör ve Siyah Cisim Kavitesi',
    badge: 'METROLOJİ & ÖLÇÜM',
    badgeColor: '#10b981',
    heading: 'Adım Adım Optik Pirometre Ölçüm Metodolojisi',
    formulaTitle: 'Ters Planck Formülü ile Sıcaklık Çözümlemesi',
    formula: 'T = c₂ / [ λ · ln( 1 + (ε_λ · c₁) / (λ⁵ · L_ölçülen) ) ]',
    formulaExplanation: 'c₁ = 2πhc² ≈ 3.7418×10⁻¹⁶ W·m²  |  c₂ = hc/k_B ≈ 1.4388×10⁻² m·K  |  ε_λ: Spektral yayma gücü',
    bullets: [
      {
        label: '1. Siyah Cisim Kavitesine Hedefleme (D:S Oranı):',
        text: 'Pirometre hedef lazeri siyah cisim silindirik/konik oyuğunun tabanına tam ortalanmalıdır. Görüş alanı (FOV) fırın açıklığından daima küçük olmalı, soğuk kenarları görmemelidir.',
        highlight: true,
      },
      {
        label: '2. Siyah Cisim Neden Kullanılır? (ε ≈ 1.000):',
        text: 'Kavite içindeki çoklu yansımalar sayesinde efektif yayma oranı ε ≥ 0.998 olur. Bu sayede cismin yüzey pürüzlülüğü ve ortam yansımaları kaynaklı hatalar sıfıra iner.',
      },
      {
        label: '3. Uygun Dalgaboyu Bandı Seçimi:',
        text: '• 0.90 µm (Si): 550°C - 3000°C yüksek sıcaklık (emissivite hatasına en az duyarlı)\n• 1.60 µm (InGaAs): 200°C - 1400°C orta-yüksek aralık\n• 3.90 µm (PbS): 80°C - 1000°C alev/fırın gaz bandı\n• 10.0 µm (Termopil): -50°C - 500°C ortam ve düşük sıcaklık yüzeyleri',
      },
      {
        label: '4. VR Laboratuvarında Deneyimleyin:',
        text: 'Masanın üzerindeki 4 pirometreden birini elinize alın, siyah cisim fırınının ağzına nişan alıp tetiği çekin! Pirometre foton akısını okuyarak Planck denklemiyle sıcaklığı hesaplayacaktır.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Temassız sıcaklık ölçümünde doğru dalgaboyu seçimi, hedef-mesafe oranı (D:S) ve emissivite kalibrasyonu en kritik 3 metroloji kuralıdır.',
  },
]

function SlideImageMesh({ imagePath }: { imagePath: string }) {
  const texture = useTexture(imagePath)
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
        const tabWidth = 1.55
        const posX = (idx - 1) * 1.62
        const posY = 0.76

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
              fontSize={0.038}
              color={isSelected ? '#ffffff' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {idx === 0
                ? '1. Planck Işınım Kanunu'
                : idx === 1
                ? '2. Öncü Bilim İnsanları'
                : '3. Pirometre Ölçüm İlkeleri'}
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
              font="/fonts/arial.ttf"
            >
              Görsel Yükleniyor...
            </Text>
          }
        >
          <SlideImageMesh imagePath={activeSlide.imagePath} />
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
            const posX = (i - 1) * 0.35
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
