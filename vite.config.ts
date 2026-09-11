import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/thermolab/' : '/',
  plugins: [react(), basicSsl()],
  server: {
    host: true
  }
}))
