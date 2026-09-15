import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

// Configuracion separada a proposito: el servidor de desarrollo NO debe
// depender del runner de tests. Si `vitest` vive en vite.config.ts, el
// contenedor de desarrollo falla al arrancar porque no lo tiene instalado.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      // Los `.e2e.test.ts` necesitan el stack levantado y datos sembrados:
      // se corren aparte con `npm run test:e2e`, nunca en el check por defecto.
      include: ['src/**/*.test.ts'],
      exclude: ['src/**/*.e2e.test.ts', 'node_modules/**'],
    },
  }),
)
