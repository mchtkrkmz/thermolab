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
    title: '1. BAĞIL NEM, ÇİY NOKTASI & PSİKROMETRİ FİZİĞİ',
    subtitle: 'Havadaki Su Buharının Termodinamik Davranışı ve Doyma Eğrileri',
    imagePath: '/slides/humidity_psychrometrics_physics.jpg',
    imageCaption: 'Termodinamik Psikrometrik Diyagram (%100 RH Doyma Eğrisi), Kısmi Buhar Basıncı e vs e_s(T) ve Sıcaklık Duyarlılığı',
    badge: 'TERMODİNAMİK TEMELLER',
    badgeColor: '#38bdf8',
    heading: 'Havadaki Nem ve Termodinamik Psikrometri Bağıntıları',
    formulaTitle: 'Bağıl Nem (%rh) ve Doyma Buhar Basıncı Formülasyonu',
    formula: 'RH = [ e / e_s(T) ] × 100 %   |   e_s(T_d) = e (Çiy Noktası Eşitliği)',
    formulaExplanation: 'e: Su buharı kısmi basıncı (Pa) | e_s(T): Doyma buhar basıncı (Sonntag/WMO) | T_d: Çiy noktası sıcaklığı',
    bullets: [
      {
        label: 'Bağıl Nemin Tanımı (%rh):',
        text: 'Belirli bir sıcaklık ve basınçtaki havanın içerdiği su buharı kısmi basıncının (e), havanın o sıcaklıkta taşıyabileceği maksimum doyma buhar basıncına (e_s(T)) oranıdır.',
        highlight: true,
      },
      {
        label: 'Çiy Noktası / Kırağı Noktası Sıcaklığı (T_d / T_f):',
        text: 'Sabit basınç altındaki havanın, içindeki su buharının doymuş hale gelerek sıvı su (çiy) veya buz kristali (kırağı) şeklinde yoğunlaşmaya başladığı termodinamik sıcaklıktır.',
      },
      {
        label: 'Kritik Sıcaklık Duyarlılığı (1 °C → >%5 rh Hata):',
        text: 'Doyma basıncı e_s(T) sıcaklıkla üssel arttığı için, hava sıcaklığı ölçümündeki yalnızca 1.0 °C\'lik bir hata, bağıl nem değerinde %5 rh\'nin üzerinde devasa bir sapmaya yol açar!',
        highlight: true,
      },
      {
        label: 'TÜBİTAK UME Yüksek Doğruluk Seviyesi:',
        text: 'Laboratuvarda hava sıcaklığı belirsizliği -10 °C ile 70 °C arasında 0.07 °C (k=2) seviyesine indirilmiş olup, nem kalibrasyonlarının mutlak güvenilirliği temin edilmektedir.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Bağıl nem doğrudan hava sıcaklığına bağımlıdır. 1 °C sıcaklık sapması nemde %5 rh\'yi aşan hata üretir; bu nedenle nem metrolojisi kusursuz sıcaklık kontrolü gerektirir.',
  },
  {
    title: '2. TÜBİTAK UME ULUSAL NEM LABORATUVARI & BİRİNCİL ALTYAPI',
    subtitle: 'Gazlarda Nem ve Katılarda Rutubet Ölçümlerinin Uluslararası İzlenebilirliği',
    imagePath: '/slides/ume_nem-laboratuvari-img-1.jpg',
    imageCaption: 'TÜBİTAK UME Nem Laboratuvarı Birincil Seviye İki-Basınçlı / İki-Sıcaklıklı Nem Jeneratörleri ve Kalibrasyon Odaları',
    badge: 'TÜBİTAK UME BİRİNCİL ÖLÇEK',
    badgeColor: '#f59e0b',
    heading: 'Ulusal Nem ve Rutubet Metrolojisi Standartları',
    formulaTitle: 'BIPM CMC & TS EN ISO/IEC 17025 Kapsamı',
    formula: 'Aralık: -80 °C ile +95 °C Çiy Noktası   |   %11 rh ile %95 rh Bağıl Nem',
    formulaExplanation: 'Hava Sıcaklığı Belirsizliği: U = 0.07 °C (k=2) | Ortam Şartları: (21 ± 3) °C, %(45 ± 15) rh',
    bullets: [
      {
        label: 'Ulusal Görev ve SI İzlenebilirlik Zinciri:',
        text: 'TÜBİTAK UME Nem Laboratuvarı; gazlarda nem (bağıl nem, mutlak nem, çiy/kırağı noktası) ve katıhal maddelerde rutubet ölçümlerinin SI birimlerine izlenebilirliğini birincil seviyede sağlar.',
        highlight: true,
      },
      {
        label: 'Birincil Seviye Ölçüm Sistemleri:',
        text: '• Birincil seviye çiy noktası sistemi: -80 °C ile +10 °C çiy/kırağı noktası aralığı\n• Birincil seviye bağıl nem sistemi: -35 °C ile +60 °C çiy noktası ve %11 rh ile %95 rh nem\n• İkincil seviye bağıl nem sistemi: -40 °C ile +180 °C sıcaklık ve %10 rh ile %95 rh nem.',
      },
      {
        label: 'Katıhal Maddelerde Rutubet Tayini:',
        text: 'Kurutma ile Kütle Kaybı (Loss-on-Drying) ve Karl Fischer (v-KF) titrasyonu ile tahıl, talaş, kağıt ve toprak numunelerinde (%2.7 mc ile %26.6 mc) izlenebilir su miktarı ölçümleri yapılır.',
        highlight: true,
      },
      {
        label: 'Uluslararası Komiteler ve Temsil:',
        text: 'BIPM CCT-WG-Hu (Nem Çalışma Grubu), EURAMET TC-T, COOMET, GULFMET ve SMIIC teknik komitelerinde Türkiye\'yi temsil ederek çok uluslu araştırma projelerini yönetmektedir.',
      },
    ],
    takeaway: 'Özet: TÜBİTAK UME Nem Laboratuvarı, -80 °C kırağı noktasından %95 rh neme kadar Türkiye\'nin endüstriyel, gıda ve iklim ölçüm izlenebilirliğini birincil düzeyde sağlar.',
  },
  {
    title: '3. İKİ-BASINÇLI NEM JENERATÖRÜ & OPTİK ÇİY NOKTASI AYNASI',
    subtitle: 'Temel Fiziksel İlkeler: Termodinamik Basınç Doyurması ve Optik Yoğunlaşma Tespiti',
    imagePath: '/slides/chilled_mirror_dewpoint_principle.jpg',
    imageCaption: 'İki Basınçlı Nem Jeneratörü Akış Şeması ve Hassas Optik Çiy Noktası Aynalı Higrometre (Chilled Mirror) Kesiti',
    badge: 'BİRİNCİL ÖLÇÜM & CİHAZ PRENSİBİ',
    badgeColor: '#10b981',
    heading: 'Optik Çiy Noktası Aynası ve İki Basınç İlkesi',
    formulaTitle: 'Dalton Kısmi Basınç ve İki-Basınç Jeneratör Eşitliği',
    formula: 'e = ( P₂ / P₁ ) · e_s(T)   |   RH = [ e / e_s(T_kabin) ] × 100 %',
    formulaExplanation: 'P₁: Doyurucu yüksek basıncı | P₂: Test hücresi basıncı | e_s(T): Doyurucu sıcaklığındaki doyma basıncı',
    bullets: [
      {
        label: 'İki-Basınçlı Nem Jeneratörü Çalışma Prensibi:',
        text: 'Kuru hava yüksek basınçta (P₁) suya tamamen doyurulur. Ardından genleşme vanasından geçirilerek test odasındaki çalışma basıncına (P₂) düşürülür. Dalton yasasına göre kısmi buhar basıncı doğrudan P₂ / P₁ oranıyla kesin belirlenir.',
        highlight: true,
      },
      {
        label: 'Optik Çiy Noktası Aynalı Higrometre (Chilled Mirror):',
        text: 'Masanızda duran Dew Point Mirror cihazı, rodyum kaplı bakır aynayı termoelektrik Peltier modülü ile soğutur. LED ışını aynaya yansıtılır; mikroskobik ilk çiy taneciği oluştuğunda optik kırılma algılanarak ayna çiy sıcaklığında kilitlenir.',
        highlight: true,
      },
      {
        label: 'Platin Termometre (Pt100/SPRT) Hassasiyeti:',
        text: 'Aynanın hemen altına entegre 4 telli platin sensör, yoğunlaşma anındaki ayna sıcaklığını < 0.05 °C belirsizlikle okuyarak gazın mutlak çiy noktası sıcaklığını verir.',
      },
      {
        label: 'VR Laboratuvarı Uygulaması:',
        text: 'Sol taraftaki İklimlendirme Kabininin hedef sıcaklık ve nemini ayarlayın; masadaki Optik Çiy Noktası Aynası kabinden aldığı gazı analiz ederek anlık çiy noktasını ekranda gösterecektir!',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Optik çiy noktası aynası temel bir fiziksel ölçümdür (drift yapmaz). İki-basınç yöntemi ise nemi kimyasal sensör kullanmadan doğrudan termodinamik basınç oranıyla üretir.',
  },
  {
    title: '4. ENDÜSTRİYEL, ÇEVRESEL VE İLERİ TEKNOLOJİ UYGULAMALARI',
    subtitle: 'Temiz Odalardan İlaç Üretimine, Lityum Bataryalardan İklim Uydularına',
    imagePath: '/slides/ume_termodinamik_3.png',
    imageCaption: 'TÜBİTAK UME Nem Metrolojisi Uygulama Alanları: Temiz Odalar, İlaç/Aşı Üretimi, Tahıl Güvenliği ve İklim Projeleri',
    badge: 'SEKTÖREL UYGULAMALAR & AR-GE',
    badgeColor: '#8b5cf6',
    heading: 'Hayati Alanlarda Nem ve Rutubet Güvencesi',
    formulaTitle: 'Eser Nem (Trace Moisture) & Malzeme Su İçeriği',
    formula: 'W_eser < 50 ppb (Ultra Kuru Gaz)   |   Rutubet = ( m_ıslak - m_kuru ) / m_ıslak',
    formulaExplanation: 'ppb: Milyarda bir su molekülü | Karl Fischer (v-KF) titrasyonu ve Loss-on-Drying kütle kaybı',
    bullets: [
      {
        label: 'İlaç, Aşı ve Temiz Oda Metrolojisi:',
        text: 'Biyofarmasötik ve aşı üretiminde ortam bağıl nemi mikrobiyolojik üremeyi ve etken madde stabilitesini doğrudan belirler. İklimlendirme kabinleri EN ISO standartlarına göre UME tarafından karakterize edilir.',
        highlight: true,
      },
      {
        label: 'Yarı İletken, Lityum Pil ve Uzay Sanayii:',
        text: 'Lityum-iyon batarya üretimi ve havacılık/uzay gaz hatlarında ultra kuru (< 50 ppb) gaz ortamı gereklidir. UME, gerçek zamanlı eser nem analiz sistemiyle bu yüksek teknolojiyi destekler.',
        highlight: true,
      },
      {
        label: 'Gıda Güvenliği & Tahıl Rutubeti (GrainMet):',
        text: 'Dökme tahıllarda yüksek rutubet aflatoksin ve küflenmeye yol açar. UME, uluslararası GrainMet (2024-2027) projesiyle bitkisel gıdalarda standart nem metrolojisini yönetmektedir.',
      },
      {
        label: 'İklim Değişikliği & Sera Gazları (MetCTG & SOMMET):',
        text: 'Toprak nemi (SOMMET MetroSoilMoist), sera gazı uyduları (MetCTG: 2025-2028) ve gaz spektrometrisi (PriSpecTemp) projeleri UME liderliğinde yürütülmektedir.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: İlaç fabrikalarından lityum batarya üretimine, tahıl ambarlarından iklim uydularına kadar nem ve su miktarı metrolojisi kalite ve güvenliğin temelidir.',
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

interface HumidityMetrologyBoardProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export default function HumidityMetrologyBoard({
  position = [-4.88, 2.50, -0.2],
  rotation = [0, Math.PI / 2, 0],
}: HumidityMetrologyBoardProps) {
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

      {/* TÜBİTAK / EURAMET Metrology Badge */}
      <mesh position={[-1.95, 1.06, 0.008]}>
        <planeGeometry args={[1.05, 0.07]} />
        <meshBasicMaterial color="#0369a1" />
      </mesh>
      <Text
        position={[-1.95, 1.06, 0.01]}
        fontSize={0.030}
        color="#bae6fd"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME NEM METROLOJİSİ
      </Text>

      {/* Main Title */}
      <Text
        position={[0.08, 1.06, 0.01]}
        fontSize={0.062}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        BAĞIL NEM, ÇİY NOKTASI VE RUTUBET EĞİTİM PANOSU
      </Text>

      {/* Slide Badge on Top Right */}
      <mesh position={[2.0, 1.06, 0.008]}>
        <planeGeometry args={[0.92, 0.07]} />
        <meshBasicMaterial color={activeSlide.badgeColor} />
      </mesh>
      <Text
        position={[2.0, 1.06, 0.01]}
        fontSize={0.030}
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
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* ========================================================
          3. INTERACTIVE SLIDE TABS BAR (TOP NAVIGATION)
         ======================================================== */}
      {SLIDES.map((_slide, idx) => {
        const isSelected = idx === currentSlideIndex
        const tabWidth = 1.18
        const posX = (idx - 1.5) * 1.25
        const posY = 0.76

        const tabLabels = [
          '1. Bağıl Nem & Çiy Noktası',
          '2. UME Nem Laboratuvarı',
          '3. Jeneratör & Çiy Aynası',
          '4. Endüstri & İklim Projeleri'
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
              {tabLabels[idx]}
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
          fontSize={0.029}
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
          <meshBasicMaterial color="#0284c7" />
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
          fontSize={0.038}
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
          <meshBasicMaterial color="#0c4a6e" />
        </mesh>
        <mesh position={[-1.13, -0.68, 0.007]}>
          <planeGeometry args={[0.02, 0.12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Text
          position={[-1.09, -0.68, 0.008]}
          fontSize={0.028}
          color="#e0f2fe"
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
              color={hoveredButton === 'prev' ? '#0284c7' : '#1e293b'}
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
              color={hoveredButton === 'next' ? '#0284c7' : '#1e293b'}
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
