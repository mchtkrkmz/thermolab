import { useMemo } from 'react'
import * as THREE from 'three'

interface CalibrationProbesAndCablesProps {
  dry1Pos: [number, number, number] // Position of Dry-Well 1
  dry2Pos: [number, number, number] // Position of Dry-Well 2
  bridgePos: [number, number, number] // Position of Resistance Bridge
}

/**
 * 4 Precision Temperature Probes (SPRT & PRT) and Neat Cable Harness
 * Cleanly routed along the rear edge of the right wall workstation table into the Resistance Bridge.
 */
export default function CalibrationProbesAndCables({
  dry1Pos = [6.65, 0.85, 2.05],
  dry2Pos = [6.65, 0.85, 2.55],
  bridgePos = [6.65, 0.85, 3.20]
}: CalibrationProbesAndCablesProps) {
  // Probes in Dry-Well 1 (MK-9142, rotated -Math.PI / 2)
  // Well top is at y = dry1Pos[1] + 0.37
  const p1Top = useMemo<[number, number, number]>(() => [
    dry1Pos[0] + 0.04,
    dry1Pos[1] + 0.52,
    dry1Pos[2] - 0.035
  ], [dry1Pos])

  const p2Top = useMemo<[number, number, number]>(() => [
    dry1Pos[0] + 0.04,
    dry1Pos[1] + 0.50,
    dry1Pos[2] + 0.035
  ], [dry1Pos])

  // Probes in Dry-Well 2 (MK-9150)
  const p3Top = useMemo<[number, number, number]>(() => [
    dry2Pos[0] + 0.04,
    dry2Pos[1] + 0.52,
    dry2Pos[2] - 0.035
  ], [dry2Pos])

  const p4Top = useMemo<[number, number, number]>(() => [
    dry2Pos[0] + 0.04,
    dry2Pos[1] + 0.50,
    dry2Pos[2] + 0.035
  ], [dry2Pos])

  // Resistance Bridge Channel Terminal positions on the front face (facing -x)
  // Bridge front face is at x = bridgePos[0] - 0.17
  // Channels CH1 to CH4 along Z:
  const ch1Terminal = useMemo<[number, number, number]>(() => [
    bridgePos[0] - 0.17,
    bridgePos[1] + 0.08,
    bridgePos[2] - 0.14
  ], [bridgePos])

  const ch2Terminal = useMemo<[number, number, number]>(() => [
    bridgePos[0] - 0.17,
    bridgePos[1] + 0.08,
    bridgePos[2] - 0.10
  ], [bridgePos])

  const ch3Terminal = useMemo<[number, number, number]>(() => [
    bridgePos[0] - 0.17,
    bridgePos[1] + 0.08,
    bridgePos[2] - 0.06
  ], [bridgePos])

  const ch4Terminal = useMemo<[number, number, number]>(() => [
    bridgePos[0] - 0.17,
    bridgePos[1] + 0.08,
    bridgePos[2] - 0.02
  ], [bridgePos])

  // Smooth, organized Catmull-Rom spline curves for each cable
  // Routed cleanly behind the devices along the rear of the table
  const cable1Geom = useMemo(() => {
    const points = [
      new THREE.Vector3(...p1Top),
      new THREE.Vector3(p1Top[0] + 0.08, p1Top[1] + 0.02, p1Top[2]),
      new THREE.Vector3(dry1Pos[0] + 0.18, dry1Pos[1] + 0.04, dry1Pos[2] + 0.15),
      new THREE.Vector3(dry2Pos[0] + 0.18, dry2Pos[1] + 0.04, dry2Pos[2] + 0.20),
      new THREE.Vector3(bridgePos[0] + 0.16, bridgePos[1] + 0.04, bridgePos[2] - 0.20),
      new THREE.Vector3(ch1Terminal[0] - 0.04, bridgePos[1] + 0.06, ch1Terminal[2] - 0.04),
      new THREE.Vector3(...ch1Terminal)
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25)
    return new THREE.TubeGeometry(curve, 36, 0.0035, 8, false)
  }, [p1Top, dry1Pos, dry2Pos, bridgePos, ch1Terminal])

  const cable2Geom = useMemo(() => {
    const points = [
      new THREE.Vector3(...p2Top),
      new THREE.Vector3(p2Top[0] + 0.08, p2Top[1] + 0.02, p2Top[2]),
      new THREE.Vector3(dry1Pos[0] + 0.16, dry1Pos[1] + 0.03, dry1Pos[2] + 0.18),
      new THREE.Vector3(dry2Pos[0] + 0.16, dry2Pos[1] + 0.03, dry2Pos[2] + 0.22),
      new THREE.Vector3(bridgePos[0] + 0.14, bridgePos[1] + 0.04, bridgePos[2] - 0.18),
      new THREE.Vector3(ch2Terminal[0] - 0.03, bridgePos[1] + 0.06, ch2Terminal[2] - 0.03),
      new THREE.Vector3(...ch2Terminal)
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25)
    return new THREE.TubeGeometry(curve, 36, 0.0035, 8, false)
  }, [p2Top, dry1Pos, dry2Pos, bridgePos, ch2Terminal])

  const cable3Geom = useMemo(() => {
    const points = [
      new THREE.Vector3(...p3Top),
      new THREE.Vector3(p3Top[0] + 0.08, p3Top[1] + 0.02, p3Top[2]),
      new THREE.Vector3(dry2Pos[0] + 0.15, dry2Pos[1] + 0.03, dry2Pos[2] + 0.15),
      new THREE.Vector3(bridgePos[0] + 0.12, bridgePos[1] + 0.04, bridgePos[2] - 0.14),
      new THREE.Vector3(ch3Terminal[0] - 0.03, bridgePos[1] + 0.06, ch3Terminal[2] - 0.02),
      new THREE.Vector3(...ch3Terminal)
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25)
    return new THREE.TubeGeometry(curve, 32, 0.0035, 8, false)
  }, [p3Top, dry2Pos, bridgePos, ch3Terminal])

  const cable4Geom = useMemo(() => {
    const points = [
      new THREE.Vector3(...p4Top),
      new THREE.Vector3(p4Top[0] + 0.08, p4Top[1] + 0.02, p4Top[2]),
      new THREE.Vector3(dry2Pos[0] + 0.14, dry2Pos[1] + 0.03, dry2Pos[2] + 0.18),
      new THREE.Vector3(bridgePos[0] + 0.10, bridgePos[1] + 0.04, bridgePos[2] - 0.10),
      new THREE.Vector3(ch4Terminal[0] - 0.02, bridgePos[1] + 0.06, ch4Terminal[2] - 0.01),
      new THREE.Vector3(...ch4Terminal)
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25)
    return new THREE.TubeGeometry(curve, 32, 0.0035, 8, false)
  }, [p4Top, dry2Pos, bridgePos, ch4Terminal])

  return (
    <group>
      {/* ==================================================================== */}
      {/* 4 PHYSICAL TEMPERATURE PROBES (SPRT & PRT)                           */}
      {/* ==================================================================== */}

      {/* --- Probe 1: SPRT 1 in Dry-Well 1 --- */}
      <group position={[p1Top[0], dry1Pos[1] + 0.37, p1Top[2]]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.0035, 0.0035, 0.24, 16]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.0085, 0.0085, 0.006, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.02, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* --- Probe 2: PRT 1 in Dry-Well 1 --- */}
      <group position={[p2Top[0], dry1Pos[1] + 0.37, p2Top[2]]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, 0.22, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.035, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <cylinderGeometry args={[0.0078, 0.0078, 0.005, 16]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* --- Probe 3: SPRT 2 in Dry-Well 2 --- */}
      <group position={[p3Top[0], dry2Pos[1] + 0.37, p3Top[2]]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.0038, 0.0038, 0.24, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.032, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.0095, 0.0095, 0.006, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* --- Probe 4: PRT 2 in Dry-Well 2 --- */}
      <group position={[p4Top[0], dry2Pos[1] + 0.37, p4Top[2]]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, 0.22, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.035, 6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <cylinderGeometry args={[0.0078, 0.0078, 0.005, 16]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
      </group>

      {/* ==================================================================== */}
      {/* 4 NEAT CONNECTED CABLES ROUTED ALONG REAR TABLE RACEWAY             */}
      {/* ==================================================================== */}
      <mesh geometry={cable1Geom} castShadow>
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>

      <mesh geometry={cable2Geom} castShadow>
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      <mesh geometry={cable3Geom} castShadow>
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>

      <mesh geometry={cable4Geom} castShadow>
        <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
      </mesh>
    </group>
  )
}
