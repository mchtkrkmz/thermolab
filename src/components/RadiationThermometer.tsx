import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { simulatePyrometerMeasurement } from '../utils/planck'

export interface RadiationThermometerProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  ambientTemp?: number
  modelName: string
  wavelength: number // mikrometre (µm) - örn: 0.9, 1.6, 3.9, 10.0
  wavelengthLabel: string
  minTemp: number
  maxTemp: number
  detectorType?: string
  onSaveMeasurement?: (refTemp: number, measuredTemp: number, deviceName: string, wavelength: number) => void
}

const _worldPos = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()
const _parentQuat = new THREE.Quaternion()
const _rayDir = new THREE.Vector3()

export default function RadiationThermometer({
  position: initialPosition,
  rotation: initialRotation = [0, 0, 0],
  color = "#d32f2f",
  ambientTemp = 25,
  modelName = "LAND CYCLOPS 100L",
  wavelength = 0.9,
  wavelengthLabel = "λ = 0.9 µm (NIR)",
  minTemp = 550,
  maxTemp = 3000,
  detectorType = "Si Fotodiyot",
  onSaveMeasurement
}: RadiationThermometerProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Konum ve durum state'leri
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(initialPosition)
  const [currentRotation, setCurrentRotation] = useState<[number, number, number]>(initialRotation)
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Ölçüm state'leri (Planck kanunu tabanlı)
  const [readingStr, setReadingStr] = useState<string>('---')
  const [readingStatus, setReadingStatus] = useState<'IDLE' | 'OK' | 'UNDER' | 'OVER'>('IDLE')
  const [isHold, setIsHold] = useState(false)
  const [emissivity, setEmissivity] = useState(1.00)
  const [showFlash, setShowFlash] = useState(false)
  const [targetName, setTargetName] = useState<string>('Boşluk / Ortam')
  
  // Lazer hedef noktası ve ışın mesafesi
  const [laserHitDist, setLaserHitDist] = useState<number>(1.2)
  const [hasHitTarget, setHasHitTarget] = useState(false)

  const { scene, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const currentRefTemp = useRef(ambientTemp)
  const currentRefEps = useRef(0.95)
  const prevTriggerState = useRef(false)
  const prevAState = useRef(false)
  const prevBState = useRef(false)

  // Masaya geri koyma (varsayılan veya masa düzlemine bırakma)
  const placeOnTable = useCallback((targetPos?: [number, number, number]) => {
    setIsGrabbed(false)
    setIsHovered(false)
    const pos = targetPos || initialPosition
    // Masa tablası yüksekliği 1.04m (taban 0.90m hizasında oturur)
    setCurrentPosition([pos[0], 1.04, pos[2]])
    setCurrentRotation([0, initialRotation[1], 0])
  }, [initialPosition, initialRotation])

  // Hedef tespiti ve Planck ışınım hesabı fonksiyonu
  const executeMeasurement = useCallback(() => {
    const res = simulatePyrometerMeasurement(
      currentRefTemp.current,
      currentRefEps.current,
      ambientTemp,
      emissivity,
      wavelength,
      minTemp,
      maxTemp
    )

    setReadingStr(res.displayString)
    setReadingStatus(res.status)
    setIsHold(true)
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 160)

    if (onSaveMeasurement && res.measuredTemp !== null) {
      onSaveMeasurement(currentRefTemp.current, res.measuredTemp, `${modelName} (${wavelengthLabel})`, wavelength)
    }
  }, [ambientTemp, emissivity, wavelength, minTemp, maxTemp, onSaveMeasurement, modelName, wavelengthLabel])

  // Klavye kısayolları (Masaüstü için: Boşluk = Ölçüm Tetik, Esc = Masaya Bırak)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGrabbed) return
      if (e.code === 'Space') {
        e.preventDefault()
        executeMeasurement()
      } else if (e.code === 'Escape') {
        e.preventDefault()
        placeOnTable()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGrabbed, executeMeasurement, placeOnTable])

  // Her karede ışın izleme ve VR kontrolcü etkileşimleri
  useFrame(() => {
    if (groupRef.current) {
      // 1. Pirometre namlusunun baktığı doğrultuyu bul (-Z yönü)
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      _rayDir.set(0, 0, -1).transformDirection(groupRef.current.matrixWorld).normalize()

      // 2. Namlu ucundan ileriye doğru ışın gönder
      raycaster.current.set(worldPos, _rayDir)
      raycaster.current.far = 10.0

      let intersects: THREE.Intersection[] = []
      try {
        const meshes: THREE.Mesh[] = []
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && !obj.userData?.isThermometer && obj.visible) {
            meshes.push(obj)
          }
        })
        intersects = raycaster.current.intersectObjects(meshes, false)
      } catch {
        // Safe fallback
      }

      if (intersects.length > 0) {
        const firstHit = intersects[0]
        setLaserHitDist(Math.max(0.2, firstHit.distance))

        // Vurulan objenin sıcaklık ve emisyon verilerini oku
        let foundTemp = ambientTemp
        let foundEps = 0.90
        let foundName = 'Laboratuvar Yüzeyi'
        let hitSpecialTarget = false

        let curr: THREE.Object3D | null = firstHit.object
        while (curr) {
          if (curr.userData) {
            if (curr.userData.isBlackBody || typeof curr.userData.temperature === 'number' || typeof curr.userData.currentTemp === 'number') {
              const tempVal = typeof curr.userData.temperature === 'number' 
                ? curr.userData.temperature 
                : curr.userData.currentTemp
              if (typeof tempVal === 'number') {
                foundTemp = tempVal
                foundEps = curr.userData.isBlackBody ? 0.998 : 0.95
                foundName = curr.userData.isBlackBody ? 'Siyah Cisim Kavitesi (Akkor)' : 'IR Kalibratör Diski'
                hitSpecialTarget = true
                break
              }
            }
          }
          curr = curr.parent
        }

        currentRefTemp.current = foundTemp
        currentRefEps.current = foundEps
        setTargetName(foundName)
        setHasHitTarget(hitSpecialTarget)
      } else {
        setLaserHitDist(3.0)
        currentRefTemp.current = ambientTemp
        currentRefEps.current = 0.90
        setTargetName('Boşluk / Ortam')
        setHasHitTarget(false)
      }
    }

    // VR Kontrolcü Poz Takibi
    if (isGrabbed && groupRef.current && gl.xr.isPresenting) {
      const controller = gl.xr.getController(0)
      if (controller && groupRef.current.parent) {
        controller.getWorldPosition(_worldPos)
        controller.getWorldQuaternion(_worldQuat)
        groupRef.current.parent.worldToLocal(_worldPos)
        groupRef.current.position.copy(_worldPos)
        groupRef.current.parent.getWorldQuaternion(_parentQuat)
        groupRef.current.quaternion.copy(_parentQuat.invert().multiply(_worldQuat))
      }
    }

    // VR Tetik ve Buton Kontrolleri
    const session = gl.xr.getSession()
    if (session) {
      let triggerPressed = false
      let aPressed = false
      let bPressed = false

      for (const source of session.inputSources) {
        if (source.gamepad) {
          if (source.gamepad.buttons[0]?.pressed) triggerPressed = true
          if (source.gamepad.buttons[4]?.pressed) aPressed = true
          if (source.gamepad.buttons[5]?.pressed) bPressed = true
        }
      }

      // (A) ile Kavra
      if (aPressed && !prevAState.current && isHovered && !isGrabbed) {
        setIsGrabbed(true)
        setIsHovered(false)
      }

      // (B) ile Masaya Koy
      if (bPressed && !prevBState.current && isGrabbed) {
        placeOnTable()
      }

      // Tetik ile Ölçüm Al (Trigger click)
      if (isGrabbed && triggerPressed && !prevTriggerState.current) {
        executeMeasurement()
      }

      prevTriggerState.current = triggerPressed
      prevAState.current = aPressed
      prevBState.current = bPressed
    }
  })

  // Emisyon Katsayısı Ayarları (0.10 - 1.00)
  const handleEmissivityDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(prev => Math.max(0.10, Math.round((prev - 0.01) * 100) / 100))
  }, [])

  const handleEmissivityUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(prev => Math.min(1.00, Math.round((prev + 0.01) * 100) / 100))
  }, [])

  // Gösterge rengi hesaplama
  const displayColor = useMemo(() => {
    if (showFlash) return '#ffffff'
    if (readingStatus === 'UNDER') return '#f59e0b' // Turuncu uyarı
    if (readingStatus === 'OVER') return '#ef4444'  // Kırmızı aşırı sıcaklık
    if (readingStatus === 'OK') return '#22c55e'   // Parlak yeşil okuma
    return '#64748b'                               // Boşta gri
  }, [showFlash, readingStatus])

  return (
    <group position={currentPosition} rotation={currentRotation}>
      <group 
        ref={groupRef}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setIsHovered(true)
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setIsHovered(false)
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (isGrabbed && groupRef.current && !gl.xr.isPresenting) {
            // Masaüstü fare hareketinde pirometreyi kameranın önünde ve doğrultusunda hareket ettir
            const dir = e.ray.direction.clone()
            const distance = 0.55
            const pos = e.ray.origin.clone().add(dir.clone().multiplyScalar(distance))
            // Masanın altına inmesini engelle (min y = 1.00)
            pos.y = Math.max(1.00, pos.y)
            groupRef.current.position.copy(pos)
            
            // Pirometreyi farenin baktığı yöne doğru doğrult
            const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.normalize())
            groupRef.current.quaternion.copy(targetRotation)
          }
        }}
      >
        {/* ===== VR / Masaüstü Bilgi & İpucu Kutusu ===== */}
        <group position={[0, 0.16, 0]} visible={isHovered && !isGrabbed}>
          <mesh>
            <planeGeometry args={[0.26, 0.05]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0.01, 0.001]}
            fontSize={0.011}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {modelName}
          </Text>
          <Text
            position={[0, -0.01, 0.001]}
            fontSize={0.009}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            Tıkla veya (A) ile Ele Al
          </Text>
        </group>

        {/* ===== Pirometre Gövdesi (Gerçekçi Optik Tasarım) ===== */}
        
        {/* Ana Optik Gövde (Alüminyum & Polimer Kaplama) */}
        <mesh position={[0, 0, 0]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.065, 0.085, 0.13]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Yan Koruyucu Kauçuk Grip Panelleri */}
        <mesh position={[0, 0, -0.005]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.068, 0.076, 0.09]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>

        {/* Ergonomik Kabza / Tutacak (Pistol Grip) */}
        <mesh position={[0, -0.08, 0.02]} rotation={[0.28, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.016, 0.019, 0.12, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>

        {/* Kabza Arkası Kauçuk Dolgu */}
        <mesh position={[0, -0.08, 0.038]} rotation={[0.28, 0, 0]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.024, 0.11, 0.012]} />
          <meshStandardMaterial color="#18181b" roughness={0.9} />
        </mesh>

        {/* ===== FİZİKSEL TETİK MEKANİZMASI (TRIGGER BUTTON) ===== */}
        <group position={[0, -0.045, -0.008]} rotation={[0.28, 0, 0]}>
          <mesh 
            userData={{ isThermometer: true }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              executeMeasurement()
            }}
          >
            <boxGeometry args={[0.014, 0.028, 0.015]} />
            <meshStandardMaterial color={showFlash ? '#ef4444' : '#27272a'} roughness={0.3} metalness={0.6} />
          </mesh>
        </group>

        {/* ===== MASAÜSTÜ STAND / YUVA (TABLE DOCK BASE) ===== */}
        {/* Pirometre masadayken dik durmasını sağlayan manyetik ağırlıklı tabanlık */}
        <mesh position={[0, -0.138, 0.035]}>
          <boxGeometry args={[0.085, 0.012, 0.09]} />
          <meshStandardMaterial color="#27272a" roughness={0.7} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.132, 0.035]}>
          <cylinderGeometry args={[0.022, 0.025, 0.012, 16]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.5} />
        </mesh>

        {/* Ön Optik Namlu (Lens Barrel - Hassas Odaklama Tüpü) */}
        <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.027, 0.027, 0.06, 32]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Ön Objektif Lensi (Kızılötesi Geçirgen Optik Cam) */}
        <mesh position={[0, 0, -0.121]} userData={{ isThermometer: true }}>
          <circleGeometry args={[0.023, 32]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.1} metalness={0.95} />
        </mesh>

        {/* Arka Vizör / Dürbün Göz Parçası (Viewfinder) */}
        <mesh position={[0, 0.02, 0.066]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.014, 0.016, 0.012, 24]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} />
        </mesh>

        {/* ===== LAZER HEDEFLEME IŞINI (AKTİF HEDEF ÇEMBERİ) ===== */}
        {isGrabbed && (
          <>
            {/* Kırmızı Kolime Lazer Işını */}
            <mesh position={[0, 0, -(laserHitDist / 2) - 0.12]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.0012, 0.0012, laserHitDist, 8]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.65} />
            </mesh>
            
            {/* Hedef Üzerindeki Lazer Noktası ve Optik Odak Çemberi */}
            <group position={[0, 0, -laserHitDist - 0.12]}>
              <mesh userData={{ isThermometer: true }}>
                <ringGeometry args={[0.006, 0.012, 24]} />
                <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
              </mesh>
              <mesh userData={{ isThermometer: true }}>
                <circleGeometry args={[0.003, 16]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            </group>
          </>
        )}

        {/* ===== 3D METROLOJİ LCD EKRAN PANELİ (SAĞ YAN YÜZEY) ===== */}
        <group position={[0.034, 0.005, -0.005]} rotation={[0, Math.PI / 2, 0]}>
          {/* Ekran Çerçevesi */}
          <mesh userData={{ isThermometer: true }}>
            <planeGeometry args={[0.075, 0.095]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Model ve Dalgaboyu Başlığı */}
          <Text
            position={[0, 0.038, 0.001]}
            fontSize={0.0055}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {modelName}
          </Text>
          <Text
            position={[0, 0.031, 0.001]}
            fontSize={0.0048}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {wavelengthLabel}
          </Text>

          {/* Sıcaklık Okuma Ekran Kutusu */}
          <mesh position={[0, 0.014, 0.001]} userData={{ isThermometer: true }}>
            <planeGeometry args={[0.068, 0.024]} />
            <meshBasicMaterial color={showFlash ? '#ffffff' : '#020617'} />
          </mesh>
          
          {/* HOLD / LIVE Etiketi */}
          <Text
            position={[-0.024, 0.021, 0.002]}
            fontSize={0.0038}
            color={isHold ? '#38bdf8' : '#e2e8f0'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {isHold ? 'HOLD' : 'SCAN'}
          </Text>

          {/* Planck Sıcaklık Değeri */}
          <Text
            position={[0.006, 0.013, 0.002]}
            fontSize={0.0105}
            color={displayColor}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {readingStr}
          </Text>

          {/* Aralık ve Detektör Bilgisi */}
          <Text
            position={[0, 0.000, 0.001]}
            fontSize={0.004}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {minTemp} ... {maxTemp} °C | {detectorType}
          </Text>

          {/* Emisyon Ayar Bloğu (Emissivity: ε) */}
          <Text
            position={[-0.014, -0.012, 0.001]}
            fontSize={0.0048}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            EMİSYON ε:
          </Text>
          <Text
            position={[0.018, -0.012, 0.001]}
            fontSize={0.006}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {emissivity.toFixed(2)}
          </Text>

          {/* [-] Butonu */}
          <mesh 
            position={[-0.018, -0.025, 0.001]} 
            onPointerDown={handleEmissivityDown}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.024, 0.011]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <Text
            position={[-0.018, -0.025, 0.002]}
            fontSize={0.007}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            -
          </Text>

          {/* [+] Butonu */}
          <mesh 
            position={[0.018, -0.025, 0.001]} 
            onPointerDown={handleEmissivityUp}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.024, 0.011]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <Text
            position={[0.018, -0.025, 0.002]}
            fontSize={0.007}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            +
          </Text>

          {/* ===== TETİK BUTONU (EKRAN ÜZERİNDEN DOĞRUDAN ÖLÇÜM) ===== */}
          <mesh 
            position={[0, -0.038, 0.001]} 
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              executeMeasurement()
            }}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.068, 0.012]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
          <Text
            position={[0, -0.038, 0.002]}
            fontSize={0.0048}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            ÖLÇÜM TETİĞİ (TRIGGER)
          </Text>
        </group>

        {/* ===== ARKA PANELDE MASAYA KOYMA VE ELE ALMA KONTROLLERİ ===== */}
        <group position={[0, -0.02, 0.066]} rotation={[0, Math.PI, 0]}>
          <mesh 
            userData={{ isThermometer: true }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              if (isGrabbed) {
                placeOnTable()
              } else {
                setIsGrabbed(true)
              }
            }}
          >
            <planeGeometry args={[0.056, 0.016]} />
            <meshStandardMaterial color={isGrabbed ? "#2563eb" : "#059669"} roughness={0.3} />
          </mesh>
          <Text
            position={[0, 0, 0.001]}
            fontSize={0.0052}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {isGrabbed ? "MASAYA BIRAK" : "ELE AL / TUT"}
          </Text>
        </group>

        {/* Aktif Tutulduğunda Hedef Bilgisi */}
        {isGrabbed && (
          <group position={[0, 0.12, 0]}>
            <mesh>
              <planeGeometry args={[0.22, 0.036]} />
              <meshBasicMaterial color="#020617" transparent opacity={0.85} />
            </mesh>
            <Text
              position={[0, 0.006, 0.001]}
              fontSize={0.008}
              color="#e2e8f0"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              Hedef: {targetName}
            </Text>
            <Text
              position={[0, -0.008, 0.001]}
              fontSize={0.0068}
              color={hasHitTarget ? "#22c55e" : "#f59e0b"}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {hasHitTarget ? `Ref Sıcaklık: ${currentRefTemp.current.toFixed(1)} °C` : "Tetik / Boşluk ile Ölç"}
            </Text>
          </group>
        )}
      </group>
    </group>
  )
}
