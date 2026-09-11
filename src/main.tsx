import ReactDOM from 'react-dom/client'
import { configureTextBuilder } from 'troika-three-text'
import * as THREE from 'three'
import App from './App.tsx'
import './index.css'

// 1. Universal Base URL resolver for GitHub Pages & Local Dev
const BASE = import.meta.env.BASE_URL || '/'

const resolveAssetUrl = (url: string): string => {
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
    if (!url.startsWith(BASE)) {
      const clean = url.replace(/^\//, '')
      return `${BASE}${clean}`
    }
  }
  return url
}

// 2. Intercept Three.js Loader URLs (TextureLoader, ImageLoader, FileLoader, etc.)
THREE.DefaultLoadingManager.setURLModifier((url) => {
  return resolveAssetUrl(url)
})

// 3. Intercept XMLHttpRequest (used by Troika for fonts in main thread/workers)
const originalOpen = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
  if (typeof url === 'string') {
    url = resolveAssetUrl(url)
  }
  return (originalOpen as any).call(this, method, url, ...rest)
}

// 4. Intercept fetch
const originalFetch = window.fetch
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  if (typeof input === 'string') {
    input = resolveAssetUrl(input)
  }
  return originalFetch.call(this, input, init)
}

// 5. Intercept Image.src
const originalSrcDesc = Object.getOwnPropertyDescriptor(Image.prototype, 'src')
if (originalSrcDesc && originalSrcDesc.set) {
  const originalSet = originalSrcDesc.set
  Object.defineProperty(Image.prototype, 'src', {
    ...originalSrcDesc,
    set(value: string) {
      if (typeof value === 'string') {
        value = resolveAssetUrl(value)
      }
      return originalSet.call(this, value)
    }
  })
}

// 6. Configure Troika 3D Text default font
configureTextBuilder({
  defaultFontURL: resolveAssetUrl('/fonts/arial.ttf')
})

// 7. Safe error logging without destroying the WebXR DOM
window.addEventListener('error', (e) => {
  console.error('[ThermoLab Error caught]:', e.message, e.error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
