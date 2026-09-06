

import { TeleportTarget } from '@react-three/xr'
import type * as THREE from 'three'

interface LabRoomProps {
  onTeleport?: (point: THREE.Vector3) => void
}

export default function LabRoom({ onTeleport }: LabRoomProps = {}) {
  // Colors based on the provided image
  const wallColor = "#e5e1c8" // Warm beige / cream
  const floorColor = "#95928d" // Warm matte grey / linoleum
  const ceilingColor = "#f0f0f0"
  const tableColor = "#b0b0b0"

  return (
    <group>
      {/* Floor with WebXR TeleportTarget */}
      <TeleportTarget onTeleport={onTeleport}>
        <mesh position={[1.1, -0.1, 0]} receiveShadow>
          <boxGeometry args={[12.2, 0.2, 10]} />
          <meshStandardMaterial color={floorColor} roughness={0.7} metalness={0.1} />
        </mesh>
      </TeleportTarget>

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

      {/* Center Table */}
      <mesh position={[0, 0.45, -0.5]} receiveShadow castShadow>
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
