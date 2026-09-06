import ReactDOM from 'react-dom/client'
import { configureTextBuilder } from 'troika-three-text'
import App from './App.tsx'
import './index.css'

configureTextBuilder({
  defaultFontURL: '/fonts/arial.ttf'
})

window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; font-size: 24px; font-family: monospace;"><h1>MODULE ERROR:</h1><p>${e.message}</p><pre>${e.error?.stack || ''}</pre></div>`
  }
})

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  )
} catch (err: any) {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; font-size: 24px;"><h1>RENDER ERROR:</h1><p>${err?.message}</p></div>`
  }
}
