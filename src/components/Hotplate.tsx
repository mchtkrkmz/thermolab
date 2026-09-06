import { useState } from 'react'
import { useFrame } from '@react-three/fiber'

interface HotplateProps {
  position: [number, number, number]
  setTemperature: React.Dispatch<React.SetStateAction<number>>
}

export default function Hotplate({ position, setTemperature }: HotplateProps) {
  const [isOn, setIsOn] = useState(false)

  // A simple heat simulation with frame-rate independent delta scaling
  useFrame((_, delta) => {
    if (isOn) {
      setTemperature(t => Math.min(t + 10 * delta, 100))
    } else {
      setTemperature(t => Math.max(t - 5 * delta, 25))
    }
  })

  return (
    <group position={position}>
      {/* Base */}
      <group>
        <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color="#222222" />
        </mesh>

        {/* Heating Element */}
        <mesh position={[0, 0.105, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 32]} />
          <meshStandardMaterial 
            color={isOn ? "#ff4400" : "#444444"} 
            emissive={isOn ? "#ff4400" : "#000000"} 
            emissiveIntensity={isOn ? 2 : 0} 
          />
        </mesh>

        {/* Button */}
        <mesh 
          position={[0.15, 0.1, 0.15]} 
          onClick={(e) => {
            e.stopPropagation()
            setIsOn(!isOn)
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            setIsOn(!isOn)
          }}
        >
          <boxGeometry args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial color={isOn ? "red" : "green"} />
        </mesh>
      </group>
    </group>
  )
}
