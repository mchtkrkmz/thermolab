import { useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface ThermometerProps {
  temperature: number // default ambient
  position: [number, number, number]
  color?: string // Not strictly used for IR gun, but kept for compatibility
}

export default function Thermometer({ temperature, position }: ThermometerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [reading, setReading] = useState(temperature)
  const [isHovered, setIsHovered] = useState(false)
  const { scene, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const prevAState = useRef(false)
  const prevBState = useRef(false)

  useFrame(() => {
    if (groupRef.current && isGrabbed) {
      // Raycast forward (-Z) from the gun's barrel
      const worldPos = new THREE.Vector3()
      const worldDir = new THREE.Vector3(0, 0, -1)
      
      groupRef.current.getWorldPosition(worldPos)
      worldDir.transformDirection(groupRef.current.matrixWorld)
      
      raycaster.current.set(worldPos, worldDir)
      
      // Find intersections
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      let foundTemp = temperature // default to ambient
      for (const hit of intersects) {
        // Skip the thermometer itself and its laser
        if (hit.object.userData && hit.object.userData.isThermometer) continue;
        
        // If we hit the black body cavity, read its temperature
        if (hit.object.userData && hit.object.userData.temperature !== undefined) {
          foundTemp = hit.object.userData.temperature
          break
        }
      }
      setReading(foundTemp)
    } else if (!isGrabbed) {
      // Return to reading ambient when not in use
      setReading(temperature)
    }

    // VR Controller Pose Tracking when grabbed
    if (isGrabbed && groupRef.current && gl.xr.isPresenting) {
      const controller = gl.xr.getController(0)
      if (controller) {
        controller.getWorldPosition(groupRef.current.position)
        controller.getWorldQuaternion(groupRef.current.quaternion)
      }
    }

    // VR Controller Buttons (A to Grab, B to Drop)
    const session = gl.xr.getSession()
    if (session) {
      let aPressed = false
      let bPressed = false

      for (const source of session.inputSources) {
        if (source.gamepad) {
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

      prevAState.current = aPressed
      prevBState.current = bPressed
    }
  })

  return (
    <group position={position}>
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
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (isGrabbed && groupRef.current && !gl.xr.isPresenting) {
            const dir = e.ray.direction.clone()
            // Hold it a bit in front of the camera
            const pos = e.ray.origin.clone().add(dir.clone().multiplyScalar(0.4))
            groupRef.current.position.copy(pos)
            
            // Rotate to point exactly where the mouse ray is pointing
            const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.normalize())
            groupRef.current.quaternion.copy(targetRotation)
          }
        }}
      >
        {/* VR Hover Popup */}
        {isHovered && !isGrabbed && (
          <group position={[0, 0.1, 0]}>
            <mesh>
              <planeGeometry args={[0.18, 0.04]} />
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
              Kavramak için (A) tuşuna basın
            </Text>
          </group>
        )}
        {/* --- IR Gun Geometry --- */}
        
        {/* Handle */}
        <mesh position={[0, -0.06, 0.02]} rotation={[0.2, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.015, 0.012, 0.1, 16]} />
          <meshStandardMaterial color="#1a251c" roughness={0.9} /> {/* Dark Green/Grey */}
        </mesh>
        
        {/* Handle Grip (Grey part) */}
        <mesh position={[0, -0.06, 0.01]} rotation={[0.2, 0, 0]} userData={{ isThermometer: true }}>
          <cylinderGeometry args={[0.016, 0.013, 0.08, 16]} />
          <meshStandardMaterial color="#555555" roughness={1} />
        </mesh>

        {/* Main Top Body */}
        <mesh position={[0, 0, 0]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.04, 0.05, 0.1]} />
          <meshStandardMaterial color="#1a251c" roughness={0.8} />
        </mesh>

        {/* Orange Front Casing */}
        <mesh position={[0, 0, -0.045]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.042, 0.052, 0.03]} />
          <meshStandardMaterial color="#ff6600" roughness={0.5} />
        </mesh>

        {/* Orange Back Casing */}
        <mesh position={[0, -0.01, 0.04]} rotation={[-0.1, 0, 0]} userData={{ isThermometer: true }}>
          <boxGeometry args={[0.042, 0.06, 0.03]} />
          <meshStandardMaterial color="#ff6600" roughness={0.5} />
        </mesh>

        {/* Screen (Light Blue Backlight) */}
        <mesh position={[0, 0, 0.056]} rotation={[-0.1, 0, 0]} userData={{ isThermometer: true }}>
          <planeGeometry args={[0.03, 0.03]} />
          <meshStandardMaterial color="#55ccff" emissive="#55ccff" emissiveIntensity={0.6} />
        </mesh>

        {/* Text on Screen */}
        <Text 
          position={[0, 0.005, 0.057]} 
          rotation={[-0.1, 0, 0]} 
          fontSize={0.015} 
          color="#000000" 
          anchorX="center" 
          anchorY="middle"
        >
          {reading.toFixed(1)}
        </Text>
        
        {/* Screen small labels */}
        <Text 
          position={[0, 0.015, 0.057]} 
          rotation={[-0.1, 0, 0]} 
          fontSize={0.005} 
          color="#000000" 
          anchorX="center"
        >
          HOLD
        </Text>

        {/* Buttons below screen */}
        <group position={[0, -0.02, 0.054]} rotation={[-0.1, 0, 0]}>
          {/* Yellow MODE button */}
          <mesh position={[0, -0.01, 0]}>
            <circleGeometry args={[0.004, 16]} />
            <meshStandardMaterial color="#ffdd00" />
          </mesh>
          {/* Red Left/Right buttons */}
          <mesh position={[-0.01, 0, 0]}>
            <circleGeometry args={[0.003, 3]} /> {/* Triangle */}
            <meshStandardMaterial color="#aa0000" />
          </mesh>
          <mesh position={[0.01, 0, 0]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.003, 3]} /> {/* Triangle */}
            <meshStandardMaterial color="#aa0000" />
          </mesh>
        </group>

        {/* Laser Emitter hole (Front) */}
        <mesh position={[0, 0.015, -0.061]} userData={{ isThermometer: true }}>
          <circleGeometry args={[0.004, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* IR Sensor hole (Front) */}
        <mesh position={[0, -0.01, -0.061]} userData={{ isThermometer: true }}>
          <circleGeometry args={[0.01, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        {/* Laser beam (Red line projecting forward) - Only visible when grabbed */}
        {isGrabbed && (
          <mesh position={[0, 0.015, -0.56]} rotation={[Math.PI / 2, 0, 0]} userData={{ isThermometer: true }}>
            <cylinderGeometry args={[0.001, 0.001, 1.0, 8]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.6} />
          </mesh>
        )}
      </group>
    </group>
  )
}
