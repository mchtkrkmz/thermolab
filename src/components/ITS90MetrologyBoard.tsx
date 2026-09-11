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
    title: '1. ITS-90 SICAKLIK ÖLÇEĞİ & SABİT NOKTALAR DİZİLİMİ',
    subtitle: 'Saf Maddelerin Faz Dengelerine Dayalı Uluslararası Metrolojik Standart',
    imagePath: '/slides/its90_fixed_points.jpg',
    imageCaption: 'ITS-90 Tanımlayıcı Sabit Noktalar Skalası (Ar -189.34 °C ile Ag 961.78 °C) ve İzotermal Faz Değişim Platosu',
    badge: 'ULUSLARARASI ÖLÇEK (ITS-90)',
    badgeColor: '#38bdf8',
    heading: 'Saf Metallerin Faz Dengeleri & Donma Platosu',
    formulaTitle: 'ITS-90 Direnç Oranı W(T₉₀) ve Sabit Nokta Bağıntısı',
    formula: 'W(T₉₀) = R(T₉₀) / R(TPW)   |   T_donma = Değişmez Faz Denge Sıcaklığı',
    formulaExplanation: 'T₉₀: ITS-90 sıcaklığı | R(TPW): Suyun Üçlü Noktası referans direnci | Saf metaller %99.9999 (6N saflık)',
    bullets: [
      {
        label: 'Termodinamik Sıcaklık ve ITS-90 İhtiyacı:',
        text: 'Mutlak termodinamik sıcaklık (T) doğrudan ölçülmesi son derece güç ve karmaşık bir büyüklüktür. ITS-90, saf elementlerin faz geçişlerini referans alarak dünya çapında tekrarlanabilir pratik bir ölçek sunar.',
        highlight: true,
      },
      {
        label: 'Tanımlayıcı Sabit Noktalar (Fixed Points):',
        text: '• Ar: -189.3442 °C | Hg: -38.8344 °C | TPW: +0.0100 °C (Temel Referans) | Ga: +29.7646 °C\n• In: 156.5985 °C | Sn: 231.928 °C | Zn: 419.527 °C | Al: 660.323 °C | Ag: 961.78 °C.',
      },
      {
        label: 'Donma Platosu (Freeze Plateau) Dinamiği:',
        text: 'Sıvı metal soğurken önce çekirdeklenme için "aşırı soğuma" (supercooling) yapar, ardından gizli füzyon ısısı salınımıyla hızla plato sıcaklığına sıçrar (rekalesans). İki faz dengedeyken sıcaklık saatlerce < 0.1 mK kararlılıkta sabit kalır!',
        highlight: true,
      },
      {
        label: 'Önünüzdeki Fırın Dizilimi:',
        text: 'Laboratuvardaki 9 adet metroloji hücresi ve fırını, tam olarak bu metallerin faz geçişi platolarını oluşturmaktadır. SPRT probunu fırına daldırıp direnç oranını ölçebilirsiniz.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: ITS-90 sabit noktaları, doğanın değişmez termodinamik faz dengeleridir. Donma süresince sıcaklık dış ortamdan bağımsız olarak mikroderece hassasiyetle sabit kalır.',
  },
  {
    title: '2. TÜBİTAK UME SICAKLIK LABORATUVARI & BİRİNCİL ALTYAPI',
    subtitle: 'Ulusal Standartların Oluşturulması, Korunması ve Uluslararası Tanınırlık',
    imagePath: '/slides/ume_sicaklik_1.jpg',
    imageCaption: 'TÜBİTAK UME Sıcaklık Laboratuvarı Birincil Seviye ITS-90 Sabit Noktaları, SPRT Kalibrasyon Fırınları ve Sıcaklık Banyoları',
    badge: 'TÜBİTAK UME BİRİNCİL METROLOJİ',
    badgeColor: '#f59e0b',
    heading: 'Ulusal Standartlar ve Birincil Seviye Kalibrasyon',
    formulaTitle: 'BIPM CMC & TS EN ISO/IEC 17025 Akreditasyonu',
    formula: 'Aralık: -189.3442 °C (Ar) ile 961.78 °C (Ag)   |   Ölçüm Belirsizliği: U < 0.5 mK',
    formulaExplanation: 'CCT.K7-2021 & EURAMET.T-K9 Uluslararası Karşılaştırmaları ile Küresel Güvenilirlik',
    bullets: [
      {
        label: 'Ulusal Görev ve SI İzlenebilirlik Zinciri:',
        text: 'TÜBİTAK UME Sıcaklık Laboratuvarı, SI sisteminde 7 temel büyüklükten biri olan Kelvin’i birincil seviyede oluşturmak ve Türkiye’deki tüm kontak sıcaklık ölçümlerinin uluslararası metroloji sistemine izlenebilirliğini sağlamakla görevlidir.',
        highlight: true,
      },
      {
        label: 'Birincil Seviye Donanım ve Sistemler:',
        text: '• Ar üçlü noktasından (-189.34 °C) Ag donma noktasına (961.78 °C) SPRT kalibrasyon sistemi\n• Sn (231.9 °C) ile Co-C ötetik noktası (1325 °C) arasında referans ısılçift kalibrasyon sistemi\n• -196 °C ile 650 °C aralığında endüstriyel termometreler için karşılaştırmalı kalibrasyon düzeneği.',
      },
      {
        label: 'Yerli Hücre & Cihaz Yapımı Yetkinliği:',
        text: 'UME, primer ITS-90 sabit noktalarını, yüksek sıcaklık metal-karbon ötetik hücrelerini (Co-C) ve cıva yerine çevreci alternatif olarak geliştirilen SF₆ ve CO₂ üçlü nokta hücrelerini kendi bünyesinde üretmektedir.',
        highlight: true,
      },
      {
        label: 'Uluslararası Başarılar & Karşılaştırmalar:',
        text: '25 yılı aşkın süredir BIPM CCT ve EURAMET uluslararası karşılaştırmalarında (CCT.K7, EURAMET.T-K9) elde edilen mükemmel sonuçlarla ulusal sanayi, savunma ve sağlık kurumlarına en yüksek doğrulukta izlenebilirlik sunar.',
      },
    ],
    takeaway: 'Özet: TÜBİTAK UME, Türkiye\'nin sıcaklık ölçüm güvenilirliğinin garantisidir. Laboratuvarımızda üretilen primer referans hücreler dünya metroloji liginde ülkemizi temsil eder.',
  },
  {
    title: '3. SUYUN ÜÇLÜ NOKTASI (TPW) & KELVİN\'İN YENİ TANIMI (AGT)',
    subtitle: 'Metrolojinin Kalbi: Katı, Sıvı ve Buharın Mutlak Dengesi & 2019 SI Devrimi',
    imagePath: '/slides/tpw_cell_kelvin.jpg',
    imageCaption: 'Borosilikat TPW Hücresi Kesiti (Buz Mantosu, İç Erime Katmanı, SPRT Kuyusu) ve Boltzmann Sabiti (k_B) ile AGT Sistemi',
    badge: 'SI KELVİN & AKUSTİK GAZ TERMOMETRİSİ',
    badgeColor: '#a855f7',
    heading: '2019 SI Kelvin Devrimi & Akustik Gaz Termometresi',
    formulaTitle: 'Boltzmann Sabiti ile Termodinamik Enerji Eşitliği',
    formula: 'E = k_B · T   |   k_B = 1.380649 × 10⁻²³ J/K (Sabit)   |   T_TPW = 273.16 K = +0.0100 °C',
    formulaExplanation: 'Kelvin materyalden bağımsız Enerji SI birimine (kg·m²·s⁻²) bağlanmıştır | AGT: Akustik Gaz Termometresi',
    bullets: [
      {
        label: '20 Mayıs 2019 SI Kelvin Yeniden Tanımı:',
        text: 'Kelvin, tarihsel olarak TPW hücresinin 1/273.16\'sına bağımlıydı. 2019\'da Boltzmann sabiti (k_B) tam sayıya sabitlenerek Kelvin herhangi bir maddeye bağlı olmaksızın doğrudan mikroskobik termal enerjiye bağlandı.',
        highlight: true,
      },
      {
        label: 'Akustik Gaz Termometresi (AGT) Sistemi:',
        text: 'TÜBİTAK UME, yeni Kelvin tanımının birincil seviyede gerçekleştirilmesinde dünyadaki en üstün yöntem olan AGT sistemini ülkemize kazandırmış ve uluslararası EMPIR Direk-T (Dissemination of the redefined kelvin) projesinde yer almıştır.',
        highlight: true,
      },
      {
        label: 'Suyun Üçlü Noktası (TPW) Hücresi:',
        text: 'Borosilikat cam tüp içinde VSMOW izotopik arı suyun katı, sıvı ve gaz fazları 611.657 Pa basınçta bir arada bulunur. İç kuyu etrafında dondurulan buz mantosu ve ince "iç erime" (inner melt) serbest su katmanı ile < 0.05 mK belirsizlik sağlanır.',
      },
      {
        label: 'Direnç Metrolojisinde W Oranı:',
        text: 'Tüm SPRT ve direnç termometreleri, direnç oranlarını W(T) = R(T) / R(TPW) şeklinde bağıl olarak hesaplayabilmek için periyodik olarak TPW hücresinde kalibre edilir ve sıfırlanır.',
        highlight: true,
      },
    ],
    takeaway: 'Özet: Yeni SI sisteminde Kelvin, Boltzmann sabiti ile tanımlanır. UME\'nin kurduğu Akustik Gaz Termometresi (AGT) ve TPW hücreleri bu tanımı nanokelvin seviyesinde hayata geçirir.',
  },
  {
    title: '4. SPRT & 4 TELLİ AC DİRENÇ KÖPRÜSÜ ÇALIŞMA PRENSİBİ',
    subtitle: 'Standart Platin Direnç Termometrisi ve Yüksek Doğruluklu Enstrümantasyon',
    imagePath: '/slides/sprt_bridge_principle.jpg',
    imageCaption: 'Kuvars Kılıflı Gerilmesiz SPRT Sensörü ve 4 Telli Kelvin Bağlantılı AC Direnç Köprüsü Devre Şeması',
    badge: 'ENSTRÜMANTASYON & FLUKEN 1594A',
    badgeColor: '#10b981',
    heading: 'SPRT Karakteristiği ve 4 Telli AC Direnç Köprüsü',
    formulaTitle: 'W(T₉₀) Direnç Oranı ve 4 Telli Kelvin Potansiyel Okuması',
    formula: 'W(T₉₀) = R(T₉₀) / R_TPW   |   V_sense = I · R_sensör (Kablo Hatası = 0)',
    formulaExplanation: 'α_platin ≥ 0.003926 °C⁻¹ (Saf platin saflık kriteri: W(Ga) ≥ 1.11807 veya W(Hg) ≤ 0.84414)',
    bullets: [
      {
        label: 'SPRT (Standard Platinum Resistance Thermometer):',
        text: '-189 °C ile +962 °C arasında ITS-90\'ın resmi interpolasyon cihazıdır. %99.9999 saflıkta platin tel, termal genleşmelerden gerilme görmemesi için kuvars haç üzerine gerilmesiz (strain-free) sarılır.',
        highlight: true,
      },
      {
        label: '4 Telli (4-Wire Kelvin) Bağlantı İlkesi:',
        text: 'İki telden akım döngüsü (I+, I-) geçirilirken, ayrı iki yüksek empedanslı potansiyel teli (V+, V-) yalnızca sensör üzerindeki voltaj düşümünü okur. Böylece metrelerce uzunluktaki kabloların iç direnci ölçüme sıfır etki eder.',
        highlight: true,
      },
      {
        label: 'AC Direnç Köprüsü & Seebeck EMF Eliminasyonu:',
        text: 'Masanın üzerindeki Fluke 1594A Super-Thermometer köprüsü gibi sistemler, akım yönünü periyodik tersleyerek (AC modu) bağlantı noktalarındaki parazitik ısıl gerilimleri (termoelektrik EMF) bütünüyle yok eder.',
        highlight: true,
      },
      {
        label: 'Öz-Isınma (Self-Heating) Düzeltmesi:',
        text: 'Ölçüm akımı (1 mA ve 1.414 mA) sensörde mikroderece mertebesinde ısınmaya yol açar. Köprü iki akımla okuma yaparak sıfır akıma ekstrapolasyon uygular ve hatayı tamamen ortadan kaldırır.',
      },
    ],
    takeaway: 'Özet: 4 telli Kelvin bağlantısı kablo kayıplarını sıfırlar, AC köprü ısıl voltajları eler, SPRT ise temaslı sıcaklık ölçümünde dünyanın en yüksek doğruluğunu sunar.',
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

interface ITS90MetrologyBoardProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export default function ITS90MetrologyBoard({
  position = [7.08, 2.45, 2.60],
  rotation = [0, -Math.PI / 2, 0],
}: ITS90MetrologyBoardProps) {
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

      {/* TÜBİTAK / BIPM Metrology Badge */}
      <mesh position={[-1.95, 1.06, 0.008]}>
        <planeGeometry args={[1.05, 0.07]} />
        <meshBasicMaterial color="#065f46" />
      </mesh>
      <Text
        position={[-1.95, 1.06, 0.01]}
        fontSize={0.030}
        color="#a7f3d0"
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        TÜBİTAK UME / BIPM METROLOJİ
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
        ITS-90 SICAKLIK ÖLÇEĞİ & SPRT DİRENÇ METROLOJİSİ
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

        const tabLabels = [
          '1. ITS-90 & Sabit Noktalar',
          '2. UME Sıcaklık Lab.',
          '3. TPW & Kelvin (AGT)',
          '4. SPRT & Direnç Köprüsü'
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
            >
              Sabırlı olunuz... Görsel Yükleniyor...
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
          <meshBasicMaterial color="#064e3b" />
        </mesh>
        <mesh position={[-1.13, -0.68, 0.007]}>
          <planeGeometry args={[0.02, 0.12]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        <Text
          position={[-1.09, -0.68, 0.008]}
          fontSize={0.028}
          color="#d1fae5"
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
