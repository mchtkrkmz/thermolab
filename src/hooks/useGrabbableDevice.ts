import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { deviceGrabManager } from '../utils/deviceGrabManager'

export interface GrabbableDeviceOptions {
  initialPosition: [number, number, number]
  initialRotation: [number, number, number]
  snoutOffset?: [number, number, number] // Namlu/Lens çıkış noktası (yerel koordinat)
  rayDirection?: [number, number, number] // Işın yönü (varsayılan [0, 0, -1])
  baseTemp?: number
  minRangeTemp?: number
  maxRangeTemp?: number
  onMeasure?: (temp: number, targetName: string) => void
}

export interface GrabbableDeviceReturn {
  groupRef: React.RefObject<THREE.Group | null>
  isGrabbed: boolean
  heldHand: 'left' | 'right' | null
  isHovered: boolean
  isReturning: boolean
  detectedTemp: number
  targetName: string
  hasHitTarget: boolean
  laserHitDistance: number
  grab: (hand?: 'left' | 'right') => void
  release: () => void
  handlers: {
    onPointerDown: (e: any) => void
    onPointerUp: (e: any) => void
    onPointerOver: (e: any) => void
    onPointerOut: (e: any) => void
  }
}

const _localMat = new THREE.Matrix4()
const _worldMat = new THREE.Matrix4()
const _scaleVec = new THREE.Vector3()

