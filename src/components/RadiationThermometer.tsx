import { useRef, useState, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface RadiationThermometerProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  ambientTemp?: number
  modelName?: string
  onSaveMeasurement?: (refTemp: number, measuredTemp: number, deviceName: string) => void
}

const _worldPos = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()
const _parentQuat = new THREE.Quaternion()

export default function RadiationThermometer({
  position,
  rotation = [0, 0, 0],
  color = "#d32f2f",
  ambientTemp = 25,
  modelName = "LAND CYCLOPS",
  onSaveMeasurement
}: RadiationThermometerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [reading, setReading] = useState(ambientTemp)
  const [emissivity, setEmissivity] = useState(1.00)
  const [showFlash, setShowFlash] = useState(false)
  
  const { scene, gl, camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const currentRefTemp = useRef(ambientTemp)
  const prevTriggerState = useRef(false)
  const prevAState = useRef(false)
  const prevBState = useRef(false)

  useFrame(() => {
    if (groupRef.current && isGrabbed) {
      const worldPos = new THREE.Vector3()
      const worldDir = new THREE.Vector3(0, 0, -1)
      
      groupRef.current.getWorldPosition(worldPos)
      worldDir.transformDirection(groupRef.current.matrixWorld)
      
      raycaster.current.camera = camera
      raycaster.current.set(worldPos, worldDir)
      
      let intersects: THREE.Intersection[] = []
      try {
        const meshes: THREE.Mesh[] = []
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && !obj.userData?.isThermometer) {
            meshes.push(obj)
          }
        })
        intersects = raycaster.current.intersectObjects(meshes, false)
      } catch {
        // Skip safely
      }

      let foundTemp = ambientTemp
      let hitTarget = false

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object
        while (curr) {
          if (curr.userData && typeof curr.userData.currentTemp === 'number') {
            foundTemp = curr.userData.currentTemp
            hitTarget = true
            break
          }
          curr = curr.parent
        }
        if (hitTarget) break
      }

      if (hitTarget) {
        currentRefTemp.current = foundTemp
        const tKelvin = Math.max(0, foundTemp + 273.15)
        const measuredKelvin = tKelvin * Math.pow(1.0 / emissivity, 0.25)
        setReading(Math.max(-50, measuredKelvin - 273.15))
      } else {
        currentRefTemp.current = ambientTemp
        setReading(foundTemp)
      }
    } else if (!isGrabbed) {
      currentRefTemp.current = ambientTemp
      setReading(ambientTemp)
    }

    // VR Controller Pose Tracking when grabbed (handles world to local conversion)
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

    // VR Controller Logic (Buttons & Measurement Trigger)
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

      if (aPressed && !prevAState.current && isHovered && !isGrabbed) {
        setIsGrabbed(true)
        setIsHovered(false)
      }

      if (bPressed && !prevBState.current && isGrabbed) {
        setIsGrabbed(false)
      }

      if (isGrabbed && triggerPressed && !prevTriggerState.current) {
        if (onSaveMeasurement) {
          onSaveMeasurement(currentRefTemp.current, reading, modelName)
          setShowFlash(true)
          setTimeout(() => setShowFlash(false), 200)
        }
      }
      
      prevTriggerState.current = triggerPressed
      prevAState.current = aPressed
      prevBState.current = bPressed
    }
  })

  const handleEmissivityDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(e => Math.max(0.10, Math.round((e - 0.01) * 100) / 100))
  }, [])

  const handleEmissivityUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setEmissivity(e => Math.min(1.00, Math.round((e + 0.01) * 100) / 100))
  }, [])

  const handleSave = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (onSaveMeasurement) {
      onSaveMeasurement(currentRefTemp.current, reading, modelName)
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 200)
    }
  }, [onSaveMeasurement, reading, modelName])

  return (
    <group position={position} rotation={rotation}>
      <group 
        ref={groupRef}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!isGrabbed && gl.xr.isPresenting) {
            setIsHovered(true)
          }
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setIsHovered(false)
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!gl.xr.isPresenting) {
            // @ts-ignore
            if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId)
            setIsGrabbed(true)
          }
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!gl.xr.isPresenting) {
            // @ts-ignore
            if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId)
            setIsGrabbed(false)
          }
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (gl.xr.isPresenting) {
            setIsGrabbed((prev) => !prev)
          }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (isGrabbed && groupRef.current && !gl.xr.isPresenting) {
            const dir = e.ray.direction.clone()
            const distance = 0.4
            const pos = e.ray.origin.clone().add(dir.clone().multiplyScalar(distance))
            groupRef.current.position.copy(pos)
            
            const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.normalize())
            groupRef.current.quaternion.copy(targetRotation)
          }
        }}
      >
        {/* ===== VR Hover Popup (3D Text - visible in VR) ===== */}
        {isHovered && !isGrabbed && (
          <group position={[0, 0.14, 0]}>
            <mesh>
              <planeGeometry args={[0.22, 0.045]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.85} />
            </mesh>
            <Text
              position={[0, 0, 0.001]}
              fontSize={0.012}
              color="#4CAF50"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
            >
              Tetik veya (A) ile Kavra
            </Text>
          </group>
        )}

        {/* ===== Pyrometer Body ===== */}
        
        {/* Main Body */}
        <mesh position={[0, 0, 0]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.06, 0.08, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>

        {/* Side Black Panels (Rubber grips) */}
        <mesh position={[0, 0, -0.01]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.062, 0.07, 0.08]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>

        {/* Handle */}
        <mesh position={[0, -0.08, 0.02]} rotation={[0.3, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.015, 0.018, 0.12, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>

        {/* Desktop Stand Dock (Stable base on the table) */}
        <mesh position={[0, -0.138, 0.035]}>
          <boxGeometry args={[0.075, 0.01, 0.075]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>

        {/* Lens Barrel (Black, protruding front) */}
        <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 32]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>

        {/* Inner Lens (Glassy) */}
        <mesh position={[0, 0, -0.106]} userData={{ isThermometer: true }}>
          <circleGeometry args={[0.02, 32]} />
          <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Viewfinder (Small hole on the back) */}
        <mesh position={[0, 0.02, 0.061]} userData={{ isThermometer: true }}>
          <circleGeometry args={[0.01, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Laser beam when grabbed */}
        {isGrabbed && (
          <mesh position={[0, 0, -0.56]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
            <cylinderGeometry args={[0.001, 0.001, 1.0, 8]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
          </mesh>
        )}

        {/* ===== 3D LCD Screen Panel (Visible in VR!) ===== */}
        <group position={[0.032, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          {/* Screen Background */}
          <mesh position={[0, 0, 0]} userData={{ isThermometer: true }}>
            <planeGeometry args={[0.065, 0.09]} />
            <meshStandardMaterial color="#222222" />
          </mesh>

          {/* Model Name */}
          <Text
            position={[0, 0.035, 0.001]}
            fontSize={0.006}
            color="#888888"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {modelName}
          </Text>

          {/* Temperature Display Background */}
          <mesh position={[0, 0.018, 0.001]} userData={{ isThermometer: true }}>
            <planeGeometry args={[0.058, 0.022]} />
            <meshBasicMaterial color={showFlash ? '#ffffff' : '#000000'} />
          </mesh>
          
          {/* Temperature Value */}
          <Text
            position={[0, 0.018, 0.002]}
            fontSize={0.012}
            color={showFlash ? '#000000' : '#00ff00'}
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {reading.toFixed(1)} °C
          </Text>

          {/* Emissivity Label */}
          <Text
            position={[-0.01, -0.002, 0.001]}
            fontSize={0.005}
            color="#aaaaaa"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            EMISSIVITY
          </Text>

          {/* Emissivity Value */}
          <Text
            position={[0.02, -0.002, 0.001]}
            fontSize={0.007}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            {emissivity.toFixed(2)}
          </Text>

          {/* Emissivity - Button */}
          <mesh 
            position={[-0.016, -0.02, 0.001]} 
            onPointerDown={handleEmissivityDown}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.025, 0.012]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          <Text
            position={[-0.016, -0.02, 0.002]}
            fontSize={0.008}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            -
          </Text>

          {/* Emissivity + Button */}
          <mesh 
            position={[0.016, -0.02, 0.001]} 
            onPointerDown={handleEmissivityUp}
            userData={{ isThermometer: true }}
          >
            <planeGeometry args={[0.025, 0.012]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          <Text
            position={[0.016, -0.02, 0.002]}
            fontSize={0.008}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            +
          </Text>

          {/* Save Measurement Button */}
          {onSaveMeasurement && (
            <>
              <mesh 
                position={[0, -0.036, 0.001]} 
                onPointerDown={handleSave}
                userData={{ isThermometer: true }}
              >
                <planeGeometry args={[0.058, 0.012]} />
                <meshStandardMaterial color="#4CAF50" />
              </mesh>
              <Text
                position={[0, -0.036, 0.002]}
                fontSize={0.005}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                font="/fonts/arial.ttf"
              >
                ÖLÇÜMÜ KAYDET
              </Text>
            </>
          )}
        </group>
      </group>
    </group>
  )
}
