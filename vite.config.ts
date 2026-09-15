import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Carbon referencia las fuentes IBM Plex con el prefijo heredado `~`.
      '~@ibm/plex': fileURLToPath(new URL('./node_modules/@ibm/plex', import.meta.url)),
    },
  },
  server: {
    // 0.0.0.0 para que el contenedor sea alcanzable desde el host.
    host: true,
    port: 5173,
    // Los bind mounts no siempre propagan inotify: polling garantiza el HMR.
    watch: { usePolling: true, interval: 300 },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['node_modules'],
        // Carbon arrastra deprecaciones de Sass que no son nuestras.
        quietDeps: true,
        silenceDeprecations: ['global-builtin', 'import'],
      },
    },
  },
})
