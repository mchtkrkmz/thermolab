import { useState, useRef } from 'react'
import { TeleportTarget } from '@react-three/xr'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { isPositionValid } from '../utils/collision'

interface LabRoomProps {
  onTeleport?: (point: THREE.Vector3) => void
}

export default function LabRoom({ onTeleport }: LabRoomProps = {}) {
  // Colors based on laboratory metrology environment
  const wallColor = "#e5e1c8" // Warm beige / cream
  const floorColor = "#95928d" // Warm matte grey / linoleum
  const ceilingColor = "#f0f0f0"
  const tableColor = "#b0b0b0"

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
          <meshStandardMaterial color={floorColor} roughness={0.7} metalness={0.1} />
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
              color={isValidHover ? "#0284c7" : "#ef4444"} 
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

      {/* Walls */}
      <mesh position={[1.1, 2.4, -5]} receiveShadow>
        <boxGeometry args={[12.2, 5, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[-5, 2.4, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 10]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[7.2, 2.4, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 10]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0} />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[1.1, 4.9, 0]} receiveShadow>
        <boxGeometry args={[12.2, 0.2, 10]} />
        <meshStandardMaterial color={ceilingColor} roughness={1} />
      </mesh>

      {/* Center Table (Moved towards back wall) */}
      <mesh position={[0, 0.45, -3.8]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.9, 1.2]} />
        <meshStandardMaterial color={tableColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Left Wall Table */}
      <mesh position={[-4.2, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.2, 0.9, 3]} />
        <meshStandardMaterial color={tableColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right Workstation Table (Temperature Calibration Bench - Aligned to Right Wall) */}
      <group position={[6.65, 0, 2.7]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Table Top Surface (Height y=0.85) */}
        <mesh position={[0, 0.825, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.9, 0.05, 0.88]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Stainless Steel Front Rim */}
        <mesh position={[0, 0.825, 0.441]}>
          <boxGeometry args={[1.9, 0.05, 0.005]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* 4 Tubular Metal Legs */}
        {[
          [-0.88, -0.38],
          [0.88, -0.38],
          [-0.88, 0.38],
          [0.88, 0.38]
        ].map(([lx, lz], idx) => (
          <mesh key={`leg-${idx}`} position={[lx, 0.4, lz]} receiveShadow castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.8, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Lower Storage Shelf */}
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.76, 0.02, 0.78]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
