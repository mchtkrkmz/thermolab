import { useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

interface CalibrationPoint {
  step: number
  targetCal: 'Dry-Well 1' | 'Dry-Well 2'
  targetTemp: number
  tolerance: number
  status: 'PENDING' | 'READY' | 'COMPLETED'
  recordedRef?: number
  recordedDUT?: number
  errorDelta?: number
  timestamp?: string
}

interface CalibrationGameProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  dry1Temp: number
  dry1Target: number
  dry2Temp: number
  dry2Target: number
  ch1Temp: number // SPRT 1 (Reference in Dry-Well 1)
  ch2Temp: number // PRT 1 (Unit Under Test in Dry-Well 1)
  ch3Temp: number // SPRT 2 (Reference in Dry-Well 2)
  ch4Temp: number // PRT 2 (Unit Under Test in Dry-Well 2)
}

export default function CalibrationGame({
  position,
  rotation = [0, 0, 0],
  dry1Temp,
  dry1Target,
  dry2Temp,
  dry2Target,
  ch1Temp,
  ch2Temp,
  ch3Temp,
  ch4Temp
}: CalibrationGameProps) {
  // 4 Calibration Steps for a complete calibration routine
  const [points, setPoints] = useState<CalibrationPoint[]>([
    { step: 1, targetCal: 'Dry-Well 1', targetTemp: 50.0, tolerance: 0.1, status: 'PENDING' },
    { step: 2, targetCal: 'Dry-Well 1', targetTemp: 150.0, tolerance: 0.1, status: 'PENDING' },
    { step: 3, targetCal: 'Dry-Well 2', targetTemp: 300.0, tolerance: 0.2, status: 'PENDING' },
    { step: 4, targetCal: 'Dry-Well 2', targetTemp: 600.0, tolerance: 0.3, status: 'PENDING' }
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isCertificateIssued, setIsCertificateIssued] = useState(false)
  const [notification, setNotification] = useState('Kalibrasyon Noktası 1 için Dry-Well 1\'i 50.0°C\'ye ayarlayın.')

  // Check if current target is stable and ready to be recorded
  const currentStep = points[currentStepIndex]
  const isTargetCal1 = currentStep?.targetCal === 'Dry-Well 1'
  const activeDevTemp = isTargetCal1 ? dry1Temp : dry2Temp
  const activeDevTarget = isTargetCal1 ? dry1Target : dry2Target

  const isTempOnTarget = Math.abs(activeDevTemp - (currentStep?.targetTemp ?? 0)) <= (currentStep?.tolerance ?? 0.1)
  const isSetPointCorrect = Math.abs(activeDevTarget - (currentStep?.targetTemp ?? 0)) < 0.05
  const isReadyToRecord = isTempOnTarget && isSetPointCorrect && !isCertificateIssued

  // Record measurement point
  const handleRecordPoint = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!isReadyToRecord || !currentStep) return

    const refVal = isTargetCal1 ? ch1Temp : ch3Temp
    const dutVal = isTargetCal1 ? ch2Temp : ch4Temp
    const errorDelta = dutVal - refVal
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

    const updated = [...points]
    updated[currentStepIndex] = {
      ...currentStep,
      status: 'COMPLETED',
      recordedRef: refVal,
      recordedDUT: dutVal,
      errorDelta: errorDelta,
      timestamp: timeStr
    }
    setPoints(updated)

    if (currentStepIndex + 1 < points.length) {
      setCurrentStepIndex(currentStepIndex + 1)
      const nextStep = points[currentStepIndex + 1]
      setNotification(`Harika! Şimdi ${nextStep.targetCal}'i ${nextStep.targetTemp.toFixed(1)}°C'ye ayarlayın.`)
    } else {
      setIsCertificateIssued(true)
      setNotification('🎉 TEBRİKLER! TÜM KALİBRASYON NOKTALARI BAŞARIYLA TAMAMLANDI!')
    }
  }

  // Reset Game
  const handleReset = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setPoints([
      { step: 1, targetCal: 'Dry-Well 1', targetTemp: 50.0, tolerance: 0.1, status: 'PENDING' },
      { step: 2, targetCal: 'Dry-Well 1', targetTemp: 150.0, tolerance: 0.1, status: 'PENDING' },
      { step: 3, targetCal: 'Dry-Well 2', targetTemp: 300.0, tolerance: 0.2, status: 'PENDING' },
      { step: 4, targetCal: 'Dry-Well 2', targetTemp: 600.0, tolerance: 0.3, status: 'PENDING' }
    ])
    setCurrentStepIndex(0)
    setIsCertificateIssued(false)
    setNotification('Yeni Kalibrasyon: Dry-Well 1\'i 50.0°C\'ye ayarlayın.')
  }

  const completedCount = useMemo(() => points.filter(p => p.status === 'COMPLETED').length, [points])

  return (
    <group position={position} rotation={rotation}>
      {/* ===== Acrylic Laboratory Clipboard Frame ===== */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.1, 0.72, 0.02]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Inner Display Surface */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[1.08, 0.70]} />
        <meshBasicMaterial color="#0b1329" />
      </mesh>

      {/* Top Header Banner */}
      <mesh position={[0, 0.31, 0.002]}>
        <planeGeometry args={[1.06, 0.06]} />
        <meshBasicMaterial color="#1e3a8a" />
      </mesh>
      <Text
        position={[-0.5, 0.32, 0.004]}
        fontSize={0.022}
        color="#38bdf8"
        anchorX="left"
        anchorY="middle"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        🎯 SICAKLIK KALİBRASYON MERKEZİ & OYUNU
      </Text>
      <Text
        position={[0.5, 0.32, 0.004]}
        fontSize={0.012}
        color="#facc15"
        anchorX="right"
        anchorY="middle"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        İlerleme: {completedCount} / 4 Nokta
      </Text>
      <Text
        position={[-0.5, 0.29, 0.004]}
        fontSize={0.011}
        color="#94a3b8"
        anchorX="left"
        anchorY="middle"
        font="/fonts/arial.ttf"
      >
        ISO/IEC 17025 Uyumlu SPRT & PRT Karşılaştırmalı Kalibrasyon Rutini
      </Text>

      {/* Notification Banner */}
      <mesh position={[0, 0.245, 0.002]}>
        <planeGeometry args={[1.04, 0.038]} />
        <meshBasicMaterial color={isCertificateIssued ? '#14532d' : isReadyToRecord ? '#065f46' : '#1e293b'} />
      </mesh>
      <Text
        position={[0, 0.245, 0.004]}
        fontSize={0.012}
        color={isCertificateIssued ? '#86efac' : isReadyToRecord ? '#6ee7b7' : '#e2e8f0'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/arial.ttf"
        fontWeight="bold"
      >
        {notification}
      </Text>

      {/* Table Header Row */}
      <group position={[0, 0.185, 0.002]}>
        <mesh>
          <planeGeometry args={[1.04, 0.032]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <Text position={[-0.49, 0, 0.002]} fontSize={0.010} color="#94a3b8" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">NOKTA</Text>
        <Text position={[-0.35, 0, 0.002]} fontSize={0.010} color="#94a3b8" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">CİHAZ</Text>
        <Text position={[-0.18, 0, 0.002]} fontSize={0.010} color="#94a3b8" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">HEDEF</Text>
        <Text position={[-0.02, 0, 0.002]} fontSize={0.010} color="#38bdf8" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">SPRT (REF)</Text>
        <Text position={[0.15, 0, 0.002]} fontSize={0.010} color="#facc15" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">PRT (DUT)</Text>
        <Text position={[0.31, 0, 0.002]} fontSize={0.010} color="#f43f5e" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">HATA (ΔT)</Text>
        <Text position={[0.45, 0, 0.002]} fontSize={0.010} color="#22c55e" anchorX="center" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">DURUM</Text>
      </group>

      {/* 4 Calibration Point Rows */}
      {points.map((pt, idx) => {
        const isCurrent = idx === currentStepIndex && !isCertificateIssued
        const yPos = 0.135 - idx * 0.05
        return (
          <group key={`row-${idx}`} position={[0, yPos, 0.002]}>
            <mesh>
              <planeGeometry args={[1.04, 0.042]} />
              <meshBasicMaterial color={isCurrent ? '#1e3a8a' : idx % 2 === 0 ? '#0f172a' : '#111827'} />
            </mesh>
            {/* Step Number */}
            <Text position={[-0.49, 0, 0.002]} fontSize={0.011} color="#e2e8f0" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              #{pt.step}
            </Text>
            {/* Device Name */}
            <Text position={[-0.35, 0, 0.002]} fontSize={0.011} color="#cbd5e1" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
              {pt.targetCal}
            </Text>
            {/* Target Temp */}
            <Text position={[-0.18, 0, 0.002]} fontSize={0.012} color="#fbbf24" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              {pt.targetTemp.toFixed(1)} °C
            </Text>
            {/* Recorded SPRT Ref */}
            <Text position={[-0.02, 0, 0.002]} fontSize={0.011} color="#38bdf8" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
              {pt.recordedRef !== undefined ? `${pt.recordedRef.toFixed(4)} °C` : isCurrent ? `${(isTargetCal1 ? ch1Temp : ch3Temp).toFixed(3)} °C` : '---'}
            </Text>
            {/* Recorded PRT DUT */}
            <Text position={[0.15, 0, 0.002]} fontSize={0.011} color="#facc15" anchorX="left" anchorY="middle" font="/fonts/arial.ttf">
              {pt.recordedDUT !== undefined ? `${pt.recordedDUT.toFixed(4)} °C` : isCurrent ? `${(isTargetCal1 ? ch2Temp : ch4Temp).toFixed(3)} °C` : '---'}
            </Text>
            {/* Error Delta */}
            <Text position={[0.31, 0, 0.002]} fontSize={0.011} color="#f43f5e" anchorX="left" anchorY="middle" font="/fonts/arial.ttf" fontWeight="bold">
              {pt.errorDelta !== undefined ? `${pt.errorDelta > 0 ? '+' : ''}${pt.errorDelta.toFixed(4)} °C` : '---'}
            </Text>
            {/* Status Badge */}
            <Text
              position={[0.45, 0, 0.002]}
              fontSize={0.010}
              color={pt.status === 'COMPLETED' ? '#22c55e' : isCurrent && isReadyToRecord ? '#fbbf24' : '#64748b'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {pt.status === 'COMPLETED' ? '✓ TAMAM' : isCurrent && isReadyToRecord ? '● HAZIR' : 'BEKLİYOR'}
            </Text>
          </group>
        )
      })}

      {/* ===== Action Buttons Area ===== */}
      <group position={[0, -0.16, 0.002]}>
        {/* Record Measurement Point Button */}
        {!isCertificateIssued ? (
          <group
            position={[-0.15, 0, 0.003]}
            onClick={handleRecordPoint}
            onPointerOver={(e) => {
              e.stopPropagation()
              if (isReadyToRecord) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <mesh>
              <boxGeometry args={[0.38, 0.052, 0.01]} />
              <meshStandardMaterial
                color={isReadyToRecord ? '#16a34a' : '#334155'}
                emissive={isReadyToRecord ? '#16a34a' : '#000000'}
                emissiveIntensity={isReadyToRecord ? 0.4 : 0}
                roughness={0.4}
              />
            </mesh>
            <Text
              position={[0, 0, 0.008]}
              fontSize={0.014}
              color={isReadyToRecord ? '#ffffff' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              {isReadyToRecord ? '📸 ÖLÇÜM AL & KAYDET' : '⏳ SICAKLIK BEKLENİYOR...'}
            </Text>
          </group>
        ) : (
          /* Certificate Approved Badge */
          <group position={[-0.15, 0, 0.003]}>
            <mesh>
              <boxGeometry args={[0.48, 0.052, 0.01]} />
              <meshStandardMaterial color="#059669" emissive="#059669" emissiveIntensity={0.6} />
            </mesh>
            <Text
              position={[0, 0, 0.008]}
              fontSize={0.013}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/fonts/arial.ttf"
              fontWeight="bold"
            >
              🏆 SERTİFİKA ONAYLANDI (PASSED)
            </Text>
          </group>
        )}

        {/* Reset / New Calibration Button */}
        <group
          position={[0.26, 0, 0.003]}
          onClick={handleReset}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh>
            <boxGeometry args={[0.28, 0.052, 0.01]} />
            <meshStandardMaterial color="#475569" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.008]}
            fontSize={0.013}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            font="/fonts/arial.ttf"
            fontWeight="bold"
          >
            🔄 SIFIRLA / YENİDEN
          </Text>
        </group>
      </group>

      {/* Bottom Live Calibration Formula Explanation */}
      <group position={[0, -0.27, 0.002]}>
        <mesh>
          <planeGeometry args={[1.04, 0.09]} />
          <meshBasicMaterial color="#090d16" />
        </mesh>
        <Text
          position={[-0.5, 0.024, 0.002]}
          fontSize={0.009}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          KALİBRASYON FORMÜLÜ VE METODU:
        </Text>
        <Text
          position={[-0.5, 0.005, 0.002]}
          fontSize={0.008}
          color="#cbd5e1"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          • Düzeltme Değeri: ΔT = T_DUT (Termometre) - T_SPRT (Standart Referans)
        </Text>
        <Text
          position={[-0.5, -0.013, 0.002]}
          fontSize={0.008}
          color="#cbd5e1"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
        >
          • Direnç Köprüsü (mchtkrkmz 1594A) 4-telli oransal köprü tekniğiyle mikro-ohm seviyesinde ölçüm yapar.
        </Text>
        <Text
          position={[-0.5, -0.031, 0.002]}
          fontSize={0.008}
          color="#22c55e"
          anchorX="left"
          anchorY="middle"
          font="/fonts/arial.ttf"
          fontWeight="bold"
        >
          • Genişletilmiş Belirsizlik (k=2): U = ±0.012 °C | Güvenilirlik: %95
        </Text>
      </group>
    </group>
  )
}
