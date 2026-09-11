import { useMemo } from 'react'
import { useTexture, Text } from '@react-three/drei'
import * as THREE from 'three'

export interface TubitakUmeSignProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  variant?: 'large' | 'compact'
  title?: string
  subtitle?: string
}

/**
 * TÜBİTAK UME (Ulusal Metroloji Enstitüsü) Prestijli Duvar Tabelası & Logo Entegrasyonu
 * 
 * Özellikler:
 * - Resmi TÜBİTAK UME logosunu yüksek çözünürlüklü doku ile duvara yerleştirir.
 * - Krom alyan montaj vidaları (standoffs) ve arkadan aydınlatmalı (halo backlight) pleksiglas çerçeve.
 * - Metroloji laboratuvarı kurumsal unvanı ve birim başlığı.
 */
export default function TubitakUmeSign({
  position,
  rotation = [0, 0, 0],
  scale = 1.0,
  variant = 'large',
  title = 'TÜBİTAK ULUSAL METROLOJİ ENSTİTÜSÜ',
  subtitle = 'Kontak Sıcaklığı, Radyosyon Sıcaklığı ve Nem Laboratuvarı',
}: TubitakUmeSignProps) {
  const logoTexture = useTexture('/tubitak_ume_logo.png')

  useMemo(() => {
    if (logoTexture) {
      logoTexture.colorSpace = THREE.SRGBColorSpace
      logoTexture.minFilter = THREE.LinearMipmapLinearFilter
      logoTexture.magFilter = THREE.LinearFilter
      logoTexture.generateMipmaps = true
    }
  }, [logoTexture])

  const isLarge = variant === 'large'
  const plaqueWidth = isLarge ? 2.4 * scale : 1.5 * scale
  const plaqueHeight = isLarge ? 1.45 * scale : 0.95 * scale
  const logoSize = isLarge ? 0.95 * scale : 0.62 * scale

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Arkadan Aydınlatmalı LED Halo Işıması (Soft Accent Backlight) */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[plaqueWidth + 0.12, plaqueHeight + 0.12]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Dış Alüminyum Kompozit Çerçeve (Anodized Aluminum Trim) */}
      <mesh position={[0, 0, -0.008]} receiveShadow>
        <boxGeometry args={[plaqueWidth + 0.04, plaqueHeight + 0.04, 0.014]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
      </mesh>

      {/* 3. Ana Kurumsal Pleksiglas Panel (White / High-Tech Glass Plate) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[plaqueWidth, plaqueHeight, 0.012]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.15}
          metalness={0.08}
        />
      </mesh>

      {/* 4. TÜBİTAK Kırmızı İnce Üst Vurgu Çizgisi (Corporate Red Accent) */}
      <mesh position={[0, (plaqueHeight / 2) - 0.018 * scale, 0.007]}>
        <planeGeometry args={[plaqueWidth - 0.06 * scale, 0.008 * scale]} />
        <meshBasicMaterial color="#e11d48" />
      </mesh>

      {/* 5. Resmi TÜBİTAK UME Logo Doku Paneli */}
      <mesh position={[0, isLarge ? 0.16 * scale : 0.10 * scale, 0.007]}>
        <planeGeometry args={[logoSize * 0.92, logoSize]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent={true}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Kurumsal Başlık ve Metroloji Laboratuvarı Yazısı */}
      {isLarge && (
        <group position={[0, -0.42 * scale, 0.008]}>
          {/* İnce Ayırıcı Çizgi */}
          <mesh position={[0, 0.08 * scale, 0]}>
            <planeGeometry args={[plaqueWidth * 0.75, 0.003]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>

          {/* Ana Kurumsal Unvan */}
          <Text
            position={[0, 0.035 * scale, 0]}
            fontSize={0.038 * scale}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
            letterSpacing={0.06}
          >
            {title}
          </Text>

          {/* Laboratuvar Bölümü Alt Başlığı */}
          <Text
            position={[0, -0.025 * scale, 0]}
            fontSize={0.024 * scale}
            color="#475569"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            letterSpacing={0.08}
          >
            {subtitle}
          </Text>

          {/* Uluslararası Akreditasyon / ITS-90 Rozeti */}
          <Text
            position={[0, -0.075 * scale, 0]}
            fontSize={0.016 * scale}
            color="#0284c7"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            TUBİTAK UME
          </Text>
        </group>
      )}

      {/* 7. 4 Köşe Krom Montaj Vidaları (Stainless Standoff Bolts) */}
      {[
        [-(plaqueWidth / 2) + 0.045 * scale, (plaqueHeight / 2) - 0.045 * scale],
        [(plaqueWidth / 2) - 0.045 * scale, (plaqueHeight / 2) - 0.045 * scale],
        [-(plaqueWidth / 2) + 0.045 * scale, -(plaqueHeight / 2) + 0.045 * scale],
        [(plaqueWidth / 2) - 0.045 * scale, -(plaqueHeight / 2) + 0.045 * scale],
      ].map(([sx, sy], sIdx) => (
        <group key={`standoff-${sIdx}`} position={[sx, sy, 0.007]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014 * scale, 0.014 * scale, 0.012, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.96} roughness={0.12} />
          </mesh>
          {/* Vida Merkez Yivi */}
          <mesh position={[0, 0, 0.0065]}>
            <circleGeometry args={[0.004 * scale, 16]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
