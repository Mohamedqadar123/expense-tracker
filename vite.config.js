import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Reachable from other devices on the local network (e.g. a phone opening
    // a link from a verification email), not just from this machine.
    host: true,
    // The browser talks to the API through the page's own address, so it
    // works from whichever device loaded the page.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
