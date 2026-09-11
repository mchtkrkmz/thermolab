import { useMemo, memo } from 'react'
import * as THREE from 'three'

interface FrostPointConnectionProps {
  startPos?: [number, number, number]
  endPos?: [number, number, number]
}

function FrostPointConnection({
  startPos = [-3.97, 0.88, 1.83], // Thunder Scientific Swagelok Gas Outlet
  endPos = [-4.09, 1.01, 0.75],   // Frost Point Mirror Gas Inlet
}: FrostPointConnectionProps) {
  // 1. STAINLESS STEEL FLEXIBLE GAS SAMPLING TUBE (BORU)
  const gasTubeGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(startPos[0], startPos[1], startPos[2]),
      new THREE.Vector3(startPos[0] - 0.05, startPos[1] + 0.16, startPos[2] - 0.10),
      new THREE.Vector3(startPos[0] - 0.11, startPos[1] + 0.16, startPos[2] - 0.33),
      new THREE.Vector3(-4.12, 0.98, 1.35),
      new THREE.Vector3(-4.11, 0.98, 1.05),
      new THREE.Vector3(endPos[0] - 0.02, endPos[1] + 0.04, endPos[2] + 0.12),
      new THREE.Vector3(endPos[0], endPos[1], endPos[2]),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 64, 0.009, 12, false)
  }, [startPos, endPos])

  // 2. DATA & SENSOR COMMUNICATION CABLE (KABLO)
  const dataCableGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(startPos[0] + 0.06, startPos[1] - 0.04, startPos[2] - 0.04),
      new THREE.Vector3(startPos[0] + 0.02, startPos[1] + 0.10, startPos[2] - 0.20),
      new THREE.Vector3(-4.16, 0.93, 1.35),
      new THREE.Vector3(-4.16, 0.93, 1.05),
      new THREE.Vector3(endPos[0] + 0.08, endPos[1] - 0.02, endPos[2] + 0.08),
      new THREE.Vector3(endPos[0] + 0.07, endPos[1], endPos[2]),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 48, 0.0055, 10, false)
  }, [startPos, endPos])

  return (
    <group>
      {/* ========================================================
          1. STAINLESS STEEL / PTFE GAS SAMPLING TUBE (BORU)
         ======================================================== */}
      {/* Gas Tube Mesh with Metallic Sheen */}
      <mesh geometry={gasTubeGeometry} castShadow>
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.92}
          roughness={0.25}
          wireframe={false}
        />
      </mesh>

      {/* Start Swagelok Fitting Coupling Collar */}
      <mesh position={[startPos[0], startPos[1] + 0.01, startPos[2]]}>
        <cylinderGeometry args={[0.015, 0.015, 0.025, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* End Swagelok Fitting Coupling Collar */}
      <mesh position={[endPos[0], endPos[1], endPos[2] + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.025, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Insulated Tube Clamps along the side of the table */}
      {[1.35, 1.05].map((cz, ci) => (
        <mesh key={`clamp-${ci}`} position={[-4.11, 0.97, cz]}>
          <boxGeometry args={[0.022, 0.026, 0.018]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      ))}

      {/* ========================================================
          2. HIGH-FLEX DATA & INTERFACE CABLE (KABLO)
         ======================================================== */}
      {/* Black Flexible Cable Mesh */}
      <mesh geometry={dataCableGeometry} castShadow>
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {/* Data Cable Strain-Relief Boot (Start) */}
      <mesh position={[startPos[0] + 0.05, startPos[1] - 0.03, startPos[2] - 0.03]}>
        <cylinderGeometry args={[0.010, 0.010, 0.022, 12]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>

      {/* Data Cable Strain-Relief Boot (End) */}
      <mesh position={[endPos[0] + 0.07, endPos[1], endPos[2] + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.020, 12]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
    </group>
  )
}

export default memo(FrostPointConnection)
