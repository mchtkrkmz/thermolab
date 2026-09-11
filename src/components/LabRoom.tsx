import { useState, useRef } from 'react'
import { TeleportTarget } from '@react-three/xr'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { isPositionValid } from '../utils/collision'

interface LabRoomProps {
  onTeleport?: (point: THREE.Vector3) => void
}

/**
 * Modern TÜBİTAK UME Sıcaklık & Nem Metroloji Laboratuvarı Mimarisi
 * 
 * Duvar Renk ve Tasarım Konsepti:
 * - Üst Duvarlar: Yüksek teknoloji temiz oda beyazı (#f8fafc / #f1f5f9) - ferah, ışık yansıtan modern yüzey.
 * - Alt Koruma Panelleri (Wainscot): TÜBİTAK UME Derin Kurumsal Gece Mavisi (#0a1d37).
 * - Mimari Vurgu Şeritleri: Resmi TÜBİTAK Kırmızısı (#e11d48) ve UME Metroloji Cam Göbeği (#0284c7).
 * - Süpürgelik: Eloksallı fırçalanmış koyu alüminyum (#1e293b).
 * - TÜBİTAK UME Arka Duvar Prestij Paneli: Tabelanın arkasında özel mimari derin lacivert ve LED aydınlatmalı odak alanı.
 */
