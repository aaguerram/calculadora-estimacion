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
    // La API se sirve por el MISMO origen que la aplicacion, igual que hace
    // nginx en produccion. Asi funciona se abra desde donde se abra (localhost,
    // 127.0.0.1, la IP de la maquina, otro equipo de la red) y desaparece el
    // CORS. Antes apuntaba a http://localhost:3001, que desde otro dispositivo
    // resuelve a ESE dispositivo y falla todo sin explicacion.
    proxy: {
      '/api': {
        target: process.env.PGRST_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
    },
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