export function useGrabbableDevice({
  initialPosition,
  initialRotation,
  snoutOffset = [0, 0.04, -0.07],
  rayDirection = [0, 0, -1],
  baseTemp = 25,
  minRangeTemp = -50,
  maxRangeTemp = 2000,
  onMeasure,
}: GrabbableDeviceOptions): GrabbableDeviceReturn {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, gl, camera } = useThree()

  const deviceId = useMemo(() => `device_${initialPosition.join('_')}`, [initialPosition])

  const [heldHand, setHeldHand] = useState<'left' | 'right' | null>(null)
  const isGrabbed = heldHand !== null

  const [isHovered, setIsHovered] = useState(false)
  const isHoveredRef = useRef(false)
  const [isReturning, setIsReturning] = useState(false)
  const [detectedTemp, setDetectedTemp] = useState(baseTemp)
  const [targetName, setTargetName] = useState('Ortam / Boşluk')
  const [hasHitTarget, setHasHitTarget] = useState(false)
  const [laserHitDistance, setLaserHitDistance] = useState(1.5)

  const returnTimer = useRef(0)
  const lastHapticTime = useRef(0)
  const raycaster = useRef(new THREE.Raycaster())

  const _initPos = useRef(new THREE.Vector3(...initialPosition))
  const _initRot = useRef(new THREE.Euler(...initialRotation))
  const _initQuat = useRef(new THREE.Quaternion().setFromEuler(_initRot.current))

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

  const _rayOrigin = useRef(new THREE.Vector3())
  const _rayDir = useRef(new THREE.Vector3())

  const prevTriggerState = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  const prevDropState = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })

  // Cihazı masaya güvenli geri bırakma (YERE ASLA DÜŞMEZ)
  const release = useCallback(() => {
    setHeldHand(null)
    setIsReturning(true)
    returnTimer.current = 0
    if (deviceGrabManager.getHeldId() === deviceId) {
      deviceGrabManager.setHeld(null)
    }
  }, [deviceId])

  // Cihazı tutma fonksiyonu (Sol veya Sağ el)
  const grab = useCallback((hand: 'left' | 'right' = 'left') => {
    if (!deviceGrabManager.canGrab(deviceId)) return
    deviceGrabManager.setHeld(deviceId)
    setHeldHand(hand)
    setIsReturning(false)
  }, [deviceId])

  // Central manager registration
  useEffect(() => {
    deviceGrabManager.register({
      id: deviceId,
      name: `Device_${initialPosition[0]}`,
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
        grab(hand ?? 'left')
      },
      release: () => {
        release()
      },
      isHeld: () => isGrabbed
    })

    return () => {
      deviceGrabManager.unregister(deviceId)
    }
  }, [deviceId, initialPosition, isGrabbed, grab, release])

  // Masaüstü klavye kısayolu (X = Ele Al, Y / Esc = Masaya Bırak, Boşluk / T = Ölçüm)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!isGrabbed && key === 'x') {
        e.preventDefault()
        grab('left')
      } else if (isGrabbed && (key === 'y' || e.code === 'Escape')) {
        e.preventDefault()
        release()
      } else if (isGrabbed && (e.code === 'Space' || key === 't')) {
        e.preventDefault()
        if (onMeasure) onMeasure(detectedTemp, targetName)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isGrabbed, release, grab, onMeasure, detectedTemp, targetName])

  useFrame((_, delta, frame) => {
    if (!groupRef.current) return
    const group = groupRef.current

    // 1. WEBXR NATIVE POSE İLE KONTROLCÜLERİ HASSAS İZLE
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
                _localMat.fromArray(pose.transform.matrix)
                _worldMat.multiplyMatrices(originMatrix, _localMat)
                _worldMat.decompose(
                  handPos.current[h],
                  handQuat.current[h],
                  _scaleVec
                )
                handActive.current[h] = true
              }
            }
          }
        }
      }
    }

    // 2. DÜŞMEYİ ENGELLEYEN MASAYA GÜVENLİ DÖNÜŞ (SAFE RETURN ANIMATION)
    if (isReturning) {
      returnTimer.current += delta
      const factor = Math.min(1.0, delta * 9.5)
      group.position.lerp(_initPos.current, factor)
      group.quaternion.slerp(_initQuat.current, factor)

      if (group.position.distanceTo(_initPos.current) < 0.005 || returnTimer.current > 0.8) {
        group.position.copy(_initPos.current)
        group.quaternion.copy(_initQuat.current)
        setIsReturning(false)
        if (deviceGrabManager.getHeldId() === deviceId) {
          deviceGrabManager.setHeld(null)
        }
      }
    }

    // 3. VR KONTROLCÜ (SOL VEYA SAĞ EL) VEYA MASAÜSTÜ POZ TAKİBİ
    if (isGrabbed && heldHand) {
      if (gl.xr.isPresenting && handActive.current[heldHand]) {
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

        // VR Buton Kontrolleri
        if (session && session.inputSources) {
          let source: XRInputSource | undefined
          for (let i = 0; i < session.inputSources.length; i++) {
            if (session.inputSources[i]?.handedness === heldHand) {
              source = session.inputSources[i]
              break
            }
          }
          if (source && source.gamepad) {
            const dropBtn = !!source.gamepad.buttons[5]?.pressed // Sol: [Y], Sağ: [B]
            const trigger = !!source.gamepad.buttons[0]?.pressed

            const prevTrig = prevTriggerState.current[heldHand]
            const prevDrop = prevDropState.current[heldHand]

            if (dropBtn && !prevDrop) {
              release()
            }

            if (trigger && !prevTrig && onMeasure) {
              onMeasure(detectedTemp, targetName)
              const haptic = (source.gamepad.hapticActuators?.[0] || (source.gamepad as any)?.vibrationActuator) as any
              if (haptic && typeof haptic.pulse === 'function') {
                try {
                  haptic.pulse(1.0, 100)
                } catch {}
              }
            }

            prevTriggerState.current[heldHand] = trigger
            prevDropState.current[heldHand] = dropBtn
          }
        }
      } else if (!gl.xr.isPresenting) {
        // Masaüstü Modu: Kameranın önüne ergonomik yerleştir
        const camPos = camera.position.clone()
        const camQuat = camera.quaternion.clone()
        const offset = new THREE.Vector3(0.20, -0.16, -0.52).applyQuaternion(camQuat)
        const targetPos = camPos.add(offset)
        group.position.lerp(targetPos, delta * 14.0)
        group.quaternion.slerp(camQuat, delta * 14.0)
      }
    }

    // 4. CANLI IŞIN İZLEME VE HEDEF SICAKLIK TESPİTİ (RAYCASTING)
    if (!gl.xr.isPresenting && isGrabbed) {
      _rayOrigin.current.copy(camera.position)
      _rayDir.current.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize()
    } else {
      _rayOrigin.current.set(...snoutOffset)
      group.localToWorld(_rayOrigin.current)
      _rayDir.current.set(...rayDirection).transformDirection(group.matrixWorld).normalize()
    }
    raycaster.current.camera = camera
    raycaster.current.set(_rayOrigin.current, _rayDir.current)
    raycaster.current.far = 10.0

    let foundTemp = baseTemp
    let foundName = 'Laboratuvar Masası / Ortam'
    let isSpecial = false
    let isApertureCenter = false
    let hitDist = 3.0

    // A) AKILLI OPTİK KONİ HEDEF KİLİTLEME
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

          const toTarget = targetPos.clone().sub(_rayOrigin.current)
          const forwardDist = toTarget.dot(_rayDir.current)

          if (forwardDist > 0.05 && forwardDist < 10.0) {
            const distToRay = raycaster.current.ray.distanceToPoint(targetPos)
            const maxThreshold = obj.userData?.isApertureCenter ? 0.16 : 0.24

            if (distToRay < maxThreshold && distToRay < bestProximityDist) {
              bestProximityDist = distToRay
              const tempVal = typeof obj.userData.currentTemp === 'number'
                ? obj.userData.currentTemp
                : typeof obj.userData.temperature === 'number'
                ? obj.userData.temperature
                : baseTemp

              const isCenter = distToRay < 0.075 || !!obj.userData.isApertureCenter
              proximityHit = {
                temp: tempVal,
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
      foundName = proximityHit.name
      isSpecial = true
      isApertureCenter = proximityHit.isCenter
      hitDist = proximityHit.dist
      setLaserHitDistance(hitDist)
    } else {
      // B) FİZİKSEL YÜZEY RAYCAST KESİŞİMİ
      let intersects: THREE.Intersection[] = []
      try {
        const candidates: THREE.Mesh[] = []
        scene.traverse((obj) => {
          if (
            obj instanceof THREE.Mesh &&
            obj.visible &&
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
              candidates.push(obj)
            }
          }
        })
        intersects = raycaster.current.intersectObjects(candidates, false)
      } catch {}

      if (intersects.length > 0) {
        const hit = intersects[0]
        hitDist = Math.max(0.15, hit.distance)
        setLaserHitDistance(hitDist)

        let cur: THREE.Object3D | null = hit.object
        while (cur) {
          if (cur.userData) {
            if (cur.userData.isBlackBody || typeof cur.userData.temperature === 'number' || typeof cur.userData.currentTemp === 'number' || cur.userData.isIRCalibrator) {
              const rawTemp = typeof cur.userData.currentTemp === 'number'
                ? cur.userData.currentTemp
                : cur.userData.temperature

              if (typeof rawTemp === 'number') {
                foundTemp = rawTemp
                isSpecial = true

                const centerPos = new THREE.Vector3()
                hit.object.getWorldPosition(centerPos)
                if (cur.userData.isApertureCenter || hit.point.distanceTo(centerPos) < 0.075) {
                  isApertureCenter = true
                  foundName = cur.userData.isBlackBody
                    ? (cur.userData.sourceName ? `🎯 ${cur.userData.sourceName} AKKOR KAVİTE` : '🎯 SİYAH CİSİM TAM ORTASI (AKKOR KAVİTE)')
                    : (cur.userData.sourceName ? `🎯 ${cur.userData.sourceName} TAM ORTASI` : '🎯 IR KALİBRATÖR TAM ORTASI')
                } else {
                  foundName = cur.userData.isBlackBody
                    ? (cur.userData.sourceName ? `🎯 ${cur.userData.sourceName} Ön Plaka` : '🎯 Siyah Cisim Ön Plakası')
                    : (cur.userData.sourceName ? `🎯 ${cur.userData.sourceName} Plakası` : '🎯 IR Kalibratör Plakası')
                }
                break
              }
            }
          }
          cur = cur.parent
        }
      } else {
        setLaserHitDistance(2.5)
        foundTemp = baseTemp
        foundName = 'Ortam / Boşluk'
        isSpecial = false
        isApertureCenter = false
      }
    }

    const noise = (Math.random() - 0.5) * 0.15
    const clampedTemp = Math.min(maxRangeTemp, Math.max(minRangeTemp, Number((foundTemp + (isSpecial ? 0 : noise)).toFixed(1))))

    setDetectedTemp(clampedTemp)
    setTargetName(foundName)
    setHasHitTarget(isSpecial)

    if (onMeasure && isGrabbed) {
      onMeasure(clampedTemp, foundName)
    }

    // SİYAH CİSMİN VEYA IR KALİBRATÖRÜN TAM ORTASINA TUTULUNCA JOYSTİCK TİTRESİN
    if (isApertureCenter && isGrabbed && gl.xr.isPresenting && heldHand) {
      const now = performance.now()
      if (now - lastHapticTime.current > 110) {
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
          const hapticActuator = (source?.gamepad?.hapticActuators?.[0] || (source?.gamepad as any)?.vibrationActuator) as any
          if (hapticActuator && typeof hapticActuator.pulse === 'function') {
            try {
              hapticActuator.pulse(0.85, 75)
            } catch {}
          }
        }
      }
    }

    // 5. VR KONTROLCÜ İLE ELE ALMA (SOL VEYA SAĞ EL İLE)
    if (!isGrabbed && !isReturning && gl.xr.isPresenting && session) {
      session.inputSources.forEach((source) => {
        const h = source.handedness
        if ((h === 'left' || h === 'right') && source.gamepad && handActive.current[h]) {
          const trigger = !!source.gamepad.buttons[0]?.pressed
          const grip = !!source.gamepad.buttons[1]?.pressed
          const primaryBtn = !!source.gamepad.buttons[4]?.pressed // Sol: [X], Sağ: [A]

          const devPos = new THREE.Vector3()
          group.getWorldPosition(devPos)
          const dist = handPos.current[h].distanceTo(devPos)

          if ((trigger || grip || primaryBtn) && (dist < 0.45 || isHoveredRef.current)) {
            grab(h)
          }
        }
      })
    }
  })

  // Pointer Etkileşim İşleyicileri
  const handlers = {
    onPointerDown: (e: any) => {
      e.stopPropagation()
      if (!isGrabbed) {
        const h = e.nativeEvent?.inputSource?.handedness === 'left' ? 'left' : 'right'
        grab(h)
      } else {
        if (onMeasure) {
          onMeasure(detectedTemp, targetName)
        }
      }
    },
    onPointerUp: (e: any) => {
      e.stopPropagation()
    },
    onPointerOver: (e: any) => {
      e.stopPropagation()
      setIsHovered(true)
      isHoveredRef.current = true
    },
    onPointerOut: () => {
      setIsHovered(false)
      isHoveredRef.current = false
    },
  }

  return {
    groupRef,
    isGrabbed,
    heldHand,
    isHovered,
    isReturning,
    detectedTemp,
    targetName,
    hasHitTarget,
    laserHitDistance,
    grab,
    release,
    handlers,
  }
}
