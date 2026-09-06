import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useState, useEffect, useRef, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createXRStore, XR, XROrigin, useXRControllerLocomotion, useXR } from '@react-three/xr'
import * as THREE from 'three'
import BlackBodySource from './components/BlackBodySource'
import ClimateCabinet from './components/ClimateCabinet'
import RadiationThermometer from './components/RadiationThermometer'
import DewPointMirror from './components/DewPointMirror'
import IRCalibrator from './components/IRCalibrator'
import DryWellCalibrator from './components/DryWellCalibrator'
import ResistanceBridge from './components/ResistanceBridge'
import CalibrationProbesAndCables from './components/CalibrationProbesAndCables'
import FixedPointFurnacesSuite from './components/FixedPointFurnacesSuite'
import RadiationPhysicsBoard from './components/RadiationPhysicsBoard'
import LabRoom from './components/LabRoom'
import { resolvePlayerPosition, isPositionValid } from './utils/collision'

export interface MeasurementRecord {
  ref: number
  measured: number
  device: string
}

// Initialize WebXR store with teleport pointer enabled on controllers & hands (Meta Quest 3)
export const xrStore = createXRStore({
  controller: {
    teleportPointer: true,
  },
  hand: {
    teleportPointer: true,
  },
})

function Player({ 
  originRef, 
  teleportTarget, 
  setTeleportTarget 
}: { 
  originRef: React.RefObject<THREE.Group | null>
  teleportTarget: { x: number; z: number } | null
  setTeleportTarget: (p: { x: number; z: number } | null) => void 
}) {
  const prevSafePos = useRef<{ x: number; z: number }>({ x: 0, z: -2.0 })

  // Enables Quest 3 thumbstick movement (left stick) and snap rotation 45 deg (right stick)
  useXRControllerLocomotion(originRef, { speed: 2.2 }, { type: 'snap', degrees: 45 }, 'left')

  // Real-time obstacle collision resolution & instant teleport execution
  useFrame(() => {
    if (originRef.current) {
      if (teleportTarget) {
        originRef.current.position.x = teleportTarget.x
        originRef.current.position.z = teleportTarget.z
        prevSafePos.current = { x: teleportTarget.x, z: teleportTarget.z }
        setTeleportTarget(null)
        return
      }

      const curX = originRef.current.position.x
      const curZ = originRef.current.position.z

      const resolved = resolvePlayerPosition(
        curX,
        curZ,
        prevSafePos.current.x,
        prevSafePos.current.z
      )

      originRef.current.position.x = resolved.x
      originRef.current.position.z = resolved.z
      prevSafePos.current = { x: resolved.x, z: resolved.z }
    }
  })

  return <XROrigin ref={originRef} position={[0, 0, -2.0]} />
}

function ControlsHandler() {
  const isPresenting = useXR((s) => s.session != null)
  return (
    <OrbitControls
      target={[0, 1.25, -3.8]}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={1.0}
      maxDistance={8.0}
      enabled={!isPresenting}
    />
  )
}

interface SafeProps {
  name: string
  children: ReactNode
}

interface SafeState {
  hasError: boolean
}

