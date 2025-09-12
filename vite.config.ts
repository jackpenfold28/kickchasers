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
    port: 5000,        // Replit requires port 5000 for frontend
    strictPort: true,  // fail instead of picking a random port
    cors: true,        // allow cross‑origin requests from LAN devices
    // Allow all hosts for Replit proxy setup
    allowedHosts: true,
    // Configure HMR for Replit proxy setup
    hmr: {
      clientPort: 443, // Use HTTPS port for Replit
    },
  },
  preview: {
    host: '0.0.0.0',   // expose preview server for Replit deployment
    port: Number(process.env.PORT) || 5000,  // use PORT env var or default to 5000
    strictPort: true,  // fail instead of picking a random port
  },
})
