import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface BlackBodySourceProps {
  position: [number, number, number]
  targetTemp: number
  setTargetTemp: React.Dispatch<React.SetStateAction<number>>
  currentTemp: number
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>
  modelName: string
  minTemp: number
  maxTemp: number
}

export default function BlackBodySource({
  position,
  targetTemp,
  setTargetTemp,
  currentTemp,
  setCurrentTemp,
  modelName,
  minTemp,
  maxTemp
}: BlackBodySourceProps) {

  const tubeMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const coneMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const rimGlowMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const cavityLightRef = useRef<THREE.PointLight>(null)
  const cavityMeshRef = useRef<THREE.Mesh>(null)
  const apertureTargetRef = useRef<THREE.Mesh>(null)
  const frontPlateRef = useRef<THREE.Mesh>(null)
  const glowRimRef = useRef<THREE.Mesh>(null)

  // Real-time physics simulation for heating and cooling with dynamic incandescence
  useFrame((_, delta) => {
    if (Math.abs(currentTemp - targetTemp) > 0.01) {
      const isHeating = targetTemp > currentTemp
      const diff = Math.abs(targetTemp - currentTemp)
      // Responsive dynamic rate: fast for large delta, gentle settling for small delta
      const rate = Math.max(45.0, diff * 1.1)
      const step = rate * delta
      const direction = isHeating ? 1 : -1

      setCurrentTemp(t => {
        const next = t + direction * Math.min(diff, step)
        return Math.min(maxTemp, Math.max(minTemp, Math.round(next * 10) / 10))
      })
    }

    // Dynamic black-body thermal incandescence & radiant lighting simulation
    // Kural: 625 °C altında tamamen siyah, 625 °C sonrasında kademeli aydınlanma ve akkorluk
    let r = 0, g = 0, b = 0
    let emissiveIntensity = 0
    let lightIntensity = 0

    if (currentTemp <= 625) {
      // 625 °C ve altı: Aydınlanma yok, delik tamamen siyah
      r = 0
      g = 0
      b = 0
      emissiveIntensity = 0
      lightIntensity = 0
    } else if (currentTemp < 800) {
      // 625°C - 800°C: 625 °C sonrasında akkorluk başlar, koyu kızıllaşma -> parlak kiraz kırmızısı
      const n = (currentTemp - 625) / 175
      r = Math.floor(120 + 135 * n)
      g = Math.floor(25 * n)
      b = 0
      emissiveIntensity = 0.6 + 2.0 * n
      lightIntensity = 0.5 + 2.0 * n
    } else if (currentTemp < 1050) {
      // 800°C - 1050°C: Kırmızıdan canlı turuncuya geçiş
      const n = (currentTemp - 800) / 250
      r = 255
      g = Math.floor(25 + 95 * n)
      b = Math.floor(10 * n)
      emissiveIntensity = 2.6 + 2.4 * n
      lightIntensity = 2.5 + 3.0 * n
    } else if (currentTemp < 1300) {
      // 1050°C - 1300°C: Parlak turuncudan altın sarısına geçiş
      const n = (currentTemp - 1050) / 250
      r = 255
      g = Math.floor(120 + 95 * n)
      b = Math.floor(10 + 45 * n)
      emissiveIntensity = 5.0 + 2.5 * n
      lightIntensity = 5.5 + 4.0 * n
    } else {
      // 1300°C - 1600°C: Altın sarısından akkor beyaz-sıcak ışıma
      const n = Math.min(1.0, (currentTemp - 1300) / 300)
      r = 255
      g = Math.floor(215 + 40 * n)
      b = Math.floor(55 + 195 * n)
      emissiveIntensity = 7.5 + 3.5 * n
      lightIntensity = 9.5 + 6.5 * n
    }

    const rgbColor = new THREE.Color(r / 255, g / 255, b / 255)

    if (tubeMaterialRef.current) {
      tubeMaterialRef.current.emissive.copy(rgbColor)
      tubeMaterialRef.current.emissiveIntensity = emissiveIntensity
    }
    if (coneMaterialRef.current) {
      coneMaterialRef.current.emissive.copy(rgbColor)
      coneMaterialRef.current.emissiveIntensity = currentTemp > 625 ? emissiveIntensity * 1.15 : 0
    }
    if (rimGlowMaterialRef.current) {
      rimGlowMaterialRef.current.emissive.copy(rgbColor)
      rimGlowMaterialRef.current.emissiveIntensity = currentTemp > 625 ? emissiveIntensity * 0.4 : 0
    }
    if (cavityLightRef.current) {
      cavityLightRef.current.color.copy(rgbColor)
      cavityLightRef.current.intensity = lightIntensity
    }

    if (cavityMeshRef.current) {
      cavityMeshRef.current.userData.temperature = currentTemp
      cavityMeshRef.current.userData.currentTemp = currentTemp
      cavityMeshRef.current.userData.isBlackBody = true
      cavityMeshRef.current.userData.isApertureCenter = true
      cavityMeshRef.current.userData.sourceName = modelName
    }

    if (apertureTargetRef.current) {
      apertureTargetRef.current.userData.temperature = currentTemp
      apertureTargetRef.current.userData.currentTemp = currentTemp
      apertureTargetRef.current.userData.isBlackBody = true
      apertureTargetRef.current.userData.isApertureCenter = true
      apertureTargetRef.current.userData.sourceName = modelName
    }

    if (glowRimRef.current) {
      glowRimRef.current.userData.temperature = currentTemp
      glowRimRef.current.userData.currentTemp = currentTemp
      glowRimRef.current.userData.isBlackBody = true
      glowRimRef.current.userData.isApertureCenter = true
      glowRimRef.current.userData.sourceName = modelName
    }

    if (frontPlateRef.current) {
      frontPlateRef.current.userData.temperature = currentTemp
      frontPlateRef.current.userData.currentTemp = currentTemp
      frontPlateRef.current.userData.isBlackBody = true
      frontPlateRef.current.userData.isAperturePlate = true
      frontPlateRef.current.userData.sourceName = modelName
    }
  })

  return (
    <group position={position} userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, sourceName: modelName }}>
      <group>

        {/* --- Base Stand --- */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.8} />
        </mesh>

        {/* Base Side Curves */}
        <mesh position={[-0.15, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.8} />
        </mesh>
        <mesh position={[0.15, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.8} />
        </mesh>

        {/* --- Main Cylindrical Furnace Body --- */}
        <group position={[0, 0.4, 0]} userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isAperturePlate: true, sourceName: modelName }}>
          {/* Main Cylinder Outer Shell */}
          <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, sourceName: modelName }}>
            <cylinderGeometry args={[0.22, 0.22, 0.4, 32, 1, true]} />
            <meshStandardMaterial color="#dcdcdc" roughness={0.5} metalness={0.25} />
          </mesh>

          {/* Main Cylinder Front Cap */}
          <mesh position={[0, 0, 0.2]} userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isAperturePlate: true, sourceName: modelName }}>
            <ringGeometry args={[0.12, 0.22, 32]} />
            <meshStandardMaterial color="#dcdcdc" roughness={0.5} metalness={0.25} side={THREE.DoubleSide} />
          </mesh>

          {/* Main Cylinder Back Cap */}
          <mesh position={[0, 0, -0.2]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.22, 32]} />
            <meshStandardMaterial color="#dcdcdc" roughness={0.5} metalness={0.25} />
          </mesh>

          {/* Front Black Aperture Heat Shield Plate */}
          <mesh
            ref={frontPlateRef}
            position={[0, 0, 0.201]}
            userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isAperturePlate: true, sourceName: modelName }}
          >
            <ringGeometry args={[0.045, 0.13, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Inner Cavity Aperture Glow Rim (subtle warm ring at mouth of cavity) */}
          <mesh
            ref={glowRimRef}
            position={[0, 0, 0.202]}
            userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isApertureCenter: true, sourceName: modelName }}
          >
            <ringGeometry args={[0.043, 0.048, 32]} />
            <meshStandardMaterial
              ref={rimGlowMaterialRef}
              color="#111111"
              roughness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Aperture Raycast Target (Kavite Ağzı Hedef Yakalama - Geniş ve Çift Yönlü) */}
          <mesh
            ref={apertureTargetRef}
            position={[0, 0, 0.206]}
            userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isApertureCenter: true, sourceName: modelName }}
          >
            <circleGeometry args={[0.10, 32]} />
            <meshBasicMaterial transparent opacity={0.001} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>

          {/* Inner Cavity Tube Wall (Glows when hot) */}
          <mesh
            ref={cavityMeshRef}
            position={[0, 0, 0.0]}
            rotation={[Math.PI / 2, 0, 0]}
            userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isApertureCenter: true, sourceName: modelName }}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.4, 32]} />
            <meshStandardMaterial
              ref={tubeMaterialRef}
              color="#111111"
              roughness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Cavity Target Back Disk */}
          <mesh
            position={[0, 0, -0.198]}
            userData={{ temperature: currentTemp, currentTemp, isBlackBody: true, isApertureCenter: true, sourceName: modelName }}
          >
            <circleGeometry args={[0.045, 32]} />
            <meshStandardMaterial
              ref={coneMaterialRef}
              color="#111111"
              roughness={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Dynamic Radiant Cavity Point Light casting visible warmth onto surroundings */}
          <pointLight
            ref={cavityLightRef}
            position={[0, 0, 0.24]}
            color="#ff3300"
            intensity={0}
            distance={4.0}
            decay={1.2}
          />
        </group>

        {/* --- Control Panel on the Base --- */}
        <mesh position={[0, 0.1, 0.151]}>
          <boxGeometry args={[0.22, 0.12, 0.01]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>

        {/* Red accent line */}
        <mesh position={[0, 0.05, 0.157]}>
          <boxGeometry args={[0.22, 0.006, 0.002]} />
          <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
        </mesh>

        {/* 3D Control Panel Face */}
        <group position={[0, 0.11, 0.158]}>
          {/* Panel Background Frame */}
          <mesh>
            <planeGeometry args={[0.21, 0.10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Model Name Banner */}
          <Text
            position={[-0.095, 0.038, 0.002]}
            fontSize={0.011}
            color="#f8fafc"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {modelName} ({minTemp}-{maxTemp}°C)
          </Text>

          {/* PV Display Background */}
          <mesh position={[-0.05, 0.01, 0.002]}>
            <planeGeometry args={[0.085, 0.032]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* PV Label */}
          <Text
            position={[-0.085, 0.02, 0.003]}
            fontSize={0.006}
            color="#94a3b8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            PV
          </Text>
          {/* PV Value (Current Temp - Red LED) */}
          <Text
            position={[-0.045, 0.009, 0.003]}
            fontSize={0.015}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {currentTemp.toFixed(1)}
          </Text>

          {/* SV Display Background */}
          <mesh position={[0.05, 0.01, 0.002]}>
            <planeGeometry args={[0.085, 0.032]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* SV Label */}
          <Text
            position={[0.015, 0.02, 0.003]}
            fontSize={0.006}
            color="#94a3b8"
            anchorX="left"
            anchorY="middle"
            font="/fonts/arial.ttf"
          >
            SV
          </Text>
          {/* SV Value (Target Temp - Green LED) */}
          <Text
            position={[0.055, 0.008, 0.003]}
            fontSize={0.015}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            {targetTemp.toFixed(1)}
          </Text>

          {/* Tactile 3D Buttons: -10 °C, -1 °C, +1 °C, +10 °C */}
          {/* -10 °C Button */}
          <group
            position={[-0.076, -0.032, 0.004]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.max(minTemp, Math.round((t - 10) * 10) / 10))
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.max(minTemp, Math.round((t - 10) * 10) / 10))
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <mesh>
              <boxGeometry args={[0.044, 0.022, 0.008]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            <Text
              position={[0, 0, 0.005]}
              fontSize={0.0075}
              color="#f87171"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              -10
            </Text>
          </group>

          {/* -1 °C Button */}
          <group
            position={[-0.026, -0.032, 0.004]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.max(minTemp, Math.round((t - 1) * 10) / 10))
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.max(minTemp, Math.round((t - 1) * 10) / 10))
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <mesh>
              <boxGeometry args={[0.044, 0.022, 0.008]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>
            <Text
              position={[0, 0, 0.005]}
              fontSize={0.008}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              -1
            </Text>
          </group>

          {/* +1 °C Button */}
          <group
            position={[0.026, -0.032, 0.004]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.min(maxTemp, Math.round((t + 1) * 10) / 10))
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.min(maxTemp, Math.round((t + 1) * 10) / 10))
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <mesh>
              <boxGeometry args={[0.044, 0.022, 0.008]} />
              <meshStandardMaterial color="#0284c7" roughness={0.4} />
            </mesh>
            <Text
              position={[0, 0, 0.005]}
              fontSize={0.008}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              +1
            </Text>
          </group>

          {/* +10 °C Button */}
          <group
            position={[0.076, -0.032, 0.004]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.min(maxTemp, Math.round((t + 10) * 10) / 10))
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              setTargetTemp(t => Math.min(maxTemp, Math.round((t + 10) * 10) / 10))
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <mesh>
              <boxGeometry args={[0.044, 0.022, 0.008]} />
              <meshStandardMaterial color="#0369a1" roughness={0.4} />
            </mesh>
            <Text
              position={[0, 0, 0.005]}
              fontSize={0.0075}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              +10
            </Text>
          </group>
        </group>
      </group>
    </group>
  )
}