export default function LabRoom({ onTeleport }: LabRoomProps = {}) {
  // Kurumsal TÜBİTAK UME Renk Paleti
  const wallUpperColor = "#f1f5f9" // Temiz Oda Parlak Beyaz / Açık Gri
  const umeNavy = "#0a1d37"        // TÜBİTAK UME Kurumsal Derin Gece Mavisi
  const umeRed = "#e11d48"         // TÜBİTAK Resmi Kurumsal Kırmızı
  const umeCyan = "#0284c7"        // Metroloji İnce Mavi Vurgu
  const skirtingColor = "#1e293b"  // Eloksal Antrasit Süpürgelik
  const floorColor = "#94a3b8"     // Antistatik ESD Epoksi Zemin Grisi
  const ceilingColor = "#f8fafc"   // Akustik Temiz Oda Tavanı
  const tableColor = "#334155"     // Modern Laboratuvar Tezgahı Grafit/Çelik

  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null)
  const ringRef = useRef<THREE.Group>(null)

  // Animated pulse for the teleport landing ring
  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.getElapsedTime()
      const scale = 1.0 + 0.08 * Math.sin(t * 5.0)
      ringRef.current.scale.set(scale, scale, 1.0)
    }
  })

  const isValidHover = hoverPoint ? isPositionValid(hoverPoint.x, hoverPoint.z, 0.35) : false

  return (
    <group>
      {/* Floor with WebXR TeleportTarget and direct ray/click teleport */}
      <TeleportTarget onTeleport={onTeleport}>
        <mesh 
          position={[1.1, -0.1, 0]} 
          receiveShadow
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation()
            if (onTeleport && isPositionValid(e.point.x, e.point.z, 0.35)) {
              onTeleport(e.point)
            }
          }}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            setHoverPoint(e.point)
          }}
          onPointerOut={() => {
            setHoverPoint(null)
          }}
        >
          <boxGeometry args={[12.2, 0.2, 10]} />
          <meshStandardMaterial color={floorColor} roughness={0.45} metalness={0.12} />
        </mesh>
      </TeleportTarget>

      {/* Holographic Teleport Landing Marker (Meta Quest 3 & WebXR Floor Reticle) */}
      {hoverPoint && (
        <group 
          ref={ringRef}
          position={[hoverPoint.x, 0.012, hoverPoint.z]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {/* Dış Halka */}
          <mesh>
            <ringGeometry args={[0.26, 0.32, 36]} />
            <meshBasicMaterial 
              color={isValidHover ? umeCyan : "#ef4444"} 
              transparent 
              opacity={0.85} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          {/* İç Çember */}
          <mesh>
            <circleGeometry args={[0.08, 24]} />
            <meshBasicMaterial 
              color={isValidHover ? "#38bdf8" : "#f87171"} 
              transparent 
              opacity={0.9} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          {/* İleri Yön Oku */}
          <mesh position={[0, 0.20, 0.001]}>
            <coneGeometry args={[0.05, 0.10, 16]} />
            <meshBasicMaterial color={isValidHover ? "#38bdf8" : "#f87171"} />
          </mesh>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 1. ARKA DUVAR (Z = -5.0) - TÜBİTAK UME PRESTİJ ODAK DUVARI */}
      {/* ========================================================================= */}
      {/* Üst Beyaz Duvar Gövdesi (y: 1.215 -> 4.80) */}
      <mesh position={[1.1, 3.01, -5.0]} receiveShadow>
        <boxGeometry args={[12.2, 3.59, 0.2]} />
        <meshStandardMaterial color={wallUpperColor} roughness={0.5} metalness={0.02} />
      </mesh>
      {/* Alt TÜBİTAK UME Lacivert Koruma Paneli (y: 0.10 -> 1.15) */}
      <mesh position={[1.1, 0.625, -4.99]} receiveShadow>
        <boxGeometry args={[12.2, 1.05, 0.22]} />
        <meshStandardMaterial color={umeNavy} roughness={0.6} metalness={0.08} />
      </mesh>
      {/* TÜBİTAK Kırmızısı Mimari Vurgu Şeridi (y: 1.15 -> 1.20) */}
      <mesh position={[1.1, 1.175, -4.88]}>
        <boxGeometry args={[12.2, 0.05, 0.02]} />
        <meshStandardMaterial color={umeRed} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Metroloji Mavi İnce Ayırıcı Pinstripe (y: 1.205 -> 1.22) */}
      <mesh position={[1.1, 1.212, -4.88]}>
        <boxGeometry args={[12.2, 0.015, 0.02]} />
        <meshStandardMaterial color={umeCyan} roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Koyu Eloksal Süpürgelik (y: 0 -> 0.10) */}
      <mesh position={[1.1, 0.05, -4.88]}>
        <boxGeometry args={[12.2, 0.10, 0.03]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ARKA DUVAR TÜBİTAK UME PRESTİJ ODAK PANELİ (Logo arkasındaki mimari panel) */}
      <group position={[3.85, 2.70, -4.92]}>
        {/* LED Arka Vurgu Işıması */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[4.4, 3.2]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        {/* Ana Akustik Derin UME Lacivert Panel */}
        <mesh receiveShadow>
          <boxGeometry args={[4.2, 3.0, 0.04]} />
          <meshStandardMaterial color="#0c2240" roughness={0.45} metalness={0.12} />
        </mesh>
        {/* Dış Alüminyum Çerçeve Trim */}
        <mesh position={[0, 0, 0.022]}>
          <boxGeometry args={[4.24, 3.04, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* İç Gövde Paneli (Hafifçe öne çıkan katman) */}
        <mesh position={[0, 0, 0.024]}>
          <boxGeometry args={[4.16, 2.96, 0.01]} />
          <meshStandardMaterial color="#0a1d37" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Dikey Modern Mimari Derz Hatları */}
        {[-1.4, -0.7, 0.7, 1.4].map((px, idx) => (
          <mesh key={`p-groove-${idx}`} position={[px, 0, 0.03]}>
            <boxGeometry args={[0.008, 2.94, 0.005]} />
            <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Panel Üst ve Alt Kırmızı İnce Vurgu Şeritleri */}
        <mesh position={[0, 1.46, 0.031]}>
          <planeGeometry args={[4.14, 0.02]} />
          <meshBasicMaterial color={umeRed} />
        </mesh>
        <mesh position={[0, -1.46, 0.031]}>
          <planeGeometry args={[4.14, 0.02]} />
          <meshBasicMaterial color={umeRed} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 2. SOL DUVAR (X = -5.0) - NEM & BİRİNCİL İKİ-BASINÇLI GENERATOR ALANI */}
      {/* ========================================================================= */}
      {/* Üst Beyaz Duvar */}
      <mesh position={[-5.0, 3.01, 0]} receiveShadow>
        <boxGeometry args={[0.2, 3.59, 10]} />
        <meshStandardMaterial color={wallUpperColor} roughness={0.5} metalness={0.02} />
      </mesh>
      {/* Alt TÜBİTAK UME Lacivert Panel */}
      <mesh position={[-4.99, 0.625, 0]} receiveShadow>
        <boxGeometry args={[0.22, 1.05, 10]} />
        <meshStandardMaterial color={umeNavy} roughness={0.6} metalness={0.08} />
      </mesh>
      {/* TÜBİTAK Kırmızı Şerit */}
      <mesh position={[-4.88, 1.175, 0]}>
        <boxGeometry args={[0.02, 0.05, 10]} />
        <meshStandardMaterial color={umeRed} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* UME Mavi Pinstripe */}
      <mesh position={[-4.88, 1.212, 0]}>
        <boxGeometry args={[0.02, 0.015, 10]} />
        <meshStandardMaterial color={umeCyan} roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Süpürgelik */}
      <mesh position={[-4.88, 0.05, 0]}>
        <boxGeometry args={[0.03, 0.10, 10]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ========================================================================= */}
      {/* 3. SAĞ DUVAR (X = +7.2) - KONTAK SICAKLIK & DİRENÇ KÖPRÜSÜ ALANI */}
      {/* ========================================================================= */}
      {/* Üst Beyaz Duvar */}
      <mesh position={[7.2, 3.01, 0]} receiveShadow>
        <boxGeometry args={[0.2, 3.59, 10]} />
        <meshStandardMaterial color={wallUpperColor} roughness={0.5} metalness={0.02} />
      </mesh>
      {/* Alt TÜBİTAK UME Lacivert Panel */}
      <mesh position={[7.19, 0.625, 0]} receiveShadow>
        <boxGeometry args={[0.22, 1.05, 10]} />
        <meshStandardMaterial color={umeNavy} roughness={0.6} metalness={0.08} />
      </mesh>
      {/* TÜBİTAK Kırmızı Şerit */}
      <mesh position={[7.08, 1.175, 0]}>
        <boxGeometry args={[0.02, 0.05, 10]} />
        <meshStandardMaterial color={umeRed} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* UME Mavi Pinstripe */}
      <mesh position={[7.08, 1.212, 0]}>
        <boxGeometry args={[0.02, 0.015, 10]} />
        <meshStandardMaterial color={umeCyan} roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Süpürgelik */}
      <mesh position={[7.08, 0.05, 0]}>
        <boxGeometry args={[0.03, 0.10, 10]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ========================================================================= */}
      {/* 4. ÖN GİRİŞ DUVARI (Z = +5.0) */}
      {/* ========================================================================= */}
      {/* Üst Beyaz Duvar */}
      <mesh position={[1.1, 3.01, 5.0]} receiveShadow>
        <boxGeometry args={[12.2, 3.59, 0.2]} />
        <meshStandardMaterial color={wallUpperColor} roughness={0.5} metalness={0.02} />
      </mesh>
      {/* Alt TÜBİTAK UME Lacivert Panel */}
      <mesh position={[1.1, 0.625, 4.99]} receiveShadow>
        <boxGeometry args={[12.2, 1.05, 0.22]} />
        <meshStandardMaterial color={umeNavy} roughness={0.6} metalness={0.08} />
      </mesh>
      {/* TÜBİTAK Kırmızı Şerit */}
      <mesh position={[1.1, 1.175, 4.88]}>
        <boxGeometry args={[12.2, 0.05, 0.02]} />
        <meshStandardMaterial color={umeRed} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* UME Mavi Pinstripe */}
      <mesh position={[1.1, 1.212, 4.88]}>
        <boxGeometry args={[12.2, 0.015, 0.02]} />
        <meshStandardMaterial color={umeCyan} roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Süpürgelik */}
      <mesh position={[1.1, 0.05, 4.88]}>
        <boxGeometry args={[12.2, 0.10, 0.03]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ========================================================================= */}
      {/* 5. TAVAN & TAVAN ÇEVRESİ PERİMETRE TRİMİ */}
      {/* ========================================================================= */}
      <mesh position={[1.1, 4.9, 0]} receiveShadow>
        <boxGeometry args={[12.2, 0.2, 10]} />
        <meshStandardMaterial color={ceilingColor} roughness={0.9} />
      </mesh>
      {/* Tavan Çevre Alüminyum Işık Bandı Profili */}
      <mesh position={[1.1, 4.79, -4.89]}>
        <boxGeometry args={[12.2, 0.04, 0.02]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ========================================================================= */}
      {/* 6. LABORATUVAR ÇALIŞMA MASALARI (Modernize Edilmiş Grafit/Çelik Kaplama) */}
      {/* ========================================================================= */}
      {/* Orta Masa (Siyah Cisimler & Kalibratörler Masası) */}
      <mesh position={[0, 0.45, -3.8]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.9, 1.2]} />
        <meshStandardMaterial color={tableColor} metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Masa Üstü Antistatik Mat Yüzey Katmanı */}
      <mesh position={[0, 0.902, -3.8]}>
        <boxGeometry args={[4.18, 0.005, 1.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Sol Duvar Masası (Thunder Scientific Jeneratör Masası) */}
      <mesh position={[-4.2, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.2, 0.9, 3]} />
        <meshStandardMaterial color={tableColor} metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[-4.2, 0.902, 0]}>
        <boxGeometry args={[1.18, 0.005, 2.98]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Sağ Duvar Masası (Kontak Sıcaklık & Direnç Köprüsü Masası) */}
      <group position={[6.65, 0, 2.7]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.825, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.9, 0.05, 0.88]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.825, 0.441]}>
          <boxGeometry args={[1.9, 0.05, 0.005]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        {[
          [-0.88, -0.38],
          [0.88, -0.38],
          [-0.88, 0.38],
          [0.88, 0.38]
        ].map(([lx, lz], idx) => (
          <mesh key={`leg-${idx}`} position={[lx, 0.4, lz]} receiveShadow castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.8, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.76, 0.02, 0.78]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
