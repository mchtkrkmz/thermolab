import * as THREE from 'three'

/**
 * Global Device Grab Manager
 * VR ve Masaüstü ortamında laboratuvardaki cihazların çakışmadan,
 * tekil ve kontrollü bir şekilde tutulmasını sağlar.
 * 
 * Özellikler:
 * - Hem Sol El ('left') hem Sağ El ('right') desteği.
 * - Aynı anda birden fazla cihazın tutulup dağılmasını engeller.
 * - Kumandaya en yakın veya hover edilen cihazı doğrudan o ele kilitler.
 */

export interface RegisteredDevice {
  id: string
  name: string
  getWorldPosition: () => THREE.Vector3
  isHovered: () => boolean
  grab: (hand?: 'left' | 'right') => void
  release: () => void
  isHeld: () => boolean
}

class DeviceGrabManager {
  private currentHeldId: string | null = null
  private devices = new Map<string, RegisteredDevice>()

  register(device: RegisteredDevice) {
    this.devices.set(device.id, device)
  }

  unregister(id: string) {
    this.devices.delete(id)
    if (this.currentHeldId === id) {
      this.currentHeldId = null
    }
  }

  getHeldId(): string | null {
    return this.currentHeldId
  }

  isDeviceHeld(id: string): boolean {
    return this.currentHeldId === id
  }

  canGrab(id: string): boolean {
    return this.currentHeldId === null || this.currentHeldId === id
  }

  setHeld(id: string | null) {
    this.currentHeldId = id
  }

  /**
   * Kumanda konumu ve eline ('left' veya 'right') göre en uygun cihazı ele alır
   */
  requestGrabBestCandidate(controllerPos: THREE.Vector3, maxDist: number = 0.55, hand: 'left' | 'right' = 'left'): boolean {
    if (this.currentHeldId !== null) return false

    // 1. Öncelik: Pointer / Lazer ile hover edilen cihaz
    for (const dev of this.devices.values()) {
      if (dev.isHovered()) {
        dev.grab(hand)
        this.currentHeldId = dev.id
        return true
      }
    }

    // 2. Öncelik: Kumandaya fiziksel olarak en yakın olan tekil cihaz
    let closestDev: RegisteredDevice | null = null
    let minDist = maxDist

    for (const dev of this.devices.values()) {
      const pos = dev.getWorldPosition()
      const dist = pos.distanceTo(controllerPos)
      if (dist < minDist) {
        minDist = dist
        closestDev = dev
      }
    }

    if (closestDev) {
      closestDev.grab(hand)
      this.currentHeldId = closestDev.id
      return true
    }

    return false
  }

  releaseAll() {
    if (this.currentHeldId) {
      const dev = this.devices.get(this.currentHeldId)
      if (dev) {
        dev.release()
      }
      this.currentHeldId = null
    }
  }
}

export const deviceGrabManager = new DeviceGrabManager()
