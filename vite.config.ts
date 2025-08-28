import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',   // expose dev server to your local network (Wi‑Fi)
    port: 5173,        // change if this port is taken
    strictPort: true,  // fail instead of picking a random port
    cors: true,        // allow cross‑origin requests from LAN devices
    // If HMR on iPad Safari has trouble, set hmr.host to your Mac's LAN IP:
    // hmr: { host: '192.168.0.23' },
  },
})
