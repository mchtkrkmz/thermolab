import { useMemo, memo } from 'react'
import * as THREE from 'three'

interface FixedPointCablesProps {
  furnacesX?: number[]
  furnaceZ?: number
  bridgePos?: [number, number, number]
  bridgeTiltX?: number
  probeLocations?: ('preheat' | 'cell')[]
}

/**
 * 9 High-Purity Flexible 4-Wire Shielded SPRT Cables
 * Connecting each of the 9 Quartz SPRTs (MK_Ar to MK_Ag)
 * up into the overhead 1595A Super-Thermometer Bridge shelf.
 */
function FixedPointCables({
  furnacesX = [2.40, 2.93, 3.46, 3.99, 4.52, 5.05, 5.58, 6.11, 6.64],
  furnaceZ = 0.60,
  bridgePos = [4.52, 1.43, 0.52],
  bridgeTiltX = 0.12,
  probeLocations
}: FixedPointCablesProps) {
  // Cable rubber jacket material
  const cableMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a', // Matte black silicone/rubber
        roughness: 0.6,
        metalness: 0.1
      }),
    []
  )

  // Gold spade lug material
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#eab308',
        metalness: 0.9,
        roughness: 0.2
      }),
    []
  )

  const redWireMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 }),
    []
  )
  const blackWireMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 }),
    []
  )
  const blueWireMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.4 }),
    []
  )

  // Calculate 3D curves for each of the 9 channels
  const cableCurves = useMemo(() => {
    return furnacesX.map((fX, i) => {
      // Channels 1, 2, 3 are Metrology Baths (Hg, TPW, Ga)
      const isBath = i === 1 || i === 2 || i === 3
      const isPreheat = probeLocations ? probeLocations[i] === 'preheat' : false

      let probeX = fX
      let pY = 1.01
      if (isBath) {
        probeX = isPreheat ? fX + 0.13 : fX - 0.045
        pY = isPreheat ? 1.07 : 1.22
      } else {
        const probeOffsetX = isPreheat ? 0.065 : -0.055
        probeX = fX - 0.065 + probeOffsetX
        pY = 1.01
      }
      const pStart = new THREE.Vector3(probeX, pY, furnaceZ)

      // Bridge input post position
      // In 9-channel bridge: left section is at x = -0.28
      // colX for 9 channels: -0.096 + i * 0.024
      // y = 0.145 - 0.010 = 0.135
      // z = 0.191
      const colX = -0.096 + i * 0.024
      const localPostPos = new THREE.Vector3(-0.28 + colX, 0.135, 0.191)

      // Rotate by bridge tilt around X axis
      localPostPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), bridgeTiltX)
      // Add world bridge position
      localPostPos.add(new THREE.Vector3(...bridgePos))
      const pEnd = localPostPos

      // Natural vertical cable drape waypoints
      const pMid1 = new THREE.Vector3(
        pStart.x,
        pStart.y + 0.12,
        pStart.z - 0.08
      )

      const pMid2 = new THREE.Vector3(
        pStart.x + (pEnd.x - pStart.x) * 0.5,
        (pStart.y + pEnd.y) * 0.5,
        pEnd.z - 0.12
      )

      const pMid3 = new THREE.Vector3(
        pEnd.x,
        pEnd.y - 0.05,
        pEnd.z - 0.05
      )

      const curve = new THREE.CatmullRomCurve3(
        [pStart, pMid1, pMid2, pMid3, pEnd],
        false,
        'catmullrom',
        0.35
      )

      return {
        curve,
        pEnd,
        pStart
      }
    })
  }, [furnacesX, furnaceZ, bridgePos, bridgeTiltX, probeLocations])

  return (
    <group>
      {cableCurves.map((cData, idx) => (
        <group key={`fixed-cable-${idx}`}>
          {/* Main Flexible Cable Tube */}
          <mesh material={cableMaterial} castShadow>
            <tubeGeometry args={[cData.curve, 32, 0.0035, 8, false]} />
          </mesh>

          {/* Strain Relief Boot at SPRT Exit */}
          <mesh position={cData.pStart} material={cableMaterial}>
            <sphereGeometry args={[0.0055, 12, 12]} />
          </mesh>

          {/* Bridge Termination Hub: Heat-shrink sleeve and 4 breakout wires */}
          <group position={cData.pEnd}>
            <mesh position={[0, -0.012, -0.015]} material={cableMaterial}>
              <cylinderGeometry args={[0.0045, 0.0055, 0.018, 12]} />
            </mesh>

            {/* 4 Breakout Wires: I+, V+, V-, I- */}
            {[
              { dy: 0.016, dx: -0.003, mat: redWireMaterial }, // I+
              { dy: 0.004, dx: -0.003, mat: redWireMaterial }, // V+
              { dy: -0.008, dx: 0.003, mat: blackWireMaterial }, // V-
              { dy: -0.020, dx: 0.003, mat: blueWireMaterial } // I-
            ].map((wire, wIdx) => (
              <group key={`wire-lead-${wIdx}`} position={[wire.dx, wire.dy, 0.002]}>
                <mesh material={wire.mat}>
                  <cylinderGeometry args={[0.0012, 0.0012, 0.012, 6]} />
                </mesh>
                <mesh position={[0, 0, 0.004]} material={goldMaterial}>
                  <boxGeometry args={[0.0035, 0.0045, 0.0012]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}
    </group>
  )
}

export default memo(FixedPointCables)
