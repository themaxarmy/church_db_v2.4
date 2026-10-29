import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve the API from the same origin so the auth cookie is first-party.
    proxy: { '/api': 'http://localhost:3001' },
  },
})
