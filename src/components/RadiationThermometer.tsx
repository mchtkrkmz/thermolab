import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { simulatePyrometerMeasurement } from '../utils/planck'
import { deviceGrabManager } from '../utils/deviceGrabManager'

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
  variant?: 'standard' | 'heitronics'
  onSaveMeasurement?: (refTemp: number, measuredTemp: number, deviceName: string, wavelength: number) => void
}

const _localMatrix = new THREE.Matrix4()
const _targetWorldMatrix = new THREE.Matrix4()
const _scaleVector = new THREE.Vector3()

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
  variant = "standard",
  onSaveMeasurement
}: RadiationThermometerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const deviceId = useMemo(() => `${modelName}_${initialPosition.join('_')}`, [modelName, initialPosition])

  // Aktif tutan el: 'left' (sol el), 'right' (sağ el) veya null (masada)
  const [heldHand, setHeldHand] = useState<'left' | 'right' | null>(null)
  const isGrabbed = heldHand !== null

  const [isHovered, setIsHovered] = useState(false)
  const isHoveredRef = useRef(false)
  const isReturning = useRef(false)

  // WebXR her iki kontrolcü için gerçek dünya pozisyon & rotasyon izleyicisi
  const handPos = useRef<{ left: THREE.Vector3; right: THREE.Vector3 }>({
    left: new THREE.Vector3(),
    right: new THREE.Vector3()
  })
  const handQuat = useRef<{ left: THREE.Quaternion; right: THREE.Quaternion }>({
    left: new THREE.Quaternion(),
    right: new THREE.Quaternion()
  })
  const handActive = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false
  })

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
  const [isCenteredUI, setIsCenteredUI] = useState(false)

  const { scene, gl, camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const currentRefTemp = useRef(ambientTemp)
  const currentRefEps = useRef(0.95)

  const prevTriggerState = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  const prevDropState = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  const lastHapticTime = useRef(0)

  // Namlu / lens çıkış ofseti (Yerel koordinatlarda)
  const snoutOffset = useMemo(() => {
    return variant === 'heitronics'
      ? new THREE.Vector3(0, 0.018, -0.24)
      : new THREE.Vector3(0, 0, -0.13)
  }, [variant])

  // Masaya güvenli geri bırakma (Yere ASLA düşmez, masadaki orijinal yuvasına süzülür)
  const placeOnTable = useCallback(() => {
    setHeldHand(null)
    setIsHovered(false)
    isHoveredRef.current = false
    isReturning.current = true
    if (deviceGrabManager.getHeldId() === deviceId) {
      deviceGrabManager.setHeld(null)
    }
  }, [deviceId])

  // Cihazı ele alma (Sol el veya Sağ el seçeneği)
  const grabDevice = useCallback((hand: 'left' | 'right' = 'left') => {
    if (!deviceGrabManager.canGrab(deviceId)) return
    deviceGrabManager.setHeld(deviceId)
    setHeldHand(hand)
    setIsHovered(false)
    isHoveredRef.current = false
    setIsHold(false)
    isReturning.current = false
  }, [deviceId])

  // Global Device Manager kaydı
  useEffect(() => {
    deviceGrabManager.register({
      id: deviceId,
      name: modelName,
      getWorldPosition: () => {
        const p = new THREE.Vector3()
        if (groupRef.current) {
          groupRef.current.getWorldPosition(p)
        } else {
          p.set(...initialPosition)
        }
        return p
      },
      isHovered: () => isHoveredRef.current,
      grab: (hand?: 'left' | 'right') => {
        grabDevice(hand ?? 'left')
      },
      release: () => {
        placeOnTable()
      },
      isHeld: () => isGrabbed
    })

    return () => {
      deviceGrabManager.unregister(deviceId)
    }
  }, [deviceId, modelName, initialPosition, isGrabbed, grabDevice, placeOnTable])

  // Planck ışınım hesabı fonksiyonu (Tetik basıldığında dondurur/kaydeder, tekrar basıldığında canlı taramaya döner)
  const executeMeasurement = useCallback(() => {
    if (isHold) {
      setIsHold(false)
      return
    }

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
  }, [isHold, ambientTemp, emissivity, wavelength, minTemp, maxTemp, onSaveMeasurement, modelName, wavelengthLabel])

  // Masaüstü klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'x' && !isGrabbed) {
        e.preventDefault()
        grabDevice('left')
      } else if ((key === 'y' || e.code === 'Escape') && isGrabbed) {
        e.preventDefault()
        placeOnTable()
      } else if ((e.code === 'Space' || key === 't') && isGrabbed) {
        e.preventDefault()
        executeMeasurement()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGrabbed, executeMeasurement, placeOnTable, grabDevice])

  // Her karede WebXR gerçek kontrolcü matris takibi ve etkileşimler
  useFrame((_, __, frame) => {
    if (!groupRef.current) return
    const group = groupRef.current

    // 1. WEBXR NATIVE POSE İLE SOL VE SAĞ KONTROLCÜLERİNİ HASSAS TAKİP ET
    handActive.current.left = false
    handActive.current.right = false

    const session = gl.xr.getSession()
    if (gl.xr.isPresenting && session && frame) {
      const refSpace = gl.xr.getReferenceSpace()
      const xrCam = gl.xr.getCamera()
      const originMatrix = xrCam.parent ? xrCam.parent.matrixWorld : new THREE.Matrix4()

      if (refSpace && session.inputSources) {
        for (const source of session.inputSources) {
          const h = source.handedness
          if (h === 'left' || h === 'right') {
            const space = source.targetRaySpace || source.gripSpace
            if (space) {
              const pose = frame.getPose(space, refSpace)
              if (pose) {
                _localMatrix.fromArray(pose.transform.matrix)
                _targetWorldMatrix.multiplyMatrices(originMatrix, _localMatrix)
                _targetWorldMatrix.decompose(
                  handPos.current[h],
                  handQuat.current[h],
                  _scaleVector
                )
                handActive.current[h] = true
              }
            }
          }
        }
      }
    }

    // 2. MASAYA GÜVENLİ SÜZÜLME ANİMASYONU (ASLA YERE DÜŞMEZ)
    if (isReturning.current) {
      const targetPos = new THREE.Vector3(...initialPosition)
      const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...initialRotation))

      group.position.lerp(targetPos, 0.22)
      group.quaternion.slerp(targetQuat, 0.22)

      if (group.position.distanceTo(targetPos) < 0.005) {
        group.position.copy(targetPos)
        group.quaternion.copy(targetQuat)
        isReturning.current = false
        if (deviceGrabManager.getHeldId() === deviceId) {
          deviceGrabManager.setHeld(null)
        }
      }
    }

    // 3. CİHAZ ELDEYKEN DOĞRUDAN AKTİF ELE KİLİTLENME (SOL VEYA SAĞ EL)
    if (isGrabbed && heldHand) {
      if (gl.xr.isPresenting && handActive.current[heldHand]) {
        // VR Modunda: Kumandanın avuç içine tam oturan ergonomik silah kabzası ofseti
        const pos = handPos.current[heldHand].clone()
        const quat = handQuat.current[heldHand].clone()

        const palmOffset = new THREE.Vector3(
          heldHand === 'left' ? 0.012 : -0.012,
          0.045,
          -0.035
        ).applyQuaternion(quat)
        pos.add(palmOffset)

        group.position.copy(pos)
        group.quaternion.copy(quat)
      } else if (!gl.xr.isPresenting) {
        // Masaüstü Modunda: Kameranın önünde FPS tarzı görüşe yerleştir
        const camPos = camera.position.clone()
        const camQuat = camera.quaternion.clone()
        const offset = new THREE.Vector3(0.20, -0.16, -0.52).applyQuaternion(camQuat)
        const targetPos = camPos.add(offset)

        group.position.lerp(targetPos, 0.28)
        group.quaternion.slerp(camQuat, 0.28)
      }
    }

    // 4. VR MODUNDA ELE ALMA (SOL KUMANDA VEYA SAĞ KUMANDA İLE)
    if (!isGrabbed && !isReturning.current && gl.xr.isPresenting && session) {
      session.inputSources.forEach((source) => {
        const h = source.handedness
        if ((h === 'left' || h === 'right') && source.gamepad && handActive.current[h]) {
          const trigger = !!source.gamepad.buttons[0]?.pressed
          const grip = !!source.gamepad.buttons[1]?.pressed
          const primaryBtn = !!source.gamepad.buttons[4]?.pressed // Sol: [X], Sağ: [A]

          const devPos = new THREE.Vector3()
          group.getWorldPosition(devPos)
          const dist = handPos.current[h].distanceTo(devPos)

          // Kumanda cihaza yakınken veya hover edilmişken tetik/grip/tuşa basılınca O ELE AL!
          if ((trigger || grip || primaryBtn) && (dist < 0.45 || isHoveredRef.current)) {
            grabDevice(h)
          }
        }
      })
    }

    // 5. CİHAZ ELDEYKEN TETİKLEME VE GERİ BIRAKMA KONTROLLERİ
    if (isGrabbed && heldHand && gl.xr.isPresenting && session && session.inputSources) {
      let source: XRInputSource | undefined
      for (let i = 0; i < session.inputSources.length; i++) {
        if (session.inputSources[i]?.handedness === heldHand) {
          source = session.inputSources[i]
          break
        }
      }
      if (source && source.gamepad) {
        const trigger = !!source.gamepad.buttons[0]?.pressed
        const dropBtn = !!source.gamepad.buttons[5]?.pressed // Sol: [Y], Sağ: [B]

        const prevTrig = prevTriggerState.current[heldHand]
        const prevDrop = prevDropState.current[heldHand]

        // Tetiğe basıldığında sıcaklık oku ve haptic geri bildirim ver
        if (trigger && !prevTrig) {
          executeMeasurement()

          const haptic = (source.gamepad.hapticActuators?.[0] || (source.gamepad as any)?.vibrationActuator) as any
          if (haptic && typeof haptic.pulse === 'function') {
            try {
              haptic.pulse(1.0, 100)
            } catch {}
          }
        }

        // [Y] (Sol) veya [B] (Sağ) tuşuna basıldığında masadaki yerine güvenle dön
        if (dropBtn && !prevDrop) {
          placeOnTable()
        }

        prevTriggerState.current[heldHand] = trigger
        prevDropState.current[heldHand] = dropBtn
      }
    }

    // 6. CANLI IŞIN İZLEME (RAYCASTING) & HEDEF MERKEZİ TİTREŞİMİ
    const lensPos = snoutOffset.clone().applyMatrix4(group.matrixWorld)
    const forwardVec = new THREE.Vector3(0, 0, -1).transformDirection(group.matrixWorld).normalize()

    let rayOrigin: THREE.Vector3
    let rayDirection: THREE.Vector3

    if (!gl.xr.isPresenting && isGrabbed) {
      // MASAÜSTÜ FPS MODU: Kullanıcının ekranda baktığı hedef noktasına doğrudan nişan al
      rayOrigin = camera.position.clone()
      rayDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize()
    } else {
      // VR MODU / MASADAYKEN: Cihazın kendi optik lensinden doğrultulan lazer ışını
      rayOrigin = lensPos
      rayDirection = forwardVec
    }

    raycaster.current.camera = camera
    raycaster.current.set(rayOrigin, rayDirection)
    raycaster.current.far = 12.0

    let foundTemp = ambientTemp
    let foundEps = 0.90
    let foundName = 'Laboratuvar Masası / Ortam'
    let hitSpecialTarget = false
    let isApertureCenter = false
    let hitDist = 3.0

    // A) AKILLI OPTİK KONİ HEDEF KİLİTLEME (SMART OPTICAL CONE GUIDANCE)
    // Siyah cisim fırınlarının (MK1600, MK1200, ME30) ve IR kalibratörlerin parıldayan kavite merkezleri
    let bestProximityDist = Infinity
    let proximityHit: any = null

    try {
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh &&
          obj.visible &&
          (obj.userData?.isBlackBody || obj.userData?.isIRCalibrator) &&
          (obj.userData?.isApertureCenter || obj.userData?.isAperturePlate)
        ) {
          const targetPos = new THREE.Vector3()
          obj.getWorldPosition(targetPos)

          const toTarget = targetPos.clone().sub(rayOrigin)
          const forwardDist = toTarget.dot(rayDirection)

          if (forwardDist > 0.05 && forwardDist < 10.0) {
            const distToRay = raycaster.current.ray.distanceToPoint(targetPos)
            const maxThreshold = obj.userData?.isApertureCenter ? 0.22 : 0.30

            if (distToRay < maxThreshold && distToRay < bestProximityDist) {
              bestProximityDist = distToRay
              const tempVal = typeof obj.userData.currentTemp === 'number'
                ? obj.userData.currentTemp
                : typeof obj.userData.temperature === 'number'
                ? obj.userData.temperature
                : ambientTemp

              const isCenter = distToRay < 0.10 || !!obj.userData.isApertureCenter
              proximityHit = {
                temp: tempVal,
                eps: obj.userData.isBlackBody ? 0.998 : 0.95,
                name: obj.userData.isBlackBody
                  ? (obj.userData.sourceName ? `🎯 ${obj.userData.sourceName} AKKOR KAVİTE` : '🎯 SİYAH CİSİM TAM ORTASI (AKKOR KAVİTE)')
                  : (obj.userData.sourceName ? `🎯 ${obj.userData.sourceName} TAM ORTASI` : '🎯 IR KALİBRATÖR TAM ORTASI'),
                isCenter,
                dist: Math.max(0.2, forwardDist)
              }
            }
          }
        }
      })
    } catch {}

    if (proximityHit) {
      foundTemp = proximityHit.temp
      foundEps = proximityHit.eps
      foundName = proximityHit.name
      hitSpecialTarget = true
      isApertureCenter = proximityHit.isCenter
      hitDist = proximityHit.dist
      setLaserHitDist(hitDist)
    } else {
      // B) FİZİKSEL YÜZEY RAYCAST KESİŞİMİ (DÜZLEMLER, PLAKALAR VE MASALAR)
      let intersects: THREE.Intersection[] = []
      try {
        const meshes: THREE.Mesh[] = []
        scene.traverse((obj) => {
          if (
            obj instanceof THREE.Mesh &&
            obj.visible &&
            !obj.userData?.isThermometer &&
            !(obj as any).isLine &&
            !(obj as any).isLine2 &&
            !(obj as any).isLineSegments2 &&
            !(obj as any).type?.includes('Line')
          ) {
            let isSelf = false
            let p: THREE.Object3D | null = obj
            while (p) {
              if (p === group) {
                isSelf = true
                break
              }
              p = p.parent
            }
            if (!isSelf) {
              meshes.push(obj)
            }
          }
        })
        intersects = raycaster.current.intersectObjects(meshes, false)
      } catch {}

      if (intersects.length > 0) {
        const firstHit = intersects[0]
        hitDist = Math.max(0.15, firstHit.distance)
        setLaserHitDist(hitDist)

        let curr: THREE.Object3D | null = firstHit.object
        while (curr) {
          if (curr.userData) {
            if (curr.userData.isBlackBody || typeof curr.userData.temperature === 'number' || typeof curr.userData.currentTemp === 'number' || curr.userData.isIRCalibrator) {
              const tempVal = typeof curr.userData.currentTemp === 'number'
                ? curr.userData.currentTemp
                : curr.userData.temperature
              if (typeof tempVal === 'number') {
                foundTemp = tempVal
                foundEps = curr.userData.isBlackBody ? 0.998 : 0.95
                hitSpecialTarget = true

                const centerPos = new THREE.Vector3()
                firstHit.object.getWorldPosition(centerPos)
                const distToCenter = firstHit.point.distanceTo(centerPos)

                if (curr.userData.isApertureCenter || distToCenter < 0.10) {
                  isApertureCenter = true
                  foundName = curr.userData.isBlackBody
                    ? (curr.userData.sourceName ? `🎯 ${curr.userData.sourceName} AKKOR KAVİTE` : '🎯 SİYAH CİSİM TAM ORTASI (AKKOR KAVİTE)')
                    : (curr.userData.sourceName ? `🎯 ${curr.userData.sourceName} TAM ORTASI` : '🎯 IR KALİBRATÖR TAM ORTASI')
                } else {
                  foundName = curr.userData.isBlackBody
                    ? (curr.userData.sourceName ? `🎯 ${curr.userData.sourceName} Ön Plaka` : '🎯 Siyah Cisim Ön Plakası')
                    : (curr.userData.sourceName ? `🎯 ${curr.userData.sourceName} Plakası` : '🎯 IR Kalibratör Plakası')
                }
                break
              }
            }
          }
          curr = curr.parent
        }
      } else {
        setLaserHitDist(3.0)
        foundTemp = ambientTemp
        foundEps = 0.90
        foundName = 'Boşluk / Ortam'
        hitSpecialTarget = false
        isApertureCenter = false
      }
    }

    currentRefTemp.current = foundTemp
    currentRefEps.current = foundEps
    setTargetName(foundName)
    setHasHitTarget(hitSpecialTarget)
    setIsCenteredUI(isApertureCenter)

    // Canlı Planck Sıcaklık Gösterimi (Eldeyken veya bir hedefe tutulduğunda)
    if (!isHold) {
      if (hitSpecialTarget || isGrabbed) {
        const liveSim = simulatePyrometerMeasurement(
          foundTemp,
          foundEps,
          ambientTemp,
          emissivity,
          wavelength,
          minTemp,
          maxTemp
        )
        if (liveSim.displayString !== readingStr) {
          setReadingStr(liveSim.displayString)
        }
        if (liveSim.status !== readingStatus) {
          setReadingStatus(liveSim.status)
        }
      }
    }

    // SİYAH CİSMİN VEYA IR KALİBRATÖRÜN TAM ORTASINA ODAKLANILDIĞINDA TUTAN ELE TİTREŞİM VER
    if (isApertureCenter && isGrabbed && gl.xr.isPresenting && heldHand) {
      const now = performance.now()
      if (now - lastHapticTime.current > 100) {
        lastHapticTime.current = now
        const session = gl.xr.getSession()
        if (session && session.inputSources) {
          let source: XRInputSource | undefined
          for (let i = 0; i < session.inputSources.length; i++) {
            if (session.inputSources[i]?.handedness === heldHand) {
              source = session.inputSources[i]
              break
            }
          }
          const haptic = (source?.gamepad?.hapticActuators?.[0] || (source?.gamepad as any)?.vibrationActuator) as any
          if (haptic && typeof haptic.pulse === 'function') {
            try {
              haptic.pulse(0.90, 80)
            } catch {}
          }
        }
      }
    } else {
      setLaserHitDist(3.0)
      currentRefTemp.current = ambientTemp
      currentRefEps.current = 0.90
      setTargetName('Boşluk / Ortam')
      setHasHitTarget(false)
      setIsCenteredUI(false)

      if (!isHold && isGrabbed) {
        const liveSim = simulatePyrometerMeasurement(
          ambientTemp,
          0.95,
          ambientTemp,
          emissivity,
          wavelength,
          minTemp,
          maxTemp
        )
        setReadingStr(liveSim.displayString)
        setReadingStatus(liveSim.status)
      }
    }
  })

  // Emisyon Katsayısı Ayarları
  const handleEmissivityDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(prev => Math.max(0.10, Math.round((prev - 0.01) * 100) / 100))
  }, [])

  const handleEmissivityUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(prev => Math.min(1.00, Math.round((prev + 0.01) * 100) / 100))
  }, [])

  const displayColor = useMemo(() => {
    if (showFlash) return '#ffffff'
    if (readingStatus === 'UNDER') return '#f59e0b'
    if (readingStatus === 'OVER') return '#ef4444'
    if (readingStatus === 'OK') return '#22c55e'
    return '#64748b'
  }, [showFlash, readingStatus])

  return (
    <>
      {/* Masadaki Sabit Yuva Göstergesi */}
      {isGrabbed && (
        <group position={initialPosition} rotation={initialRotation}>
          <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.045, 0.055, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0.02, 0]}
            rotation={[-Math.PI / 4, 0, 0]}
            fontSize={0.012}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {modelName} Yuvası
          </Text>
        </group>
      )}

      {/* Ana Cihaz Grubu */}
      <group
        ref={groupRef}
        position={initialPosition}
        rotation={initialRotation}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!isGrabbed) {
            const h = (e.nativeEvent as any)?.inputSource?.handedness === 'left' ? 'left' : 'right'
            grabDevice(h)
          } else {
            executeMeasurement()
          }
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setIsHovered(true)
          isHoveredRef.current = true
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setIsHovered(false)
          isHoveredRef.current = false
        }}
      >
        {/* Bilgi Kutusu (Masadayken üzerine gelindiğinde) */}
        <group position={[0, 0.16, 0]} visible={isHovered && !isGrabbed}>
          <mesh>
            <planeGeometry args={[0.34, 0.058]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
          </mesh>
          <Text
            position={[0, 0.012, 0.001]}
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
            fontSize={0.007}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            🎮 Sol [X] / Sağ [A] / Tetik ile Ele Al | [Y]/[B]: Masaya Bırak
          </Text>
        </group>

        {/* ===== Pirometre Gövdesi ===== */}
        {variant === 'heitronics' ? (
          <group>
            {/* Titanyum Gri Gövde */}
            <mesh position={[0, 0.012, -0.01]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.064, 0.090, 0.165]} />
              <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.046, 0.015]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.052, 0.034, 0.125]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Döküm Şampanya Çerçeve */}
            <mesh position={[0, 0.012, -0.094]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.068, 0.096, 0.012]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.2} />
            </mesh>
            {/* Cıvatalar */}
            {[
              [-0.026, -0.028],
              [0.026, -0.028],
              [-0.026, 0.038],
              [0.026, 0.038],
            ].map(([bx, by], bi) => (
              <mesh key={`fbolt-${bi}`} position={[bx, 0.012 + by, -0.101]} userData={{ isThermometer: true }}>
                <cylinderGeometry args={[0.003, 0.003, 0.003, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.95} />
              </mesh>
            ))}
            {/* Marka Etiketi */}
            <mesh position={[0, -0.024, -0.101]}>
              <planeGeometry args={[0.046, 0.012]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <Text
              position={[0, -0.024, -0.102]}
              rotation={[0, Math.PI, 0]}
              fontSize={0.0055}
              color="#334155"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              TUBİTAK UME G1RS
            </Text>
            {/* Optik Namlu */}
            <mesh position={[0, 0.018, -0.165]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.025, 0.025, 0.13, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.018, -0.228]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.027, 0.027, 0.012, 32]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Yeşil Mercek */}
            <mesh position={[0, 0.018, -0.231]} rotation={[0, Math.PI, 0]} userData={{ isThermometer: true }}>
              <circleGeometry args={[0.022, 32]} />
              <meshStandardMaterial color="#84cc16" roughness={0.05} metalness={0.95} />
            </mesh>
            {/* Vizör */}
            <group position={[0, 0.042, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh userData={{ isThermometer: true }}>
                <cylinderGeometry args={[0.012, 0.012, 0.024, 24]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.014, 0]} userData={{ isThermometer: true }}>
                <cylinderGeometry args={[0.016, 0.013, 0.008, 24]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
            </group>
            {/* Tetik Butonu */}
            <group position={[0, -0.055, -0.035]}>
              <mesh
                userData={{ isThermometer: true }}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  executeMeasurement()
                }}
              >
                <boxGeometry args={[0.016, 0.014, 0.025]} />
                <meshStandardMaterial color={showFlash ? '#ef4444' : '#1e293b'} metalness={0.7} />
              </mesh>
            </group>
          </group>
        ) : (
          <group>
            {/* Ana Gövde */}
            <mesh position={[0, 0, 0]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.065, 0.085, 0.13]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.005]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.068, 0.076, 0.09]} />
              <meshStandardMaterial color="#18181b" roughness={0.85} />
            </mesh>
            {/* Kabza / Pistol Grip */}
            <mesh position={[0, -0.08, 0.02]} rotation={[0.28, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.016, 0.019, 0.12, 16]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.08, 0.038]} rotation={[0.28, 0, 0]} userData={{ isThermometer: true }}>
              <boxGeometry args={[0.024, 0.11, 0.012]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
            {/* Fiziksel Tetik */}
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
            {/* Namlu */}
            <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.027, 0.027, 0.06, 32]} />
              <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, -0.121]} userData={{ isThermometer: true }}>
              <circleGeometry args={[0.023, 32]} />
              <meshStandardMaterial color="#0c0a09" roughness={0.1} metalness={0.95} />
            </mesh>
            {/* Vizör */}
            <mesh position={[0, 0.02, 0.066]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
              <cylinderGeometry args={[0.014, 0.016, 0.012, 24]} />
              <meshStandardMaterial color="#09090b" roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* ===== LAZER HEDEFLEME IŞINI ===== */}
        {isGrabbed && (
          <>
            <mesh
              position={[snoutOffset.x, snoutOffset.y, snoutOffset.z - (laserHitDist / 2)]}
              rotation={[Math.PI / 2, 0, 0]}
              userData={{ isThermometer: true }}
            >
              <cylinderGeometry args={[0.0012, 0.0012, laserHitDist, 8]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
            </mesh>
            <group position={[snoutOffset.x, snoutOffset.y, snoutOffset.z - laserHitDist]}>
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

        {/* ===== LCD EKRAN PANELİ ===== */}
        <group position={[0.034, 0.005, -0.005]} rotation={[0, Math.PI / 2, 0]}>
          <mesh userData={{ isThermometer: true }}>
            <planeGeometry args={[0.075, 0.095]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.8} />
          </mesh>

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

          <mesh position={[0, 0.014, 0.001]} userData={{ isThermometer: true }}>
            <planeGeometry args={[0.068, 0.024]} />
            <meshBasicMaterial color={showFlash ? '#ffffff' : '#020617'} />
          </mesh>

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

          {/* Emisyon Ayar Bloğu */}
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

          <mesh
            position={[-0.018, -0.025, 0.001]}
            onPointerDown={handleEmissivityDown}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.024, 0.011]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <Text position={[-0.018, -0.025, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" anchorY="middle">
            -
          </Text>

          <mesh
            position={[0.018, -0.025, 0.001]}
            onPointerDown={handleEmissivityUp}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.024, 0.011]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <Text position={[0.018, -0.025, 0.002]} fontSize={0.007} color="#ffffff" anchorX="center" anchorY="middle">
            +
          </Text>

          {/* TETİK BUTONU */}
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

        {/* ===== ARKA DİJİTAL LCD / OLED EKRAN PANELİ (OPERATÖRÜN DOĞRUDAN GÖRÜŞ ÇİZGİSİNDE) ===== */}
        <group
          position={[0, variant === 'heitronics' ? 0.005 : -0.005, variant === 'heitronics' ? 0.0735 : 0.0665]}
          rotation={[0, 0, 0]}
        >
          {/* Çerçeve Bezel */}
          <mesh userData={{ isThermometer: true }}>
            <boxGeometry args={[0.056, 0.046, 0.003]} />
            <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.8} />
          </mesh>

          {/* LCD Panel Camı */}
          <mesh position={[0, 0, 0.0018]} userData={{ isThermometer: true }}>
            <planeGeometry args={[0.052, 0.042]} />
            <meshBasicMaterial color={showFlash ? '#ffffff' : '#020617'} side={THREE.DoubleSide} />
          </mesh>

          {/* Üst Durum Satırı: SCAN / HOLD & Metrolojik Durum */}
          <Text
            position={[-0.016, 0.015, 0.0022]}
            fontSize={0.0036}
            color={isHold ? '#38bdf8' : '#22c55e'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {isHold ? '🔒 HOLD' : '⚡ SCAN'}
          </Text>
          <Text
            position={[0.014, 0.015, 0.0022]}
            fontSize={0.0033}
            color={readingStatus === 'OK' ? '#4ade80' : readingStatus === 'UNDER' ? '#facc15' : '#ef4444'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {readingStatus === 'OK' ? '● KALİBRE' : readingStatus === 'UNDER' ? '▲ LO ARALIK' : '▼ HI ARALIK'}
          </Text>

          {/* BÜYÜK DİJİTAL SICAKLIK EKRANI */}
          <Text
            position={[0, 0.003, 0.0022]}
            fontSize={0.0092}
            color={displayColor}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {readingStr}
          </Text>

          {/* Hedef Bilgisi (Siyah Cisim / IR Kalibratör / Ortam) */}
          <Text
            position={[0, -0.008, 0.0022]}
            fontSize={0.0032}
            color={hasHitTarget ? (isCenteredUI ? '#facc15' : '#38bdf8') : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {targetName.length > 20 ? targetName.substring(0, 19) + '…' : targetName}
          </Text>

          {/* Alt Satır: Emisyon Katsayısı ε & Dalgaboyu */}
          <Text
            position={[-0.014, -0.016, 0.0022]}
            fontSize={0.0032}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            ε: {emissivity.toFixed(2)}
          </Text>
          <Text
            position={[0.015, -0.016, 0.0022]}
            fontSize={0.0030}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {wavelengthLabel.split(' ')[0]}
          </Text>
        </group>

        {/* ===== ARKA PANELDE MASAYA BIRAK BUTONU ===== */}
        <group
          position={[0, variant === 'heitronics' ? -0.026 : -0.034, variant === 'heitronics' ? 0.0735 : 0.0665]}
          rotation={[0, 0, 0]}
        >
          <mesh
            userData={{ isThermometer: true }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              if (isGrabbed) {
                placeOnTable()
              } else {
                grabDevice('left')
              }
            }}
          >
            <planeGeometry args={[0.052, 0.012]} />
            <meshStandardMaterial color={isGrabbed ? "#2563eb" : "#059669"} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0, 0.001]}
            fontSize={0.0042}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {isGrabbed ? "MASAYA BIRAK" : "ELE AL / TUT"}
          </Text>
        </group>

        {/* Aktif Tutulduğunda Canlı Holografik HUD (Baş Üstü Gösterge) */}
        {isGrabbed && (
          <group position={[0, 0.14, 0]} rotation={[0, heldHand === 'left' ? -0.15 : 0.15, 0]}>
            <mesh>
              <planeGeometry args={[0.25, 0.096]} />
              <meshBasicMaterial color="#090d16" transparent opacity={0.94} />
            </mesh>
            <mesh position={[0, 0, -0.001]}>
              <planeGeometry args={[0.254, 0.100]} />
              <meshBasicMaterial color={isCenteredUI ? '#facc15' : '#0284c7'} transparent opacity={0.8} />
            </mesh>
            <Text
              position={[0, 0.032, 0.003]}
              fontSize={0.0080}
              color={color}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {modelName} ({heldHand === 'left' ? '🖐️ SOL EL' : '🖐️ SAĞ EL'})
            </Text>
            <Text
              position={[0, 0.018, 0.003]}
              fontSize={0.0064}
              color={isCenteredUI ? '#facc15' : '#38bdf8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {targetName}
            </Text>

            {/* BÜYÜK DİJİTAL CANLI OKUMA DEĞERİ */}
            <Text
              position={[0, 0.002, 0.003]}
              fontSize={0.0115}
              color={displayColor}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {readingStr}
            </Text>
            <Text
              position={[0, -0.012, 0.003]}
              fontSize={0.0055}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              {hasHitTarget ? `Referans: ${currentRefTemp.current.toFixed(1)} °C | ε: ${emissivity.toFixed(2)}` : `Hedefe Doğrultun | ε: ${emissivity.toFixed(2)}`}
            </Text>

            {isCenteredUI && (
              <Text
                position={[0, -0.023, 0.003]}
                fontSize={0.0052}
                color="#facc15"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                📳 TİTREŞİM AKTİF - MERKEZ ODAKLANDI
              </Text>
            )}

            {/* Masaya Bırak Butonu */}
            <group
              position={[0, -0.035, 0.003]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation()
                placeOnTable()
              }}
            >
              <mesh>
                <boxGeometry args={[0.18, 0.015, 0.002]} />
                <meshStandardMaterial color="#22c55e" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.002]} fontSize={0.0054} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/arial.ttf">
                ⬇️ Masadaki Yerine Bırak ({heldHand === 'left' ? 'Y' : 'B'})
              </Text>
            </group>
          </group>
        )}
      </group>
    </>
  )
}