class SafeComponent extends Component<SafeProps, SafeState> {
  state: SafeState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[Error in ${this.props.name}]:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

interface LabSceneProps {
  bb1TargetTemp: number
  setBb1TargetTemp: React.Dispatch<React.SetStateAction<number>>
  bb1CurrentTemp: number
  setBb1CurrentTemp: React.Dispatch<React.SetStateAction<number>>
  bb2TargetTemp: number
  setBb2TargetTemp: React.Dispatch<React.SetStateAction<number>>
  bb2CurrentTemp: number
  setBb2CurrentTemp: React.Dispatch<React.SetStateAction<number>>
}

/* ---------- Lab Scene ---------- */
function LabScene({
  bb1TargetTemp,
  setBb1TargetTemp,
  bb1CurrentTemp,
  setBb1CurrentTemp,
  bb2TargetTemp,
  setBb2TargetTemp,
  bb2CurrentTemp,
  setBb2CurrentTemp
}: LabSceneProps) {
  const ambientTemp = 25

  const [ir1TargetTemp, setIr1TargetTemp] = useState(50)
  const [ir1CurrentTemp, setIr1CurrentTemp] = useState(50)
  const [ir2TargetTemp, setIr2TargetTemp] = useState(100)
  const [ir2CurrentTemp, setIr2CurrentTemp] = useState(100)
  const [dry1TargetTemp, setDry1TargetTemp] = useState(25)
  const [dry1CurrentTemp, setDry1CurrentTemp] = useState(25)
  const [dry2TargetTemp, setDry2TargetTemp] = useState(200)
  const [dry2CurrentTemp, setDry2CurrentTemp] = useState(200)
  const [cabTargetTemp, setCabTargetTemp] = useState(25)
  const [cabCurrentTemp, setCabCurrentTemp] = useState(25)
  const [cabTargetHum, setCabTargetHum] = useState(40)
  const [cabCurrentHum, setCabCurrentHum] = useState(40)

  return (
    <group>
      {/* Educational Radiation Physics & Planck Law Board on the Wall behind Table */}
      <Suspense fallback={null}>
        <SafeComponent name="RadiationPhysicsBoard">
          <RadiationPhysicsBoard position={[0, 2.45, -4.82]} />
        </SafeComponent>
      </Suspense>

      {/* Black Body Source 1 (MK1600: 500°C to 1600°C - Left side of main table) */}
      <Suspense fallback={null}>
        <SafeComponent name="BlackBodySource1">
          <BlackBodySource
            position={[-1.4, 0.90, -3.8]}
            targetTemp={bb1TargetTemp}
            setTargetTemp={setBb1TargetTemp}
            currentTemp={bb1CurrentTemp}
            setCurrentTemp={setBb1CurrentTemp}
            modelName="MK1600"
            minTemp={500}
            maxTemp={1600}
          />
        </SafeComponent>
      </Suspense>

      {/* Black Body Source 2 (MK1200: 50°C to 1200°C - Mid-left of main table) */}
      <Suspense fallback={null}>
        <SafeComponent name="BlackBodySource2">
          <BlackBodySource
            position={[-0.7, 0.90, -3.8]}
            targetTemp={bb2TargetTemp}
            setTargetTemp={setBb2TargetTemp}
            currentTemp={bb2CurrentTemp}
            setCurrentTemp={setBb2CurrentTemp}
            modelName="MK1200"
            minTemp={50}
            maxTemp={1200}
          />
        </SafeComponent>
      </Suspense>

      {/* Planck Pyrometer 1: LAND CYCLOPS 100L (NIR - 0.9 µm - High Temp: 550°C to 3000°C - Crimson Red) */}
      <Suspense fallback={null}>
        <SafeComponent name="RadiationThermometer1">
          <RadiationThermometer
            position={[-0.30, 1.04, -3.72]}
            rotation={[0, 0.18, 0]}
            color="#dc2626"
            ambientTemp={ambientTemp}
            modelName="LAND CYCLOPS 100L"
            wavelength={0.9}
            wavelengthLabel="λ = 0.90 µm (NIR)"
            minTemp={550}
            maxTemp={3000}
            detectorType="Si Fotodiyot"
            onSaveMeasurement={(ref, meas, name) => {
              console.log('Saved measurement:', ref, meas, name)
            }}
          />
        </SafeComponent>
      </Suspense>

      {/* Planck Pyrometer 2: LAND CYCLOPS 160B (SWIR - 1.6 µm - Mid-High Temp: 200°C to 1400°C - Cyan Blue) */}
      <Suspense fallback={null}>
        <SafeComponent name="RadiationThermometer2">
          <RadiationThermometer
            position={[-0.10, 1.04, -3.72]}
            rotation={[0, 0.06, 0]}
            color="#0284c7"
            ambientTemp={ambientTemp}
            modelName="LAND CYCLOPS 160B"
            wavelength={1.6}
            wavelengthLabel="λ = 1.60 µm (SWIR)"
            minTemp={200}
            maxTemp={1400}
            detectorType="InGaAs"
            onSaveMeasurement={(ref, meas, name) => {
              console.log('Saved measurement:', ref, meas, name)
            }}
          />
        </SafeComponent>
      </Suspense>

      {/* Planck Pyrometer 3: HEITRONICS KT19 (MWIR - 3.9 µm - Mid Temp: 80°C to 1000°C - Amber Orange) */}
      <Suspense fallback={null}>
        <SafeComponent name="RadiationThermometer3">
          <RadiationThermometer
            position={[0.12, 1.04, -3.72]}
            rotation={[0, -0.06, 0]}
            color="#ea580c"
            ambientTemp={ambientTemp}
            modelName="HEITRONICS KT19"
            wavelength={3.9}
            wavelengthLabel="λ = 3.90 µm (MWIR)"
            minTemp={80}
            maxTemp={1000}
            detectorType="PbS / Gaz Bandı"
            onSaveMeasurement={(ref, meas, name) => {
              console.log('Saved measurement:', ref, meas, name)
            }}
          />
        </SafeComponent>
      </Suspense>

      {/* Planck Pyrometer 4: MIKRON M90 (LWIR - 10.0 µm - Ambient & Low Temp: -50°C to 500°C - Emerald Green) */}
      <Suspense fallback={null}>
        <SafeComponent name="RadiationThermometer4">
          <RadiationThermometer
            position={[0.32, 1.04, -3.72]}
            rotation={[0, -0.18, 0]}
            color="#059669"
            ambientTemp={ambientTemp}
            modelName="MIKRON M90 LWIR"
            wavelength={10.0}
            wavelengthLabel="λ = 8-14 µm (LWIR)"
            minTemp={-50}
            maxTemp={500}
            detectorType="Termopil"
            onSaveMeasurement={(ref, meas, name) => {
              console.log('Saved measurement:', ref, meas, name)
            }}
          />
        </SafeComponent>
      </Suspense>

      {/* IR Calibrator 1 (Low Temp: -15°C to 150°C - Mid-right of main table) */}
      <Suspense fallback={null}>
        <SafeComponent name="IRCalibrator1">
          <IRCalibrator
            position={[0.8, 0.90, -3.8]}
            minTemp={-15}
            maxTemp={150}
            targetTemp={ir1TargetTemp}
            setTargetTemp={setIr1TargetTemp}
            currentTemp={ir1CurrentTemp}
            setCurrentTemp={setIr1CurrentTemp}
          />
        </SafeComponent>
      </Suspense>

      {/* IR Calibrator 2 (High Temp: 35°C to 500°C - Far right of main table) */}
      <Suspense fallback={null}>
        <SafeComponent name="IRCalibrator2">
          <IRCalibrator
            position={[1.5, 0.90, -3.8]}
            minTemp={35}
            maxTemp={500}
            targetTemp={ir2TargetTemp}
            setTargetTemp={setIr2TargetTemp}
            currentTemp={ir2CurrentTemp}
            setCurrentTemp={setIr2CurrentTemp}
          />
        </SafeComponent>
      </Suspense>

      {/* Climate Cabinet (Nem Kabini - standing on floor beside left table) */}
      <Suspense fallback={null}>
        <SafeComponent name="ClimateCabinet">
          <ClimateCabinet
            position={[-3.1, 0.0, -0.6]}
            targetTemp={cabTargetTemp}
            setTargetTemp={setCabTargetTemp}
            currentTemp={cabCurrentTemp}
            setCurrentTemp={setCabCurrentTemp}
            targetHum={cabTargetHum}
            setTargetHum={setCabTargetHum}
            currentHum={cabCurrentHum}
            setCurrentHum={setCabCurrentHum}
          />
        </SafeComponent>
      </Suspense>

      {/* Dew Point Mirror (on left table, cable connects through cabinet hole) */}
      <Suspense fallback={null}>
        <SafeComponent name="DewPointMirror">
          <DewPointMirror
            position={[-3.8, 0.92, 0.3]}
            rotation={[0, 0.6, 0]}
            currentTemp={cabCurrentTemp}
            currentHum={cabCurrentHum}
            holePosition={[-3.475, 0.95, -0.6]}
            sensorPosition={[-3.1, 1.06, -0.55]}
          />
        </SafeComponent>
      </Suspense>

      {/* Fluke 9142 Dry-Well Calibrator 1 (-50°C to 200°C) - On Right Wall Calibration Table */}
      <Suspense fallback={null}>
        <SafeComponent name="DryWellCalibrator1">
          <DryWellCalibrator
            position={[6.65, 0.85, 2.05]}
            rotation={[0, -Math.PI / 2, 0]}
            modelName="mchtkrkmz MK-9142"
            subTitle="FIELD METROLOGY WELL"
            minTemp={-50}
            maxTemp={200}
            targetTemp={dry1TargetTemp}
            setTargetTemp={setDry1TargetTemp}
            currentTemp={dry1CurrentTemp}
            setCurrentTemp={setDry1CurrentTemp}
          />
        </SafeComponent>
      </Suspense>

      {/* mchtkrkmz MK-9150 High-Temp Thermocouple Calibrator 2 (50°C to 1200°C) - On Right Wall Calibration Table */}
      <Suspense fallback={null}>
        <SafeComponent name="DryWellCalibrator2">
          <DryWellCalibrator
            position={[6.65, 0.85, 2.55]}
            rotation={[0, -Math.PI / 2, 0]}
            modelName="mchtkrkmz MK-9150"
            subTitle="HIGH-TEMP CALIBRATOR"
            minTemp={50}
            maxTemp={1200}
            targetTemp={dry2TargetTemp}
            setTargetTemp={setDry2TargetTemp}
            currentTemp={dry2CurrentTemp}
            setCurrentTemp={setDry2CurrentTemp}
          />
        </SafeComponent>
      </Suspense>

      {/* Fluke 1594A Super-Thermometer Resistance Bridge */}
      <Suspense fallback={null}>
        <SafeComponent name="ResistanceBridge">
          <ResistanceBridge
            position={[6.65, 0.85, 3.20]}
            rotation={[0, -Math.PI / 2, 0]}
            ch1Temp={dry1CurrentTemp}
            ch2Temp={dry1CurrentTemp}
            ch3Temp={dry2CurrentTemp}
            ch4Temp={dry2CurrentTemp}
          />
        </SafeComponent>
      </Suspense>

      {/* 4 SPRT & PRT Probes inserted into Dry-Wells + 4 Physical Cables to Resistance Bridge */}
      <Suspense fallback={null}>
        <SafeComponent name="CalibrationProbesAndCables">
          <CalibrationProbesAndCables
            dry1Pos={[6.65, 0.85, 2.05]}
            dry2Pos={[6.65, 0.85, 2.55]}
            bridgePos={[6.65, 0.85, 3.20]}
          />
        </SafeComponent>
      </Suspense>

      {/* 5 ITS-90 Fixed-Point Temperature Cell Furnaces (MK_In, MK_Sn, MK_Zn, MK_Al, MK_Ag) */}
      <Suspense fallback={null}>
        <SafeComponent name="FixedPointFurnacesSuite">
          <FixedPointFurnacesSuite />
        </SafeComponent>
      </Suspense>

    </group>
  )
}

/* ---------- App ---------- */
function App() {
  const [bb1TargetTemp, setBb1TargetTemp] = useState(500)
  const [bb1CurrentTemp, setBb1CurrentTemp] = useState(500)
  const [bb2TargetTemp, setBb2TargetTemp] = useState(50)
  const [bb2CurrentTemp, setBb2CurrentTemp] = useState(50)
  const [isInVR, setIsInVR] = useState(false)
  const [teleportTarget, setTeleportTarget] = useState<{ x: number; z: number } | null>(null)
  const playerOriginRef = useRef<THREE.Group>(null)

  useEffect(() => {
    return xrStore.subscribe((state) => {
      setIsInVR(state.session != null)
    })
  }, [])

  const handleTeleport = (point: THREE.Vector3) => {
    // Only allow teleporting if landing spot is safe and not inside an obstacle or wall
    if (!isPositionValid(point.x, point.z, 0.35)) {
      return
    }
    setTeleportTarget({ x: point.x, z: point.z })
  }

  return (
    <div className="app-shell">
      <Canvas
        camera={{ position: [0, 1.8, -1.8], fov: 52 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <XR store={xrStore}>
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 10, 25]} />

          <ambientLight intensity={1.3} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <ControlsHandler />
          <pointLight position={[0, 4, 0]} intensity={1.5} />
          <pointLight position={[-3, 4, -3]} intensity={1} />
          <pointLight position={[3, 4, -3]} intensity={1} />

          {/* Player feet origin & Locomotion in VR */}
          <Player 
            originRef={playerOriginRef} 
            teleportTarget={teleportTarget} 
            setTeleportTarget={setTeleportTarget} 
          />

          {/* Lab Room – walls, floor, tables with TeleportTarget */}
          <LabRoom onTeleport={handleTeleport} />

          {/* Dynamic / Interactive equipment */}
          <LabScene
            bb1TargetTemp={bb1TargetTemp}
            setBb1TargetTemp={setBb1TargetTemp}
            bb1CurrentTemp={bb1CurrentTemp}
            setBb1CurrentTemp={setBb1CurrentTemp}
            bb2TargetTemp={bb2TargetTemp}
            setBb2TargetTemp={setBb2TargetTemp}
            bb2CurrentTemp={bb2CurrentTemp}
            setBb2CurrentTemp={setBb2CurrentTemp}
          />
        </XR>
      </Canvas>

      <div className="ui-layer">
        <div className="panel">
          <h1>Laboratuvar WebXR</h1>
          <p>
            {isInVR
              ? "🥽 VR Modu Aktif (Meta Quest 3). Sol analog çubukla yürüyebilir, sağ analog çubukla 45° dönebilir, kontrolcü/el ile zemine işaret edip tetik/kıstırma yaparak holografik çembere ışınlanabilirsiniz."
              : "Masaüstünde fareyle gezinebilir, zemine tıklayarak veya istasyon butonlarını kullanarak istediğiniz cihazın yanına anında ışınlanabilirsiniz."}
          </p>

          {/* Hızlı Laboratuvar Işınlanma İstasyonları */}
          <div style={{ marginTop: '8px', marginBottom: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '5px', fontWeight: 'bold' }}>
              ⚡ Hızlı Işınlanma İstasyonları:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                className="secondary" 
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => handleTeleport(new THREE.Vector3(0, 0, -2.0))}
              >
                🎯 Merkez Masa
              </button>
              <button 
                className="secondary" 
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => handleTeleport(new THREE.Vector3(-2.1, 0, 0.2))}
              >
                ❄️ İklim Kabini
              </button>
              <button 
                className="secondary" 
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => handleTeleport(new THREE.Vector3(4.0, 0, 1.8))}
              >
                🔥 Sabit Noktalar
              </button>
              <button 
                className="secondary" 
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => handleTeleport(new THREE.Vector3(5.5, 0, 2.4))}
              >
                ⚡ Direnç Köprüsü
              </button>
            </div>
          </div>

          <div className="button-row">
            {!isInVR ? (
              <button
                className="primary"
                onClick={() => {
                  xrStore.enterVR().catch((err: Error) => {
                    console.error('WebXR error:', err)
                    alert(
                      'WebXR VR başlatılamadı.\nLütfen Meta Quest Browser kullandığınızdan ve adresin HTTPS olduğundan emin olun.\n\nHata detayı: ' +
                        err.message
                    )
                  })
                }}
              >
                🥽 VR Moduna Gir (Enter VR)
              </button>
            ) : (
              <button
                className="danger"
                onClick={() => {
                  const session = xrStore.getState().session
                  if (session) session.end()
                }}
              >
                🚪 VR'dan Çık
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
